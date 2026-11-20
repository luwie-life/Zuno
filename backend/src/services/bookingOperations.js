
import {
  Booking,
  BookingSlot,
  Business,
  Customer,
  Service,
  User,
} from '../models/index.js';

import { conflict, notFound } from '../lib/errors.js';
import { newReference } from '../lib/tokens.js';
import {
  resolveBookingSlot,
  availableBookingTimes,
} from '../lib/bookingAvailability.js';

import { withTxn } from './db.js';
import { sendMail } from './mailer.js';
import { audit } from './audit.js';

function logPostCommitFailure(label, error) {
  console.error(`[${label}]`, error);
}

async function notifySafely(label, notification) {
  try {
    await notification();
  } catch (error) {
    logPostCommitFailure(label, error);
  }
}

async function auditSafely(event) {
  await notifySafely('Booking audit failed', () => audit(event));
}

export async function listAvailableTimes({
  business,
  service,
  date,
  now = new Date(),
}) {
  if (!business?._id || !service || !date) {
    return [];
  }

  const occupied = await BookingSlot.find({
    business: business._id,
    localDate: date,
  })
    .select('slotIndex -_id')
    .lean();

  return availableBookingTimes({
    business,
    service,
    date,
    occupiedSlotIndexes: occupied.map((item) => item.slotIndex),
    now,
  });
}

async function findOrCreateCustomer(businessId, info, session) {
  const email = info.email.trim().toLowerCase();
  const clauses = [{ email }];

  if (info.phone) {
    clauses.push({ phone: info.phone });
  }

  let customerQuery = Customer.findOne({
    business: businessId,
    $or: clauses,
  });

  if (session) {
    customerQuery = customerQuery.session(session);
  }

  let customer = await customerQuery;

  if (!customer) {
    const [created] = await Customer.create(
      [{
        business: businessId,
        name: info.name.trim(),
        email,
        phone: info.phone || '',
      }],
      { session },
    );

    customer = created;
  }

  return customer;
}

async function notifyBookingRequest(business, booking) {
  const timeAndDate =
    `${booking.localDate} ${booking.startTime} (${booking.timezone})`;

  const owner = await User.findById(business.owner)
    .select('email name')
    .lean()
    .catch((error) => {
      logPostCommitFailure('Booking owner lookup failed', error);
      return null;
    });

  const merchantEmail = business.email || owner?.email;
  const notifications = [];

  if (merchantEmail) {
    notifications.push(
      sendMail({
        to: merchantEmail,
        user: owner?._id,
        template: 'booking_request_merchant',
        subject: `New booking request: ${booking.serviceName}`,
        text:
          `A customer requested ${booking.serviceName} for ${timeAndDate}. ` +
          `Booking reference: ${booking.reference}. ` +
          'Sign in to confirm or decline the request.',
      }),
    );
  }

  if (booking.customerInfo?.email) {
    notifications.push(
      sendMail({
        to: booking.customerInfo.email,
        template: 'booking_request_customer',
        subject: `Request received: ${booking.serviceName}`,
        text:
          `Your request for ${booking.serviceName} on ${timeAndDate} ` +
          'was sent to the business. It is pending confirmation. ' +
          `Reference: ${booking.reference}. No payment was taken.`,
      }),
    );
  }

  const results = await Promise.allSettled(notifications);

  for (const result of results) {
    if (result.status === 'rejected') {
      logPostCommitFailure(
        'Booking notification failed',
        result.reason,
      );
    }
  }
}

export async function createBookingRequest({
  businessId,
  serviceId,
  date,
  time,
  customerInfo,
  note,
}) {
  const [business, service] = await Promise.all([
    Business.findOne({
      _id: businessId,
      status: 'active',
      storePublished: true,
    }),

    Service.findOne({
      _id: serviceId,
      business: businessId,
      status: 'active',
      published: true,
      bookable: true,
    }),
  ]);

  if (!business || !service) {
    throw notFound('Business or service is not available.');
  }

  const occupied = await BookingSlot.find({
    business: businessId,
    localDate: date,
  })
    .select('slotIndex -_id')
    .lean();

  const slot = resolveBookingSlot({
    business,
    service,
    date,
    time,
    occupiedSlotIndexes: occupied.map((item) => item.slotIndex),
  });

  if (!slot) {
    throw conflict(
      'That time is no longer available. Choose another appointment time.',
      'BOOKING_SLOT_UNAVAILABLE',
    );
  }

  let createdBookingId;
  let booking;

  try {
    booking = await withTxn(async (session) => {
      const customer = await findOrCreateCustomer(
        businessId,
        customerInfo,
        session,
      );

      const reference = newReference('ZB', 10);

      const [created] = await Booking.create(
        [{
          business: businessId,
          service: service._id,
          customer: customer._id,
          reference,

          serviceName: service.name,
          price: service.price ?? 0,
          pricingDescription: service.pricingDescription || '',
          durationMinutes: service.durationMinutes,

          customerInfo: {
            name: customerInfo.name.trim(),
            email: customerInfo.email.trim().toLowerCase(),
            phone: customerInfo.phone || '',
            note: note || '',
          },

          localDate: date,
          startTime: time,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,

          startsAt: slot.startsAt,
          endsAt: slot.endsAt,

          timezone: business.timezone || 'Africa/Lagos',
          status: 'pending',

          history: [{
            action: 'requested',
            note: 'Awaiting merchant confirmation.',
          }],
        }],
        { session },
      );

      createdBookingId = created._id;

      await BookingSlot.insertMany(
        slot.slotIndexes.map((slotIndex) => ({
          business: businessId,
          localDate: date,
          slotIndex,
          booking: created._id,
        })),
        {
          session,
          ordered: true,
        },
      );

      return created;
    });
  } catch (error) {
    if (createdBookingId) {
      await BookingSlot.deleteMany({
        booking: createdBookingId,
      }).catch((cleanupError) => {
        logPostCommitFailure(
          'Booking slot cleanup failed',
          cleanupError,
        );
      });

      await Booking.deleteOne({
        _id: createdBookingId,
      }).catch((cleanupError) => {
        logPostCommitFailure(
          'Booking cleanup failed',
          cleanupError,
        );
      });
    }

    if (error?.code === 11000) {
      throw conflict(
        'That time was just booked by someone else. Choose another time.',
        'BOOKING_SLOT_UNAVAILABLE',
      );
    }

    throw error;
  }

  await notifySafely(
    'Booking request notification failed',
    () => notifyBookingRequest(business, booking),
  );

  return booking;
}

export async function changeBooking({
  businessId,
  bookingId,
  status,
  date,
  time,
  actor,
  reason,
}) {
  const hasDate = date !== undefined && date !== null;
  const hasTime = time !== undefined && time !== null;

  if (hasDate !== hasTime) {
    throw conflict(
      'Both date and time are required to reschedule a booking.',
    );
  }

  if (hasDate && hasTime) {
    const { env } = await import('../config/env.js');

    if (env.allowNoTxn) {
      throw conflict(
        'Rescheduling requires a replica-set database so the old appointment remains reserved if the new slot cannot be claimed.',
        'BOOKING_REQUIRES_TRANSACTIONS',
      );
    }

    return rescheduleBooking({
      businessId,
      bookingId,
      date,
      time,
      actor,
      reason,
    });
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    business: businessId,
  });

  if (!booking) {
    throw notFound('Booking not found');
  }

  const allowed = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['cancelled', 'completed'],
    rejected: [],
    cancelled: [],
    completed: [],
  };

  if (!allowed[booking.status]?.includes(status)) {
    throw conflict(
      `Cannot change a ${booking.status} booking to ${status}.`,
    );
  }

  const updated = await withTxn(async (session) => {
    const claimed = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        business: businessId,
        status: booking.status,
      },
      {
        status,
        $push: {
          history: {
            actor,
            action: status,
            note: reason || '',
          },
        },
      },
      {
        new: true,
        session,
      },
    );

    if (!claimed) {
      throw conflict('Booking changed; refresh and try again.');
    }

    if (['rejected', 'cancelled'].includes(status)) {
      await BookingSlot.deleteMany(
        { booking: booking._id },
        { session },
      );
    }

    return claimed;
  });

  await notifySafely(
    'Booking status notification failed',
    () => notifyStatusChange(updated, status),
  );

  await auditSafely({
    actor,
    actorType: 'merchant',
    action: `booking.${status}`,
    business: businessId,
    targetType: 'Booking',
    targetId: updated._id,
    reason,
  });

  return updated;
}

async function rescheduleBooking({
  businessId,
  bookingId,
  date,
  time,
  actor,
  reason,
}) {
  const initial = await Booking.findOne({
    _id: bookingId,
    business: businessId,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (!initial) {
    throw notFound('Active booking not found');
  }

  const [service, business] = await Promise.all([
    Service.findOne({
      _id: initial.service,
      business: businessId,
      status: 'active',
      published: true,
      bookable: true,
    }),

    Business.findOne({
      _id: businessId,
      status: 'active',
      storePublished: true,
    }),
  ]);

  if (!service || !business) {
    throw conflict(
      'The service or business is no longer available.',
    );
  }

  let updated;

  try {
    updated = await withTxn(async (session) => {
      const current = await Booking.findOne({
        _id: bookingId,
        business: businessId,
        status: { $in: ['pending', 'confirmed'] },
      }).session(session);

      if (!current) {
        throw conflict('Booking changed; refresh and try again.');
      }

      // Keep the duration agreed to when this booking was created.
      // Editing the service later must not silently alter an existing booking.
      const duration = current.durationMinutes;

      if (
        !Number.isInteger(duration) ||
        duration < 15 ||
        duration % 15 !== 0
      ) {
        throw conflict(
          'This booking has an invalid duration and cannot be rescheduled.',
        );
      }

      const bookingService = {
        durationMinutes: duration,
      };

      const occupied = await BookingSlot.find({
        business: businessId,
        localDate: date,
        booking: { $ne: current._id },
      })
        .select('slotIndex -_id')
        .session(session)
        .lean();

      const slot = resolveBookingSlot({
        business,
        service: bookingService,
        date,
        time,
        occupiedSlotIndexes: occupied.map((item) => item.slotIndex),
      });

      if (!slot) {
        throw conflict(
          'That time is no longer available. Choose another appointment time.',
          'BOOKING_SLOT_UNAVAILABLE',
        );
      }

      // Release the old slots and reserve the new ones atomically.
      await BookingSlot.deleteMany(
        { booking: current._id },
        { session },
      );

      await BookingSlot.insertMany(
        slot.slotIndexes.map((slotIndex) => ({
          business: businessId,
          localDate: date,
          slotIndex,
          booking: current._id,
        })),
        {
          session,
          ordered: true,
        },
      );

      current.localDate = date;
      current.startTime = time;
      current.startMinute = slot.startMinute;
      current.endMinute = slot.endMinute;
      current.startsAt = slot.startsAt;
      current.endsAt = slot.endsAt;

      current.history.push({
        actor,
        action: 'rescheduled',
        note: reason || '',
      });

      await current.save({ session });

      return current;
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw conflict(
        'That time was just booked by someone else. Choose another time.',
        'BOOKING_SLOT_UNAVAILABLE',
      );
    }

    throw error;
  }

  await notifySafely(
    'Booking reschedule notification failed',
    () => notifyStatusChange(updated, 'rescheduled'),
  );

  await auditSafely({
    actor,
    actorType: 'merchant',
    action: 'booking.rescheduled',
    business: businessId,
    targetType: 'Booking',
    targetId: updated._id,
    reason,
  });

  return updated;
}

async function notifyStatusChange(booking, status) {
  if (!booking.customerInfo?.email) {
    return;
  }

  const action = status === 'confirmed'
    ? 'confirmed'
    : status === 'rejected'
      ? 'rejected'
      : status === 'cancelled'
        ? 'cancelled'
        : status === 'rescheduled'
          ? 'rescheduled'
          : 'completed';

  const details = action === 'rejected'
    ? 'The business could not accept this request.'
    : `Appointment: ${booking.localDate} ${booking.startTime} (${booking.timezone}).`;

  await sendMail({
    to: booking.customerInfo.email,
    template: `booking_${action}_customer`,
    subject: `Booking ${action}: ${booking.serviceName}`,
    text:
      `Your ${booking.serviceName} booking is ${action}. ` +
      `${details} Reference: ${booking.reference}.`,
  });
}

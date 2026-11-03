import { Router } from 'express';
import { Booking, BookingSlot, Business, Service } from '../models/index.js';
import { asyncH, notFound, bad } from '../lib/errors.js';
import { parse, z, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature, requireModule } from '../middleware/auth.js';
import { changeBooking } from '../services/bookingOperations.js';
import { availableBookingTimes } from '../lib/bookingAvailability.js';

const r = Router();
r.use(requireAuth, requireBusiness(null), requireModule('services'));

r.get('/', requireBusiness('bookings.read'), requireFeature('bookings'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { business: req.business._id };
  if (['pending', 'confirmed', 'cancelled', 'completed'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))) throw bad('date must use YYYY-MM-DD format.');
    filter.localDate = String(req.query.date);
  }
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ localDate: 1, startMinute: 1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
}));

r.get('/:id', requireBusiness('bookings.read'), requireFeature('bookings'), asyncH(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, business: req.business._id });
  if (!booking) throw notFound('Booking not found');
  res.json({ booking });
}));

r.get('/:id/availability', requireBusiness('bookings.read'), requireFeature('bookings'), asyncH(async (req, res) => {
  const date = String(req.query.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw bad('date must use YYYY-MM-DD format.');
  const booking = await Booking.findOne({ _id: req.params.id, business: req.business._id, status: { $in: ['pending', 'confirmed'] } });
  if (!booking) throw notFound('Active booking not found');
  const [business, service, occupied] = await Promise.all([
    Business.findById(req.business._id), Service.findOne({ _id: booking.service, business: req.business._id, status: 'active' }),
    BookingSlot.find({ business: req.business._id, localDate: date, booking: { $ne: booking._id } }).select('slotIndex -_id').lean(),
  ]);
  if (!business || !service) throw conflict('The service or business is no longer available.');
  res.json({ date, timezone: business.timezone || 'Africa/Lagos', times: availableBookingTimes({ business, service, date, occupiedSlotIndexes: occupied.map((item) => item.slotIndex) }) });
}));

r.patch('/:id', requireBusiness('bookings.manage'), requireFeature('bookings'), asyncH(async (req, res) => {
  const body = parse(z.object({
    status: z.enum(['confirmed', 'cancelled', 'completed']).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
    reason: z.string().trim().max(500).optional(),
  }).refine((value) => Boolean(value.status) !== Boolean(value.date || value.startTime), 'Choose either a status transition or a reschedule.')
    .refine((value) => Boolean(value.date) === Boolean(value.startTime), 'A reschedule requires both date and startTime.'), req.body);
  const booking = await changeBooking({
    businessId: req.business._id, bookingId: req.params.id, status: body.status,
    date: body.date, time: body.startTime, actor: req.user._id, reason: body.reason,
  });
  res.json({ booking });
}));

export default r;

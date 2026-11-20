
const SLOT_MINUTES = 15;
const MINUTES_PER_DAY = 24 * 60;
const SLOTS_PER_DAY = MINUTES_PER_DAY / SLOT_MINUTES;
const DEFAULT_ADVANCE_BOOKING_DAYS = 60;
const MAX_ADVANCE_BOOKING_DAYS = 365;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validTimezone(timezone) {
  if (typeof timezone !== 'string' || !timezone.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en', {
      timeZone: timezone,
    }).format();

    return true;
  } catch {
    return false;
  }
}

export function parseLocalDate(date) {
  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T12:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return {
    weekday: parsed.getUTCDay(),
    date,
  };
}

export function parseLocalTime(time) {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time)) {
    return null;
  }

  const [hour, minute] = time.split(':').map(Number);

  return hour * 60 + minute;
}

function localClock(now, timezone) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    return null;
  }

  if (!validTimezone(timezone)) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minute: Number(values.hour) * 60 + Number(values.minute),
  };
}

/**
 * Converts a local business date and time into a UTC Date.
 *
 * Returns null when:
 * - The date or time is invalid.
 * - The timezone is invalid.
 * - The local time does not exist because of a DST transition.
 * - The local time is ambiguous because of a DST transition.
 *
 * Appointment times use a 15-minute grid.
 */
export function localDateTimeToUtc(date, time, timezone) {
  const parsedDate = parseLocalDate(date);
  const minute = parseLocalTime(time);

  if (
    !parsedDate ||
    minute === null ||
    minute % SLOT_MINUTES !== 0 ||
    !validTimezone(timezone)
  ) {
    return null;
  }

  const hour = Math.floor(minute / 60);
  const minutePart = minute % 60;

  const [year, month, day] = date.split('-').map(Number);

  const wallClock = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minutePart,
  );

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const matches = [];

  // Search possible UTC instants around the requested wall-clock time.
  // The 15-minute interval matches the appointment slot grid.
  for (
    let candidate = wallClock - 16 * 60 * 60_000;
    candidate <= wallClock + 16 * 60 * 60_000;
    candidate += SLOT_MINUTES * 60_000
  ) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .map((part) => [part.type, part.value]),
    );

    const matchesLocalTime =
      parts.year === String(year).padStart(4, '0') &&
      parts.month === String(month).padStart(2, '0') &&
      parts.day === String(day).padStart(2, '0') &&
      Number(parts.hour) === hour &&
      Number(parts.minute) === minutePart;

    if (matchesLocalTime) {
      matches.push(candidate);
    }
  }

  // Reject nonexistent and ambiguous local times.
  if (matches.length !== 1) {
    return null;
  }

  return new Date(matches[0]);
}

function dayHours(business, date) {
  const parsed = parseLocalDate(date);
  const timezone = business?.timezone || 'Africa/Lagos';

  if (
    !parsed ||
    !validTimezone(timezone) ||
    !Array.isArray(business?.weeklyHours)
  ) {
    return null;
  }

  const hoursForDay = business.weeklyHours.filter(
    (item) => item?.dayOfWeek === parsed.weekday,
  );

  // Duplicate weekday configurations are ambiguous.
  if (hoursForDay.length !== 1) {
    return null;
  }

  const hours = hoursForDay[0];

  if (hours.closed) {
    return null;
  }

  const open = parseLocalTime(hours.open);
  const close = parseLocalTime(hours.close);

  if (
    open === null ||
    close === null ||
    open >= close
  ) {
    return null;
  }

  return {
    ...parsed,
    open,
    close,
  };
}

export function slotIndexes(startMinute, durationMinutes) {
  if (
    !Number.isInteger(startMinute) ||
    !Number.isInteger(durationMinutes) ||
    startMinute < 0 ||
    startMinute >= MINUTES_PER_DAY ||
    startMinute % SLOT_MINUTES !== 0 ||
    durationMinutes < SLOT_MINUTES ||
    durationMinutes % SLOT_MINUTES !== 0 ||
    startMinute + durationMinutes > MINUTES_PER_DAY
  ) {
    return null;
  }

  const slots = [];

  for (
    let minute = startMinute;
    minute < startMinute + durationMinutes;
    minute += SLOT_MINUTES
  ) {
    const slotIndex = minute / SLOT_MINUTES;

    if (slotIndex < 0 || slotIndex >= SLOTS_PER_DAY) {
      return null;
    }

    slots.push(slotIndex);
  }

  return slots;
}

function advanceBookingDays(business) {
  const configured = business?.bookingPolicy?.advanceBookingDays;

  if (configured === undefined || configured === null) {
    return DEFAULT_ADVANCE_BOOKING_DAYS;
  }

  if (
    !Number.isInteger(configured) ||
    configured < 1 ||
    configured > MAX_ADVANCE_BOOKING_DAYS
  ) {
    return DEFAULT_ADVANCE_BOOKING_DAYS;
  }

  return configured;
}

function normalizeOccupiedSlots(occupiedSlotIndexes) {
  if (!Array.isArray(occupiedSlotIndexes)) {
    return null;
  }

  const occupied = new Set();

  for (const slot of occupiedSlotIndexes) {
    if (
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= SLOTS_PER_DAY
    ) {
      return null;
    }

    occupied.add(slot);
  }

  return occupied;
}

export function availableBookingTimes({
  business,
  service,
  date,
  occupiedSlotIndexes = [],
  now = new Date(),
}) {
  if (!business || !service) {
    return [];
  }

  const timezone = business.timezone || 'Africa/Lagos';
  const today = localClock(now, timezone);

  if (!today) {
    return [];
  }

  const hours = dayHours(business, date);
  const duration = service.durationMinutes;
  const occupied = normalizeOccupiedSlots(occupiedSlotIndexes);

  if (
    !hours ||
    !Number.isInteger(duration) ||
    duration < SLOT_MINUTES ||
    duration % SLOT_MINUTES !== 0 ||
    !occupied
  ) {
    return [];
  }

  const maxDate = new Date(`${today.date}T12:00:00.000Z`);

  maxDate.setUTCDate(
    maxDate.getUTCDate() + advanceBookingDays(business),
  );

  const lastDate = maxDate.toISOString().slice(0, 10);

  if (date < today.date || date > lastDate) {
    return [];
  }

  // Round opening time up to the next valid 15-minute boundary.
  const firstStart =
    Math.ceil(hours.open / SLOT_MINUTES) * SLOT_MINUTES;

  const times = [];

  for (
    let start = firstStart;
    start + duration <= hours.close;
    start += SLOT_MINUTES
  ) {
    // Do not offer appointments that have already started.
    if (date === today.date && start <= today.minute) {
      continue;
    }

    const time = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(
      start % 60,
    ).padStart(2, '0')}`;

    const slots = slotIndexes(start, duration);

    if (!slots) {
      continue;
    }

    // Reject appointments with any occupied 15-minute interval.
    if (slots.some((slot) => occupied.has(slot))) {
      continue;
    }

    // Confirm that this local time maps to exactly one UTC instant.
    if (!localDateTimeToUtc(date, time, timezone)) {
      continue;
    }

    times.push(time);
  }

  return times;
}

export function resolveBookingSlot({
  business,
  service,
  date,
  time,
  occupiedSlotIndexes = [],
  now = new Date(),
}) {
  if (!business || !service) {
    return null;
  }

  const startMinute = parseLocalTime(time);
  const duration = service.durationMinutes;

  if (
    startMinute === null ||
    !Number.isInteger(duration) ||
    duration < SLOT_MINUTES ||
    duration % SLOT_MINUTES !== 0
  ) {
    return null;
  }

  const openTimes = availableBookingTimes({
    business,
    service,
    date,
    occupiedSlotIndexes,
    now,
  });

  if (!openTimes.includes(time)) {
    return null;
  }

  const timezone = business.timezone || 'Africa/Lagos';

  const startsAt = localDateTimeToUtc(
    date,
    time,
    timezone,
  );

  if (!startsAt) {
    return null;
  }

  const slots = slotIndexes(startMinute, duration);

  if (!slots) {
    return null;
  }

  const endsAt = new Date(
    startsAt.getTime() + duration * 60_000,
  );

  if (Number.isNaN(endsAt.getTime())) {
    return null;
  }

  return {
    startMinute,
    endMinute: startMinute + duration,
    startsAt,
    endsAt,
    slotIndexes: slots,
  };
}

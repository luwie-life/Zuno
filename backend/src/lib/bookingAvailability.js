const SLOT_MINUTES = 15;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validTimezone(timezone) {
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); return true; } catch { return false; }
}

export function parseLocalDate(date) {
  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) return null;
  const parsed = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return { weekday: parsed.getUTCDay(), date };
}

export function parseLocalTime(time) {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function localClock(now, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, minute: Number(values.hour) * 60 + Number(values.minute) };
}

export function localDateTimeToUtc(date, time, timezone) {
  const parsedDate = parseLocalDate(date);
  const minute = parseLocalTime(time);
  if (!parsedDate || minute === null || !validTimezone(timezone)) return null;
  const hour = Math.floor(minute / 60);
  const minutePart = minute % 60;
  const [year, month, day] = date.split('-').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minutePart);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const matches = [];
  for (let candidate = wallClock - 16 * 60 * 60_000; candidate <= wallClock + 16 * 60 * 60_000; candidate += 15 * 60_000) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    if (parts.year === String(year).padStart(4, '0') && parts.month === String(month).padStart(2, '0') && parts.day === String(day).padStart(2, '0') && Number(parts.hour) === hour && Number(parts.minute) === minutePart) matches.push(candidate);
  }
  return matches.length === 1 ? new Date(matches[0]) : null;
}

function dayHours(business, date) {
  const parsed = parseLocalDate(date);
  if (!parsed || !validTimezone(business.timezone || 'Africa/Lagos')) return null;
  const hours = business.weeklyHours?.find((item) => item.dayOfWeek === parsed.weekday);
  if (!hours || hours.closed) return null;
  const open = parseLocalTime(hours.open);
  const close = parseLocalTime(hours.close);
  if (open === null || close === null || open >= close) return null;
  return { ...parsed, open, close };
}

export function slotIndexes(startMinute, durationMinutes) {
  if (!Number.isInteger(startMinute) || !Number.isInteger(durationMinutes) || startMinute < 0 || startMinute % SLOT_MINUTES !== 0 || durationMinutes < SLOT_MINUTES || durationMinutes % SLOT_MINUTES !== 0) return null;
  const slots = [];
  for (let minute = startMinute; minute < startMinute + durationMinutes; minute += SLOT_MINUTES) slots.push(minute / SLOT_MINUTES);
  return slots;
}

export function availableBookingTimes({ business, service, date, occupiedSlotIndexes = [], now = new Date() }) {
  const hours = dayHours(business, date);
  const duration = service?.durationMinutes;
  if (!hours || !Number.isInteger(duration) || duration < SLOT_MINUTES || duration % SLOT_MINUTES !== 0) return [];
  const timezone = business.timezone || 'Africa/Lagos';
  const today = localClock(now, timezone);
  const maxDate = new Date(`${today.date}T12:00:00.000Z`);
  maxDate.setUTCDate(maxDate.getUTCDate() + (business.bookingPolicy?.advanceBookingDays || 60));
  const lastDate = maxDate.toISOString().slice(0, 10);
  if (date < today.date || date > lastDate) return [];
  const occupied = new Set(occupiedSlotIndexes);
  const times = [];
  for (let start = hours.open; start + duration <= hours.close; start += SLOT_MINUTES) {
    if (date === today.date && start <= today.minute) continue;
    const time = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
    if (!localDateTimeToUtc(date, time, timezone)) continue;
    const slots = slotIndexes(start, duration);
    if (slots.every((slot) => !occupied.has(slot))) times.push(time);
  }
  return times;
}

export function resolveBookingSlot({ business, service, date, time, occupiedSlotIndexes = [], now = new Date() }) {
  const startMinute = parseLocalTime(time);
  const openTimes = availableBookingTimes({ business, service, date, occupiedSlotIndexes, now });
  if (startMinute === null || !openTimes.includes(time)) return null;
  const timezone = business.timezone || 'Africa/Lagos';
  const startsAt = localDateTimeToUtc(date, time, timezone);
  if (!startsAt) return null;
  return { startMinute, endMinute: startMinute + service.durationMinutes, startsAt, endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000), slotIndexes: slotIndexes(startMinute, service.durationMinutes) };
}
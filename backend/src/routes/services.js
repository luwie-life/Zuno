import { Router } from 'express';
import { Booking, Business, Service } from '../models/index.js';
import { asyncH, bad, conflict, notFound } from '../lib/errors.js';
import { parse, z, pageParams, escapeRegex } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature, requireModule, assertLimit } from '../middleware/auth.js';
import { validTimezone } from '../lib/bookingAvailability.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth, requireBusiness(null), requireModule('services'));

const serviceBody = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().max(4000).default(''),
  category: z.string().trim().max(80).default(''),
  price: z.number().int().min(0).max(100_000_000_000),
  durationMinutes: z.number().int().min(15).max(720).refine((value) => value % 15 === 0, 'Duration must use 15-minute increments.'),
  bookingRequirements: z.string().max(1000).default(''),
  status: z.enum(['active', 'inactive']).default('active'),
  published: z.boolean().default(true),
});
const hoursEntry = z.object({ dayOfWeek: z.number().int().min(0).max(6), open: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), close: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), closed: z.boolean().default(false) });
const hoursBody = z.object({
  timezone: z.string().min(1).max(80),
  weeklyHours: z.array(hoursEntry).length(7).superRefine((hours, ctx) => {
    if (new Set(hours.map((item) => item.dayOfWeek)).size !== 7) ctx.addIssue({ code: 'custom', message: 'Provide one schedule for each weekday.' });
    for (const item of hours) if (!item.closed && item.open >= item.close) ctx.addIssue({ code: 'custom', message: `Closing time must be after opening time for weekday ${item.dayOfWeek}.` });
  }),
  bookingPolicy: z.object({ cancellationNoticeHours: z.number().int().min(0).max(720), advanceBookingDays: z.number().int().min(1).max(365) }),
});

r.get('/', requireBusiness('services.read'), requireFeature('services'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { business: req.business._id };
  if (req.query.status === 'active' || req.query.status === 'inactive') filter.status = req.query.status;
  if (req.query.search) filter.name = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i');
  const [items, total] = await Promise.all([Service.find(filter).sort('name').skip(skip).limit(limit), Service.countDocuments(filter)]);
  res.json({ items, total, page, limit });
}));

r.post('/', requireBusiness('services.write'), requireFeature('services'), asyncH(async (req, res) => {
  const body = parse(serviceBody, req.body);
  await assertLimit(req, 'services', await Service.countDocuments({ business: req.business._id }));
  const service = await Service.create({ ...body, business: req.business._id });
  await audit({ req, action: 'service.created', business: req.business._id, targetType: 'Service', targetId: service._id });
  res.status(201).json({ service });
}));

r.patch('/:id', requireBusiness('services.write'), requireFeature('services'), asyncH(async (req, res) => {
  const body = parse(serviceBody.partial(), req.body);
  const service = await Service.findOneAndUpdate({ _id: req.params.id, business: req.business._id }, body, { new: true, runValidators: true });
  if (!service) throw notFound('Service not found');
  await audit({ req, action: 'service.updated', business: req.business._id, targetType: 'Service', targetId: service._id });
  res.json({ service });
}));

r.delete('/:id', requireBusiness('services.write'), requireFeature('services'), asyncH(async (req, res) => {
  const hasPending = await Booking.exists({ business: req.business._id, service: req.params.id, status: { $in: ['pending', 'confirmed'] } });
  if (hasPending) throw conflict('This service has pending or confirmed bookings. Deactivate it instead.');
  const service = await Service.findOneAndDelete({ _id: req.params.id, business: req.business._id });
  if (!service) throw notFound('Service not found');
  await audit({ req, action: 'service.deleted', business: req.business._id, targetType: 'Service', targetId: service._id });
  res.json({ ok: true });
}));

r.get('/availability/settings', requireBusiness('services.read'), requireFeature('services'), asyncH(async (req, res) => {
  res.json({ timezone: req.business.timezone || 'Africa/Lagos', weeklyHours: req.business.weeklyHours || [], bookingPolicy: req.business.bookingPolicy || { cancellationNoticeHours: 24, advanceBookingDays: 60 } });
}));

r.put('/availability/settings', requireBusiness('services.write'), requireFeature('services'), asyncH(async (req, res) => {
  const body = parse(hoursBody, req.body);
  if (!validTimezone(body.timezone)) throw bad('Use a valid IANA timezone, such as Africa/Lagos.');
  const business = await Business.findOneAndUpdate({ _id: req.business._id }, { timezone: body.timezone, weeklyHours: body.weeklyHours, bookingPolicy: body.bookingPolicy }, { new: true, runValidators: true });
  await audit({ req, action: 'service.availability.updated', business: business._id, targetType: 'Business', targetId: business._id });
  res.json({ timezone: business.timezone, weeklyHours: business.weeklyHours, bookingPolicy: business.bookingPolicy });
}));

export default r;

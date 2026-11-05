import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Business, Product, Category, Order, Payment, Service, Booking } from '../models/index.js';
import { asyncH, notFound, bad } from '../lib/errors.js';
import { parse, z, objectId, phone, escapeRegex, pageParams } from '../lib/validate.js';
import { getAccess } from '../services/subscriptions.js';
import { createOnlineOrder } from '../services/orders.js';
import { verifyAndApply } from '../services/payments.js';
import { businessModulesFor } from '../lib/businessModules.js';
import { featureAllowed } from '../lib/subscriptionRules.js';
import { createBookingRequest, listAvailableTimes } from '../services/bookingOperations.js';
import { normalizeStorefrontConfig } from '../lib/storefront.js';

const r = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many checkout attempts. Try again shortly.',
    },
  },
});

async function liveStore(slug) {
  const b = await Business.findOne({
    slug: String(slug).toLowerCase(),
  });

  if (!b || !b.storePublished || b.status !== 'active') {
    throw notFound('Store not found');
  }

  const modules = businessModulesFor(b.businessType);
  const hasCommerce = modules.includes('commerce');
  const hasServices = modules.includes('services');

  if (!hasCommerce && !hasServices) {
    throw notFound('Store not found');
  }

  const { access, plan } = await getAccess(b._id);

  return {
    b,
    accepting:
      hasCommerce &&
      access &&
      featureAllowed(plan, 'online_store'),

    acceptingServices:
      hasServices &&
      access &&
      featureAllowed(plan, 'services') &&
      featureAllowed(plan, 'bookings'),
  };
}

const publicBiz = (b, accepting, acceptingServices) => ({
  name: b.name,
  slug: b.slug,
  description: b.description,
  category: b.category,
  phone: b.phone,
  email: b.email,
  address: b.address,
  logoUrl: b.logoUrl,
  brandColor: b.brandColor,
  storefront: normalizeStorefrontConfig(b.storefront, b.name),
  deliveryFee: b.deliveryFee,
  timezone: b.timezone || 'Africa/Lagos',
  acceptingOrders: accepting,
  acceptingServices,
});

const publicProduct = (p) => ({
  id: p._id,
  name: p.name,
  description: p.description,
  images: p.images,
  price: p.price,
  sku: p.sku,
  category: p.category,
  inStock: !p.trackStock || p.stock - p.reserved > 0,
  available: p.trackStock
    ? Math.max(0, Math.min(p.stock - p.reserved, 99))
    : null,
});

const publicService = (service) => ({
  id: service._id,
  name: service.name,
  description: service.description,
  category: service.category,
  price: service.price,
  durationMinutes: service.durationMinutes,
  bookingRequirements: service.bookingRequirements,
});

function requireCommerce(accepting) {
  if (!accepting) {
    throw notFound('Product shopping is not available for this business.');
  }
}

r.get('/:slug', asyncH(async (req, res) => {
  const { b, accepting, acceptingServices } = await liveStore(req.params.slug);

  res.json({
    business: publicBiz(b, accepting, acceptingServices),
    categories: accepting
      ? await Category.find({ business: b._id })
          .select('name')
          .sort('name')
      : [],
  });
}));

r.get('/:slug/services', asyncH(async (req, res) => {
  const { b, acceptingServices } = await liveStore(req.params.slug);

  if (!acceptingServices) {
    throw notFound('Service bookings are not available for this business.');
  }

  const services = await Service.find({
    business: b._id,
    status: 'active',
    published: true,
  }).sort('name');

  res.json({
    items: services.map(publicService),
  });
}));

r.get('/:slug/services/:id/availability', asyncH(async (req, res) => {
  const { b, acceptingServices } = await liveStore(req.params.slug);

  if (!acceptingServices) {
    throw notFound('Service bookings are not available for this business.');
  }

  const service = await Service.findOne({
    _id: req.params.id,
    business: b._id,
    status: 'active',
    published: true,
  });

  if (!service) {
    throw notFound('Service not found');
  }

  const date = String(req.query.date || '');
  const times = await listAvailableTimes({
    business: b,
    service,
    date,
  });

  res.json({
    date,
    timezone: b.timezone || 'Africa/Lagos',
    times,
  });
}));

r.post('/:slug/bookings', checkoutLimiter, asyncH(async (req, res) => {
  const { b, acceptingServices } = await liveStore(req.params.slug);

  if (!acceptingServices) {
    throw bad('This business is not accepting service booking requests.');
  }

  const body = parse(z.object({
    serviceId: objectId,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    customer: z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(200),
      phone,
      note: z.string().max(1000).optional(),
    }),
  }), req.body);

  const booking = await createBookingRequest({
    businessId: b._id,
    serviceId: body.serviceId,
    date: body.date,
    time: body.startTime,
    customerInfo: body.customer,
    note: body.customer.note,
  });

  res.status(201).json({
    booking: {
      reference: booking.reference,
      status: booking.status,
      serviceName: booking.serviceName,
      date: booking.localDate,
      startTime: booking.startTime,
      timezone: booking.timezone,
    },
  });
}));

r.post('/:slug/bookings/lookup', checkoutLimiter, asyncH(async (req, res) => {
  const { b, acceptingServices } = await liveStore(req.params.slug);

  if (!acceptingServices) {
    throw notFound('Booking not found');
  }

  const body = parse(z.object({
    reference: z.string().trim().min(8).max(32),
    email: z.string().trim().email().max(200),
  }), req.body);

  const booking = await Booking.findOne({
    business: b._id,
    reference: body.reference.toUpperCase(),
    'customerInfo.email': body.email.toLowerCase(),
  }).select('reference status serviceName localDate startTime timezone');

  if (!booking) {
    throw notFound('Booking not found');
  }

  res.json({ booking });
}));

r.get('/:slug/products', asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);

  requireCommerce(accepting);

  const { page, limit, skip } = pageParams(req.query);

  const f = {
    business: b._id,
    published: true,
    archived: false,
  };

  if (req.query.search) {
    f.name = new RegExp(
      escapeRegex(String(req.query.search).slice(0, 60)),
      'i'
    );
  }

  if (req.query.category && /^[a-f\d]{24}$/i.test(req.query.category)) {
    f.category = req.query.category;
  }

  const [items, total] = await Promise.all([
    Product.find(f).sort('-createdAt').skip(skip).limit(limit),
    Product.countDocuments(f),
  ]);

  res.json({
    items: items.map(publicProduct),
    total,
    page,
    limit,
  });
}));

r.get('/:slug/products/:id', asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);

  requireCommerce(accepting);

  const p = await Product.findOne({
    _id: req.params.id,
    business: b._id,
    published: true,
    archived: false,
  });

  if (!p) {
    throw notFound('Product not found');
  }

  res.json({
    product: publicProduct(p),
  });
}));

r.post('/:slug/checkout', checkoutLimiter, asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);

  if (!accepting) {
    throw bad('This store is not accepting orders right now.');
  }

  const body = parse(z.object({
    items: z.array(z.object({
      productId: objectId,
      qty: z.number().int().min(1).max(999),
    })).min(1).max(50),

    customer: z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email(),
      phone,
      address: z.object({
        line: z.string().trim().min(3).max(200),
        city: z.string().trim().min(2).max(80),
        state: z.string().trim().min(2).max(80),
      }),
    }),

    note: z.string().max(500).optional(),
  }), req.body);

  const { order, authorizationUrl, reference } =
    await createOnlineOrder(b, body);

  res.status(201).json({
    orderRef: order.ref,
    reference,
    authorizationUrl,
    total: order.total,
  });
}));

// The server verifies Paystack. The browser's success state is never trusted.
r.get('/:slug/orders/verify', asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);

  requireCommerce(accepting);

  const reference = String(req.query.reference || '');

  const payment = await Payment.findOne({
    reference,
    purpose: 'storefront_order',
  });

  if (!payment || String(payment.business) !== String(b._id)) {
    throw notFound('Order not found');
  }

  const out = await verifyAndApply(reference, {
    expectedContext: 'merchant',
    gatewayId: payment.gateway,
  });

  const order = await Order.findById(payment.target.id);

  res.json({
    result: out.result,
    order: {
      ref: order.ref,
      paymentStatus: order.paymentStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      total: order.total,
      items: order.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
    },
  });
}));

r.post('/:slug/orders/lookup', checkoutLimiter, asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);

  requireCommerce(accepting);

  const body = parse(z.object({
    ref: z.string().max(30),
    email: z.string().email(),
  }), req.body);

  const order = await Order.findOne({
    business: b._id,
    ref: body.ref.toUpperCase(),
    'customerInfo.email': body.email.toLowerCase(),
  });

  if (!order) {
    throw notFound('No order matches those details');
  }

  res.json({
    order: {
      ref: order.ref,
      paymentStatus: order.paymentStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      total: order.total,
      createdAt: order.createdAt,
    },
  });
}));

export default r;

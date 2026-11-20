
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const oid = (ref, extra = {}) => ({
  type: Schema.Types.ObjectId,
  ref,
  ...extra,
});

const opts = { timestamps: true };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function isValidTimezone(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en', {
      timeZone: value,
    }).format();

    return true;
  } catch {
    return false;
  }
}

function bookingStartMatchesLocalTime(booking) {
  if (
    !(booking.startsAt instanceof Date) ||
    Number.isNaN(booking.startsAt.getTime()) ||
    !DATE_PATTERN.test(booking.localDate || '') ||
    !TIME_PATTERN.test(booking.startTime || '') ||
    !isValidTimezone(booking.timezone)
  ) {
    return false;
  }

  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en', {
        timeZone: booking.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(booking.startsAt)
        .map((part) => [part.type, part.value]),
    );

    const [year, month, day] = booking.localDate.split('-');
    const [hour, minute] = booking.startTime.split(':');

    return (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour &&
      parts.minute === minute
    );
  } catch {
    return false;
  }
}

const addressSchema = new Schema({
  line: { type: String, trim: true, maxlength: 200, default: '' },
  city: { type: String, trim: true, maxlength: 80, default: '' },
  state: { type: String, trim: true, maxlength: 80, default: '' },
  postalCode: { type: String, trim: true, maxlength: 20, default: '' },
  country: { type: String, trim: true, maxlength: 80, default: 'Nigeria' },
}, { _id: false });

const socialLinksSchema = new Schema({
  website: { type: String, trim: true, maxlength: 500, default: '' },
  instagram: { type: String, trim: true, maxlength: 500, default: '' },
  facebook: { type: String, trim: true, maxlength: 500, default: '' },
  tiktok: { type: String, trim: true, maxlength: 500, default: '' },
  youtube: { type: String, trim: true, maxlength: 500, default: '' },
  linkedin: { type: String, trim: true, maxlength: 500, default: '' },
  x: { type: String, trim: true, maxlength: 500, default: '' },
}, { _id: false });

const faqSchema = new Schema({
  question: { type: String, required: true, trim: true, maxlength: 240 },
  answer: { type: String, required: true, trim: true, maxlength: 2000 },
  sortOrder: { type: Number, min: 0, default: 0 },
}, { _id: false });

const aboutSchema = new Schema({
  heading: { type: String, trim: true, maxlength: 120, default: '' },
  content: { type: String, trim: true, maxlength: 5000, default: '' },
  imageUrl: { type: String, trim: true, maxlength: 2000, default: '' },
}, { _id: false });

const deliveryInfoSchema = new Schema({
  available: { type: Boolean, default: false },
  fee: { type: Number, min: 0, default: 0 },
  estimatedTime: { type: String, trim: true, maxlength: 120, default: '' },
  details: { type: String, trim: true, maxlength: 2000, default: '' },
}, { _id: false });

const serviceInfoSchema = new Schema({
  serviceArea: { type: String, trim: true, maxlength: 1000, default: '' },
  onsite: { type: Boolean, default: false },
  remote: { type: Boolean, default: false },
  details: { type: String, trim: true, maxlength: 2000, default: '' },
}, { _id: false });

const storefrontAppearanceSchema = new Schema({
  primaryColor: { type: String, match: COLOR_PATTERN, default: '#0B6B4F' },
  accentColor: { type: String, match: COLOR_PATTERN, default: '#D6A85F' },
  backgroundColor: { type: String, match: COLOR_PATTERN, default: '#FFFFFF' },
  textColor: { type: String, match: COLOR_PATTERN, default: '#111827' },
}, { _id: false });

const storefrontSchema = new Schema({
  templateId: { type: String, trim: true, maxlength: 64, default: '' },
  appearance: { type: storefrontAppearanceSchema, default: () => ({}) },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
}, { _id: false });

// Closed days do not need opening or closing times.
const weeklyHoursSchema = new Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },

  open: {
    type: String,
    required: function () {
      return !this.closed;
    },
    match: TIME_PATTERN,
  },

  close: {
    type: String,
    required: function () {
      return !this.closed;
    },
    match: TIME_PATTERN,
    validate: {
      validator(value) {
        if (this.closed) return true;
        if (!this.open || !value) return false;
        return this.open < value;
      },
      message: 'Closing time must be after opening time.',
    },
  },

  closed: { type: Boolean, default: false },
}, { _id: false });

const weeklyHoursArrayValidator = {
  validator(hours) {
    if (!Array.isArray(hours)) return false;
    if (hours.some((item) => !item)) return false;

    const days = hours.map((item) => item.dayOfWeek);
    return new Set(days).size === days.length;
  },
  message: 'Business hours can only contain one entry per weekday.',
};

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  platformRole: {
    type: String,
    enum: [null, 'owner', 'support', 'billing'],
    default: null,
  },
  failedLogins: { type: Number, default: 0 },
  lockUntil: Date,
  lastLoginAt: Date,
}, opts));

export const Session = model('Session', new Schema({
  user: oid('User', { index: true, required: true }),
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  userAgent: String,
  ip: String,
}, opts));

// Single-use, hashed tokens: password reset, email verification, contact change.
export const Token = model('Token', new Schema({
  user: oid('User', { index: true, required: true }),
  purpose: {
    type: String,
    enum: ['password_reset', 'email_verify', 'contact_change'],
    required: true,
  },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: Date,
  initiatedBy: oid('User'),
  meta: Schema.Types.Mixed,
}, opts));

export const Business = model('Business', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  businessType: {
    type: String,
    enum: ['product', 'service', 'restaurant', 'hybrid'],
    default: 'product',
  },

  category: { type: String, trim: true, maxlength: 80, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  phone: { type: String, trim: true, maxlength: 20, default: '' },
  whatsapp: { type: String, trim: true, maxlength: 20, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },

  address: { type: addressSchema, default: () => ({}) },
  serviceArea: { type: String, trim: true, maxlength: 1000, default: '' },

  logoUrl: { type: String, trim: true, maxlength: 2000, default: '' },
  images: {
    type: [{ type: String, trim: true, maxlength: 2000 }],
    default: [],
    validate: (value) => value.length <= 20,
  },

  brandColor: { type: String, match: COLOR_PATTERN, default: '#0B6B4F' },

  brandColors: {
    primary: { type: String, match: COLOR_PATTERN, default: '#0B6B4F' },
    secondary: { type: String, match: COLOR_PATTERN, default: '#111827' },
    accent: { type: String, match: COLOR_PATTERN, default: '#D6A85F' },
  },

  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  about: { type: aboutSchema, default: () => ({}) },
  deliveryInfo: { type: deliveryInfoSchema, default: () => ({}) },
  serviceInfo: { type: serviceInfoSchema, default: () => ({}) },

  storePolicies: {
    shipping: { type: String, trim: true, maxlength: 3000, default: '' },
    returns: { type: String, trim: true, maxlength: 3000, default: '' },
    cancellations: { type: String, trim: true, maxlength: 3000, default: '' },
    privacy: { type: String, trim: true, maxlength: 3000, default: '' },
    terms: { type: String, trim: true, maxlength: 3000, default: '' },
  },

  faqs: {
    type: [faqSchema],
    default: [],
    validate: (value) => value.length <= 50,
  },

  storefront: { type: storefrontSchema, default: () => ({}) },

  deliveryFee: { type: Number, min: 0, default: 0 }, // kobo

  timezone: {
    type: String,
    default: 'Africa/Lagos',
    validate: {
      validator: isValidTimezone,
      message: 'A valid IANA timezone is required.',
    },
  },

  weeklyHours: {
    type: [weeklyHoursSchema],
    default: [],
    validate: weeklyHoursArrayValidator,
  },

  bookingPolicy: {
    cancellationNoticeHours: {
      type: Number,
      default: 24,
      min: 0,
      max: 720,
    },
    advanceBookingDays: {
      type: Number,
      default: 60,
      min: 1,
      max: 365,
    },
  },

  owner: oid('User', { required: true }),

  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
    index: true,
  },

  suspensionReason: String,

  // Keep this synchronized with storefront.status in business routes.
  storePublished: { type: Boolean, default: false },

  defaultPaymentProvider: { type: String, default: null },
  currency: { type: String, default: 'NGN' },
}, opts));

export const MerchantGateway = model('MerchantGateway', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    provider: {
      type: String,
      required: true,
      enum: ['paystack'],
    },
    enabled: { type: Boolean, default: true },
    encryptedSecret: { type: String, required: true, select: false },
    encryptionIv: { type: String, required: true, select: false },
    encryptionTag: { type: String, required: true, select: false },
    maskedAccount: String,
    providerAccountId: String,
    testedAt: Date,
    connectedAt: Date,
  }, opts);

  s.index(
    { business: 1, provider: 1, enabled: 1 },
    {
      unique: true,
      partialFilterExpression: { enabled: true },
    },
  );

  s.index({ business: 1, provider: 1, connectedAt: -1 });

  return s;
})());

export const Membership = model('Membership', (() => {
  const s = new Schema({
    user: oid('User', { required: true, index: true }),
    business: oid('Business', { required: true, index: true }),
    role: {
      type: String,
      enum: ['owner', 'manager', 'cashier'],
      required: true,
    },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  }, opts);

  s.index({ user: 1, business: 1 }, { unique: true });

  return s;
})());

export const Category = model('Category', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    name: { type: String, required: true, trim: true, maxlength: 60 },
  }, opts);

  s.index({ business: 1, name: 1 }, { unique: true });

  return s;
})());

export const MenuCategory = model('MenuCategory', (() => {
  const s = new Schema({
    business: oid('Business', { required: true, index: true }),
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    sortOrder: { type: Number, min: 0, default: 0 },
    published: { type: Boolean, default: true },
  }, opts);

  s.index({ business: 1, sortOrder: 1, name: 1 });
  s.index({ business: 1, name: 1 }, { unique: true });

  return s;
})());

export const MenuItem = model('MenuItem', (() => {
  const s = new Schema({
    business: oid('Business', { required: true, index: true }),
    category: oid('MenuCategory', { required: true }),
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },

    // All monetary values are stored in kobo.
    price: { type: Number, required: true, min: 0 },

    imageUrl: { type: String, trim: true, maxlength: 2000, default: '' },
    available: { type: Boolean, default: true },
    published: { type: Boolean, default: false },
    sortOrder: { type: Number, min: 0, default: 0 },
  }, opts);

  s.index({ business: 1, category: 1, sortOrder: 1 });
  s.index({ business: 1, published: 1, available: 1 });

  return s;
})());

export const Product = model('Product', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 4000 },
    images: [String],
    price: { type: Number, required: true, min: 0 }, // kobo
    cost: { type: Number, min: 0, default: 0 },
    sku: { type: String, trim: true },
    category: oid('Category'),
    trackStock: { type: Boolean, default: true },
    stock: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    published: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
  }, opts);

  s.index({ business: 1, archived: 1, published: 1 });

  s.index(
    { business: 1, sku: 1 },
    {
      unique: true,
      partialFilterExpression: {
        sku: { $type: 'string', $gt: '' },
      },
    },
  );

  s.index({ business: 1, name: 'text' });

  return s;
})());

export const StockMovement = model('StockMovement', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    product: oid('Product', { required: true }),
    type: {
      type: String,
      required: true,
      enum: [
        'sale_online',
        'sale_pos',
        'reserve',
        'release',
        'adjustment',
        'purchase',
        'return_restock',
        'cancel_restock',
        'initial',
      ],
    },
    stockDelta: { type: Number, default: 0 },
    reservedDelta: { type: Number, default: 0 },
    stockAfter: Number,
    reason: String,
    actor: oid('User'),
    ref: { kind: String, id: Schema.Types.ObjectId },
  }, opts);

  s.index({ business: 1, product: 1, createdAt: -1 });

  return s;
})());

export const Counter = model('Counter', (() => {
  const s = new Schema({
    business: oid('Business'),
    key: String,
    seq: { type: Number, default: 0 },
  });

  s.index({ business: 1, key: 1 }, { unique: true });

  return s;
})());

export const Customer = model('Customer', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { line: String, city: String, state: String },
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  }, opts);

  // Intentionally non-unique: customers may share contact details.
  s.index({ business: 1, phone: 1 });
  s.index({ business: 1, email: 1 });

  return s;
})());

export const Service = model('Service', (() => {
  const s = new Schema({
    business: oid('Business', { required: true, index: true }),
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 4000, default: '' },
    category: { type: String, trim: true, maxlength: 80, default: '' },
    price: { type: Number, min: 0 },
    pricingDescription: { type: String, trim: true, maxlength: 500, default: '' },
    durationMinutes: { type: Number, min: 15, max: 720 },
    bookable: { type: Boolean, default: true },
    bookingRequirements: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    published: { type: Boolean, default: true },
  }, opts);

  s.index({ business: 1, status: 1, published: 1 });

  return s;
})());

export const Booking = model('Booking', (() => {
  const s = new Schema({
    business: oid('Business', { required: true, index: true }),
    service: oid('Service', { required: true }),
    customer: oid('Customer'),

    reference: { type: String, required: true, unique: true },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    pricingDescription: { type: String, maxlength: 500, default: '' },
    durationMinutes: { type: Number, required: true, min: 15, max: 720 },

    customerInfo: {
      name: String,
      email: String,
      phone: String,
      note: String,
    },

    localDate: {
      type: String,
      required: true,
      match: DATE_PATTERN,
    },

    startTime: {
      type: String,
      required: true,
      match: TIME_PATTERN,
    },

    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },

    startMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 1425,
      validate: {
        validator(value) {
          return value % 15 === 0;
        },
        message: 'Booking start must align with a 15-minute interval.',
      },
    },

    endMinute: {
      type: Number,
      required: true,
      min: 15,
      max: 1440,
      validate: {
        validator(value) {
          return value % 15 === 0;
        },
        message: 'Booking end must align with a 15-minute interval.',
      },
    },

    timezone: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },

    history: [{
      at: { type: Date, default: Date.now },
      actor: oid('User'),
      action: String,
      note: String,
    }],
  }, opts);

  s.pre('validate', function validateBookingTimes() {
    if (
      Number.isFinite(this.startMinute) &&
      Number.isFinite(this.endMinute) &&
      Number.isFinite(this.durationMinutes) &&
      this.endMinute - this.startMinute !== this.durationMinutes
    ) {
      this.invalidate(
        'endMinute',
        'Booking time range must match the booking duration.',
      );
    }

    if (
      Number.isFinite(this.startMinute) &&
      TIME_PATTERN.test(this.startTime || '')
    ) {
      const [hour, minute] = this.startTime.split(':').map(Number);
      const expectedStartMinute = hour * 60 + minute;

      if (this.startMinute !== expectedStartMinute) {
        this.invalidate(
          'startMinute',
          'Booking start minute must match the local start time.',
        );
      }
    }

    if (
      this.startsAt instanceof Date &&
      this.endsAt instanceof Date &&
      !Number.isNaN(this.startsAt.getTime()) &&
      !Number.isNaN(this.endsAt.getTime())
    ) {
      const actualDuration =
        (this.endsAt.getTime() - this.startsAt.getTime()) / 60_000;

      if (actualDuration !== this.durationMinutes) {
        this.invalidate(
          'endsAt',
          'UTC booking timestamps must match the booking duration.',
        );
      }

      if (this.endsAt <= this.startsAt) {
        this.invalidate(
          'endsAt',
          'Booking end must be after booking start.',
        );
      }
    }

    if (
      this.startsAt &&
      !bookingStartMatchesLocalTime(this)
    ) {
      this.invalidate(
        'startsAt',
        'UTC start time must match the local booking date, time and timezone.',
      );
    }
  });

  s.index({ business: 1, localDate: 1, startMinute: 1 });
  s.index({ business: 1, status: 1, createdAt: -1 });

  return s;
})());

export const BookingSlot = model('BookingSlot', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    localDate: {
      type: String,
      required: true,
      match: DATE_PATTERN,
    },
    slotIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 95,
      validate: {
        validator(value) {
          return Number.isInteger(value);
        },
        message: 'Booking slot must be an integer.',
      },
    },
    booking: oid('Booking', { required: true }),
  }, opts);

  // Critical concurrency protection: two bookings cannot claim
  // the same 15-minute slot for the same business and date.
  s.index(
    { business: 1, localDate: 1, slotIndex: 1 },
    { unique: true },
  );

  s.index({ booking: 1 });

  return s;
})());

const itemSchema = new Schema({
  product: oid('Product'),
  name: String,
  sku: String,
  unitPrice: Number,
  qty: Number,
  lineTotal: Number,
  track: { type: Boolean, default: true },
}, { _id: false });

const historySchema = new Schema({
  at: { type: Date, default: Date.now },
  actor: oid('User'),
  action: String,
  note: String,
}, { _id: false });

export const Order = model('Order', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    ref: { type: String, required: true, unique: true },
    customer: oid('Customer'),

    customerInfo: {
      name: String,
      email: String,
      phone: String,
      address: { line: String, city: String, state: String },
      note: String,
    },

    items: [itemSchema],
    subtotal: Number,
    deliveryFee: Number,
    total: Number,

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded'],
      default: 'pending',
    },

    fulfilmentStatus: {
      type: String,
      enum: ['new', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'new',
    },

    stockState: {
      type: String,
      enum: ['reserved', 'deducted', 'released', 'restocked'],
      default: 'reserved',
    },

    reservationExpiresAt: Date,
    paymentReference: { type: String, unique: true, sparse: true },
    history: [historySchema],
    channel: { type: String, default: 'online' },
  }, opts);

  s.index({ business: 1, createdAt: -1 });
  s.index({ stockState: 1, reservationExpiresAt: 1 });

  return s;
})());

export const Sale = model('Sale', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    receiptNo: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    items: [itemSchema],
    subtotal: Number,
    discount: Number,
    total: Number,
    discountInput: { type: { type: String }, value: Number },

    paymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'card_terminal', 'paystack'],
      required: true,
    },

    paymentVerification: {
      type: String,
      enum: ['cash_recorded', 'manual_recorded', 'gateway_verified', 'pending'],
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded'],
      default: 'pending',
    },

    paymentReference: { type: String, sparse: true },
    cashReceived: Number,
    customer: oid('Customer'),
    cashier: oid('User'),

    stockState: {
      type: String,
      enum: ['reserved', 'deducted', 'released'],
      default: 'deducted',
    },

    reservationExpiresAt: Date,

    status: {
      type: String,
      enum: ['completed', 'pending', 'voided', 'partially_returned', 'returned'],
      default: 'completed',
    },

    returns: [{
      at: Date,
      by: oid('User'),
      reason: String,
      restock: Boolean,
      refundAmount: Number,
      items: [{ product: oid('Product'), qty: Number }],
    }],

    channel: { type: String, default: 'pos' },
  }, opts);

  s.index({ business: 1, idempotencyKey: 1 }, { unique: true });
  s.index({ business: 1, receiptNo: 1 }, { unique: true });
  s.index({ business: 1, createdAt: -1 });
  s.index({ stockState: 1, reservationExpiresAt: 1 });

  return s;
})());

export const Supplier = model('Supplier', new Schema({
  business: oid('Business', { required: true, index: true }),
  name: { type: String, required: true, trim: true },
  phone: String,
  email: String,
  address: String,
  notes: String,
}, opts));

export const Purchase = model('Purchase', new Schema({
  business: oid('Business', { required: true, index: true }),
  supplier: oid('Supplier'),
  items: [{ product: oid('Product'), qty: Number, unitCost: Number }],
  total: Number,
  status: { type: String, enum: ['draft', 'received', 'cancelled'], default: 'draft' },
  receivedAt: Date,
  receivedBy: oid('User'),
  note: String,
}, opts));

export const Plan = model('Plan', new Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  setupFee: { type: Number, required: true, min: 0 }, // retained for legacy records
  monthlyFee: { type: Number, required: true, min: 0 }, // kobo
  priceIsFrom: { type: Boolean, default: false },
  features: [String],

  limits: {
    products: { type: Number, default: -1 },
    staff: { type: Number, default: -1 },
    services: { type: Number, default: -1 },
    bookings: { type: Number, default: -1 },
  },

  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, opts));

export const Subscription = model('Subscription', new Schema({
  business: oid('Business', { required: true, unique: true }),
  plan: oid('Plan', { required: true }),
  pendingPlan: oid('Plan'),
  scheduledPlan: oid('Plan'),

  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
  },

  setupStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'waived'],
    default: 'waived',
  },

  setupPaidAt: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },

  authorization: {
    code: String,
    email: String,
    reusable: Boolean,
    last4: String,
    brand: String,
  },

  lastAppliedPaymentReference: String,
  failedRenewals: { type: Number, default: 0 },
  lastRenewalAttemptAt: Date,

  renewalStatus: {
    type: String,
    enum: ['current', 'retry_required'],
    default: 'current',
  },

  lastRenewalFailureAt: Date,
  lastRenewalFailureReason: String,
  nextRenewalRetryAt: Date,
  renewalLockUntil: Date,
  pendingRenewalPaymentReference: String,

  override: {
    until: Date,
    features: [String],
    reason: String,
    by: oid('User'),
  },
}, opts));

export const Payment = model('Payment', (() => {
  const s = new Schema({
    business: oid('Business', { index: true }),

    purpose: {
      type: String,
      enum: ['setup_fee', 'subscription', 'storefront_order', 'pos_sale', 'app_setup'],
      required: true,
    },

    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },

    status: {
      type: String,
      enum: ['initialized', 'success', 'failed', 'abandoned', 'refunded'],
      default: 'initialized',
    },

    target: { kind: String, id: Schema.Types.ObjectId },
    meta: Schema.Types.Mixed,

    provider: { type: String, enum: ['paystack'] },
    gateway: oid('MerchantGateway'),
    context: { type: String, enum: ['platform', 'merchant'] },

    providerTransactionId: String,
    paystackId: Number,
    channel: String,
    verifiedAt: Date,
    failureReason: String,
    applied: { type: Boolean, default: false },
    applyClaimedAt: Date,
  }, opts);

  s.index({ createdAt: -1 });

  return s;
})());

export const WebhookEvent = model('WebhookEvent', new Schema({
  key: { type: String, required: true, unique: true },
  event: String,
  processedAt: Date,
}, opts));

export const RecoveryRequest = model('RecoveryRequest', new Schema({
  reference: { type: String, required: true, unique: true },
  statusKeyHash: { type: String, required: true, select: false },

  category: {
    type: String,
    required: true,
    enum: [
      'forgot_password',
      'forgot_email',
      'lost_email_access',
      'lost_phone_access',
      'cannot_identify_account',
      'former_admin_lost_access',
      'ownership_changed',
      'suspected_compromise',
      'other',
    ],
  },

  applicant: {
    name: String,
    businessName: String,
    possibleEmail: String,
    registeredPhone: String,
    storeSlug: String,
    contactEmail: String,
    contactPhone: String,
    registrationPeriod: String,
    explanation: String,
    preferredContact: String,
  },

  user: oid('User'),
  business: oid('Business'),
  assignedTo: oid('User'),

  status: { type: String, default: 'submitted', index: true },
  riskLevel: { type: String, enum: ['standard', 'high'], default: 'standard' },

  verification: [{
    at: Date,
    by: oid('User'),
    method: {
      type: String,
      enum: [
        'registered_contact',
        'established_recovery_method',
        'authenticated_owner',
        'business_records',
        'authority_evidence',
        'manual_review',
      ],
    },
    outcome: { type: String, enum: ['passed', 'failed', 'inconclusive'] },
    note: String,
  }],

  notes: [{ at: Date, by: oid('User'), body: String }],
  publicMessages: [{ at: Date, from: String, body: String }],

  decision: {
    outcome: String,
    reason: String,
    by: oid('User'),
    at: Date,
  },

  actionsTaken: [{
    at: Date,
    by: oid('User'),
    action: String,
    note: String,
  }],

  resolvedAt: Date,
}, opts));

export const SupportTicket = model('SupportTicket', (() => {
  const s = new Schema({
    reference: { type: String, required: true, unique: true },
    business: oid('Business', { index: true }),
    createdBy: oid('User', { required: true, index: true }),

    category: {
      type: String,
      enum: [
        'account_access',
        'account_recovery',
        'store_setup',
        'products_inventory',
        'pos_sales',
        'payments',
        'subscriptions',
        'mobile_app',
        'other',
      ],
      required: true,
    },

    subject: { type: String, required: true, maxlength: 160 },
    status: { type: String, default: 'open', index: true },
    assignedTo: oid('User'),

    messages: [{
      at: { type: Date, default: Date.now },
      author: { type: String, enum: ['merchant', 'staff'] },
      user: oid('User'),
      body: String,
      internal: { type: Boolean, default: false },
    }],
  }, opts);

  return s;
})());

export const AppApplication = model('AppApplication', new Schema({
  reference: { type: String, required: true, unique: true },
  business: oid('Business', { required: true, index: true }),
  createdBy: oid('User', { required: true }),

  form: {
    businessName: String,
    applicantName: String,
    email: String,
    phone: String,
    category: String,
    storeSlug: String,
    reason: String,
    platform: { type: String, enum: ['android', 'ios', 'both'] },
    features: [String],
    brandAssets: [String],
    additional: String,
    preferredContact: { type: String, enum: ['email', 'phone', 'whatsapp'] },
  },

  status: { type: String, default: 'draft', index: true },

  messages: [{
    at: { type: Date, default: Date.now },
    author: { type: String, enum: ['merchant', 'staff'] },
    body: String,
  }],

  internalNotes: [{ at: Date, by: oid('User'), body: String }],

  quotation: {
    setupFee: Number,
    monthlyFee: Number,
    notes: String,
    issuedAt: Date,
    issuedBy: oid('User'),
  },

  setupPayment: {
    status: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
    recordedBy: oid('User'),
    at: Date,
    note: String,
  },

  supportArrangement: {
    status: { type: String, enum: ['none', 'agreed', 'active', 'ended'], default: 'none' },
    monthlyFee: Number,
    note: String,
  },

  progress: [{ at: Date, by: oid('User'), note: String }],

  delivery: {
    notes: String,
    androidUrl: String,
    iosUrl: String,
    deliveredAt: Date,
  },

  history: [{ at: Date, by: oid('User'), from: String, to: String }],
}, opts));

export const Notification = model('Notification', new Schema({
  user: oid('User'),
  toEmail: String,
  template: String,
  subject: String,

  status: {
    type: String,
    enum: ['sent', 'skipped_no_provider', 'failed'],
    required: true,
  },

  error: String,
}, opts));

export const AuditLog = model('AuditLog', (() => {
  const s = new Schema({
    actor: oid('User'),

    actorType: {
      type: String,
      enum: ['platform', 'merchant', 'system', 'public'],
      default: 'system',
    },

    action: { type: String, required: true, index: true },
    targetType: String,
    targetId: Schema.Types.ObjectId,
    business: oid('Business', { index: true }),
    related: { kind: String, id: Schema.Types.ObjectId },
    reason: String,
    outcome: { type: String, default: 'success' },
    meta: Schema.Types.Mixed,
    ip: String,
  }, opts);

  s.index({ createdAt: -1 });

  return s;
})());

export const PlatformSettings = model('PlatformSettings', new Schema({
  key: { type: String, unique: true, default: 'platform' },

  // Subscription policy
  graceDays: { type: Number, default: 7, min: 0, max: 60 },

  // Pricing configuration
  currencyConfig: {
    type: String,
    enum: ['ngn_global'],
    default: 'ngn_global',
  },

  pricingVersion: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Branded app pricing; separate from merchant subscriptions
  appSetupFrom: { type: Number, default: 50000000 },
  appMonthlyFrom: { type: Number, default: 2500000 },

  // Platform operations
  reservationMinutes: { type: Number, default: 30, min: 5, max: 240 },
  recoveryTokenMinutes: { type: Number, default: 60, min: 10, max: 1440 },
  supportEmail: { type: String, default: '' },
  supportPhone: { type: String, default: '' },
}, opts));

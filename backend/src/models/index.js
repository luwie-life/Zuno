import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const oid = (ref, extra = {}) => ({ type: Schema.Types.ObjectId, ref, ...extra });
const opts = { timestamps: true };

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  platformRole: { type: String, enum: [null, 'owner', 'support', 'billing'], default: null },
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
  purpose: { type: String, enum: ['password_reset', 'email_verify', 'contact_change'], required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: Date,
  initiatedBy: oid('User'),
  meta: Schema.Types.Mixed,
}, opts));

export const Business = model('Business', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, trim: true },
  description: { type: String, maxlength: 1000 },
  phone: String, email: String,
  address: { line: String, city: String, state: String },
  logoUrl: String,
  brandColor: { type: String, default: '#0B6B4F' },
  deliveryFee: { type: Number, default: 0 }, // kobo
  owner: oid('User', { required: true }),
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  suspensionReason: String,
  storePublished: { type: Boolean, default: false },
  defaultPaymentProvider: { type: String, default: null },
  currency: { type: String, default: 'NGN' },
}, opts));

export const MerchantGateway = model('MerchantGateway', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    provider: { type: String, required: true, enum: ['paystack'] },
    enabled: { type: Boolean, default: true },
    encryptedSecret: { type: String, required: true, select: false },
    encryptionIv: { type: String, required: true, select: false },
    encryptionTag: { type: String, required: true, select: false },
    maskedAccount: String,
    providerAccountId: String,
    testedAt: Date,
    connectedAt: Date,
  }, opts);
  s.index({ business: 1, provider: 1, enabled: 1 }, { unique: true, partialFilterExpression: { enabled: true } });
  s.index({ business: 1, provider: 1, connectedAt: -1 });
  return s;
})());

export const Membership = model('Membership', (() => {
  const s = new Schema({
    user: oid('User', { required: true, index: true }),
    business: oid('Business', { required: true, index: true }),
    role: { type: String, enum: ['owner', 'manager', 'cashier'], required: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  }, opts);
  s.index({ user: 1, business: 1 }, { unique: true });
  return s;
})());

export const Category = model('Category', (() => {
  const s = new Schema({ business: oid('Business', { required: true }), name: { type: String, required: true, trim: true, maxlength: 60 } }, opts);
  s.index({ business: 1, name: 1 }, { unique: true });
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
    stock: { type: Number, default: 0, min: 0 },      // physical units on hand
    reserved: { type: Number, default: 0, min: 0 },   // held for unpaid online/POS-electronic orders
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    published: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
  }, opts);
  s.index({ business: 1, archived: 1, published: 1 });
  s.index({ business: 1, sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string', $gt: '' } } });
  s.index({ business: 1, name: 'text' });
  return s;
})());

export const StockMovement = model('StockMovement', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    product: oid('Product', { required: true }),
    type: { type: String, required: true, enum: ['sale_online', 'sale_pos', 'reserve', 'release', 'adjustment', 'purchase', 'return_restock', 'cancel_restock', 'initial'] },
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
  const s = new Schema({ business: oid('Business'), key: String, seq: { type: Number, default: 0 } });
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
  s.index({ business: 1, phone: 1 });
  s.index({ business: 1, email: 1 });
  return s;
})());

const itemSchema = new Schema({
  product: oid('Product'), name: String, sku: String,
  unitPrice: Number, qty: Number, lineTotal: Number, track: { type: Boolean, default: true },
}, { _id: false });
const historySchema = new Schema({ at: { type: Date, default: Date.now }, actor: oid('User'), action: String, note: String }, { _id: false });

export const Order = model('Order', (() => {
  const s = new Schema({
    business: oid('Business', { required: true }),
    ref: { type: String, required: true, unique: true },
    customer: oid('Customer'),
    customerInfo: { name: String, email: String, phone: String, address: { line: String, city: String, state: String }, note: String },
    items: [itemSchema],
    subtotal: Number, deliveryFee: Number, total: Number,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded'], default: 'pending' },
    fulfilmentStatus: { type: String, enum: ['new', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'], default: 'new' },
    stockState: { type: String, enum: ['reserved', 'deducted', 'released', 'restocked'], default: 'reserved' },
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
    subtotal: Number, discount: Number, total: Number,
    discountInput: { type: { type: String }, value: Number },
    paymentMethod: { type: String, enum: ['cash', 'transfer', 'card_terminal', 'paystack'], required: true },
    paymentVerification: { type: String, enum: ['cash_recorded', 'manual_recorded', 'gateway_verified', 'pending'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded'], default: 'pending' },
    paymentReference: { type: String, sparse: true },
    cashReceived: Number,
    customer: oid('Customer'),
    cashier: oid('User'),
    stockState: { type: String, enum: ['reserved', 'deducted', 'released'], default: 'deducted' },
    reservationExpiresAt: Date,
    status: { type: String, enum: ['completed', 'pending', 'voided', 'partially_returned', 'returned'], default: 'completed' },
    returns: [{ at: Date, by: oid('User'), reason: String, restock: Boolean, refundAmount: Number, items: [{ product: oid('Product'), qty: Number }] }],
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
  name: { type: String, required: true, trim: true }, phone: String, email: String, address: String, notes: String,
}, opts));

export const Purchase = model('Purchase', new Schema({
  business: oid('Business', { required: true, index: true }),
  supplier: oid('Supplier'),
  items: [{ product: oid('Product'), qty: Number, unitCost: Number }],
  total: Number,
  status: { type: String, enum: ['draft', 'received', 'cancelled'], default: 'draft' },
  receivedAt: Date, receivedBy: oid('User'), note: String,
}, opts));

export const Plan = model('Plan', new Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  setupFee: { type: Number, required: true, min: 0 },     // kobo
  monthlyFee: { type: Number, required: true, min: 0 },   // kobo
  priceIsFrom: { type: Boolean, default: false },
  features: [String],
  limits: { products: { type: Number, default: -1 }, staff: { type: Number, default: -1 } },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, opts));

export const Subscription = model('Subscription', new Schema({
  business: oid('Business', { required: true, unique: true }),
  plan: oid('Plan', { required: true }),
  pendingPlan: oid('Plan'),     // upgrade awaiting its setup-fee difference
  scheduledPlan: oid('Plan'),   // downgrade applied at period end
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' }, // intent only; access is computed
  setupStatus: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
  setupPaidAt: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  authorization: { code: String, email: String, reusable: Boolean, last4: String, brand: String }, // Paystack token, never card data
  lastAppliedPaymentReference: String,
  failedRenewals: { type: Number, default: 0 },
  lastRenewalAttemptAt: Date,
  override: { until: Date, features: [String], reason: String, by: oid('User') },
}, opts));

export const Payment = model('Payment', (() => {
  const s = new Schema({
    business: oid('Business', { index: true }),
    purpose: { type: String, enum: ['setup_fee', 'subscription', 'storefront_order', 'pos_sale', 'app_setup'], required: true },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    status: { type: String, enum: ['initialized', 'success', 'failed', 'abandoned', 'refunded'], default: 'initialized' },
    target: { kind: String, id: Schema.Types.ObjectId },
    meta: Schema.Types.Mixed, // e.g. { planId }
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
  category: { type: String, required: true, enum: ['forgot_password', 'forgot_email', 'lost_email_access', 'lost_phone_access', 'cannot_identify_account', 'former_admin_lost_access', 'ownership_changed', 'suspected_compromise', 'other'] },
  applicant: { name: String, businessName: String, possibleEmail: String, registeredPhone: String, storeSlug: String, contactEmail: String, contactPhone: String, registrationPeriod: String, explanation: String, preferredContact: String },
  user: oid('User'), business: oid('Business'),
  assignedTo: oid('User'),
  status: { type: String, default: 'submitted', index: true },
  riskLevel: { type: String, enum: ['standard', 'high'], default: 'standard' },
  verification: [{ at: Date, by: oid('User'), method: { type: String, enum: ['registered_contact', 'established_recovery_method', 'authenticated_owner', 'business_records', 'authority_evidence', 'manual_review'] }, outcome: { type: String, enum: ['passed', 'failed', 'inconclusive'] }, note: String }],
  notes: [{ at: Date, by: oid('User'), body: String }],               // private, never returned to applicants
  publicMessages: [{ at: Date, from: String, body: String }],        // visible to applicant via status check
  decision: { outcome: String, reason: String, by: oid('User'), at: Date },
  actionsTaken: [{ at: Date, by: oid('User'), action: String, note: String }],
  resolvedAt: Date,
}, opts));

export const SupportTicket = model('SupportTicket', (() => {
  const s = new Schema({
    reference: { type: String, required: true, unique: true },
    business: oid('Business', { index: true }),
    createdBy: oid('User', { required: true, index: true }),
    category: { type: String, enum: ['account_access', 'account_recovery', 'store_setup', 'products_inventory', 'pos_sales', 'payments', 'subscriptions', 'mobile_app', 'other'], required: true },
    subject: { type: String, required: true, maxlength: 160 },
    status: { type: String, default: 'open', index: true },
    assignedTo: oid('User'),
    messages: [{ at: { type: Date, default: Date.now }, author: { type: String, enum: ['merchant', 'staff'] }, user: oid('User'), body: String, internal: { type: Boolean, default: false } }],
  }, opts);
  return s;
})());

export const AppApplication = model('AppApplication', new Schema({
  reference: { type: String, required: true, unique: true },
  business: oid('Business', { required: true, index: true }),
  createdBy: oid('User', { required: true }),
  form: {
    businessName: String, applicantName: String, email: String, phone: String, category: String, storeSlug: String,
    reason: String, platform: { type: String, enum: ['android', 'ios', 'both'] }, features: [String], brandAssets: [String],
    additional: String, preferredContact: { type: String, enum: ['email', 'phone', 'whatsapp'] },
  },
  status: { type: String, default: 'draft', index: true },
  messages: [{ at: { type: Date, default: Date.now }, author: { type: String, enum: ['merchant', 'staff'] }, body: String }],
  internalNotes: [{ at: Date, by: oid('User'), body: String }],
  quotation: { setupFee: Number, monthlyFee: Number, notes: String, issuedAt: Date, issuedBy: oid('User') },
  setupPayment: { status: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' }, recordedBy: oid('User'), at: Date, note: String },
  supportArrangement: { status: { type: String, enum: ['none', 'agreed', 'active', 'ended'], default: 'none' }, monthlyFee: Number, note: String },
  progress: [{ at: Date, by: oid('User'), note: String }],
  delivery: { notes: String, androidUrl: String, iosUrl: String, deliveredAt: Date },
  history: [{ at: Date, by: oid('User'), from: String, to: String }],
}, opts));

export const Notification = model('Notification', new Schema({
  user: oid('User'), toEmail: String, template: String, subject: String,
  status: { type: String, enum: ['sent', 'skipped_no_provider', 'failed'], required: true },
  error: String,
}, opts));

export const AuditLog = model('AuditLog', (() => {
  const s = new Schema({
    actor: oid('User'), actorType: { type: String, enum: ['platform', 'merchant', 'system', 'public'], default: 'system' },
    action: { type: String, required: true, index: true },
    targetType: String, targetId: Schema.Types.ObjectId, business: oid('Business', { index: true }),
    related: { kind: String, id: Schema.Types.ObjectId },
    reason: String, outcome: { type: String, default: 'success' }, meta: Schema.Types.Mixed, ip: String,
  }, opts);
  s.index({ createdAt: -1 });
  return s;
})());

export const PlatformSettings = model('PlatformSettings', new Schema({
  key: { type: String, unique: true, default: 'platform' },
  graceDays: { type: Number, default: 7, min: 0, max: 60 },
  appSetupFrom: { type: Number, default: 50000000 },  // ₦500,000 in kobo
  appMonthlyFrom: { type: Number, default: 2500000 }, // ₦25,000 in kobo
  reservationMinutes: { type: Number, default: 30, min: 5, max: 240 },
  recoveryTokenMinutes: { type: Number, default: 60, min: 10, max: 1440 },
  supportEmail: { type: String, default: '' },
  supportPhone: { type: String, default: '' },
}, opts));

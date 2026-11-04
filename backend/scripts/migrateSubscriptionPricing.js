
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  Plan,
  Subscription,
  PlatformSettings,
} from '../src/models/index.js';

const NGN = (amount) => amount * 100;

const BASE_FEATURES = [
  'online_store',
  'products',
  'orders',
  'basic_reports',
  'services',
  'bookings',
];

const BUSINESS_FEATURES = [
  ...BASE_FEATURES,
  'pos',
  'shared_inventory',
  'stock_movements',
  'low_stock',
  'customers',
  'suppliers',
  'purchasing',
  'enhanced_reports',
];

const PLAN_DEFINITIONS = [
  {
    key: 'free',
    name: 'Free',
    description: 'Get started with Zuno at no monthly cost.',
    monthlyFee: 0,
    features: [],
    limits: {
      products: 0,
      staff: 0,
      services: 0,
      bookings: 0,
    },
    sortOrder: 0,
  },
  {
    key: 'starter',
    name: 'Starter',
    description: 'Establish your online business presence.',
    monthlyFee: NGN(5000),
    features: BASE_FEATURES,
    limits: {
      products: 200,
      staff: 1,
      services: 200,
      bookings: -1,
    },
    sortOrder: 1,
  },
  {
    key: 'growth',
    name: 'Growth',
    description: 'More tools to manage and grow your business.',
    monthlyFee: NGN(10000),
    features: BUSINESS_FEATURES,
    limits: {
      products: 2000,
      staff: 5,
      services: 2000,
      bookings: -1,
    },
    sortOrder: 2,
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'The complete Zuno experience for growing businesses.',
    monthlyFee: NGN(20000),
    features: [...BUSINESS_FEATURES, 'priority_support'],
    limits: {
      products: -1,
      staff: -1,
      services: -1,
      bookings: -1,
    },
    sortOrder: 3,
  },
];

const LEGACY_MAPPING = {
  online_store: 'starter',
  store_business: 'growth',
  advanced: 'pro',
};

async function migrate() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log('Connected to MongoDB.');

  const settings = await PlatformSettings.findOne({ key: 'platform' }).lean();

  if (Number(settings?.pricingVersion || 0) >= 1) {
    console.log('Pricing migration already completed. No changes made.');
    return;
  }

  const legacyPlans = await Plan.find({
    key: { $in: Object.keys(LEGACY_MAPPING) },
  }).lean();

  const legacyByKey = new Map(
    legacyPlans.map((plan) => [plan.key, plan]),
  );

  const canonicalPlans = new Map();

  // Create/update the four canonical plans.
  for (const definition of PLAN_DEFINITIONS) {
    const legacyKey = Object.keys(LEGACY_MAPPING).find(
      (key) => LEGACY_MAPPING[key] === definition.key,
    );

    const legacyPlan = legacyKey
      ? legacyByKey.get(legacyKey)
      : null;

    const existingCanonical = await Plan.findOne({
      key: definition.key,
    }).lean();

    // Preserve existing paid-plan features and limits where available.
    const preservedPlan = legacyPlan || existingCanonical;

    const planData = {
      ...definition,
      setupFee: 0,
      priceIsFrom: false,
      active: true,
      features: definition.key === 'free'
        ? definition.features
        : preservedPlan?.features?.length
          ? preservedPlan.features
          : definition.features,
      limits: definition.key === 'free'
        ? definition.limits
        : preservedPlan?.limits || definition.limits,
    };

    const plan = await Plan.findOneAndUpdate(
      { key: definition.key },
      { $set: planData },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    canonicalPlans.set(definition.key, plan);

    console.log(`Prepared ${definition.name}: ₦${definition.monthlyFee / 100}/month`);
  }

  // Remap current, scheduled and pending subscription plan references.
  let currentRemapped = 0;
  let scheduledRemapped = 0;
  let pendingRemapped = 0;

  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_MAPPING)) {
    const legacyPlan = legacyByKey.get(legacyKey);
    const canonicalPlan = canonicalPlans.get(canonicalKey);

    if (!legacyPlan || !canonicalPlan) continue;

    const currentResult = await Subscription.updateMany(
      { plan: legacyPlan._id },
      { $set: { plan: canonicalPlan._id } },
    );

    const scheduledResult = await Subscription.updateMany(
      { scheduledPlan: legacyPlan._id },
      { $set: { scheduledPlan: canonicalPlan._id } },
    );

    const pendingResult = await Subscription.updateMany(
      { pendingPlan: legacyPlan._id },
      { $set: { pendingPlan: canonicalPlan._id } },
    );

    currentRemapped += currentResult.modifiedCount || 0;
    scheduledRemapped += scheduledResult.modifiedCount || 0;
    pendingRemapped += pendingResult.modifiedCount || 0;

    // Keep legacy records, but prevent new subscriptions selecting them.
    await Plan.updateOne(
      { _id: legacyPlan._id },
      { $set: { active: false } },
    );

    console.log(`Mapped ${legacyKey} to ${canonicalKey}.`);
  }

  // All subscriptions use the no-setup-fee policy.
  // This does not modify payment records or billing dates.
  const waivedResult = await Subscription.updateMany(
    { setupStatus: { $ne: 'waived' } },
    { $set: { setupStatus: 'waived' } },
  );

  // Record completion last, so an interrupted migration can be rerun.
  await PlatformSettings.findOneAndUpdate(
    { key: 'platform' },
    {
      $set: {
        currencyConfig: 'ngn_global',
        pricingVersion: 1,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  console.log('\nMigration completed successfully.');
  console.log(`Current plans remapped: ${currentRemapped}`);
  console.log(`Scheduled plans remapped: ${scheduledRemapped}`);
  console.log(`Pending plans remapped: ${pendingRemapped}`);
  console.log(`Subscriptions setup fees waived: ${waivedResult.modifiedCount || 0}`);
  console.log('Legacy plans deactivated.');
  console.log('Payment history preserved.');
  console.log('Paystack authorizations preserved.');
  console.log('Subscription IDs and billing dates preserved.');
  console.log('Currency configuration: ngn_global');
  console.log('Pricing version: 1');
}

migrate()
  .catch((error) => {
    console.error('Pricing migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

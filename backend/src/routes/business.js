
import { Router } from 'express';
import {
  Business,
  Membership,
  Product,
  MenuItem,
  User,
  Plan,
} from '../models/index.js';

import { asyncH, bad, conflict, forbidden } from '../lib/errors.js';
import { parse, z, phone, kobo } from '../lib/validate.js';
import {
  requireAuthAllowUnverified,
  requireVerifiedEmail,
  requireBusiness,
  assertLimit,
} from '../middleware/auth.js';

import {
  createSubscription,
  getAccess,
} from '../services/subscriptions.js';

import { audit } from '../services/audit.js';
import { businessModulesFor } from '../lib/businessModules.js';
import { sendMail } from '../services/mailer.js';
import { env } from '../config/env.js';

const r = Router();

// Authentication is still mandatory.
// Unverified accounts are temporarily allowed through onboarding only.
r.use(requireAuthAllowUnverified);

const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'store',
  'login',
  'register',
  'pricing',
  'support',
  'zuno',
  'www',
  'recover',
  'mobile-app',
  'privacy',
  'terms',
]);

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/,
    'Use 3-40 letters, numbers or hyphens',
  )
  .refine(
    (s) => !RESERVED.has(s),
    'That store address is reserved',
  );

const addr = z.object({
  line: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(80).optional(),
});

const httpsUrl = z
  .string()
  .url()
  .refine(
    (u) => u.startsWith('https://'),
    'Must be an https URL',
  );

const urlOrEmpty = httpsUrl.or(z.literal(''));
const brandColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const socialLinks = z.object({
  website: urlOrEmpty.optional(),
  instagram: urlOrEmpty.optional(),
  facebook: urlOrEmpty.optional(),
  tiktok: urlOrEmpty.optional(),
  youtube: urlOrEmpty.optional(),
  linkedin: urlOrEmpty.optional(),
  x: urlOrEmpty.optional(),
});

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const hoursEntry = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  open: z.string().regex(TIME_PATTERN).optional(),
  close: z.string().regex(TIME_PATTERN).optional(),
  closed: z.boolean().default(false),
}).superRefine((item, ctx) => {
  if (item.closed) return;

  if (!item.open) {
    ctx.addIssue({
      code: 'custom',
      path: ['open'],
      message: 'Opening time is required for an open day.',
    });
  }

  if (!item.close) {
    ctx.addIssue({
      code: 'custom',
      path: ['close'],
      message: 'Closing time is required for an open day.',
    });
  }

  if (item.open && item.close && item.open >= item.close) {
    ctx.addIssue({
      code: 'custom',
      path: ['close'],
      message: 'Closing time must be after opening time.',
    });
  }
});

const businessHours = z.array(hoursEntry).max(7).superRefine((hours, ctx) => {
  if (new Set(hours.map((item) => item.dayOfWeek)).size !== hours.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Business hours must not repeat a weekday.',
    });
  }
});

const faqs = z.array(z.object({
  question: z.string().trim().min(1).max(240),
  answer: z.string().trim().min(1).max(2000),
  sortOrder: z.number().int().min(0).max(10000).optional(),
})).max(50);

const storefrontAppearance = z.object({
  primaryColor: brandColor.optional(),
  accentColor: brandColor.optional(),
  backgroundColor: brandColor.optional(),
  textColor: brandColor.optional(),
});

const templateId = z.string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9_-]{1,63}$/i, 'Invalid template ID');

function hasBusinessProfile(business) {
  return Boolean(
    business.category
    && business.phone
    && (
      business.address?.city
      || business.serviceArea
      || business.serviceInfo?.serviceArea
    ),
  );
}

// ---- create business ----

r.post('/', asyncH(async (req, res) => {
  const b = parse(
    z.object({
      name: z.string().trim().min(2).max(120),
      slug: slugSchema,
      planKey: z.string().min(2).max(40),
      businessType: z
        .enum(['product', 'service', 'restaurant', 'hybrid'])
        .default('product'),
      category: z.string().max(80).optional(),
    }),
    req.body,
  );

  if (await Business.exists({ slug: b.slug })) {
    throw conflict(
      'That store address is taken.',
      'SLUG_TAKEN',
    );
  }

  const plan = await Plan.findOne({
    key: b.planKey,
    active: true,
  });

  if (!plan) {
    throw bad('Choose a valid plan.');
  }

  const owned = await Membership.countDocuments({
    user: req.user._id,
    role: 'owner',
    status: 'active',
  });

  if (owned >= 5) {
    throw bad('Business limit reached for one account.');
  }

  const business = await Business.create({
    name: b.name,
    slug: b.slug,
    businessType: b.businessType,
    category: b.category,
    owner: req.user._id,
    email: req.user.email,
    phone: req.user.phone,
  });

  await Membership.create({
    user: req.user._id,
    business: business._id,
    role: 'owner',
  });

  await createSubscription(
    business._id,
    b.planKey,
  );

  await audit({
    req,
    action: 'business.created',
    targetType: 'Business',
    targetId: business._id,
    business: business._id,
  });

  res.status(201).json({ business });
}));

// ---- slug availability ----

r.get('/slug-available/:slug', asyncH(async (req, res) => {
  const s = slugSchema.safeParse(req.params.slug);

  res.json({
    available:
      s.success
      && !(await Business.exists({ slug: s.data })),
  });
}));

// All business management routes below this point require verified email.
r.use(requireVerifiedEmail);

// ---- current business ----

r.get(
  '/current',
  requireBusiness(null, { allowSuspended: true }),
  asyncH(async (req, res) => {
    const b = req.business;

    const [products, menuItems, access] = await Promise.all([
      Product.countDocuments({
        business: b._id,
        archived: false,
      }),
      MenuItem.countDocuments({
        business: b._id,
        published: true,
      }),
      getAccess(b._id),
    ]);

    const modules = businessModulesFor(b.businessType);

    const overrideFeatures =
      access.access
      && access.sub?.override?.until > new Date()
        ? access.sub.override.features || []
        : [];

    const availableFeatures = access.access
      ? [
          ...new Set([
            ...(access.plan?.features || []),
            ...overrideFeatures,
          ]),
        ]
      : [];

    const profileDone = hasBusinessProfile(b);

    const steps = [
      {
        key: 'profile',
        label: 'Add business details',
        done: profileDone,
      },
      {
        key: 'plan',
        label: 'Activate your plan',
        done: access.access,
        optional: true,
      },
      ...(modules.includes('commerce')
        ? [
            {
              key: 'products',
              label: 'Add your first product',
              done: products > 0,
              optional: true,
            },
            {
              key: 'publish',
              label: 'Publish your store',
              done: Boolean(b.storePublished),
            },
          ]
        : modules.includes('menu')
          ? [
              {
                key: 'menu',
                label: 'Add your first menu item',
                done: menuItems > 0,
                optional: true,
              },
              {
                key: 'publish',
                label: 'Publish your store',
                done: Boolean(b.storePublished),
              },
            ]
          : [
              {
                key: 'portfolio',
                label: 'Add your first service or project',
                done: Boolean(b.storePublished),
                optional: true,
              },
            ]),
    ];

    res.json({
      business: b,
      businessType: b.businessType || 'product',
      modules,
      role: req.role,

      permissions: [
        'business.update',
        'products.read',
        'products.write',
        'orders.read',
        'orders.write',
        'pos.sell',
        'pos.discount',
        'pos.refund',
        'inventory.read',
        'inventory.adjust',
        'reports.read',
        'suppliers.write',
        'customers.read',
        'customers.write',
        'services.read',
        'services.write',
        'menu.read',
        'menu.write',
        'bookings.read',
        'bookings.manage',
        'staff.manage',
        'billing.manage',
        'apps.read',
      ].filter(req.can),

      subscription: {
        state: access.state,
        plan: access.plan && {
          key: access.plan.key,
          name: access.plan.name,
          features: access.plan.features,
          limits: access.plan.limits,
        },
        features: availableFeatures,
        currentPeriodEnd: access.sub?.currentPeriodEnd,
        setupStatus: access.sub?.setupStatus,
      },

      setup: {
        steps,
        complete: steps
          .filter((step) => !step.optional)
          .every((step) => step.done),
      },
    });
  }),
);

// ---- update business profile ----

r.patch(
  '/current',
  requireBusiness('business.update'),
  asyncH(async (req, res) => {
    const b = parse(
      z.object({
        name: z.string().trim().min(2).max(120),
        slug: slugSchema,
        category: z.string().max(80),
        description: z.string().max(1000),
        phone,
        whatsapp: phone,
        email: z.string().email(),
        address: addr.partial(),
        serviceArea: z.string().trim().max(1000),
        logoUrl: urlOrEmpty,
        images: z.array(httpsUrl).max(20),
        brandColor,
        brandColors: z.object({
          primary: brandColor.optional(),
          secondary: brandColor.optional(),
          accent: brandColor.optional(),
        }),
        socialLinks,
        about: z.object({
          heading: z.string().trim().max(120).optional(),
          content: z.string().trim().max(5000).optional(),
          imageUrl: urlOrEmpty.optional(),
        }),
        deliveryInfo: z.object({
          available: z.boolean().optional(),
          fee: kobo.optional(),
          estimatedTime: z.string().trim().max(120).optional(),
          details: z.string().trim().max(2000).optional(),
        }),
        serviceInfo: z.object({
          serviceArea: z.string().trim().max(1000).optional(),
          onsite: z.boolean().optional(),
          remote: z.boolean().optional(),
          details: z.string().trim().max(2000).optional(),
        }),
        weeklyHours: businessHours,
        storePolicies: z.object({
          shipping: z.string().trim().max(3000).optional(),
          returns: z.string().trim().max(3000).optional(),
          cancellations: z.string().trim().max(3000).optional(),
          privacy: z.string().trim().max(3000).optional(),
          terms: z.string().trim().max(3000).optional(),
        }),
        faqs,
        deliveryFee: kobo,
      }).partial(),
      req.body,
    );

    if (
      b.slug
      && b.slug !== req.business.slug
      && await Business.exists({
        slug: b.slug,
        _id: { $ne: req.business._id },
      })
    ) {
      throw conflict('That store address is taken.', 'SLUG_TAKEN');
    }

    if (b.slug) {
      b.slug = b.slug.toLowerCase();
    }

    for (const key of [
      'address',
      'brandColors',
      'socialLinks',
      'about',
      'deliveryInfo',
      'serviceInfo',
      'storePolicies',
    ]) {
      if (b[key]) {
        const current =
          req.business[key]?.toObject?.()
          || req.business[key]
          || {};

        b[key] = { ...current, ...b[key] };
      }
    }

    if (b.brandColor && !b.brandColors?.primary) {
      const currentColors =
        req.business.brandColors?.toObject?.()
        || req.business.brandColors
        || {};

      b.brandColors = {
        ...currentColors,
        primary: b.brandColor,
      };
    } else if (b.brandColors?.primary) {
      b.brandColor = b.brandColors.primary;
    }

    if (b.deliveryInfo?.fee !== undefined) {
      b.deliveryFee = b.deliveryInfo.fee;
    } else if (b.deliveryFee !== undefined) {
      const currentDelivery =
        req.business.deliveryInfo?.toObject?.()
        || req.business.deliveryInfo
        || {};

      b.deliveryInfo = {
        ...currentDelivery,
        fee: b.deliveryFee,
      };
    }

    Object.assign(req.business, b);

    await req.business.save();

    res.json({ business: req.business });
  }),
);

// ---- storefront settings ----

r.get(
  '/current/storefront',
  requireBusiness('business.update'),
  asyncH(async (req, res) => {
    res.json({ storefront: req.business.storefront });
  }),
);

r.put(
  '/current/storefront',
  requireBusiness('business.update'),
  asyncH(async (req, res) => {
    const body = parse(
      z.object({
        templateId: templateId.optional(),
        appearance: storefrontAppearance.optional(),
      }).strict(),
      req.body,
    );

    const existing =
      req.business.storefront?.toObject?.()
      || req.business.storefront
      || {};

    req.business.storefront = {
      ...existing,
      ...body,
      appearance: {
        ...(existing.appearance || {}),
        ...(body.appearance || {}),
      },
    };

    await req.business.save();

    res.json({ storefront: req.business.storefront });
  }),
);

// ---- publish storefront ----

r.post(
  '/current/publish',
  requireBusiness('business.update'),
  asyncH(async (req, res) => {
    const { publish } = parse(
      z.object({
        publish: z.boolean(),
      }),
      req.body,
    );

    const b = req.business;

    if (publish) {
      const modules = businessModulesFor(b.businessType);

      const hasCommerce = modules.includes('commerce');
      const hasServices = modules.includes('services');
      const hasMenu = modules.includes('menu');

      if (!hasCommerce && !hasServices && !hasMenu) {
        throw forbidden(
          'Publishing is not enabled for this business type.',
        );
      }

      if (!req.user.emailVerified) {
        throw forbidden(
          'Verify your email before publishing.',
        );
      }

      if (!hasBusinessProfile(b)) {
        throw bad(
          'Add your category, phone and business location or service area first.',
        );
      }

      if (!b.storefront?.templateId) {
        throw bad('Select a storefront template before publishing.');
      }
    }

    const wasPublished = Boolean(b.storePublished);

    if (!b.storefront) {
      b.storefront = {};
    }

    b.storePublished = publish;
    b.storefront.status = publish ? 'published' : 'draft';

    await b.save();

    await audit({
      req,
      action: publish
        ? 'store.published'
        : 'store.unpublished',
      targetType: 'Business',
      targetId: b._id,
      business: b._id,
    });

    if (publish && !wasPublished) {
      try {
        const owner = await User.findById(b.owner).select('email name');

        const recipient = b.email || owner?.email;

        if (recipient) {
          await sendMail({
            user: owner?._id,
            to: recipient,
            template: 'store_published',
            subject: `${b.name} is now published`,
            text: `Your storefront is live at ${env.frontendUrl}/store/${b.slug}.`,
          });
        }
      } catch (error) {
        // Publishing has already succeeded. A notification failure
        // must not make the publish request appear unsuccessful.
        console.error('Store publication email failed:', error);
      }
    }

    res.json({ business: b });
  }),
);

// ---- team ----

r.get(
  '/current/members',
  requireBusiness('staff.manage'),
  asyncH(async (req, res) => {
    const ms = await Membership.find({
      business: req.business._id,
      status: 'active',
    }).populate('user', 'name email phone');

    res.json({
      members: ms.map((m) => ({
        id: m._id,
        role: m.role,
        user: m.user,
      })),
    });
  }),
);

r.post(
  '/current/members',
  requireBusiness('staff.manage'),
  asyncH(async (req, res) => {
    const b = parse(
      z.object({
        email: z.string().email(),
        role: z.enum(['manager', 'cashier']),
      }),
      req.body,
    );

    const count = await Membership.countDocuments({
      business: req.business._id,
      status: 'active',
    });

    await assertLimit(req, 'staff', count);

    const user = await User.findOne({
      email: b.email.toLowerCase(),
      status: 'active',
    });

    if (!user) {
      throw bad(
        'No Zuno account exists for that email. Ask them to register first.',
      );
    }

    const existing = await Membership.findOne({
      user: user._id,
      business: req.business._id,
    });

    if (existing?.status === 'active') {
      throw conflict('They are already on this team.');
    }

    if (existing) {
      existing.status = 'active';
      existing.role = b.role;
      await existing.save();
    } else {
      await Membership.create({
        user: user._id,
        business: req.business._id,
        role: b.role,
      });
    }

    await audit({
      req,
      action: 'team.member_added',
      business: req.business._id,
      targetType: 'User',
      targetId: user._id,
      meta: { role: b.role },
    });

    res.status(201).json({ ok: true });
  }),
);

r.patch(
  '/current/members/:id',
  requireBusiness('staff.manage'),
  asyncH(async (req, res) => {
    const b = parse(
      z.object({
        role: z.enum(['manager', 'cashier']),
      }),
      req.body,
    );

    const m = await Membership.findOne({
      _id: req.params.id,
      business: req.business._id,
      status: 'active',
    });

    if (!m || m.role === 'owner') {
      throw bad('Member not found or cannot be changed.');
    }

    m.role = b.role;

    await m.save();

    await audit({
      req,
      action: 'team.role_changed',
      business: req.business._id,
      targetType: 'User',
      targetId: m.user,
      meta: { role: b.role },
    });

    res.json({ ok: true });
  }),
);

r.delete(
  '/current/members/:id',
  requireBusiness('staff.manage'),
  asyncH(async (req, res) => {
    const m = await Membership.findOne({
      _id: req.params.id,
      business: req.business._id,
      status: 'active',
    });

    if (!m || m.role === 'owner') {
      throw bad('Member not found or cannot be removed.');
    }

    m.status = 'revoked';

    await m.save();

    await audit({
      req,
      action: 'team.member_removed',
      business: req.business._id,
      targetType: 'User',
      targetId: m.user,
    });

    res.json({ ok: true });
  }),
);

export default r;

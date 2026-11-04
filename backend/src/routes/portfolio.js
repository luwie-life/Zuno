import { Router } from 'express';
import PortfolioProject from '../models/PortfolioProject.js';
import { asyncH, bad, conflict, notFound } from '../lib/errors.js';
import { parse, z, pageParams } from '../lib/validate.js';
import {
  requireAuth,
  requireBusiness,
  requireFeature,
  requireModule,
} from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const r = Router();

r.use(requireAuth, requireBusiness(null), requireModule('services'));

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);

const urlSchema = z.string()
  .max(2000)
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }, 'Enter a valid HTTP or HTTPS URL.');

const projectBody = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(180).optional(),
  summary: z.string().max(300).default(''),
  description: z.string().max(10000).default(''),
  category: z.string().max(100).default(''),
  coverImage: urlSchema.default(''),
  galleryImages: z.array(urlSchema).max(30).default([]),
  servicesProvided: z.array(z.string().trim().min(1).max(100)).max(15).default([]),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  client: z.string().max(160).default(''),
  projectDate: z.coerce.date().nullable().optional(),
  externalUrl: urlSchema.default(''),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

async function uniqueSlug(businessId, requestedSlug, title, excludeId = null) {
  const base = slugify(requestedSlug || title) || 'project';

  let candidate = base;
  let counter = 2;

  while (true) {
    const filter = {
      business: businessId,
      slug: candidate,
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const exists = await PortfolioProject.exists(filter);

    if (!exists) return candidate;

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

// List projects belonging to the current business.
r.get(
  '/',
  requireBusiness('services.read'),
  requireFeature('services'),
  asyncH(async (req, res) => {
    const { page, limit, skip } = pageParams(req.query);

    const filter = {
      business: req.business._id,
    };

    if (req.query.published === 'true') {
      filter.published = true;
    } else if (req.query.published === 'false') {
      filter.published = false;
    }

    if (req.query.featured === 'true') {
      filter.featured = true;
    }

    if (req.query.category) {
      filter.category = String(req.query.category).slice(0, 100);
    }

    const [items, total] = await Promise.all([
      PortfolioProject.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      PortfolioProject.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
    });
  }),
);

// Create a project.
r.post(
  '/',
  requireBusiness('services.write'),
  requireFeature('services'),
  asyncH(async (req, res) => {
    const body = parse(projectBody, req.body);

    const slug = await uniqueSlug(
      req.business._id,
      body.slug,
      body.title,
    );

    const project = await PortfolioProject.create({
      ...body,
      slug,
      business: req.business._id,
    });

    await audit({
      req,
      action: 'portfolio.project_created',
      business: req.business._id,
      targetType: 'PortfolioProject',
      targetId: project._id,
    });

    res.status(201).json({ project });
  }),
);

// Update an existing project.
r.patch(
  '/:id',
  requireBusiness('services.write'),
  requireFeature('services'),
  asyncH(async (req, res) => {
    const body = parse(projectBody.partial(), req.body);

    const project = await PortfolioProject.findOne({
      _id: req.params.id,
      business: req.business._id,
    });

    if (!project) {
      throw notFound('Portfolio project not found.');
    }

    if (body.title !== undefined || body.slug !== undefined) {
      body.slug = await uniqueSlug(
        req.business._id,
        body.slug || body.title || project.slug,
        body.title || project.title,
        project._id,
      );
    }

    Object.assign(project, body);

    await project.save();

    await audit({
      req,
      action: 'portfolio.project_updated',
      business: req.business._id,
      targetType: 'PortfolioProject',
      targetId: project._id,
    });

    res.json({ project });
  }),
);

// Delete a project.
r.delete(
  '/:id',
  requireBusiness('services.write'),
  requireFeature('services'),
  asyncH(async (req, res) => {
    const project = await PortfolioProject.findOneAndDelete({
      _id: req.params.id,
      business: req.business._id,
    });

    if (!project) {
      throw notFound('Portfolio project not found.');
    }

    await audit({
      req,
      action: 'portfolio.project_deleted',
      business: req.business._id,
      targetType: 'PortfolioProject',
      targetId: project._id,
    });

    res.json({ ok: true });
  }),
);

export default r;

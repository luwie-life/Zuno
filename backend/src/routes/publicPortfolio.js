import { Router } from 'express';
import { Business } from '../models/index.js';
import PortfolioProject from '../models/PortfolioProject.js';
import { asyncH, notFound } from '../lib/errors.js';
import { getAccess } from '../services/subscriptions.js';
import { businessModulesFor } from '../lib/businessModules.js';
import { featureAllowed } from '../lib/subscriptionRules.js';

const r = Router();

async function getPublishedPortfolio(slug) {
  const business = await Business.findOne({
    slug: String(slug).toLowerCase(),
    status: 'active',
    storePublished: true,
  });

  if (!business) {
    throw notFound('Portfolio not found.');
  }

  const modules = businessModulesFor(business.businessType);

  if (!modules.includes('services')) {
    throw notFound('Portfolio not found.');
  }

  const { access, plan } = await getAccess(business._id);

  if (!access || !featureAllowed(plan, 'services')) {
    throw notFound('Portfolio not found.');
  }

  return business;
}

// Public portfolio project list.
r.get('/:slug/portfolio', asyncH(async (req, res) => {
  const business = await getPublishedPortfolio(req.params.slug);

  const projects = await PortfolioProject.find({
    business: business._id,
    published: true,
  })
    .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
    .limit(60)
    .select(
      'title slug summary description category coverImage galleryImages servicesProvided tags client projectDate externalUrl featured sortOrder createdAt',
    )
    .lean();

  res.json({
    business: {
      name: business.name,
      slug: business.slug,
      description: business.description,
      logoUrl: business.logoUrl,
      brandColor: business.brandColor,
    },
    items: projects,
    total: projects.length,
  });
}));

// Public individual project detail.
r.get('/:slug/portfolio/:projectSlug', asyncH(async (req, res) => {
  const business = await getPublishedPortfolio(req.params.slug);

  const project = await PortfolioProject.findOne({
    business: business._id,
    slug: req.params.projectSlug,
    published: true,
  })
    .select(
      'title slug summary description category coverImage galleryImages servicesProvided tags client projectDate externalUrl featured createdAt',
    )
    .lean();

  if (!project) {
    throw notFound('Portfolio project not found.');
  }

  res.json({
    business: {
      name: business.name,
      slug: business.slug,
      description: business.description,
      logoUrl: business.logoUrl,
      brandColor: business.brandColor,
    },
    project,
  });
}));

export default r;

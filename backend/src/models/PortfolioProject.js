import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const portfolioProjectSchema = new Schema({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },

  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 180,
  },

  summary: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },

  description: {
    type: String,
    trim: true,
    maxlength: 10000,
    default: '',
  },

  category: {
    type: String,
    trim: true,
    maxlength: 100,
    default: '',
  },

  coverImage: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
  },

  galleryImages: {
    type: [{
      type: String,
      trim: true,
      maxlength: 2000,
    }],
    default: [],
    validate: {
      validator: (images) => images.length <= 30,
      message: 'A project cannot have more than 30 gallery images.',
    },
  },

  servicesProvided: {
    type: [{
      type: String,
      trim: true,
      maxlength: 100,
    }],
    default: [],
  },

  tags: {
    type: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
    default: [],
  },

  client: {
    type: String,
    trim: true,
    maxlength: 160,
    default: '',
  },

  projectDate: {
    type: Date,
    default: null,
  },

  externalUrl: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
  },

  featured: {
    type: Boolean,
    default: false,
  },

  published: {
    type: Boolean,
    default: false,
    index: true,
  },

  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

portfolioProjectSchema.index(
  { business: 1, slug: 1 },
  { unique: true }
);

portfolioProjectSchema.index({
  business: 1,
  published: 1,
  sortOrder: 1,
});

portfolioProjectSchema.index({
  business: 1,
  featured: 1,
  published: 1,
});

const PortfolioProject =
  models.PortfolioProject ||
  model('PortfolioProject', portfolioProjectSchema);

export default PortfolioProject;
export { PortfolioProject };

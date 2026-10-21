import { conflict } from './errors.js';

const machine = (name, edges) => ({
  name,
  edges,
  can: (from, to) => (edges[from] || []).includes(to),
  assert(from, to) {
    if (!(edges[from] || []).includes(to)) throw conflict(`Invalid ${name} status change: ${from} -> ${to}`, 'INVALID_TRANSITION');
  },
});

export const appMachine = machine('application', {
  draft: ['submitted', 'cancelled'],
  submitted: ['under_review', 'cancelled', 'rejected'],
  under_review: ['more_info_required', 'quotation_issued', 'rejected', 'cancelled'],
  more_info_required: ['under_review', 'cancelled', 'rejected'],
  quotation_issued: ['approved', 'rejected', 'cancelled', 'under_review'],
  approved: ['in_development', 'cancelled'],
  in_development: ['ready_for_review', 'cancelled'],
  ready_for_review: ['in_development', 'delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
});
// Transitions a merchant may trigger themselves. Everything else is staff-only.
export const APP_MERCHANT_EDGES = {
  draft: ['submitted', 'cancelled'],
  submitted: ['cancelled'],
  under_review: ['cancelled'],
  more_info_required: ['under_review', 'cancelled'],
  quotation_issued: ['approved', 'rejected', 'cancelled'],
  approved: ['cancelled'],
};

export const recoveryMachine = machine('recovery', {
  submitted: ['under_review', 'closed'],
  under_review: ['more_info_required', 'awaiting_applicant_verification', 'verification_in_progress', 'approved', 'rejected', 'closed'],
  more_info_required: ['under_review', 'closed'],
  awaiting_applicant_verification: ['verification_in_progress', 'under_review', 'closed'],
  verification_in_progress: ['approved', 'rejected', 'under_review', 'closed'],
  approved: ['resolved', 'closed'],
  rejected: ['closed', 'under_review'],
  resolved: ['closed'],
  closed: [],
});

export const supportMachine = machine('support', {
  open: ['in_progress', 'waiting_on_merchant', 'escalated', 'resolved', 'closed'],
  in_progress: ['waiting_on_merchant', 'escalated', 'resolved', 'closed'],
  waiting_on_merchant: ['open', 'in_progress', 'resolved', 'closed'],
  escalated: ['in_progress', 'resolved', 'closed'],
  resolved: ['open', 'closed'],
  closed: [],
});

export const fulfilmentMachine = machine('fulfilment', {
  new: ['processing', 'cancelled'],
  processing: ['ready', 'out_for_delivery', 'cancelled'],
  ready: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
});

// Pure rules deciding which sensitive recovery actions are allowed. Unit tested.
export const HIGH_RISK = ['ownership_changed', 'suspected_compromise', 'former_admin_lost_access'];
export const riskFor = (category) => (HIGH_RISK.includes(category) ? 'high' : 'standard');

const STRONG = ['authority_evidence', 'business_records', 'authenticated_owner'];

export function passedMethods(req) {
  return [...new Set((req.verification || []).filter((v) => v.outcome === 'passed').map((v) => v.method))];
}

export function recoveryActionCheck({ request, action, role }) {
  if (!request) return { ok: false, reason: 'No request' };
  if (['closed', 'rejected'].includes(request.status)) return { ok: false, reason: 'Request is closed or rejected' };
  const passed = passedMethods(request);
  const strong = passed.some((m) => STRONG.includes(m));
  switch (action) {
    case 'send_reset':
      if (!request.user) return { ok: false, reason: 'Link the request to a merchant account first' };
      if (!['under_review', 'verification_in_progress', 'approved'].includes(request.status)) return { ok: false, reason: 'Request must be under review or approved' };
      return { ok: true };
    case 'revoke_sessions':
      if (!request.user) return { ok: false, reason: 'Link the request to a merchant account first' };
      return { ok: true };
    case 'change_contact':
      if (!request.user) return { ok: false, reason: 'Link the request to a merchant account first' };
      if (request.status !== 'approved') return { ok: false, reason: 'Request must be approved first' };
      if (passed.length < 2 || !strong) return { ok: false, reason: 'Needs two passed verification methods including business records or authority evidence' };
      if (request.riskLevel === 'high' && role !== 'owner') return { ok: false, reason: 'High-risk requests need a Platform Owner' };
      return { ok: true };
    case 'transfer_ownership':
      if (!request.business || !request.user) return { ok: false, reason: 'Link the request to the business and current owner first' };
      if (!['ownership_changed', 'former_admin_lost_access'].includes(request.category)) return { ok: false, reason: 'Category does not allow ownership transfer' };
      if (request.status !== 'approved') return { ok: false, reason: 'Request must be approved first' };
      if (passed.length < 2 || !strong) return { ok: false, reason: 'Needs two passed verification methods including business records or authority evidence' };
      if (role !== 'owner') return { ok: false, reason: 'Only a Platform Owner can transfer ownership' };
      return { ok: true };
    case 'suspend_user':
      if (role !== 'owner') return { ok: false, reason: 'Only a Platform Owner can suspend accounts' };
      return { ok: true };
    default:
      return { ok: false, reason: 'Unknown action' };
  }
}

export class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const bad = (m, d) => new HttpError(400, m, 'BAD_REQUEST', d);
export const unauthorized = (m = 'Authentication required') => new HttpError(401, m, 'UNAUTHENTICATED');
export const forbidden = (m = 'You do not have permission to do this') => new HttpError(403, m, 'FORBIDDEN');
export const notFound = (m = 'Not found') => new HttpError(404, m, 'NOT_FOUND');
export const conflict = (m, code = 'CONFLICT') => new HttpError(409, m, code);
export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

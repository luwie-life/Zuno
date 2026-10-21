import bcrypt from 'bcryptjs';

const COMMON = new Set(['password123', 'password1234', '1234567890', 'qwertyuiop', 'letmein1234', 'zunozunozuno', 'iloveyou123']);

export function passwordProblem(pw, email = '') {
  if (typeof pw !== 'string' || pw.length < 10) return 'Password must be at least 10 characters.';
  if (pw.length > 128) return 'Password must be 128 characters or fewer.';
  if (COMMON.has(pw.toLowerCase())) return 'That password is too common.';
  const local = email.split('@')[0] || '';
  if (local.length > 3 && pw.toLowerCase().includes(local.toLowerCase())) return 'Password must not contain your email name.';
  return null;
}
export const hashPassword = (pw) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

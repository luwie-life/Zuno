// One-time bootstrap of the first Platform Owner. There is no default admin and no public admin sign-up.
// Usage: npm run create-admin -- you@example.com "Your Name"     (the password is typed at a hidden prompt)
import readline from 'node:readline';
import mongoose from 'mongoose';
import { env, assertEnv } from '../src/config/env.js';
import { User } from '../src/models/index.js';
import { hashPassword, passwordProblem } from '../src/lib/password.js';

assertEnv();
const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ') || 'Platform Owner';
if (!email || !email.includes('@')) { console.error('Usage: npm run create-admin -- you@example.com "Your Name"'); process.exit(1); }

function ask(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); }; // hide typed characters
    rl.question(q, (a) => { rl.close(); console.log(); resolve(a); });
  });
}

await mongoose.connect(env.mongoUri);
if (await User.exists({ platformRole: 'owner' })) { console.error('A Platform Owner already exists. Create staff from the admin dashboard instead.'); process.exit(1); }
const pw = await ask('Choose a password (min 10 chars): ');
const problem = passwordProblem(pw, email);
if (problem) { console.error(problem); process.exit(1); }
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) { existing.platformRole = 'owner'; existing.passwordHash = await hashPassword(pw); existing.emailVerified = true; await existing.save(); }
else await User.create({ name, email, passwordHash: await hashPassword(pw), platformRole: 'owner', emailVerified: true });
console.log(`Platform Owner ready: ${email}. Sign in at /admin/login`);
await mongoose.disconnect();

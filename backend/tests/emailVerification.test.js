import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Token, User } from '../src/models/index.js';
import { hashToken } from '../src/lib/tokens.js';
import { verifyEmailToken } from '../src/services/emailVerification.js';
const record = () => ({user:'merchant-1',meta:{email:'merchant@example.com'}});

test('token claim enforces hashing, purpose, single-use and both expiry boundaries', async t => {
  let query, update;
  t.mock.method(Token,'findOneAndUpdate',async(q,u)=>{query=q;update=u;return record();});
  const write=t.mock.method(User,'updateOne',async()=>({matchedCount:1}));
  const invalidate=t.mock.method(Token,'updateMany',async()=>({modifiedCount:1}));
  await verifyEmailToken('raw-token-not-stored');
  assert.equal(query.tokenHash,hashToken('raw-token-not-stored'));
  assert.notEqual(query.tokenHash,'raw-token-not-stored');
  assert.equal(query.purpose,'email_verify');assert.equal(query.usedAt,null);
  assert.equal(query.expiresAt.$gt.getTime()-query.createdAt.$gt.getTime(),30*60_000);
  assert.equal(update.usedAt.getTime(),query.expiresAt.$gt.getTime());
  assert.deepEqual(write.mock.calls[0].arguments,[{_id:'merchant-1',status:'active',email:'merchant@example.com'},{emailVerified:true}]);
  assert.deepEqual(invalidate.mock.calls[0].arguments[0],{user:'merchant-1',purpose:'email_verify',usedAt:null});
});
test('missing, expired or previously used token results do not update an account', async t => {
  t.mock.method(Token,'findOneAndUpdate',async()=>null);
  const write=t.mock.method(User,'updateOne',async()=>({matchedCount:1}));
  await assert.rejects(verifyEmailToken('invalid-token'),error=>error.status===400);
  assert.equal(write.mock.callCount(),0);
});
test('simulated atomic claim rejects concurrent replay', async t => {
  let claimed=false;
  t.mock.method(Token,'findOneAndUpdate',async()=>{if(claimed)return null;claimed=true;return record();});
  const write=t.mock.method(User,'updateOne',async()=>({matchedCount:1}));
  t.mock.method(Token,'updateMany',async()=>({modifiedCount:0}));
  const results=await Promise.allSettled([verifyEmailToken('same-token'),verifyEmailToken('same-token')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected').length,1);
  assert.equal(write.mock.callCount(),1);
});
test('email mismatch and legacy unbound links cannot verify an account', async t => {
  const claim=t.mock.method(Token,'findOneAndUpdate',async()=>record());
  const write=t.mock.method(User,'updateOne',async()=>({matchedCount:0}));
  const invalidate=t.mock.method(Token,'updateMany',async()=>({modifiedCount:0}));
  await assert.rejects(verifyEmailToken('changed-email-token'),error=>error.status===400);
  assert.equal(invalidate.mock.callCount(),0);
  claim.mock.mockImplementation(async()=>({user:'merchant-1'}));
  await assert.rejects(verifyEmailToken('legacy-unbound-token'),error=>error.status===400);
  assert.equal(write.mock.callCount(),1);
});
test('database claim failures propagate without verifying an account', async t => {
  t.mock.method(Token,'findOneAndUpdate',async()=>{throw new Error('database unavailable');});
  const write=t.mock.method(User,'updateOne',async()=>({matchedCount:1}));
  await assert.rejects(verifyEmailToken('any-token'),/database unavailable/);
  assert.equal(write.mock.callCount(),0);
});

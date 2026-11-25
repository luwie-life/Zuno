
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date, label } from '../../lib/format.js';
import {
  Badge,
  Card,
  ErrorNote,
  Loading,
  Notice,
  PageHeader,
  Table,
  useApi,
  useAction,
  useToast,
} from '../../components/ui.jsx';

const STATE_TEXT = {
  none: 'No subscription',
  pending_setup: 'Account setup pending',
  pending_payment: 'Subscription payment pending',
  active: 'Active',
  grace: 'Payment overdue: grace period',
  expired: 'Expired: paid features are paused',
  cancelled: 'Cancelled',
  suspended: 'Suspended',
};

function ManualRenewalStatus({ data }) {
  const hasPendingPayment =
    Boolean(data.pendingRenewalReference) ||
    data.payments?.some((payment) => payment.status === 'initialized');

  if (hasPendingPayment) {
    return (
      <Notice tone="warn">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Your payment is being verified
            </p>
            <p className="mt-1 text-sm">
              We are checking your existing payment with Paystack.
              Please verify its status before starting another payment.
            </p>
          </div>
        </div>
      </Notice>
    );
  }

  if (data.state === 'grace') {
    return (
      <Notice tone="warn">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Your subscription needs renewal</p>
            <p className="mt-1 text-sm">
              Your paid period has ended. Your 7-day grace period allows
              you to continue using paid features while you renew.
            </p>
          </div>
        </div>
      </Notice>
    );
  }

  if (data.state === 'expired') {
    return (
      <Notice tone="warn">
        Your paid subscription and grace period have ended.
        Renew your plan to restore paid features.
      </Notice>
    );
  }

  if (data.state === 'suspended') {
    return (
      <Notice tone="warn">
        Your subscription is suspended. Contact Zuno support for assistance.
      </Notice>
    );
  }

  if (data.state === 'cancelled') {
    return (
      <Notice tone="warn">
        Your subscription has been cancelled. Choose a plan to restore
        paid features.
      </Notice>
    );
  }

  if (data.state === 'pending_setup') {
    return (
      <Notice tone="warn">
        Your account setup is not complete yet.
      </Notice>
    );
  }

  if (data.state === 'pending_payment') {
    return (
      <Notice tone="warn">
        Complete your subscription payment to activate your paid plan.
      </Notice>
    );
  }

  if (data.state === 'none') {
    return (
      <Notice>
        You do not currently have an active subscription.
        Choose a plan to get started.
      </Notice>
    );
  }

  if (data.cancelAtPeriodEnd) {
    return (
      <Notice tone="warn">
        Your subscription is scheduled to end at the end of your paid period.
        You can reverse this cancellation before then.
      </Notice>
    );
  }

  if (data.state === 'active') {
    return (
      <Notice tone="ok">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Manual renewal is enabled</p>
            <p className="mt-1 text-sm">
              Your subscription is not automatically charged. You decide
              when to make each monthly payment through Paystack.
            </p>
          </div>
        </div>
      </Notice>
    );
  }

  return (
    <Notice>
      Your subscription status is currently {data.state}.
      Contact support if you need assistance.
    </Notice>
  );
}

export default function Billing() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [run, busy] = useAction();

  const {
    data,
    loading,
    error,
    reload,
  } = useApi(() => api('/billing', { biz: true }), []);

  const [verifying, setVerifying] = useState(false);
  const ref = sp.get('reference') || sp.get('trxref');

  useEffect(() => {
    if (!ref) return;

    let mounted = true;

    setVerifying(true);

    api(`/billing/verify?reference=${encodeURIComponent(ref)}`, {
      biz: true,
    })
      .then((result) => {
        if (!mounted) return;

        const successful = [
          'success',
          'already_processed',
        ].includes(result.result);

        toast(
          successful
            ? 'Payment confirmed'
            : result.result === 'pending' ||
                result.result === 'pending_application'
              ? 'Payment is still being verified'
              : 'We could not confirm that payment',
          successful ? 'ok' : 'bad',
        );
      })
      .catch((e) => {
        if (mounted) toast(e.message, 'bad');
      })
      .finally(() => {
        if (!mounted) return;

        setVerifying(false);
        setSp({}, { replace: true });
        reload();
        refresh();
      });

    return () => {
      mounted = false;
    };
  }, [ref]); // eslint-disable-line

  if (loading || verifying) {
    return (
      <Loading
        text={
          verifying
            ? 'Confirming your payment with Paystack'
            : 'Loading billing information'
        }
      />
    );
  }

  if (error) return <ErrorNote error={error} retry={reload} />;
  if (!data) return null;

  const d = data;
  const currentPlan = d.plan;
  const scheduledPlan = d.scheduledPlan;
  const isFree = Number(currentPlan?.monthlyFee || 0) === 0;

  const unresolvedPayment = d.payments?.find(
    (payment) => payment.status === 'initialized',
  );

  const pendingReference =
    d.pendingRenewalReference || unresolvedPayment?.reference;

  const pay = () =>
    run(async () => {
      const result = await api('/billing/checkout', {
        method: 'POST',
        biz: true,
        body: { purpose: 'subscription' },
      });

      window.location.href = result.authorizationUrl;
    });

  const verifyPayment = (reference) =>
    run(async () => {
      const result = await api(
        `/billing/verify?reference=${encodeURIComponent(reference)}`,
        { biz: true },
      );

      const successful = [
        'success',
        'already_processed',
      ].includes(result.result);

      if (successful) {
        toast('Payment confirmed', 'ok');
      } else if (
        result.result === 'pending' ||
        result.result === 'pending_application'
      ) {
        toast('Payment is still being verified', 'ok');
      } else {
        toast('We could not confirm that payment', 'bad');
      }

      await reload();
      await refresh();

      return result;
    });

  return (
    <>
      <PageHeader
        title="Billing"
        sub="Manage your plan, subscription and payments."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">Current plan</p>

          <p className="font-display text-2xl font-bold">
            {currentPlan?.name || 'No plan selected'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              tone={
                d.state === 'active'
                  ? 'ok'
                  : d.state === 'grace'
                    ? 'warn'
                    : 'bad'
              }
            >
              {STATE_TEXT[d.state] || d.state}
            </Badge>

            {d.cancelAtPeriodEnd && (
              <Badge tone="warn">Cancellation scheduled</Badge>
            )}
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt>Monthly subscription</dt>
              <dd className="text-right font-medium">
                {currentPlan ? naira(currentPlan.monthlyFee) : '—'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt>Setup fee</dt>
              <dd className="text-right">None</dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt>Paid until</dt>
              <dd className="text-right">
                {d.currentPeriodEnd
                  ? date(d.currentPeriodEnd)
                  : isFree
                    ? 'Free plan'
                    : 'Not paid yet'}
              </dd>
            </div>
          </dl>

          {d.pendingPlan && (
            <div className="mt-4">
              <Notice tone="warn">
                Your change to <strong>{d.pendingPlan.name}</strong> is
                waiting for payment. Complete the subscription payment
                to activate it.
              </Notice>
            </div>
          )}

          {scheduledPlan && (
            <div className="mt-4">
              <Notice>
                Your plan is scheduled to change to{' '}
                <strong>{scheduledPlan.name}</strong>.
                {Number(scheduledPlan.monthlyFee) === 0
                  ? ' The Free plan takes effect after your paid period and 7-day grace period.'
                  : ' The new plan takes effect at the scheduled time.'}
              </Notice>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {(d.pendingPlan || (isFree && d.scheduledPlan)) && (
              <button
                className="btn-primary"
                disabled={busy || !!pendingReference}
                onClick={pay}
              >
                Pay {d.pendingPlan?.name || d.scheduledPlan?.name} subscription
              </button>
            )}

            {!isFree &&
              !d.pendingPlan &&
              !d.scheduledPlan && (
                <button
                  className="btn-primary"
                  disabled={busy || !!pendingReference}
                  onClick={pay}
                >
                  {d.state === 'active'
                    ? 'Renew subscription'
                    : 'Renew subscription now'}
                </button>
              )}
          </div>

          {pendingReference && (
            <div className="mt-3">
              <button
                className="btn-secondary inline-flex items-center gap-2"
                disabled={busy}
                onClick={() => verifyPayment(pendingReference)}
              >
                <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                Verify existing payment
              </button>
            </div>
          )}

          <p className="mt-4 text-xs text-muted">
            Renewals are initiated by you. Zuno does not automatically
            charge your card. Payments are completed through Paystack's
            secure checkout and subscriptions activate only after
            server-side payment verification.
          </p>

          <div className="mt-3 border-t border-line pt-3 text-sm">
            {d.cancelAtPeriodEnd ? (
              <button
                className="font-semibold text-forest underline"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api('/billing/cancel', {
                      method: 'POST',
                      biz: true,
                      body: { cancel: false },
                    });

                    await reload();
                    await refresh();
                  }, 'Cancellation reverted')
                }
              >
                Keep my subscription
              </button>
            ) : (
              !isFree && (
                <button
                  className="text-danger underline"
                  disabled={busy}
                  onClick={() =>
                    window.confirm(
                      'Cancel at the end of the paid period? Your data stays safe.',
                    ) &&
                    run(async () => {
                      await api('/billing/cancel', {
                        method: 'POST',
                        biz: true,
                        body: { cancel: true },
                      });

                      await reload();
                    }, 'Will cancel at period end')
                  }
                >
                  Cancel at period end
                </button>
              )
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">
            Monthly renewal
          </h2>

          <div className="mt-4">
            <ManualRenewalStatus data={d} />
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <p>Receive reminders before your subscription expires.</p>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <p>Renew securely through Paystack when you're ready.</p>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <p>Your subscription is extended after payment verification.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold">Change plan</h2>

        <p className="mt-1 text-sm text-muted">
          Choose a plan for your store or service business. There are no setup
          fees.
        </p>

        <ul className="mt-3 space-y-3">
          {(d.plans || []).map((plan) => {
            const current = plan.key === currentPlan?.key;
            const scheduled = plan.key === scheduledPlan?.key;
            const awaitingPayment = plan.key === d.pendingPlan?.key;

            return (
              <li
                key={plan.key}
                className="rounded-lg border border-line p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted">
                      {naira(plan.monthlyFee)}/month
                      {plan.priceIsFrom ? ' (from)' : ''}
                    </p>

                    {plan.description && (
                      <p className="mt-1 text-xs text-muted">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {current ? (
                    <Badge tone="ok">Current</Badge>
                  ) : scheduled ? (
                    <Badge tone="warn">Scheduled</Badge>
                  ) : awaitingPayment ? (
                    <Badge tone="warn">Awaiting payment</Badge>
                  ) : (
                    <button
                      className="btn-secondary !min-h-[36px] !py-1"
                      disabled={busy || !!pendingReference}
                      onClick={() =>
                        run(async () => {
                          const result = await api('/billing/change-plan', {
                            method: 'POST',
                            biz: true,
                            body: { planKey: plan.key },
                          });

                          await reload();

                          toast(
                            result.requiresPayment
                              ? 'Plan selected. Complete payment to activate it.'
                              : result.effective === 'after_period_and_grace'
                                ? 'Free plan scheduled after your paid period and grace period.'
                                : result.effective === 'next_renewal'
                                  ? 'Plan change scheduled for your next renewal.'
                                  : 'Plan change saved.',
                          );

                          return result;
                        })
                      }
                    >
                      Switch
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <h2 className="mb-2 mt-8 text-lg font-bold">
        Payment history
      </h2>

      <Card>
        {!d.payments?.length ? (
          <p className="p-4 text-sm text-muted">
            No payments yet.
          </p>
        ) : (
          <Table
            head={[
              'Date',
              'For',
              'Amount',
              'Status',
              'Reference',
              'Action',
            ]}
          >
            {d.payments.map((payment) => (
              <tr key={payment.reference}>
                <td className="px-4 py-2.5">
                  {date(payment.createdAt)}
                </td>

                <td className="px-4 py-2.5">
                  {label(payment.purpose)}
                </td>

                <td className="px-4 py-2.5">
                  {naira(payment.amount)}
                </td>

                <td className="px-4 py-2.5">
                  <Badge>{payment.status}</Badge>

                  {payment.failureReason && (
                    <p className="mt-1 max-w-[180px] text-xs text-danger">
                      {label(payment.failureReason)}
                    </p>
                  )}
                </td>

                <td className="px-4 py-2.5 text-xs text-muted">
                  {payment.reference}
                </td>

                <td className="px-4 py-2.5">
                  {payment.status === 'initialized' && (
                    <button
                      className="text-sm font-medium text-forest underline"
                      disabled={busy}
                      onClick={() => verifyPayment(payment.reference)}
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

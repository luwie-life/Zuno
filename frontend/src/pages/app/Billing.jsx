
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date, dateTime, label } from '../../lib/format.js';
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

function RenewalStatus({ data }) {
  if (data.renewalPaymentPending) {
    return (
      <Notice tone="warn">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Renewal payment is being verified
            </p>
            <p className="mt-1 text-sm">
              We are checking the existing payment with Paystack. Do not
              initiate another renewal payment while this is being resolved.
            </p>
          </div>
        </div>
      </Notice>
    );
  }

  if (data.renewalStatus === 'retry_required') {
    return (
      <Notice tone="warn">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Renewal needs attention</p>
            <p className="mt-1 text-sm">
              {data.lastRenewalFailureReason
                ? `Latest issue: ${label(data.lastRenewalFailureReason)}.`
                : 'Your latest automatic renewal was unsuccessful.'}
            </p>

            {data.lastRenewalFailureAt && (
              <p className="mt-1 text-xs text-muted">
                Last failure: {dateTime(data.lastRenewalFailureAt)}
              </p>
            )}

            {data.nextRenewalRetryAt && (
              <p className="mt-1 text-xs text-muted">
                Next automatic retry: {dateTime(data.nextRenewalRetryAt)}
              </p>
            )}

            <p className="mt-2 text-xs">
              Check your saved payment method or request a retry below.
            </p>
          </div>
        </div>
      </Notice>
    );
  }

  if (data.card) {
    return (
      <Notice tone="ok">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Automatic renewal is set up
            </p>
            <p className="mt-1 text-sm">
              Your saved Paystack authorisation can be used for eligible
              automatic renewals.
            </p>
          </div>
        </div>
      </Notice>
    );
  }

  return (
    <Notice>
      Automatic renewal is not set up yet. A qualifying Paystack card payment
      may create a reusable payment authorisation.
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
  const isFree = Number(d.plan?.monthlyFee || 0) === 0;

  const pay = () =>
    run(async () => {
      const result = await api('/billing/checkout', {
        method: 'POST',
        biz: true,
        body: { purpose: 'subscription' },
      });

      window.location.href = result.authorizationUrl;
    });

  const retryRenewal = () =>
    run(async () => {
      const result = await api('/billing/retry-renewal', {
        method: 'POST',
        biz: true,
      });

      await reload();
      await refresh();

      if (result.pending) {
        toast(
          'Payment is still being verified. We will not create another charge.',
          'ok',
        );
      } else if (result.renewalStatus === 'current') {
        toast('Your renewal has been resolved.', 'ok');
      } else {
        toast('Retry processed. Check your renewal status below.', 'ok');
      }

      return result;
    });

  const renewalNeedsAttention =
    d.renewalStatus === 'retry_required';

  const renewalButtonLabel = d.renewalPaymentPending
    ? 'Check payment status'
    : 'Retry renewal';

  const currentPlan = d.plan;
  const scheduledPlan = d.scheduledPlan;

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

            {d.card && (
              <div className="flex items-center justify-between gap-3">
                <dt>Saved payment method</dt>
                <dd className="flex items-center gap-1 text-right">
                  <CreditCard className="h-4 w-4" />
                  {d.card.brand || 'Card'} •••• {d.card.last4}
                </dd>
              </div>
            )}
          </dl>

          {d.pendingPlan && (
            <div className="mt-4">
              <Notice tone="warn">
                Your change to <strong>{d.pendingPlan.name}</strong> is waiting
                for payment. Complete the subscription payment to activate it.
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
                  : ' The new plan takes effect at your next successful renewal.'}
              </Notice>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {(d.pendingPlan || (isFree && d.scheduledPlan)) && (
              <button
                className="btn-primary"
                disabled={busy || d.renewalPaymentPending}
                onClick={pay}
              >
                Pay {d.pendingPlan?.name || d.scheduledPlan?.name} subscription
              </button>
            )}

            {!isFree &&
              !d.pendingPlan &&
              !d.scheduledPlan &&
              ['expired', 'pending_payment'].includes(d.state) && (
                <button
                  className="btn-primary"
                  disabled={busy || d.renewalPaymentPending}
                  onClick={pay}
                >
                  Pay monthly subscription
                </button>
              )}
          </div>

          <p className="mt-4 text-xs text-muted">
            Payments are completed on Paystack's secure page. Zuno never sees
            your card details. Paid subscriptions activate only after
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
            Renewal and payment status
          </h2>

          <div className="mt-4">
            <RenewalStatus data={d} />
          </div>

          {renewalNeedsAttention && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {d.renewalPaymentPending
                      ? 'Existing payment needs verification'
                      : 'Automatic renewal needs attention'}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Failed attempts: {d.failedRenewals || 0}
                  </p>
                </div>

                <button
                  className="btn-primary inline-flex items-center gap-2"
                  disabled={busy}
                  onClick={retryRenewal}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`}
                  />
                  {renewalButtonLabel}
                </button>
              </div>
            </div>
          )}

          {d.lastRenewalAttemptAt && (
            <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Last renewal attempt: {dateTime(d.lastRenewalAttemptAt)}
            </div>
          )}

          {d.card ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-line p-3 text-sm">
              <CreditCard className="h-5 w-5 text-muted" />
              <div>
                <p className="font-medium">
                  Saved payment authorisation
                </p>
                <p className="text-xs text-muted">
                  {d.card.brand || 'Card'} ending in {d.card.last4}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              A reusable payment authorisation may be saved after a qualifying
              Paystack card payment.
            </p>
          )}
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
                      disabled={busy || d.renewalPaymentPending}
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
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

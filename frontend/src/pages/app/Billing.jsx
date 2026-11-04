
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
  pending_setup: 'Setup fee not paid yet',
  pending_payment: 'Monthly subscription not paid yet',
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
            <p className="font-semibold">Renewal payment is being verified</p>
            <p className="mt-1 text-sm">
              We are checking the existing payment with Paystack. Do not make
              another renewal payment while this is being resolved.
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
              Check that your saved payment method is valid. You can also
              request a retry below.
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
            <p className="font-semibold">Automatic renewal is set up</p>
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
      Automatic renewal is not set up yet. Complete a subscription payment
      using a payment method that supports reusable authorisation.
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

  if (error) {
    return <ErrorNote error={error} retry={reload} />;
  }

  if (!data) return null;

  const d = data;

  const pay = (purpose) =>
    run(async () => {
      const result = await api('/billing/checkout', {
        method: 'POST',
        biz: true,
        body: { purpose },
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
        toast(
          'Retry processed. Check your renewal status below.',
          'ok',
        );
      }

      return result;
    });

  const setupDue = d.pendingPlan
    ? true
    : d.setupStatus === 'unpaid';

  const renewalNeedsAttention =
    d.renewalStatus === 'retry_required';

  const renewalButtonLabel = d.renewalPaymentPending
    ? 'Check payment status'
    : 'Retry renewal';

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
            {d.plan?.name || 'No plan selected'}
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
              <dt>Setup fee</dt>
              <dd>
                <Badge>
                  {d.setupStatus === 'paid'
                    ? 'paid'
                    : d.setupStatus === 'waived'
                      ? 'waived'
                      : 'unpaid'}
                </Badge>
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt>Monthly subscription</dt>
              <dd className="text-right">
                {d.plan ? naira(d.plan.monthlyFee) : '—'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3">
              <dt>Paid until</dt>
              <dd className="text-right">
                {d.currentPeriodEnd
                  ? date(d.currentPeriodEnd)
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
                Upgrade to <strong>{d.pendingPlan.name}</strong> starts after
                you pay the setup-fee difference.
              </Notice>
            </div>
          )}

          {d.scheduledPlan && (
            <div className="mt-4">
              <Notice>
                Your plan changes to <strong>{d.scheduledPlan.name}</strong>{' '}
                at your next renewal.
              </Notice>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {setupDue && (
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => pay('setup_fee')}
              >
                Pay setup fee
              </button>
            )}

            <button
              className="btn-primary"
              disabled={
                busy ||
                d.renewalPaymentPending ||
                (d.setupStatus === 'unpaid' &&
                  !d.pendingPlan &&
                  d.plan?.setupFee > 0)
              }
              onClick={() => pay('subscription')}
            >
              {d.currentPeriodEnd
                ? 'Pay for next month'
                : 'Pay monthly subscription'}
            </button>
          </div>

          {d.setupStatus === 'unpaid' &&
            d.plan?.setupFee > 0 && (
              <p className="mt-2 text-xs text-muted">
                Pay the setup fee first, then the monthly subscription.
              </p>
            )}

          <p className="mt-4 text-xs text-muted">
            Payments are made on Paystack's secure page. Zuno never sees your
            card details. Your plan activates only after we verify the payment
            with Paystack.
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
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Renewal and payment status</h2>

          <div className="mt-4">
            <RenewalStatus data={d} />
          </div>

          {d.renewalStatus === 'retry_required' && (
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

          {d.card && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-line p-3 text-sm">
              <CreditCard className="h-5 w-5 text-muted" />
              <div>
                <p className="font-medium">Saved payment authorisation</p>
                <p className="text-xs text-muted">
                  {d.card.brand || 'Card'} ending in {d.card.last4}
                </p>
              </div>
            </div>
          )}

          {!d.card && (
            <p className="mt-3 text-xs text-muted">
              A reusable payment authorisation may be saved after a
              qualifying Paystack card payment.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold">Change plan</h2>

        <ul className="mt-3 space-y-3">
          {(d.plans || []).map((p) => {
            const current = p.key === d.plan?.key;

            return (
              <li
                key={p.key}
                className="rounded-lg border border-line p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">
                      {naira(p.setupFee)} setup · {naira(p.monthlyFee)}
                      /month
                      {p.priceIsFrom ? ' (from)' : ''}
                    </p>
                    {p.description && (
                      <p className="mt-1 text-xs text-muted">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {current ? (
                    <Badge tone="ok">Current</Badge>
                  ) : (
                    <button
                      className="btn-secondary !min-h-[36px] !py-1"
                      disabled={busy || d.renewalPaymentPending}
                      onClick={() =>
                        run(async () => {
                          const result = await api(
                            '/billing/change-plan',
                            {
                              method: 'POST',
                              biz: true,
                              body: { planKey: p.key },
                            },
                          );

                          toast(
                            result.upgrade
                              ? 'Upgrade started: pay the setup-fee difference to activate it'
                              : result.downgradeAtPeriodEnd
                                ? 'Downgrade scheduled for next renewal'
                                : 'Plan changed',
                          );

                          await reload();
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

      <h2 className="mb-2 mt-8 text-lg font-bold">Payment history</h2>

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

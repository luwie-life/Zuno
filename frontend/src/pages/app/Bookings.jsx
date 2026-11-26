import { useState } from 'react';
import { CalendarDays, Clock3, UserRound, Check, X, RefreshCw } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date, dateTime, label } from '../../lib/format.js';
import {
  Badge,
  Card,
  Empty,
  ErrorNote,
  Input,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Pager,
  Select,
  Table,
  Textarea,
  useApi,
  useAction,
} from '../../components/ui.jsx';

function BookingDetail({ id, onChange }) {
  const { can } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => api(`/bookings/${id}`, { biz: true }),
    [id]
  );

  const [run, busy] = useAction();
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [times, setTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [reason, setReason] = useState('');

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} retry={reload} />;

  const booking = data.booking;
  const manage = can('bookings.manage');
  const active = ['pending', 'confirmed'].includes(booking.status);

  const refresh = async () => {
    await reload();
    onChange();
  };

  const changeStatus = (status) => {
    const messages = {
      confirmed: 'Booking confirmed',
      rejected: 'Booking declined',
      cancelled: 'Booking cancelled',
      completed: 'Booking marked completed',
    };

    run(async () => {
      await api(`/bookings/${id}`, {
        method: 'PATCH',
        biz: true,
        body: { status },
      });
      await refresh();
    }, messages[status]);
  };

  const loadTimes = async () => {
    if (!newDate) {
      setScheduleError(new Error('Choose a date first.'));
      return;
    }

    setTimesLoading(true);
    setScheduleError(null);
    setTimes([]);
    setNewTime('');

    try {
      const result = await api(
        `/bookings/${id}/availability${qs({ date: newDate })}`,
        { biz: true }
      );
      setTimes(result.times || []);
      if (!result.times?.length) {
        setScheduleError(new Error('No available times on this date. Try another date.'));
      }
    } catch (failure) {
      setScheduleError(failure);
    } finally {
      setTimesLoading(false);
    }
  };

  const saveReschedule = () => {
    if (!newDate || !newTime) {
      setScheduleError(new Error('Choose an available date and time.'));
      return;
    }

    run(async () => {
      await api(`/bookings/${id}`, {
        method: 'PATCH',
        biz: true,
        body: {
          date: newDate,
          startTime: newTime,
          reason: reason.trim(),
        },
      });

      setRescheduling(false);
      setTimes([]);
      setNewTime('');
      setReason('');
      await refresh();
    }, 'Booking rescheduled');
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-xl font-bold">
          {booking.reference}
        </span>
        <Badge>{label(booking.status)}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-paper p-4">
          <div className="flex items-center gap-2 text-muted">
            <UserRound className="h-4 w-4" />
            Customer
          </div>
          <p className="mt-2 font-semibold text-ink">
            {booking.customerInfo?.name || 'Customer'}
          </p>
          <p className="mt-1 text-muted">
            {booking.customerInfo?.phone || 'No phone provided'}
          </p>
          <p className="text-muted">
            {booking.customerInfo?.email || 'No email provided'}
          </p>
        </div>

        <div className="rounded-xl bg-paper p-4">
          <div className="flex items-center gap-2 text-muted">
            <CalendarDays className="h-4 w-4" />
            Appointment
          </div>
          <p className="mt-2 font-semibold text-ink">
            {booking.localDate
              ? date(new Date(`${booking.localDate}T12:00:00`))
              : 'Date unavailable'}
          </p>
          <p className="mt-1 text-muted">
            {booking.startTime} · {booking.timezone}
          </p>
          <p className="text-muted">
            {booking.durationMinutes} minutes
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Service requested
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">
              {booking.serviceName}
            </p>
            <p className="mt-1 text-muted">
              {booking.pricingDescription || 'Service appointment'}
            </p>
          </div>
          <p className="font-semibold text-ink">
            {naira(booking.price)}
          </p>
        </div>
      </div>

      {booking.customerInfo?.note && (
        <div className="rounded-xl border border-line p-4">
          <p className="font-semibold">Customer note</p>
          <p className="mt-2 whitespace-pre-wrap text-muted">
            {booking.customerInfo.note}
          </p>
        </div>
      )}

      {manage && active && (
        <div className="space-y-3">
          <p className="font-semibold">Booking actions</p>

          {booking.status === 'pending' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => changeStatus('confirmed')}
              >
                <Check className="h-4 w-4" />
                Confirm booking
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={busy}
                onClick={() => changeStatus('rejected')}
              >
                <X className="h-4 w-4" />
                Decline request
              </button>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => changeStatus('completed')}
            >
              <Check className="h-4 w-4" />
              Mark as completed
            </button>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => {
                setNewDate(booking.localDate || '');
                setNewTime('');
                setTimes([]);
                setScheduleError(null);
                setRescheduling((value) => !value);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Reschedule
            </button>

            <button
              type="button"
              className="btn-secondary text-danger"
              disabled={busy}
              onClick={() => changeStatus('cancelled')}
            >
              Cancel booking
            </button>
          </div>
        </div>
      )}

      {rescheduling && manage && active && (
        <div className="space-y-4 rounded-xl border border-line p-4">
          <div>
            <h3 className="font-semibold">Reschedule appointment</h3>
            <p className="mt-1 text-xs text-muted">
              Only available appointment times can be selected.
            </p>
          </div>

          <Input
            id="booking-new-date"
            label="New appointment date"
            type="date"
            value={newDate}
            onChange={(event) => {
              setNewDate(event.target.value);
              setTimes([]);
              setNewTime('');
              setScheduleError(null);
            }}
          />

          <button
            type="button"
            className="btn-secondary w-full"
            disabled={timesLoading || !newDate}
            onClick={loadTimes}
          >
            {timesLoading ? 'Checking availability…' : 'Check available times'}
          </button>

          <ErrorNote error={scheduleError} />

          {times.length > 0 && (
            <Select
              id="booking-new-time"
              label="Available appointment time"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
            >
              <option value="">Choose a time</option>
              {times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </Select>
          )}

          <Textarea
            id="booking-reschedule-reason"
            label="Reason (optional)"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add a note about this change..."
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setRescheduling(false)}
            >
              Keep current appointment
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={busy || !newTime}
              onClick={saveReschedule}
            >
              Save new appointment
            </button>
          </div>
        </div>
      )}

      {Array.isArray(booking.history) && booking.history.length > 0 && (
        <details className="rounded-xl border border-line p-4">
          <summary className="cursor-pointer font-semibold">
            Booking history
          </summary>
          <ul className="mt-3 space-y-3">
            {booking.history.map((entry, index) => (
              <li key={`${entry.action}-${index}`} className="border-l-2 border-line pl-3">
                <p className="font-medium">{label(entry.action)}</p>
                {entry.note && (
                  <p className="mt-1 text-muted">{entry.note}</p>
                )}
                {entry.at && (
                  <p className="mt-1 text-xs text-muted">
                    {dateTime(entry.at)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function Bookings() {
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data, loading, error, reload } = useApi(
    () => api(
      `/bookings${qs({
        ...filters,
        page,
        limit: 20,
      })}`,
      { biz: true }
    ),
    [filters, page]
  );

  const bookings = data?.items || [];

  return (
    <>
      <PageHeader
        title="Bookings"
        sub="Review appointment requests, manage schedules and keep customers updated."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Select
          id="booking-status-filter"
          aria-label="Filter bookings by status"
          value={filters.status}
          onChange={(event) => {
            setFilters({ ...filters, status: event.target.value });
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'rejected', 'cancelled', 'completed'].map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </Select>

        <Input
          id="booking-date-filter"
          type="date"
          aria-label="Filter bookings by date"
          value={filters.date}
          onChange={(event) => {
            setFilters({ ...filters, date: event.target.value });
            setPage(1);
          }}
        />

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setFilters({ status: '', date: '' });
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </div>

      <Card>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="p-4">
            <ErrorNote error={error} retry={reload} />
          </div>
        ) : bookings.length === 0 ? (
          <Empty
            icon={CalendarDays}
            title="No bookings found"
            hint="Customer appointment requests will appear here when someone books a service from your storefront."
          />
        ) : (
          <>
            <Table head={['Customer', 'Service', 'Appointment', 'Status', '']}>
              {bookings.map((booking) => (
                <tr
                  key={booking._id}
                  className="cursor-pointer transition hover:bg-forest-50/50"
                  onClick={() => setSelected(booking._id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {booking.customerInfo?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-muted">
                      {booking.reference}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{booking.serviceName}</p>
                    <p className="text-xs text-muted">
                      {naira(booking.price)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{booking.localDate}</p>
                    <p className="text-xs text-muted">
                      <Clock3 className="mr-1 inline h-3 w-3" />
                      {booking.startTime}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{label(booking.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold text-forest">
                      View
                    </span>
                  </td>
                </tr>
              ))}
            </Table>

            <Pager
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Booking details"
        wide
      >
        {selected && (
          <BookingDetail
            id={selected}
            onChange={reload}
          />
        )}
      </Modal>
    </>
  );
}
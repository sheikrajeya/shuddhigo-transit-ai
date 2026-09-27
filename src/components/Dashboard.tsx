import { Bus, MapPin, Clock, Users, AlertTriangle, CheckCircle2, Ticket } from 'lucide-react';
import type { Route, Bus as BusType, Seat, HygieneReport, AuditLog } from '../types';

interface DashboardProps {
  route: Route | null;
  bus: BusType | null;
  seats: Seat[];
  reports: HygieneReport[];
  auditLogs: AuditLog[];
  onNavigate: (tab: string) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>}
      </div>
    </button>
  );
}

export function Dashboard({ route, bus, seats, reports, auditLogs, onNavigate }: DashboardProps) {
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const bookedSeats = seats.filter((s) => s.status === 'booked').length;
  const openReports = reports.filter((r) => r.status === 'open').length;
  const criticalReports = reports.filter((r) => r.severity === 'critical' && r.status !== 'resolved').length;

  const recentReports = reports.slice(0, 4);
  const recentAudit = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero bus info card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-800 to-slate-700 text-white shadow-lg">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Bus size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bus {bus?.bus_number ?? 'AP-31-Z-4829'}</h2>
              <p className="text-sm text-slate-300">
                Route {route?.route_number ?? '28K'} · {route?.route_name ?? 'RTC Complex — Steel Plant'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{availableSeats}</p>
              <p className="text-xs text-slate-300">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{bookedSeats}</p>
              <p className="text-xs text-slate-300">Booked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{openReports}</p>
              <p className="text-xs text-slate-300">Open Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Ticket}
          label="Available Seats"
          value={availableSeats}
          sublabel={`${bookedSeats} booked out of ${bus?.total_seats ?? 40}`}
          accent="bg-teal-100 text-teal-600"
          onClick={() => onNavigate('booking')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Reports"
          value={openReports}
          sublabel={criticalReports > 0 ? `${criticalReports} critical` : 'No critical issues'}
          accent="bg-amber-100 text-amber-600"
          onClick={() => onNavigate('hygiene')}
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved Reports"
          value={reports.filter((r) => r.status === 'resolved').length}
          sublabel={`${reports.length} total reports`}
          accent="bg-emerald-100 text-emerald-600"
          onClick={() => onNavigate('hygiene')}
        />
        <StatCard
          icon={Users}
          label="Audit Entries"
          value={auditLogs.length}
          sublabel="Depot activity log"
          accent="bg-violet-100 text-violet-600"
          onClick={() => onNavigate('audit')}
        />
      </div>

      {/* Route timeline + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Route timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Route 28K Timetable</h3>
          </div>
          <div className="space-y-0">
            {route?.stops.map((stop, i) => (
              <div key={stop.sequence} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0 ? 'bg-teal-500 text-white' : i === (route.stops.length - 1) ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i === 0 ? 'A' : i === route.stops.length - 1 ? 'B' : stop.sequence}
                  </div>
                  {i < route.stops.length - 1 && <div className="h-8 w-0.5 bg-slate-200" />}
                </div>
                <div className={`flex flex-1 items-center justify-between pb-4 ${i < route.stops.length - 1 ? '' : ''}`}>
                  <span className="text-sm font-medium text-slate-700">{stop.name}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> {stop.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Recent Depot Activity</h3>
          <div className="space-y-3">
            {recentAudit.length === 0 && (
              <p className="text-sm text-slate-400">No activity recorded yet.</p>
            )}
            {recentAudit.map((log) => {
              const detailMsg = (log.details as Record<string, string>)?.message ?? '';
              return (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{detailMsg}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {log.actor} · {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Recent Hygiene Reports</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentReports.map((report) => (
              <div key={report.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{report.category}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    report.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                    report.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    report.severity === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>{report.severity}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{report.description}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {new Date(report.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Bus, LayoutDashboard, Sparkles, Armchair, ScrollText, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Route, Bus as BusType, Seat, HygieneReport, AuditLog } from './types';
import { Dashboard } from './components/Dashboard';
import { HygieneView } from './components/HygieneView';
import { BookingView } from './components/BookingView';
import { AuditView } from './components/AuditView';

type Tab = 'dashboard' | 'hygiene' | 'booking' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'hygiene', label: 'Hygiene Reports', icon: Sparkles },
  { id: 'booking', label: 'Seat Booking', icon: Armchair },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [route, setRoute] = useState<Route | null>(null);
  const [bus, setBus] = useState<BusType | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [reports, setReports] = useState<HygieneReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [routeRes, busRes, seatsRes, reportsRes, auditRes] = await Promise.all([
      supabase.from('routes').select('*').eq('route_number', '28K').maybeSingle(),
      supabase.from('buses').select('*').eq('bus_number', 'AP-31-Z-4829').maybeSingle(),
      supabase.from('seats').select('*').order('seat_number', { ascending: true }),
      supabase.from('hygiene_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
    ]);

    if (routeRes.data) setRoute(routeRes.data as Route);
    if (busRes.data) setBus(busRes.data as BusType);
    setSeats((seatsRes.data ?? []) as Seat[]);
    setReports((reportsRes.data ?? []) as HygieneReport[]);
    setAuditLogs((auditRes.data ?? []) as AuditLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('shuddhigo-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seats' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hygiene_reports' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/30">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .tab-enter { animation: fadeIn 0.2s ease-out, slideUp 0.25s ease-out; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.25); border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.4); }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
              <Bus size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-800">ShuddhiGo</h1>
              <p className="text-[11px] text-slate-400">APSRTC Route 28K · AP-31-Z-4829 · Visakhapatnam</p>
            </div>
          </div>
          <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 sm:flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Loading ShuddhiGo...</p>
          </div>
        ) : (
          <div key={activeTab} className="tab-enter">
            {activeTab === 'dashboard' && (
              <Dashboard
                route={route}
                bus={bus}
                seats={seats}
                reports={reports}
                auditLogs={auditLogs}
                onNavigate={(t) => setActiveTab(t as Tab)}
              />
            )}
            {activeTab === 'hygiene' && <HygieneView reports={reports} onRefresh={loadAll} />}
            {activeTab === 'booking' && <BookingView seats={seats} bus={bus} onRefresh={loadAll} />}
            {activeTab === 'audit' && <AuditView auditLogs={auditLogs} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center">
        <p className="text-xs text-slate-400">
          ShuddhiGo · Civic transit hygiene & booking platform · Visakhapatnam APSRTC
        </p>
      </footer>
    </div>
  );
}

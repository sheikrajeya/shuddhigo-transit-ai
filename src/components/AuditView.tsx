import { useMemo, useState } from 'react';
import { FileText, CheckCircle2, Ticket, TicketX, BusFront, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditLog } from '../types';
import { AUDIT_ACTIONS } from '../constants';

interface AuditViewProps {
  auditLogs: AuditLog[];
}

function getActionIcon(action: string): React.ElementType {
  const info = AUDIT_ACTIONS[action];
  if (!info) return FileText;
  switch (info.icon) {
    case 'FileText': return FileText;
    case 'CheckCircle2': return CheckCircle2;
    case 'Ticket': return Ticket;
    case 'TicketX': return TicketX;
    case 'BusFront': return BusFront;
    default: return FileText;
  }
}

export function AuditView({ auditLogs }: AuditViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');

  const sorted = useMemo(() =>
    [...auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [auditLogs]);

  const filtered = filterAction === 'all' ? sorted : sorted.filter((l) => l.action === filterAction);

  const actionTypes = ['all', ...Object.keys(AUDIT_ACTIONS)];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Depot Audit Logs</h2>
        <p className="text-sm text-slate-500">Complete activity trail for Bus AP-31-Z-4829 · Route 28K</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {actionTypes.map((a) => (
          <button
            key={a}
            onClick={() => setFilterAction(a)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filterAction === a ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {a === 'all' ? 'All Activity' : AUDIT_ACTIONS[a]?.label ?? a}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">No audit entries found.</div>
        )}
        <div className="space-y-0">
          {filtered.map((log, idx) => {
            const Icon = getActionIcon(log.action);
            const actionInfo = AUDIT_ACTIONS[log.action];
            const isExpanded = expanded === log.id;
            const detailMsg = (log.details as Record<string, string>)?.message ?? '';
            const isLast = idx === filtered.length - 1;

            return (
              <div key={log.id} className="flex items-start gap-4">
                {/* Timeline rail */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${actionInfo?.badge ?? 'bg-slate-100 text-slate-600'}`}>
                    <Icon size={16} />
                  </div>
                  {!isLast && <div className="h-full min-h-[3rem] w-0.5 bg-slate-100" />}
                </div>

                {/* Content */}
                <div className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 transition-all hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${actionInfo?.badge ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {actionInfo?.label ?? log.action}
                        </span>
                        <span className="text-xs text-slate-400">{log.actor}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{detailMsg}</p>

                    {/* Expandable details */}
                    {Object.keys(log.details).length > 1 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : log.id)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isExpanded ? 'Hide details' : 'Show details'}
                      </button>
                    )}
                    {isExpanded && (
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 p-2.5 text-xs text-slate-600">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

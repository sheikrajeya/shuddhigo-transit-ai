import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, CheckCircle2, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { HygieneReport, ReportCategory, ReportSeverity } from '../types';
import { CATEGORIES, SEVERITIES, CATEGORY_MAP, SEVERITY_MAP, REPORT_STATUS_MAP, GEMINI_MATCH, BUS_NUMBER, ROUTE_NUMBER } from '../constants';

interface HygieneViewProps {
  reports: HygieneReport[];
  onRefresh: () => void;
}

interface VerifyResult {
  verified: boolean;
  match: string;
  summary: string;
  source: string;
}

export function HygieneView({ reports, onRefresh }: HygieneViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('cleanliness');
  const [severity, setSeverity] = useState<ReportSeverity>('medium');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!showForm) {
      setVerifyResult(null);
      setError(null);
    }
  }, [showForm]);

  const handleVerify = async () => {
    if (!description.trim()) {
      setError('Please describe the issue first.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-timetable`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bus_number: BUS_NUMBER,
          route_number: ROUTE_NUMBER,
          category,
          severity,
          description: description.trim(),
        }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Verification failed (${response.status})`);
      }
      const data: VerifyResult = await response.json();
      if (!data.verified) {
        throw new Error('Verification returned no result.');
      }
      setVerifyResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe the issue.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const geminiMatch = verifyResult?.match ?? 'unverified';
    const geminiSummary = verifyResult?.summary ?? null;

    const { error: insertErr } = await supabase.from('hygiene_reports').insert({
      bus_number: BUS_NUMBER,
      route_number: ROUTE_NUMBER,
      category,
      severity,
      description: description.trim(),
      reporter_name: reporterName.trim() || null,
      gemini_verified: !!verifyResult,
      gemini_summary: geminiSummary,
      gemini_match: geminiMatch,
      status: 'open',
    });

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'report_created',
      entity_type: 'hygiene_report',
      entity_id: BUS_NUMBER,
      details: {
        message: `Hygiene report filed: ${category} (${severity}) for bus ${BUS_NUMBER}`,
        category,
        severity,
        gemini_verified: !!verifyResult,
        gemini_match: geminiMatch,
      },
      actor: reporterName.trim() || 'Anonymous Commuter',
    });

    setSubmitting(false);
    setShowForm(false);
    setDescription('');
    setReporterName('');
    setVerifyResult(null);
    onRefresh();
  };

  const handleResolve = async (id: string) => {
    const { error: updateErr } = await supabase
      .from('hygiene_reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    await supabase.from('audit_logs').insert({
      action: 'report_resolved',
      entity_type: 'hygiene_report',
      entity_id: id,
      details: { message: `Hygiene report ${id.slice(0, 8)} marked resolved by depot staff` },
      actor: 'Depot Staff',
    });
    onRefresh();
  };

  const filteredReports = filterStatus === 'all' ? reports : reports.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Hygiene Reports</h2>
          <p className="text-sm text-slate-500">Public reports cross-checked against Route 28K timetable</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-900 hover:shadow active:scale-95"
        >
          <Sparkles size={16} /> New Report
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'open', 'acknowledged', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filterStatus === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredReports.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
            No reports yet. Click "New Report" to file one.
          </div>
        )}
        {filteredReports.map((report) => {
          const cat = CATEGORY_MAP[report.category];
          const sev = SEVERITY_MAP[report.severity];
          const statusInfo = REPORT_STATUS_MAP[report.status];
          const geminiInfo = report.gemini_match ? GEMINI_MATCH[report.gemini_match] : null;

          return (
            <div key={report.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${cat.badge}`}>{cat.label}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.badge}`}>{sev.label}</span>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusInfo.badge}`}>{statusInfo.label}</span>
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-slate-700">{report.description}</p>

              {/* Gemini verification badge */}
              {report.gemini_verified && geminiInfo && (
                <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                  <div className="flex items-center gap-1.5">
                    {geminiInfo.icon === 'CheckCircle2' && <CheckCircle2 size={14} className="text-emerald-600" />}
                    {geminiInfo.icon === 'AlertTriangle' && <AlertTriangle size={14} className="text-orange-600" />}
                    {geminiInfo.icon === 'HelpCircle' && <HelpCircle size={14} className="text-slate-500" />}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${geminiInfo.badge}`}>{geminiInfo.label}</span>
                  </div>
                  {report.gemini_summary && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{report.gemini_summary}</p>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
                <span className="text-xs text-slate-400">
                  {report.reporter_name ?? 'Anonymous'} · {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                {report.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New report modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">File Hygiene Report</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto px-6 py-5">
              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        category === c.id ? `${c.badge} ring-2 ring-offset-1` : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</label>
                <div className="flex flex-wrap gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSeverity(s.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        severity === s.id ? `${s.badge} ring-2 ring-offset-1` : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. Mention stops, times, or seat numbers if relevant — this helps Gemini cross-check against the timetable."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Reporter name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Your Name (optional)</label>
                <input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Gemini verify result */}
              {verifyResult && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                  <div className="flex items-center gap-2">
                    {verifyResult.match === 'matched' && <CheckCircle2 size={16} className="text-emerald-600" />}
                    {verifyResult.match === 'mismatch' && <AlertTriangle size={16} className="text-orange-600" />}
                    {verifyResult.match === 'unverified' && <HelpCircle size={16} className="text-slate-500" />}
                    <span className="text-sm font-semibold text-slate-700">
                      {verifyResult.source === 'gemini' ? 'Gemini AI Verification' : 'Local Heuristic Verification'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{verifyResult.summary}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                onClick={handleVerify}
                disabled={verifying || !description.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {verifying ? 'Verifying...' : 'Cross-check with Gemini'}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

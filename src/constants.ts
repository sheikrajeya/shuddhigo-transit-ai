import type { ReportCategory, ReportSeverity, ReportStatus, GeminiMatch } from './types';

export const BUS_NUMBER = 'AP-31-Z-4829';
export const ROUTE_NUMBER = '28K';

export const CATEGORIES: { id: ReportCategory; label: string; icon: string; badge: string }[] = [
  { id: 'cleanliness', label: 'Cleanliness', icon: 'Sparkles', badge: 'bg-teal-100 text-teal-700 border-teal-200' },
  { id: 'seats', label: 'Seats', icon: 'Armchair', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'ac', label: 'AC / Ventilation', icon: 'Wind', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'doors', label: 'Doors', icon: 'DoorOpen', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'windows', label: 'Windows', icon: 'PanelsTopLeft', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 'other', label: 'Other', icon: 'Wrench', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const CATEGORY_MAP: Record<ReportCategory, (typeof CATEGORIES)[number]> = {
  cleanliness: CATEGORIES[0],
  seats: CATEGORIES[1],
  ac: CATEGORIES[2],
  doors: CATEGORIES[3],
  windows: CATEGORIES[4],
  other: CATEGORIES[5],
};

export const SEVERITIES: { id: ReportSeverity; label: string; badge: string; dot: string; ring: string }[] = [
  { id: 'low', label: 'Low', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  { id: 'medium', label: 'Medium', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', ring: 'ring-amber-200' },
  { id: 'high', label: 'High', badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', ring: 'ring-orange-200' },
  { id: 'critical', label: 'Critical', badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', ring: 'ring-red-200' },
];

export const SEVERITY_MAP: Record<ReportSeverity, (typeof SEVERITIES)[number]> = {
  low: SEVERITIES[0],
  medium: SEVERITIES[1],
  high: SEVERITIES[2],
  critical: SEVERITIES[3],
};

export const REPORT_STATUSES: { id: ReportStatus; label: string; badge: string; dot: string }[] = [
  { id: 'open', label: 'Open', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { id: 'acknowledged', label: 'Acknowledged', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { id: 'resolved', label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

export const REPORT_STATUS_MAP: Record<ReportStatus, (typeof REPORT_STATUSES)[number]> = {
  open: REPORT_STATUSES[0],
  acknowledged: REPORT_STATUSES[1],
  resolved: REPORT_STATUSES[2],
};

export const GEMINI_MATCH: Record<GeminiMatch, { label: string; badge: string; icon: string }> = {
  matched: { label: 'Verified Match', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'CheckCircle2' },
  mismatch: { label: 'Mismatch', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'AlertTriangle' },
  unverified: { label: 'Unverified', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'HelpCircle' },
};

export const AUDIT_ACTIONS: Record<string, { label: string; badge: string; icon: string }> = {
  report_created: { label: 'Report Filed', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'FileText' },
  report_resolved: { label: 'Report Resolved', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'CheckCircle2' },
  seat_booked: { label: 'Seat Booked', badge: 'bg-violet-100 text-violet-700 border-violet-200', icon: 'Ticket' },
  seat_released: { label: 'Seat Released', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'TicketX' },
  bus_inspected: { label: 'Bus Inspected', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'BusFront' },
};

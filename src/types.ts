export interface Stop {
  name: string;
  time: string;
  sequence: number;
}

export interface Route {
  id: string;
  route_number: string;
  route_name: string;
  origin: string;
  destination: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  bus_number: string;
  route_id: string;
  total_seats: number;
  depot: string;
  driver_name: string | null;
  conductor_name: string | null;
  active: boolean;
}

export type SeatStatus = 'available' | 'booked' | 'reserved';

export interface Seat {
  id: string;
  bus_id: string;
  seat_number: number;
  status: SeatStatus;
  booked_by: string | null;
  booked_at: string | null;
  booking_ref: string | null;
}

export type ReportCategory = 'cleanliness' | 'seats' | 'ac' | 'doors' | 'windows' | 'other';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'acknowledged' | 'resolved';
export type GeminiMatch = 'matched' | 'mismatch' | 'unverified';

export interface HygieneReport {
  id: string;
  bus_number: string;
  route_number: string;
  category: ReportCategory;
  severity: ReportSeverity;
  description: string;
  reporter_name: string | null;
  gemini_verified: boolean;
  gemini_summary: string | null;
  gemini_match: GeminiMatch | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  actor: string;
  created_at: string;
}

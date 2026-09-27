import { useState } from 'react';
import { Armchair, User, X, Check, Loader2, Ticket, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Seat, Bus } from '../types';
import { BUS_NUMBER, ROUTE_NUMBER } from '../constants';

interface BookingViewProps {
  seats: Seat[];
  bus: Bus | null;
  onRefresh: () => void;
}

function genRef(): string {
  return 'SG' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 2x2 layout with aisle. Seats 1-40. Left col: 1,2 / 5,6 / 9,10 ... Right col: 3,4 / 7,8 / 11,12 ...
function getSeatLayout(total: number): { left: number[]; right: number[] }[] {
  const rows: { left: number[]; right: number[] }[] = [];
  for (let i = 0; i < total; i += 4) {
    rows.push({
      left: [i + 1, i + 2].filter((n) => n <= total),
      right: [i + 3, i + 4].filter((n) => n <= total),
    });
  }
  return rows;
}

export function BookingView({ seats, bus, onRefresh }: BookingViewProps) {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const seatMap = new Map<number, Seat>();
  seats.forEach((s) => seatMap.set(s.seat_number, s));

  const layout = getSeatLayout(bus?.total_seats ?? 40);
  const availableCount = seats.filter((s) => s.status === 'available').length;
  const bookedCount = seats.filter((s) => s.status === 'booked').length;

  // Smart suggestion: first available seat (sequential booking)
  const firstAvailable = seats.find((s) => s.status === 'available');

  const handleBook = async () => {
    if (!selectedSeat) return;
    if (!passengerName.trim()) {
      setError('Please enter passenger name.');
      return;
    }
    setBooking(true);
    setError(null);

    // Optimistic: mark as booked
    const ref = genRef();
    const { error: updateErr } = await supabase
      .from('seats')
      .update({
        status: 'booked',
        booked_by: passengerName.trim(),
        booked_at: new Date().toISOString(),
        booking_ref: ref,
      })
      .eq('id', selectedSeat.id)
      .eq('status', 'available'); // guard against race

    if (updateErr) {
      setError(updateErr.message);
      setBooking(false);
      return;
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'seat_booked',
      entity_type: 'seat',
      entity_id: `Seat ${selectedSeat.seat_number}`,
      details: {
        message: `Seat ${selectedSeat.seat_number} booked by ${passengerName.trim()} (Ref: ${ref}) on bus ${BUS_NUMBER}`,
        seat_number: selectedSeat.seat_number,
        passenger: passengerName.trim(),
        booking_ref: ref,
      },
      actor: passengerName.trim(),
    });

    setBooking(false);
    setSelectedSeat(null);
    setPassengerName('');
    setSuccess(`Seat ${selectedSeat.seat_number} booked successfully! Ref: ${ref}`);
    onRefresh();
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleRelease = async (seat: Seat) => {
    const { error: updateErr } = await supabase
      .from('seats')
      .update({ status: 'available', booked_by: null, booked_at: null, booking_ref: null })
      .eq('id', seat.id);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    await supabase.from('audit_logs').insert({
      action: 'seat_released',
      entity_type: 'seat',
      entity_id: `Seat ${seat.seat_number}`,
      details: {
        message: `Seat ${seat.seat_number} released (was booked by ${seat.booked_by}) on bus ${BUS_NUMBER}`,
        seat_number: seat.seat_number,
      },
      actor: 'Depot Staff',
    });
    setSelectedSeat(null);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <Info size={16} /> <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <Check size={16} /> <span>{success}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Smart Seat Booking</h2>
          <p className="text-sm text-slate-500">Bus {BUS_NUMBER} · Route {ROUTE_NUMBER} · {bus?.depot ?? 'Dwaraka Bus Station Depot'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="h-3 w-3 rounded border-2 border-emerald-400 bg-emerald-50" />
            <span className="text-slate-600">Available ({availableCount})</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="h-3 w-3 rounded bg-slate-400" />
            <span className="text-slate-600">Booked ({bookedCount})</span>
          </div>
        </div>
      </div>

      {/* Smart suggestion banner */}
      {firstAvailable && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
            <Ticket size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-teal-800">Smart Sequential Booking</p>
            <p className="text-xs text-teal-600">Next available seat: <strong>Seat {firstAvailable.seat_number}</strong> — booking fills front-to-back for optimal load distribution.</p>
          </div>
          <button
            onClick={() => setSelectedSeat(firstAvailable)}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
          >
            Book Seat {firstAvailable.seat_number}
          </button>
        </div>
      )}

      {/* Bus layout */}
      <div className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Driver row */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <User size={14} /> Driver: {bus?.driver_name ?? 'N/A'}
            </div>
            <div className="flex items-center gap-1">
              <div className="h-6 w-10 rounded-md border-2 border-slate-300" />
              <span className="text-[10px] text-slate-400">Front</span>
            </div>
          </div>

          {/* Seat grid */}
          <div className="space-y-2">
            {layout.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center justify-between gap-2">
                {/* Left seats */}
                <div className="flex gap-2">
                  {row.left.map((seatNum) => {
                    const seat = seatMap.get(seatNum);
                    const isAvailable = seat?.status === 'available';
                    return (
                      <button
                        key={seatNum}
                        onClick={() => isAvailable && setSelectedSeat(seat ?? null)}
                        disabled={!isAvailable}
                        className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                          isAvailable
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100 hover:scale-105 cursor-pointer'
                            : 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                        } ${selectedSeat?.seat_number === seatNum ? 'ring-2 ring-teal-400 ring-offset-1 scale-105' : ''}`}
                        title={isAvailable ? `Seat ${seatNum} - Available` : `Seat ${seatNum} - Booked by ${seat?.booked_by ?? 'N/A'}`}
                      >
                        <Armchair size={16} />
                        <span className="text-[9px] font-semibold">{seatNum}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Aisle */}
                <div className="flex h-11 w-4 items-center justify-center">
                  <span className="text-[8px] text-slate-300">{rowIdx + 1}</span>
                </div>

                {/* Right seats */}
                <div className="flex gap-2">
                  {row.right.map((seatNum) => {
                    const seat = seatMap.get(seatNum);
                    const isAvailable = seat?.status === 'available';
                    return (
                      <button
                        key={seatNum}
                        onClick={() => isAvailable && setSelectedSeat(seat ?? null)}
                        disabled={!isAvailable}
                        className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                          isAvailable
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100 hover:scale-105 cursor-pointer'
                            : 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                        } ${selectedSeat?.seat_number === seatNum ? 'ring-2 ring-teal-400 ring-offset-1 scale-105' : ''}`}
                        title={isAvailable ? `Seat ${seatNum} - Available` : `Seat ${seatNum} - Booked by ${seat?.booked_by ?? 'N/A'}`}
                      >
                        <Armchair size={16} />
                        <span className="text-[9px] font-semibold">{seatNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Back row indicator */}
          <div className="mt-3 border-t border-slate-100 pt-2 text-center">
            <span className="text-[10px] text-slate-400">Back of bus</span>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedSeat(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Book Seat {selectedSeat.seat_number}</h2>
              <button onClick={() => setSelectedSeat(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <Armchair className="mx-auto text-emerald-600" size={32} />
                <p className="mt-1 text-sm font-semibold text-emerald-700">Seat {selectedSeat.seat_number}</p>
                <p className="text-xs text-emerald-600">Route {ROUTE_NUMBER} · {bus?.route_id ? '' : ''}Status: Available</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Passenger Name</label>
                <input
                  autoFocus
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBook()}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setSelectedSeat(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95 disabled:opacity-50"
              >
                {booking ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booked seat info modal (clicking a booked seat) */}
      {selectedSeat && selectedSeat.status === 'booked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedSeat(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Seat {selectedSeat.seat_number}</h2>
              <button onClick={() => setSelectedSeat(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-3 px-6 py-5">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-600">Booked by: <strong>{selectedSeat.booked_by}</strong></p>
                <p className="text-xs text-slate-400">Ref: {selectedSeat.booking_ref}</p>
                <p className="text-xs text-slate-400">Booked at: {selectedSeat.booked_at ? new Date(selectedSeat.booked_at).toLocaleString('en-IN') : 'N/A'}</p>
              </div>
              <button
                onClick={() => handleRelease(selectedSeat)}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                Release Seat (Depot Staff)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

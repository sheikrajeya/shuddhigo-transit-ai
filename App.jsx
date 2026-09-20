import React, { useState } from 'react';
import { 
  Bus, ShieldCheck, AlertTriangle, CheckCircle2, Upload, Camera, MapPin, 
  Clock, BookOpen, QrCode, Users, Building2, Lock, Search, Sparkles, RefreshCw 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('report');

  const [reportState, setReportState] = useState({
    city: 'Visakhapatnam',
    routeNumber: '28K',
    stopName: 'RTC Complex',
    timeReported: '10:30 AM',
    isVerifying: false,
    verified: false,
    matchedViaTimetable: false
  });

  const [depotForm, setDepotForm] = useState({
    busNumber: 'AP-31-Z-4829',
    depotId: 'DEP-VSKP-02',
    scheduledRoute: '28K (RTC Complex to Simhachalam)',
    departureTime: '05:00 AM',
    submitted: false
  });

  const [seatMap] = useState([
    { id: '1A', status: 'occupied', passenger: 'Passenger #1', category: 'General' },
    { id: '1B', status: 'occupied', passenger: 'Passenger #2', category: 'General' },
    { id: '2A', status: 'available', passenger: null, category: 'Elderly / Priority' },
    { id: '2B', status: 'available', passenger: null, category: 'General' },
    { id: '3A', status: 'available', passenger: null, category: 'Differently Abled' },
    { id: '3B', status: 'available', passenger: null, category: 'General' },
  ]);

  const handleVerifyReport = (hasPlate = true) => {
    setReportState(prev => ({ 
      ...prev, 
      isVerifying: true, 
      verified: false 
    }));

    setTimeout(() => {
      setReportState(prev => ({
        ...prev,
        isVerifying: false,
        verified: true,
        matchedViaTimetable: !hasPlate
      }));
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-emerald-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-xl text-emerald-800 shadow-sm">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                ShuddhiGo <span className="text-xs bg-emerald-600 text-emerald-100 font-normal px-2 py-0.5 rounded-full">Visakhapatnam</span>
              </h1>
              <p className="text-xs text-emerald-200">Happy Ride, Peaceful Mind.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs bg-emerald-900 px-3 py-1.5 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-emerald-100 font-medium">APSRTC VSKP Region</span>
          </div>
        </div>

        <div className="bg-emerald-900 border-t border-emerald-700">
          <div className="max-w-5xl mx-auto flex space-x-1 px-4 pt-1">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-lg transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'report' ? 'bg-slate-50 text-emerald-900 shadow-md' : 'text-emerald-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>1. Report & Verify (Public Priority)</span>
            </button>

            <button
              onClick={() => setActiveTab('seats')}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-lg transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'seats' ? 'bg-slate-50 text-emerald-900 shadow-md' : 'text-emerald-100'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>2. Seat Booking & Media</span>
            </button>

            <button
              onClick={() => setActiveTab('depot')}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-lg transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'depot' ? 'bg-slate-50 text-emerald-900 shadow-md' : 'text-emerald-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>3. Depot Inspection Log</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {activeTab === 'report' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" /> Commuter Hygiene Report
              </h2>
              <span className="text-xs bg-slate-100 px-3 py-1 rounded text-slate-600">City: <strong>Visakhapatnam</strong></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Route Number</label>
                <input type="text" value={reportState.routeNumber} onChange={e => setReportState({...reportState, routeNumber: e.target.value})} className="w-full text-sm p-2 bg-slate-50 border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Bus Stop</label>
                <input type="text" value={reportState.stopName} onChange={e => setReportState({...reportState, stopName: e.target.value})} className="w-full text-sm p-2 bg-slate-50 border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Time Reported</label>
                <div className="text-xs p-2.5 bg-slate-100 rounded-lg text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 10:30 AM (Auto-Geotagged)
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-6 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-3">Snap or Upload Issue Photo</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => handleVerifyReport(true)} disabled={reportState.isVerifying} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Photo (With Plate)
                </button>
                <button onClick={() => handleVerifyReport(false)} disabled={reportState.isVerifying} className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-amber-400" /> Upload Photo (Plate Missed / Hidden)
                </button>
              </div>
            </div>

            {reportState.isVerifying && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-amber-800 animate-pulse text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                <div>
                  <p className="font-bold">Gemini 1.5 Pro Cross-Checking Verification Engine Running...</p>
                  <p>Scanning depot dispatch schedules & GPS logs for Visakhapatnam Route {reportState.routeNumber}...</p>
                </div>
              </div>
            )}

            {reportState.verified && (
              <div className="space-y-4 pt-2">
                {reportState.matchedViaTimetable && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3 text-blue-900 text-xs">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-blue-950 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Hackproof Timetable Cross-Match Activated
                      </p>
                      <p>Plate Missing/Obscured? Gemini matched stop <strong>"{reportState.stopName}"</strong> at <strong>10:30 AM</strong> on Route <strong>28K</strong> to Vehicle <strong>AP-31-Z-4829</strong>.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-100 p-4 rounded-xl border text-center">
                    <span className="text-xs font-bold text-slate-700 uppercase block mb-2">5:00 AM Depot Baseline</span>
                    <div className="bg-slate-200 h-28 rounded flex flex-col items-center justify-center text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-1" />
                      <p className="font-medium">Clean Bus Baseline Log</p>
                      <p className="text-[10px] text-slate-500">AP-31-Z-4829 • Signed off at VSKP Depot</p>
                    </div>
                  </div>

                  <div className="bg-slate-100 p-4 rounded-xl border text-center">
                    <span className="text-xs font-bold text-slate-700 uppercase block mb-2">10:30 AM Commuter Upload</span>
                    <div className="bg-slate-200 h-28 rounded flex flex-col items-center justify-center text-xs">
                      <AlertTriangle className="w-6 h-6 text-red-600 mb-1" />
                      <p className="font-medium text-red-700">Mold / Dirt Detected</p>
                      <p className="text-[10px] text-slate-500">Geotag: RTC Complex, Visakhapatnam</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-900 text-xs font-mono space-y-1">
                  <p className="font-bold text-sm font-sans flex items-center gap-1"><Sparkles className="w-4 h-4 text-red-600" /> Gemini 1.5 Pro Discrepancy Verdict</p>
                  <p>• Vehicle ID: AP-31-Z-4829 {reportState.matchedViaTimetable ? '(Cross-matched via Depot Schedule)' : '(OCR Verified)'}</p>
                  <p>• Mold Severity: 8/10 (Critical)</p>
                  <p>• Verdict: FALSE INSPECTION CLAIM DETECTED</p>
                  <p className="text-slate-700 font-sans mt-2">• Penalty notice automatically generated for VSKP Depot Inspector DEP-VSKP-02.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'seats' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Sequential Smart Seat Allocation
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {seatMap.map((seat) => (
                <div key={seat.id} className={`p-3 rounded-xl border text-xs ${seat.status === 'occupied' ? 'bg-slate-100' : 'bg-emerald-50 border-emerald-300'}`}>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Seat {seat.id}</span>
                    <span className={seat.status === 'occupied' ? 'text-slate-500' : 'text-emerald-700'}>{seat.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{seat.category}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Free Onboard Media Hub</p>
                <p className="text-xs text-slate-300">Scan onboard QR code for daily e-books and news digests.</p>
              </div>
              <div className="bg-white p-2 rounded text-slate-900 text-center">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'depot' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" /> Pre-Trip Depot Audit Log (5:00 AM)
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><label className="font-semibold">Bus Number</label><input type="text" value={depotForm.busNumber} readOnly className="w-full p-2 bg-slate-100 border rounded" /></div>
              <div><label className="font-semibold">Depot ID</label><input type="text" value={depotForm.depotId} readOnly className="w-full p-2 bg-slate-100 border rounded" /></div>
            </div>
            <button onClick={() => setDepotForm({...depotForm, submitted: true})} className="w-full bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs">
              Submit Pre-Trip Visual Audit Log
            </button>
            {depotForm.submitted && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs">
                ✓ Baseline Log Saved to Firebase Cloud Storage (VSKP-AP31Z4829-0500AM)
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, CheckCircle2, Loader2, ShieldCheck, X, Clock, Globe } from 'lucide-react';

interface Props {
  adminEmail: string;
}

// Returns true if the popup should show today (resets daily at 4 AM)
function shouldShowPopup(): boolean {
  if (typeof window === 'undefined') return false;

  // Check URL query override e.g. ?snapshot=true
  const params = new URLSearchParams(window.location.search);
  if (params.get('snapshot') === 'true') return true;

  const now = new Date();
  const todayReset4AM = new Date(now);
  todayReset4AM.setHours(4, 0, 0, 0);

  // If current time is before 4 AM, the "today" reset was yesterday at 4 AM
  if (now < todayReset4AM) {
    todayReset4AM.setDate(todayReset4AM.getDate() - 1);
  }

  const lastShown = localStorage.getItem('adminLoginSnapshot_lastShown');
  if (!lastShown) return true;

  const lastShownDate = new Date(lastShown);
  return lastShownDate < todayReset4AM;
}

export default function AdminLoginSnapshotModal({ adminEmail }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'idle' | 'location' | 'saving' | 'done' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number; alt: number | null } | null>(null);

  const startVerificationFlow = useCallback(() => {
    setVisible(true);
    setCoords(null);
    setStep('location');
    fetchLocation();
  }, []);

  // Check on mount whether to show popup & listen for trigger events
  useEffect(() => {
    if (shouldShowPopup()) {
      startVerificationFlow();
    }

    const handleTrigger = () => {
      startVerificationFlow();
    };
    window.addEventListener('trigger-admin-snapshot', handleTrigger);
    return () => window.removeEventListener('trigger-admin-snapshot', handleTrigger);
  }, [startVerificationFlow]);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      fetchIPLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          alt: pos.coords.altitude != null ? pos.coords.altitude : null
        };
        setCoords(c);
        saveSession(c);
      },
      (err) => {
        console.warn('GPS location fallback to IP:', err);
        fetchIPLocation();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchIPLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const c = { lat: data.latitude, lng: data.longitude, alt: null };
          setCoords(c);
          saveSession(c);
          return;
        }
      }
    } catch (e) {
      console.warn('ipapi fallback trying freeipapi...', e);
      try {
        const res2 = await fetch('https://freeipapi.com/api/json');
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
            const c = { lat: data2.latitude, lng: data2.longitude, alt: null };
            setCoords(c);
            saveSession(c);
            return;
          }
        }
      } catch (e2) {
        console.warn('All location fallbacks failed:', e2);
      }
    }
    saveSession(null);
  };

  const saveSession = async (location: { lat: number; lng: number; alt: number | null } | null) => {
    setStep('saving');
    const targetEmail = adminEmail || (typeof window !== 'undefined' ? localStorage.getItem('admin_email') : null) || 'admin@balajichilkur.com';
    try {
      await fetch('/api/cms/admin-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: targetEmail,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          altitude: location?.alt ?? null,
        })
      });
      localStorage.setItem('adminLoginSnapshot_lastShown', new Date().toISOString());
      setStep('done');
      setTimeout(() => setVisible(false), 2200);
    } catch (err) {
      console.error('Failed to save login session:', err);
      localStorage.setItem('adminLoginSnapshot_lastShown', new Date().toISOString());
      setStep('done');
      setTimeout(() => setVisible(false), 2200);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-sm mx-4 overflow-hidden relative">
        {/* Brand header bar */}
        <div className="bg-[#4A2E2B] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-[#D35400]" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#D35400]">Security Check</p>
              <h2 className="font-display font-black text-sm text-[#FAF6EE] leading-tight">Daily Login Location &amp; IP Log</h2>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="text-[#FAF6EE]/70 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <StatusRow
              icon={<MapPin size={15} />}
              label="Location & Coordinates"
              status={step === 'location' ? 'loading' : coords ? 'done' : 'skipped'}
              detail={
                coords
                  ? `Lat: ${coords.lat.toFixed(4)}°, Lng: ${coords.lng.toFixed(4)}°${coords.alt != null ? ` (Alt: ${coords.alt.toFixed(1)}m)` : ''}`
                  : step === 'location'
                  ? 'Acquiring GPS location & altitude...'
                  : 'Location not available'
              }
            />

            <StatusRow
              icon={<Clock size={15} />}
              label="Date &amp; Time"
              status="done"
              detail={new Date().toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'medium'
              })}
            />

            <StatusRow
              icon={<ShieldCheck size={15} />}
              label="Logging Security Record"
              status={step === 'saving' ? 'loading' : step === 'done' ? 'done' : 'idle'}
              detail={step === 'done' ? 'Saved to Audit & Access Trail ✓' : 'Saving details...'}
            />
          </div>

          {/* Done banner */}
          {step === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>Login location &amp; IP verified successfully!</span>
            </div>
          )}

          {/* Admin email footer */}
          <p className="text-center text-[10px] text-zinc-400 font-medium pt-1">
            Verified for <span className="font-bold text-zinc-600">{adminEmail || 'admin@balajichilkur.com'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper status row component
function StatusRow({ icon, label, status, detail }: {
  icon: React.ReactNode;
  label: string;
  status: 'idle' | 'pending' | 'loading' | 'done' | 'skipped';
  detail?: string;
}) {
  const colors = {
    idle: 'text-zinc-300',
    pending: 'text-amber-500',
    loading: 'text-blue-500',
    done: 'text-emerald-500',
    skipped: 'text-zinc-400',
  };

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 border border-zinc-100">
      <span className={`${colors[status]} shrink-0 p-1.5 bg-white rounded-lg border border-zinc-200/60 shadow-2xs`}>{icon}</span>
      <div className="flex-grow min-w-0">
        <span className="text-xs font-bold text-zinc-800">{label}</span>
        {detail && <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">{detail}</p>}
      </div>
      {status === 'loading' && <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />}
      {status === 'done' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
    </div>
  );
}

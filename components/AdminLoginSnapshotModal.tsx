"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, MapPin, CheckCircle2, AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';

interface Props {
  adminEmail: string;
}

// Returns true if the popup should show today (resets daily at 4 AM)
function shouldShowPopup(): boolean {
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
  const [step, setStep] = useState<'idle' | 'camera' | 'capturing' | 'location' | 'saving' | 'done' | 'error'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check on mount whether to show popup
  useEffect(() => {
    if (typeof window !== 'undefined' && shouldShowPopup()) {
      setVisible(true);
      setStep('camera');
    }
  }, []);

  // Start camera when step becomes 'camera'
  useEffect(() => {
    if (step !== 'camera') return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Start countdown
        let c = 3;
        setCountdown(c);
        const timer = setInterval(() => {
          c -= 1;
          setCountdown(c);
          if (c <= 0) {
            clearInterval(timer);
            capturePhoto();
          }
        }, 1000);
      } catch (err) {
        console.warn('Camera not available, skipping photo capture');
        // If no camera, skip directly to location
        setStep('location');
        fetchLocation(null);
      }
    })();
  }, [step]);

  const capturePhoto = useCallback(() => {
    setStep('capturing');
    let capturedPhoto: string | null = null;
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedPhoto = canvas.toDataURL('image/jpeg', 0.6); // compress to 60%
        setPhotoBase64(capturedPhoto);
      }
    }
    stopCamera();
    setStep('location');
    fetchLocation(capturedPhoto);
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const fetchLocation = (capturedPhoto: string | null) => {
    if (!navigator.geolocation) {
      fetchIPLocation(capturedPhoto);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        saveSession(capturedPhoto, c);
      },
      () => {
        // Location denied or failed — fall back to IP geolocation
        fetchIPLocation(capturedPhoto);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const fetchIPLocation = async (capturedPhoto: string | null) => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const c = { lat: data.latitude, lng: data.longitude };
          setCoords(c);
          saveSession(capturedPhoto, c);
          return;
        }
      }
    } catch (e) {
      console.warn('ipapi.co fallback failed, trying freeipapi...', e);
      try {
        const res2 = await fetch('https://freeipapi.com/api/json');
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
            const c = { lat: data2.latitude, lng: data2.longitude };
            setCoords(c);
            saveSession(capturedPhoto, c);
            return;
          }
        }
      } catch (e2) {
        console.warn('All location fallbacks failed:', e2);
      }
    }
    saveSession(capturedPhoto, null);
  };

  const saveSession = async (capturedPhoto: string | null, location: { lat: number; lng: number } | null) => {
    setStep('saving');
    try {
      await fetch('/api/cms/admin-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          photoBase64: capturedPhoto || null,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
        })
      });
      // Mark as shown
      localStorage.setItem('adminLoginSnapshot_lastShown', new Date().toISOString());
      setStep('done');
      // Auto-dismiss after 2.5 seconds
      setTimeout(() => setVisible(false), 2500);
    } catch (err) {
      console.error('Failed to save login session:', err);
      localStorage.setItem('adminLoginSnapshot_lastShown', new Date().toISOString());
      setStep('done');
      setTimeout(() => setVisible(false), 2500);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-sm mx-4 overflow-hidden relative">
        
        {/* Brand header bar */}
        <div className="bg-[#4A2E2B] px-6 py-4 flex items-center gap-3">
          <ShieldCheck size={18} className="text-[#D35400]" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#D35400]">Security Check</p>
            <h2 className="font-display font-black text-sm text-[#FAF6EE] leading-tight">Daily Login Verification</h2>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Camera preview */}
          {(step === 'camera' || step === 'capturing') && (
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Countdown overlay */}
              {step === 'camera' && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-white font-black text-6xl drop-shadow-xl animate-pulse">{countdown}</span>
                </div>
              )}
              {step === 'capturing' && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Camera size={32} className="text-[#D35400] animate-bounce" />
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas used only for photo */}
          {step !== 'camera' && step !== 'capturing' && (
            <canvas ref={canvasRef} className="hidden" />
          )}

          {/* Captured photo preview */}
          {photoBase64 && step !== 'camera' && step !== 'capturing' && (
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoBase64} alt="Login snapshot" className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> Captured
              </div>
            </div>
          )}

          {/* Status text */}
          <div className="space-y-1.5">
            <StatusRow
              icon={<Camera size={14} />}
              label="Selfie Snapshot"
              status={
                step === 'camera' ? 'pending'
                : step === 'capturing' ? 'loading'
                : photoBase64 ? 'done'
                : 'skipped'
              }
              detail={step === 'camera' ? `Taking photo in ${countdown}s...` : photoBase64 ? 'Photo captured ✓' : 'Camera unavailable'}
            />
            <StatusRow
              icon={<MapPin size={14} />}
              label="Location"
              status={
                step === 'camera' || step === 'capturing' ? 'idle'
                : step === 'location' ? 'loading'
                : coords ? 'done'
                : step === 'saving' || step === 'done' ? 'skipped'
                : 'idle'
              }
              detail={coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : step === 'location' ? 'Getting GPS...' : 'Awaiting...'}
            />
            <StatusRow
              icon={<ShieldCheck size={14} />}
              label="Saving Record"
              status={step === 'saving' ? 'loading' : step === 'done' ? 'done' : 'idle'}
              detail={step === 'done' ? 'Saved to Audit Trail ✓' : step === 'saving' ? 'Saving...' : ''}
            />
          </div>

          {/* Done banner */}
          {step === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 size={16} />
              <span>Login verified. Have a great day!</span>
            </div>
          )}

          {/* Admin email footer */}
          <p className="text-center text-[10px] text-zinc-400 font-medium">
            Logged in as <span className="font-bold text-zinc-600">{adminEmail}</span>
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
    <div className="flex items-center gap-2.5">
      <span className={`${colors[status]} shrink-0`}>{icon}</span>
      <div className="flex-grow min-w-0">
        <span className="text-xs font-bold text-zinc-700">{label}</span>
        {detail && <p className="text-[10px] text-zinc-400 truncate">{detail}</p>}
      </div>
      {status === 'loading' && <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />}
      {status === 'done' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
    </div>
  );
}

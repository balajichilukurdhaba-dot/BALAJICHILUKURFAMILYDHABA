"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Ticket, AlertTriangle, ArrowLeft, Search, RefreshCw, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paramRef = searchParams.get('ref');
  const paramToken = searchParams.get('token');

  const [bookingRef, setBookingRef] = useState<string | null>(paramRef);
  const [token, setToken] = useState<string | null>(paramToken);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [showLookupModal, setShowLookupModal] = useState(false);

  // Persistence & Recovery Logic
  useEffect(() => {
    if (paramRef && paramToken) {
      // Save to localStorage for instant recovery if refreshed or navigated away
      localStorage.setItem('active_booking_ref', paramRef);
      localStorage.setItem('active_booking_token', paramToken);
      setBookingRef(paramRef);
      setToken(paramToken);
    } else {
      // Check localStorage if URL parameters were cleared
      const cachedRef = localStorage.getItem('active_booking_ref');
      const cachedToken = localStorage.getItem('active_booking_token');
      if (cachedRef && cachedToken) {
        setBookingRef(cachedRef);
        setToken(cachedToken);
      }
    }
  }, [paramRef, paramToken]);

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone) return;
    setLookupLoading(true);
    setLookupError('');

    try {
      const res = await fetch(`/api/reservations/lookup?phone=${encodeURIComponent(lookupPhone)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.reservations || data.reservations.length === 0) {
        throw new Error('No active reservations found for this phone number.');
      }

      const latest = data.reservations[0];
      setBookingRef(latest.bookingRef);
      setToken(latest.qrToken);
      localStorage.setItem('active_booking_ref', latest.bookingRef);
      localStorage.setItem('active_booking_token', latest.qrToken);
      setShowLookupModal(false);
    } catch (err: any) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  if (!bookingRef || !token) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center space-y-6 font-sans">
        <AlertTriangle size={56} className="mx-auto text-amber-500" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">No Active Booking Found</h2>
          <p className="text-slate-500 text-xs mt-1">If you refreshed or cleared your browser, enter your phone number to retrieve your QR code pass.</p>
        </div>

        <form onSubmit={handlePhoneLookup} className="space-y-3 pt-2">
          {lookupError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
              {lookupError}
            </div>
          )}
          <input
            type="tel"
            required
            placeholder="Enter Phone Number (e.g. 98765 43210)"
            value={lookupPhone}
            onChange={(e) => setLookupPhone(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {lookupLoading ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
            <span>Retrieve Booking Pass & QR</span>
          </button>
        </form>

        <div className="pt-2">
          <Link href="/reserve" className="text-xs font-semibold text-slate-600 hover:underline">
            ← Book New Table
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/90 font-sans">
      <div className="bg-emerald-600 p-8 text-center text-white relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle2 size={40} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-1">Booking Confirmed!</h2>
        <p className="text-white/90 text-xs">We look forward to hosting your dining table.</p>
      </div>

      <div className="p-6 md:p-8 flex flex-col items-center">
        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Booking Reference</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tracking-wider">{bookingRef}</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl w-full border border-slate-200/80 relative overflow-hidden flex flex-col items-center shadow-inner">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold uppercase tracking-wider text-xs z-10">
            <Ticket size={16} className="text-emerald-600" />
            <span>10% Online Booking Discount Voucher</span>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md z-10 mb-4 border border-slate-200">
            <QRCodeSVG 
              value={token} 
              size={190}
              level="H"
              fgColor="#0F172A"
              bgColor="#FFFFFF"
            />
          </div>
          
          <p className="text-xs text-center font-sans text-slate-500 z-10 max-w-[220px]">
            Present this QR code to staff at the billing counter to claim your discount.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => setShowLookupModal(true)}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Search size={14} />
            <span>Look Up Another Booking</span>
          </button>

          <Link 
            href="/reserve"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors text-center"
          >
            Book Another Table
          </Link>
        </div>
      </div>

      {/* Modal for phone lookup fallback */}
      {showLookupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl"
          >
            <h3 className="font-bold text-slate-900 text-sm">Find Booking Pass</h3>
            <p className="text-xs text-slate-500">Enter your phone number to retrieve your confirmed QR voucher.</p>
            
            <form onSubmit={handlePhoneLookup} className="space-y-3">
              {lookupError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg font-medium">
                  {lookupError}
                </div>
              )}
              <input
                type="tel"
                required
                placeholder="Phone number e.g. 98765 43210"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLookupModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                >
                  {lookupLoading ? <RefreshCw className="animate-spin" size={12} /> : <Search size={12} />}
                  <span>Search</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function ReservationSuccessPage() {
  return (
    <div className="pt-28 pb-20 px-4 md:px-8 min-h-screen relative overflow-hidden flex items-center justify-center bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full z-10"
      >
        <Suspense fallback={<div className="text-center font-bold font-sans text-xs text-slate-500">Loading booking pass...</div>}>
          <SuccessContent />
        </Suspense>
      </motion.div>
    </div>
  );
}

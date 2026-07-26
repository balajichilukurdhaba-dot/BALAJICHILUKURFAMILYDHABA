"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (searchParams?.get('reason') === 'expired') {
      setNotice('Your 6-hour admin session has expired for security. Please sign in again.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email address and password.');
      setLoading(false);
      return;
    }

    try {
      // Strictly authenticate against Supabase Auth
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (supabaseError || !data?.session) {
        let msg = 'Invalid email or password.';
        if (supabaseError?.message?.toLowerCase().includes('invalid api key')) {
          msg = 'Invalid Supabase API Key: Please update NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file with the "anon" public key.';
        }
        setError(msg);
        setLoading(false);
        return;
      }

      // Successful login: persist 6-hour session cookie & localStorage
      if (typeof window !== 'undefined') {
        const now = Date.now().toString();
        document.cookie = "admin_logged_in=true; path=/; max-age=21600";
        document.cookie = `admin_login_time=${now}; path=/; max-age=21600`;
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_email', cleanEmail);
        localStorage.setItem('admin_login_time', now);
      }

      // Record snapshot asynchronously
      fetch('/api/cms/admin-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: cleanEmail })
      }).catch(() => {});

      window.location.href = '/admin';
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-slate-800 selection:text-white antialiased relative overflow-hidden">
      {/* Subtle Background Mesh Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 space-y-6 relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center p-2 shadow-sm">
            <img src="/bsd-logo.png" alt="Balaji Dhaba" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Admin Console</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to access management dashboard</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {notice && (
            <div className="p-3 bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs rounded-lg font-medium flex items-start gap-2">
              <Clock size={15} className="shrink-0 mt-0.5 text-amber-400" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                placeholder="admin@balajidhaba.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>256-Bit SSL Encrypted Admin Portal</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span className="text-xs">Loading Admin Console...</span>
      </div>
    }>
      <AdminLoginPageContent />
    </React.Suspense>
  );
}

"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <div className="p-8 text-center border-b border-brand-dark/10">
          <img src="/bsd-logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 drop-shadow-md" />
          <h2 className="font-display text-2xl font-bold text-brand-dark">Admin Portal</h2>
          <p className="text-brand-dark/60 font-sans text-sm mt-1">Sign in to manage your restaurant</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                placeholder="admin@restaurant.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-accent text-white font-bold uppercase tracking-widest rounded-xl shadow-[0_6px_0_0_#12301A] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#12301A] active:translate-y-[6px] active:shadow-[0_0px_0_0_#12301A] transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

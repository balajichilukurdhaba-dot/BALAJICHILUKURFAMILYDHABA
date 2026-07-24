"use client";
import React, { useState } from 'react';
import { Save, MapPin, Phone, Store, Percent, Plus, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { createBranch, updateBranch, deleteBranch, updateCampaignSettings } from './actions';
import { createClient } from '@/utils/supabase/client';

interface SettingsClientProps {
  branches: any[];
  websiteSettings: {
    bookingBadgeText: string;
    bookingBadgeActive: boolean;
    bookingBadgeColor: string;
  };
}

export default function SettingsClient({ branches, websiteSettings }: SettingsClientProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const supabase = createClient();

  const handleDeleteClick = (branchId: string, branchName: string) => {
    setDeleteTargetId(branchId);
    setDeleteTargetName(branchName);
    setAdminEmail('');
    setAdminPassword('');
    setConfirmError('');
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setConfirmError('Please fill in both email and password.');
      return;
    }
    setConfirmLoading(true);
    setConfirmError('');
    try {
      if (deleteTargetId) {
        await deleteBranch(deleteTargetId);
      }
      setConfirmModalOpen(false);
      setDeleteTargetId(null);
    } catch (err: any) {
      setConfirmError(err.message || 'An unexpected error occurred during verification.');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl font-sans">
      {/* Title */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/15 px-3 py-1 rounded-full border border-brand-accent/20">
          Core Config
        </span>
        <h1 className="text-3xl font-display font-black text-brand-dark mt-3">Settings & Branch CMS</h1>
        <p className="text-brand-dark/60 font-sans text-sm mt-1">Manage public branches, restaurant locations, phone lines, and campaign badges.</p>
      </div>

      {/* List & Edit Existing Branches */}
      <div className="space-y-6">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-accent ml-1">Active Restaurant Branches</h3>
        
        {branches.map((b, index) => (
          <div key={b.id} className="bg-white rounded-3xl border border-brand-gold/10 shadow-md overflow-hidden">
            <div className="p-6 md:p-8 border-b border-brand-dark/5 bg-[#FFFFFF]/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="text-brand-accent" size={20} />
                <div>
                  <h2 className="font-display font-bold text-base text-brand-dark">{b.name}</h2>
                  <p className="text-[10px] text-brand-dark/40 font-mono">ID: {b.id}</p>
                </div>
              </div>
              
              {/* Delete branch button (only if there is more than 1 branch) */}
              {branches.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleDeleteClick(b.id, b.name)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <form action={updateBranch} className="p-6 md:p-8 space-y-6 font-sans">
              <input type="hidden" name="id" value={b.id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/65 ml-1">
                    Branch Display Name
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/35" size={16} />
                    <input 
                      name="name"
                      type="text"
                      required
                      defaultValue={b.name}
                      className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/65 ml-1">
                    Support Line
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/35" size={16} />
                    <input 
                      name="phone"
                      type="text"
                      required
                      defaultValue={b.phone}
                      className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/65 ml-1">
                  Physical Location & Maps Coordinates
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-brand-dark/35" size={16} />
                  <textarea 
                    name="address"
                    required
                    defaultValue={b.address}
                    rows={3}
                    className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-brand-dark/5 flex justify-end">
                <button 
                  type="submit"
                  className="px-6 py-3.5 bg-brand-dark text-white font-bold uppercase tracking-widest rounded-xl hover:bg-brand-accent transition-colors flex items-center gap-2 text-[10px] shadow-sm"
                >
                  <Save size={14} />
                  <span>Update Branch Info</span>
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>

      {/* Add New Branch Card */}
      <div className="bg-white rounded-3xl border border-dashed border-brand-gold/40 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-brand-dark/5 bg-brand-gold/5 flex items-center gap-3">
          <Plus className="text-brand-accent" size={22} />
          <div>
            <h2 className="font-display font-bold text-lg text-brand-dark">Add New Restaurant Branch</h2>
            <p className="text-xs text-brand-dark/50 font-sans">Deploy an additional store location with its own metadata</p>
          </div>
        </div>

        <form action={createBranch} className="p-6 md:p-8 space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/65 ml-1">
                Branch Display Name
              </label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/35" size={16} />
                <input 
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Hitec Branch"
                  className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/65 ml-1">
                Support Line
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/35" size={16} />
                <input 
                  name="phone"
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/65 ml-1">
              Physical Location & Maps Coordinates
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-brand-dark/35" size={16} />
              <textarea 
                name="address"
                required
                placeholder="e.g. Plot No. 12, Phase II, Madhapur, Hyderabad, Telangana 500081"
                rows={3}
                className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 pl-12 pr-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-brand-dark/5 flex justify-end">
            <button 
              type="submit"
              className="px-8 py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 text-xs shadow-md shadow-brand-accent/15"
            >
              <Plus size={16} />
              <span>Create Restaurant Branch</span>
            </button>
          </div>
        </form>
      </div>

      {/* Card 3: Campaign Configuration */}
      <div className="bg-white rounded-3xl border border-brand-gold/10 shadow-md overflow-hidden">
        <div className="p-6 md:p-8 border-b border-brand-dark/5 bg-brand-gold/5 flex items-center gap-3">
          <Percent className="text-brand-gold" size={22} />
          <div>
            <h2 className="font-display font-bold text-lg text-brand-dark">Active Campaigns & Booking Badges</h2>
            <p className="text-xs text-brand-dark/50 font-sans">Customize the promotional badge text and styles shown on the reservation button.</p>
          </div>
        </div>
        
        <form action={updateCampaignSettings} className="p-6 md:p-8 space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 ml-1">
                Booking Badge Promo Text
              </label>
              <input 
                name="bookingBadgeText"
                type="text"
                defaultValue={websiteSettings.bookingBadgeText || 'Special Offer'}
                placeholder="e.g. Special Offer, Book & Save, 10% OFF"
                className="w-full bg-[#FFFFFF]/25 border border-brand-dark/10 rounded-xl py-3 px-4 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
              />
              <span className="text-[10px] text-brand-dark/40 block ml-1">Fallback is "Special Offer" if left empty.</span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 ml-1">
                Badge Color Hex Accent
              </label>
              <div className="flex gap-3 items-center">
                <input 
                  name="bookingBadgeColor"
                  type="color"
                  defaultValue={websiteSettings.bookingBadgeColor || '#1E4D2B'}
                  className="w-12 h-12 border border-brand-dark/10 rounded-xl cursor-pointer p-1 bg-white"
                />
                <input 
                  type="text"
                  value={websiteSettings.bookingBadgeColor || '#1E4D2B'}
                  readOnly
                  className="bg-zinc-50 border border-brand-dark/10 rounded-xl py-3 px-4 text-brand-dark font-mono text-xs w-28 text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-[#FAF6EE] p-4 rounded-2xl border border-brand-dark/5">
            <input 
              name="bookingBadgeActive"
              type="checkbox"
              id="bookingBadgeActive"
              defaultChecked={websiteSettings.bookingBadgeActive !== false}
              className="w-4 h-4 text-brand-accent border-brand-dark/10 rounded focus:ring-brand-accent accent-[#1E4D2B]"
            />
            <label htmlFor="bookingBadgeActive" className="text-xs font-bold uppercase tracking-wider text-brand-dark/80 cursor-pointer select-none">
              Display Booking Promotion Badge on Public Website
            </label>
          </div>

          <div className="pt-6 border-t border-brand-dark/5 flex justify-end">
            <button 
              type="submit"
              className="px-8 py-3.5 bg-brand-dark text-white font-bold uppercase tracking-widest rounded-xl hover:bg-brand-accent transition-colors flex items-center gap-2 text-xs shadow-md"
            >
              <Save size={16} />
              <span>Save Campaign Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Confirm Credentials Modal for Deleting Branch */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/45 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-brand-dark/5 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <ShieldAlert size={18} />
                <h3 className="font-display font-black text-lg text-[#1E4D2B]">Verify Admin Identity</h3>
              </div>
              <p className="text-xs text-brand-dark/65 leading-relaxed">
                Deleting a branch is a destructive operation. All reservations, tables, and offers associated with <span className="font-bold text-brand-dark">"{deleteTargetName}"</span> will be permanently deleted.
              </p>
              <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-wider">
                Please enter your credentials to authorize this action:
              </p>
            </div>

            {confirmError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-600 text-xs font-semibold flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{confirmError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Admin Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="admin@email.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-brand-dark/10 rounded-xl px-4 py-2.5 text-xs text-brand-dark font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Admin Password</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-brand-dark/10 rounded-xl px-4 py-2.5 text-xs text-brand-dark font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={confirmLoading}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmLoading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {confirmLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={12} />
                      <span>Delete Branch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import { Save, MapPin, Phone, Store, Percent, Trash2, ShieldAlert, Loader2, Settings } from 'lucide-react';
import { updateBranch, deleteBranch, updateCampaignSettings } from './actions';

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
    <div className="space-y-8 max-w-4xl font-sans text-slate-900 antialiased pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Settings size={13} className="text-slate-600" />
              Core Configuration
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings &amp; Branch Configuration
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage public restaurant locations, support contact lines, physical addresses, and booking promotion badges.
          </p>
        </div>
      </div>

      {/* List & Edit Existing Branches */}
      <div className="space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Active Restaurant Locations</h2>
        
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/60">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{b.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {b.id}</p>
                </div>
              </div>
              
              {/* Delete branch button (only if there is more than 1 branch) */}
              {branches.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleDeleteClick(b.id, b.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete Location</span>
                </button>
              )}
            </div>

            <form action={updateBranch} className="p-6 space-y-5">
              <input type="hidden" name="id" value={b.id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Branch Display Name
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input 
                      name="name"
                      type="text"
                      required
                      defaultValue={b.name}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Support Line Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input 
                      name="phone"
                      type="text"
                      required
                      defaultValue={b.phone}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Physical Address & Location Details
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  <textarea 
                    name="address"
                    required
                    defaultValue={b.address}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400 transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
                >
                  <Save size={14} />
                  <span>Update Location Info</span>
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>

      {/* Campaign & Badge Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/60">
            <Percent size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">Active Campaign &amp; Booking Badges</h2>
            <p className="text-xs text-slate-500">Customize the promotional badge text and accent color shown on the public site.</p>
          </div>
        </div>
        
        <form action={updateCampaignSettings} className="p-6 space-y-5 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Booking Badge Promo Text
              </label>
              <input 
                name="bookingBadgeText"
                type="text"
                defaultValue={websiteSettings.bookingBadgeText || 'Special Offer'}
                placeholder="e.g. Special Offer, Book & Save, 10% OFF"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
              />
              <span className="text-[11px] text-slate-400 block">Fallback is "Special Offer" if left empty.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Badge Accent Color
              </label>
              <div className="flex gap-3 items-center">
                <input 
                  name="bookingBadgeColor"
                  type="color"
                  defaultValue={websiteSettings.bookingBadgeColor || '#1E4D2B'}
                  className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer p-0.5 bg-white"
                />
                <input 
                  type="text"
                  value={websiteSettings.bookingBadgeColor || '#1E4D2B'}
                  readOnly
                  className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-mono text-xs w-28 text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <input 
              name="bookingBadgeActive"
              type="checkbox"
              id="bookingBadgeActive"
              defaultChecked={websiteSettings.bookingBadgeActive !== false}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 accent-slate-900"
            />
            <label htmlFor="bookingBadgeActive" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
              Display Booking Promotion Badge on Public Website
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Save size={14} />
              <span>Save Campaign Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Confirm Credentials Modal for Deleting Branch */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <ShieldAlert size={18} />
                <h3 className="font-bold text-base text-slate-900">Verify Administrator Identity</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deleting a location is a destructive operation. All reservations and offers associated with <span className="font-bold text-slate-900">"{deleteTargetName}"</span> will be permanently removed.
              </p>
            </div>

            {confirmError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{confirmError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Admin Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="admin@email.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Admin Password</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={confirmLoading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {confirmLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Confirm Delete</span>
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

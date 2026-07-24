"use client";
import React, { useState } from 'react';
import { 
  Database, Download, Upload, RefreshCw, Loader2, Sparkles, Check, 
  AlertTriangle, ShieldAlert, FileText
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';


export default function BackupCMS() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // File restore & modal states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  const handleConfirmCredentials = async (selectedTypes: string[]) => {
    setIsConfirmModalOpen(false);
    await handleExportBackup(selectedTypes);
  };

  const handleExportBackup = async (selectedTypes: string[]) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/cms/backup?types=${selectedTypes.join(',')}`);
      const data = await res.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data.payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `BSD_Database_Backup_${new Date().toISOString().slice(0,10)}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessMsg('Database snapshot exported successfully!');
      } else {
        setErrorMsg(data.error || 'Export failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error exporting backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;

    if (!confirm('WARNING: Restoring a database backup will overwrite existing dishes, categories, offers, and gallery photos! Proceed?')) {
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonText = event.target?.result as string;
          const payload = JSON.parse(jsonText);

          const res = await fetch('/api/cms/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restore', payload })
          });
          const data = await res.json();
          if (data.success) {
            setSuccessMsg('Database restored successfully from backup file!');
            setRestoreFile(null);
          } else {
            setErrorMsg(data.error || 'Restore operation failed');
          }
        } catch (err: any) {
          setErrorMsg('Invalid JSON format: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (err: any) {
      setErrorMsg('Error reading file: ' + err.message);
      setLoading(false);
    }
  };

  const handleTriggerSeeding = async () => {
    if (!confirm('Re-seed the database? This will restore the database to the initial 162 standard dishes and 35 gallery assets, resetting all modifications. Proceed?')) {
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/cms/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_reset' })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Database successfully seeded to factory default settings!');
      } else {
        setErrorMsg(data.error || 'Seed resetting failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error triggering database seeding');
    } finally {
      setLoading(false);
    }
  };

  const triggerSuccessToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl relative">
      {/* Professional Top Center Pop-up Notification (Auto dismisses in 2 secs) */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-[#1E4D2B] text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-4 min-w-[320px] max-w-xl backdrop-blur-md"
          >
            <div className="p-2.5 bg-emerald-500/25 text-emerald-400 rounded-xl border border-emerald-400/30">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Data Deleted Successfully
              </span>
              <span className="text-xs font-bold text-white/95 leading-tight mt-0.5">
                {successMsg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-brand-dark/5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <Database size={14} className="text-brand-gold animate-pulse" />
            System Maintenance
          </span>
          <h1 className="font-display text-3xl font-black text-brand-dark mt-2">
            Backups & Database Reset
          </h1>
          <p className="text-sm text-brand-dark/60 mt-1">
            Export entire database schemas, restore configuration from files, or re-run default seeders.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 animate-slideDown">
          <AlertTriangle size={18} className="text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Export / Seed Card */}
        <div className="bg-white p-8 rounded-3xl border border-brand-dark/5 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-lg text-brand-dark flex items-center gap-2">
              <Download size={18} className="text-brand-accent" />
              <span>Export & Default Seeding</span>
            </h3>
            <p className="text-xs text-brand-dark/50 mt-1">Export full snapshot or restore template to factory defaults.</p>
          </div>

          <div className="space-y-4">
            <div className="border border-brand-dark/5 bg-brand-bg rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-brand-dark block">Download DB Snapshot</span>
              <p className="text-[11px] text-brand-dark/65 leading-relaxed">
                Downloads a single, standalone JSON file containing all Categories, Dishes, Testimonials, Offers, Gallery Photos, Site Settings, and Audit Logs. Use this for server migrations.
              </p>
              
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-dark hover:bg-brand-dark/95 text-[#FFFFFF] font-bold uppercase tracking-wider text-xs rounded-xl shadow-md disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                <span>Download Database JSON Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload / Restore Card */}
        <div className="bg-white p-8 rounded-3xl border border-brand-dark/5 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-lg text-brand-dark flex items-center gap-2">
              <Upload size={18} className="text-brand-accent" />
              <span>Restore Database Snapshot</span>
            </h3>
            <p className="text-xs text-brand-dark/50 mt-1">Upload a JSON backup file to overwrite current configuration.</p>
          </div>

          <form onSubmit={handleRestoreBackup} className="space-y-4">
            <div className="border-2 border-dashed border-brand-dark/10 hover:border-brand-accent rounded-2xl p-8 text-center bg-brand-bg relative cursor-pointer">
              {restoreFile ? (
                <div className="space-y-2 flex flex-col items-center">
                  <Database className="text-brand-accent" size={32} />
                  <span className="text-xs font-bold text-brand-dark truncate max-w-[200px]">
                    {restoreFile.name}
                  </span>
                  <span className="text-[9px] text-brand-dark/45 font-mono">
                    Size: {(restoreFile.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setRestoreFile(null)}
                    className="text-[10px] text-red-500 underline font-semibold"
                  >
                    Select different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto text-brand-dark/35" size={32} />
                  <span className="block text-xs font-bold text-brand-dark/65">
                    Select JSON Backup File
                  </span>
                  <span className="block text-[9px] text-brand-dark/45">
                    Only .json files generated from this CMS portal are supported.
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    required
                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !restoreFile}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-brand-accent/20 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
              <span>Restore Backup Snapshot</span>
            </button>
          </form>
        </div>

      </div>

      {/* Danger Zone: Data Privacy & Permanent Purge */}
      <div className="bg-red-50/60 border border-red-200/80 rounded-3xl p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-red-700">
          <ShieldAlert size={24} className="text-red-600 animate-pulse" />
          <div>
            <h3 className="font-display font-black text-lg text-red-900">
              Data Privacy & Permanent Deletion
            </h3>
            <p className="text-xs text-red-700/80 mt-0.5">
              Permanently wipe sensitive records (Bookings, WhatsApp Orders, Audit Logs) to preserve storage and user privacy.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-red-200/60">
          <div className="text-xs text-red-950 font-medium">
            🔒 High Privacy Notice: Deleting records is permanent. You will be prompted to enter your <strong className="font-bold">Admin ID and Password</strong> to confirm identity.
          </div>
          <button
            onClick={() => setIsPurgeModalOpen(true)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-w-[220px]"
          >
            <AlertTriangle size={15} />
            <span>Purge Data Options</span>
          </button>
        </div>
      </div>

      {/* Admin confirm credentials modal before downloading */}
      <AdminConfirmCredentialsModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmCredentials}
        title="Confirm Credentials"
        message="Please verify your administrator credentials to download the database backup snapshot."
      />

      {/* High Privacy Data Purge Verification Modal */}
      <AdminPurgeModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onSuccess={(msg) => {
          setIsPurgeModalOpen(false);
          triggerSuccessToast(msg);
        }}
      />
    </div>
  );
}

interface AdminConfirmCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedTypes: string[]) => Promise<void>;
  title?: string;
  message?: string;
}

function AdminConfirmCredentialsModal({ isOpen, onClose, onConfirm, title, message }: AdminConfirmCredentialsModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  if (!isOpen) return null;

  const dataOptions = [
    { key: 'orders', label: 'WhatsApp Orders' },
    { key: 'reservations', label: 'Reservations' },
    { key: 'menu', label: 'Menu CMS' },
    { key: 'reviews', label: 'Reviews CMS' },
    { key: 'offers', label: 'Offers CMS' },
    { key: 'gallery', label: 'Gallery CMS' },
    { key: 'messages', label: 'Customer Inbox' },
    { key: 'settings', label: 'Site Settings' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setError("Please select at least one dataset to export.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError("Invalid administrator credentials. Download denied.");
        setLoading(false);
        return;
      }

      await onConfirm(selectedTypes);
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/45 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-brand-dark/5 space-y-4">
        <div>
          <h3 className="font-display font-black text-lg text-[#1E4D2B]">{title}</h3>
          <p className="text-xs text-brand-dark/65 mt-1 leading-relaxed">{message}</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Datasets Selection Checks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50">
                Select Data to Export
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedTypes.length === dataOptions.length) {
                    setSelectedTypes([]);
                  } else {
                    setSelectedTypes(dataOptions.map(o => o.key));
                  }
                }}
                className="text-[9px] text-[#1E4D2B] hover:underline font-bold uppercase tracking-wider"
              >
                {selectedTypes.length === dataOptions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 border border-brand-dark/10 rounded-2xl p-4 bg-brand-bg/50">
              {dataOptions.map(opt => {
                const isChecked = selectedTypes.includes(opt.key);
                return (
                  <label key={opt.key} className="flex items-center gap-2 text-xs font-semibold text-brand-dark cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedTypes(prev => prev.filter(t => t !== opt.key));
                        } else {
                          setSelectedTypes(prev => [...prev, opt.key]);
                        }
                      }}
                      className="rounded border-zinc-300 text-[#1E4D2B] focus:ring-[#1E4D2B] h-3.5 w-3.5"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-accent transition-colors text-zinc-800"
              placeholder="admin@example.com"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Admin Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-accent transition-colors text-zinc-800"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-brand-dark/10 hover:bg-brand-dark/5 text-brand-dark text-[11px] font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedTypes.length === 0}
              className="px-4 py-2 rounded-lg bg-[#1E4D2B] hover:bg-[#1E4D2B]/90 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 justify-center min-w-[110px] disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Download"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AdminPurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function AdminPurgeModal({ isOpen, onClose, onSuccess }: AdminPurgeModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['reservations', 'orders', 'audits']);
  const [timelines, setTimelines] = useState<Record<string, { range: string; beforeDate: string }>>({
    reservations: { range: 'all', beforeDate: '' },
    orders: { range: 'all', beforeDate: '' },
    messages: { range: 'all', beforeDate: '' },
    audits: { range: 'all', beforeDate: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const purgeOptions = [
    { key: 'reservations', label: 'Bookings & Table Reservations' },
    { key: 'orders', label: 'WhatsApp Customer Orders' },
    { key: 'messages', label: 'Customer Inbox & Contact Messages' },
    { key: 'audits', label: 'Audit Trail Logs & Admin Sessions' },
  ];

  const timelineRanges = [
    { key: 'all', label: 'ALL TIME (Delete Everything)' },
    { key: 'older_7', label: 'Older than 7 Days' },
    { key: 'older_30', label: 'Older than 30 Days (1 Month)' },
    { key: 'older_90', label: 'Older than 90 Days (3 Months)' },
    { key: 'older_180', label: 'Older than 180 Days (6 Months)' },
    { key: 'custom', label: 'Custom Cutoff Date' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setError('Please select at least one category to purge.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cms/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          dataTypes: selectedTypes,
          timelines
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || 'Selected records permanently purged from database.');
        setEmail('');
        setPassword('');
      } else {
        setError(data.error || 'Authentication or deletion failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during purge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-200 space-y-4 my-8">
        <div className="flex items-center gap-3 border-b border-red-100 pb-3">
          <div className="p-2 bg-red-100 text-red-700 rounded-xl">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-red-900">Privacy & Timeline Data Purge</h3>
            <p className="text-xs text-red-700/80">Select timeline per category to permanently wipe records</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {/* Category & Timeline Selection */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-red-900/80">
              1. Select Categories and Timeline / Date Range
            </label>
            <div className="space-y-3 border border-red-100 rounded-2xl p-4 bg-red-50/30">
              {purgeOptions.map(opt => {
                const isChecked = selectedTypes.includes(opt.key);
                const categoryTimeline = timelines[opt.key] || { range: 'all', beforeDate: '' };

                return (
                  <div key={opt.key} className="p-3 bg-white border border-red-100 rounded-xl space-y-2 shadow-sm">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-red-950 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedTypes(prev => prev.filter(t => t !== opt.key));
                          } else {
                            setSelectedTypes(prev => [...prev, opt.key]);
                          }
                        }}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>

                    {isChecked && (
                      <div className="pl-6 pt-1 space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/50">Timeline:</span>
                          <select
                            value={categoryTimeline.range}
                            onChange={(e) => {
                              const newRange = e.target.value;
                              setTimelines(prev => ({
                                ...prev,
                                [opt.key]: { ...prev[opt.key], range: newRange }
                              }));
                            }}
                            className="bg-brand-bg border border-brand-dark/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-dark focus:outline-none focus:border-red-500"
                          >
                            {timelineRanges.map(tr => (
                              <option key={tr.key} value={tr.key}>{tr.label}</option>
                            ))}
                          </select>
                        </div>

                        {categoryTimeline.range === 'custom' && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/50">Before Date:</span>
                            <input
                              type="date"
                              required
                              value={categoryTimeline.beforeDate}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                setTimelines(prev => ({
                                  ...prev,
                                  [opt.key]: { ...prev[opt.key], beforeDate: newDate }
                                }));
                              }}
                              className="bg-brand-bg border border-brand-dark/15 rounded-lg px-2 py-1 text-xs text-brand-dark focus:outline-none focus:border-red-500"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Credentials */}
          <div className="space-y-3 pt-1 border-t border-brand-dark/5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/70">
              2. Privacy Verification (Enter Admin Credentials)
            </label>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Admin ID / Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-red-500 transition-colors text-zinc-800"
                placeholder="admin@restaurant.com"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Admin Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-red-500 transition-colors text-zinc-800"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-brand-dark/5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-brand-dark/10 hover:bg-brand-dark/5 text-brand-dark text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedTypes.length === 0}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <AlertTriangle size={14} />}
              <span>{loading ? "Deleting Records..." : "Delete Timeline Records"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


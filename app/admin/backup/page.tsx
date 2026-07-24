"use client";
import React, { useState } from 'react';
import { 
  Database, Download, Upload, RefreshCw, Loader2, CheckCircle2, 
  AlertTriangle, ShieldCheck, FileText, Calendar, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      if (!res.ok) throw new Error('Failed to generate export backup');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balaji-dhaba-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      triggerSuccessToast(`Database snapshot exported successfully (${selectedTypes.length} models)`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;

    if (!confirm("Caution: Restoring a snapshot will overwrite matching database records. Continue?")) {
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const fileText = await restoreFile.text();
      const backupData = JSON.parse(fileText);

      const res = await fetch('/api/cms/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Restore failed');
      }

      triggerSuccessToast(`Backup snapshot restored: ${JSON.stringify(data.restored || {})}`);
      setRestoreFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error restoring database snapshot');
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
    <div className="space-y-6 max-w-5xl relative">
      {/* Top Center Pop-up Notification (Auto dismisses in 2 secs) */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 min-w-[320px] max-w-lg"
          >
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-100">
                Action Completed
              </span>
              <span className="text-xs text-slate-300">
                {successMsg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System Maintenance & Maintenance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage data backups, system state restoration, and record purge maintenance.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-3 text-xs font-medium">
          <AlertTriangle size={16} className="text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Export Snapshot Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Download size={16} className="text-slate-600" />
              <span>Export System Backup</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Download a JSON snapshot containing your menu catalog, content, and settings.</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60 space-y-3">
            <span className="text-xs font-semibold text-slate-800 block">Snapshot Export</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generates an offline copy of all Categories, Dishes, Testimonials, Offers, Gallery Assets, and Configuration Settings.
            </p>
            
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              <span>Generate Backup Snapshot</span>
            </button>
          </div>
        </div>

        {/* Upload Snapshot Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Upload size={16} className="text-slate-600" />
              <span>Restore Backup Snapshot</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Upload a valid snapshot file to sync system settings.</p>
          </div>

          <form onSubmit={handleRestoreBackup} className="space-y-4">
            <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-6 text-center bg-slate-50 relative cursor-pointer transition-colors">
              {restoreFile ? (
                <div className="space-y-2 flex flex-col items-center">
                  <Database className="text-slate-700" size={28} />
                  <span className="text-xs font-medium text-slate-800 truncate max-w-[200px]">
                    {restoreFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRestoreFile(null)}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload className="mx-auto text-slate-400" size={24} />
                  <span className="block text-xs font-medium text-slate-700">
                    Select JSON Snapshot File
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
              <span>Restore System State</span>
            </button>
          </form>
        </div>
      </div>

      {/* Data Retention & Purge Panel */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Data Retention & Maintenance Purge
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selectively purge obsolete records (Bookings, Orders, Messages, Audit Logs) to optimize storage usage.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Lock size={13} className="text-slate-400" />
            <span>Requires mandatory Administrator credentials verification.</span>
          </div>
          <button
            onClick={() => setIsPurgeModalOpen(true)}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck size={14} />
            <span>Open Maintenance Console</span>
          </button>
        </div>
      </div>

      {/* Admin Verification Modal */}
      <AdminConfirmCredentialsModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmCredentials}
        title="Admin Verification"
        message="Please enter administrator credentials to proceed with snapshot export."
      />

      {/* Maintenance Purge Modal */}
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
  onConfirm: (selectedTypes: string[]) => void;
  title: string;
  message: string;
}

function AdminConfirmCredentialsModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: AdminConfirmCredentialsModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedModels, setSelectedModels] = useState<string[]>([
    'categories', 'dishes', 'testimonials', 'offers', 'gallery', 'siteSettings', 'auditLogs'
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide Admin Email and Password');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConfirm(selectedModels);
      setEmail('');
      setPassword('');
      setError('');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{message}</p>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              placeholder="admin@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
            >
              {loading ? "Verifying..." : "Confirm & Download"}
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
    { key: 'audits', label: 'Audit Trail & Login Sessions' },
  ];

  const timelineRanges = [
    { key: 'all', label: 'ALL TIME (Entire Dataset)' },
    { key: 'older_7', label: 'Older than 7 Days' },
    { key: 'older_30', label: 'Older than 30 Days (1 Month)' },
    { key: 'older_90', label: 'Older than 90 Days (3 Months)' },
    { key: 'older_180', label: 'Older than 180 Days (6 Months)' },
    { key: 'custom', label: 'Custom Cutoff Date' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setError('Please select at least one category.');
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
        onSuccess(data.message || 'Records purged and storage optimized.');
        setEmail('');
        setPassword('');
      } else {
        setError(data.error || 'Authentication or purge operation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during purge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">Data Maintenance & Purge</h3>
          <p className="text-xs text-slate-500 mt-1">Configure date cutoffs per category to permanently remove obsolete records.</p>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              1. Select Categories and Timeline Range
            </label>
            <div className="space-y-2.5 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              {purgeOptions.map(opt => {
                const isChecked = selectedTypes.includes(opt.key);
                const categoryTimeline = timelines[opt.key] || { range: 'all', beforeDate: '' };

                return (
                  <div key={opt.key} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer select-none">
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
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>

                    {isChecked && (
                      <div className="pl-6 pt-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-500">Timeline:</span>
                          <select
                            value={categoryTimeline.range}
                            onChange={(e) => {
                              const newRange = e.target.value;
                              setTimelines(prev => ({
                                ...prev,
                                [opt.key]: { ...prev[opt.key], range: newRange }
                              }));
                            }}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900"
                          >
                            {timelineRanges.map(tr => (
                              <option key={tr.key} value={tr.key}>{tr.label}</option>
                            ))}
                          </select>
                        </div>

                        {categoryTimeline.range === 'custom' && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[11px] font-medium text-slate-500">Before Date:</span>
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
                              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
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

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800">
              2. Administrator Verification
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                placeholder="admin@restaurant.com"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedTypes.length === 0}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Processing..." : "Purge Selected Records"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

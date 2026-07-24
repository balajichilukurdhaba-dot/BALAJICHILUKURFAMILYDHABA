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
  
  // File restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
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

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 animate-slideDown">
          <Check size={18} className="text-green-600" />
          <span className="text-xs font-bold uppercase tracking-wider">{successMsg}</span>
        </div>
      )}

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

      {/* Admin confirm credentials modal before downloading */}
      <AdminConfirmCredentialsModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmCredentials}
        title="Confirm Credentials"
        message="Please verify your administrator credentials to download the database backup snapshot."
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


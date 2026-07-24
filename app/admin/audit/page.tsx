"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldAlert, Search, RefreshCw, Loader2, FileText, Calendar,
  UserCheck, MapPin, Monitor, Clock, X
} from 'lucide-react';

// Helper: get local YYYY-MM-DD string offset by daysAgo from today
function getLocalDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

// Helper: get local YYYY-MM-DD string from a Date or ISO string
function getLocalDateStrFromDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}


export default function AuditLogsCMS() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFilter, setActionFilter] = useState('All');
  const [loginSessions, setLoginSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const calendarInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr(0));
  const [todayValue, setTodayValue] = useState<string>(() => getLocalDateStr(0));

  const loginCalendarInputRef = useRef<HTMLInputElement>(null);
  const [selectedLoginDate, setSelectedLoginDate] = useState<string>(() => getLocalDateStr(0));

  // 60-day scrollable date strip
  const recentDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(todayValue + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      const value = local.toISOString().split('T')[0];
      let label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      days.push({ label, value });
    }
    return days;
  }, [todayValue]);

  // Midnight date-roll detection (check every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const newToday = getLocalDateStr(0);
      if (newToday !== todayValue) {
        setTodayValue(newToday);
        setSelectedDate(prev => prev === todayValue ? newToday : prev);
        setSelectedLoginDate(prev => prev === todayValue ? newToday : prev);
        // Refresh immediately on date roll
        loadLogs(true);
        loadLoginSessions();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [todayValue]);

  // Initial load & Auto-refresh from DB every 60s
  useEffect(() => {
    loadLogs();
    loadLoginSessions();

    const interval = setInterval(() => {
      loadLogs(true);
      loadLoginSessions();
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  async function loadLoginSessions() {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/cms/admin-logins?limit=50');
      const data = await res.json();
      if (data.success) setLoginSessions(data.sessions || []);
    } catch (e) {
      console.error('Failed to load login sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  }

  const filteredSessions = useMemo(() => {
    return loginSessions.filter(s => {
      if (selectedLoginDate) {
        const sessionDateStr = getLocalDateStrFromDate(s.loginAt);
        return sessionDateStr === selectedLoginDate;
      }
      return true;
    });
  }, [loginSessions, selectedLoginDate]);

  async function loadLogs(isRefreshing = false) {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/cms/audit');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch audit trail logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const filteredLogs = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return logs.filter(log => {
      const matchesSearch = !query || 
        log.userEmail.toLowerCase().includes(query) ||
        (log.details && log.details.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query));
      
      const matchesAction = actionFilter === 'All' || log.action === actionFilter;

      let matchesDate = true;
      if (selectedDate) {
        const logDateStr = getLocalDateStrFromDate(log.createdAt);
        matchesDate = logDateStr === selectedDate;
      }

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [logs, debouncedSearch, actionFilter, selectedDate]);

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach(log => {
      if (log.action) actions.add(log.action);
    });
    return ['All', ...Array.from(actions)];
  }, [logs]);

  const getActionTagStyle = (action: string) => {
    const a = (action || '').toUpperCase();
    if (a.includes('DELETE') || a.includes('REMOVE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (a.includes('ADD') || a.includes('CREATE') || a.includes('IMPORT')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('REORDER') || a.includes('TOGGLE')) {
      return 'bg-brand-bg text-brand-accent border-brand-accent/20';
    }
    return 'bg-brand-bg text-brand-dark/75 border-brand-dark/15';
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <ShieldAlert size={12} className="text-brand-accent" />
            Security &amp; Compliance
          </span>
          <h1 className="font-display text-2xl font-black text-brand-dark mt-2">
            Audit Trail Logs
          </h1>
          <p className="text-xs text-brand-dark/65 mt-1">
            Review security-audited operations: who added dishes, exported databases, or modified site templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-admin-snapshot'))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2E2B] text-white hover:bg-[#382220] text-[10px] font-bold uppercase transition-all shadow-sm"
          >
            <UserCheck size={12} className="text-[#D35400]" />
            <span>Verify Login Photo</span>
          </button>

          <button
            onClick={() => loadLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-dark/15 hover:border-brand-accent text-brand-dark hover:text-brand-accent text-[10px] font-bold uppercase transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin text-brand-accent' : 'text-brand-accent'} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Date Filter Strip */}
      <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm p-5 space-y-4">
        {/* Strip header */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#1E4D2B]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1E4D2B]/60">Filter by Date — scroll for older dates</span>
          <div className="ml-auto flex items-center gap-2">
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1E4D2B] hover:underline"
              >
                <X size={9} /> Clear
              </button>
            )}
            {/* Calendar picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => calendarInputRef.current?.showPicker()}
                className={`res-date-card-base flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wide ${
                  selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                    ? 'res-date-card-active bg-[#1E4D2B] border-[#1E4D2B] text-white shadow-md'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <Calendar size={11} />
                {selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Pick Date'
                }
              </button>
              <input
                ref={calendarInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute opacity-0 pointer-events-none w-0 h-0 top-0 left-0"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Scrollable date cards */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 pt-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes resCardPop {
              0%   { transform: scale(0.88); opacity: 0.4; }
              60%  { transform: scale(1.10); }
              100% { transform: scale(1.06); opacity: 1; }
            }
            @keyframes resTodayPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(211,84,0,0.0); }
              50%       { box-shadow: 0 0 0 5px rgba(211,84,0,0.18); }
            }
            @keyframes resActiveGlow {
              0%, 100% { box-shadow: 0 4px 18px rgba(74,46,43,0.22); }
              50%       { box-shadow: 0 4px 24px rgba(74,46,43,0.38); }
            }
            .res-date-card-active  { animation: resCardPop 0.28s cubic-bezier(.34,1.56,.64,1) forwards, resActiveGlow 2.4s ease-in-out 0.3s infinite; }
            .res-date-card-today   { animation: resTodayPulse 2.6s ease-in-out infinite; }
            .res-date-card-base    { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
            .res-date-card-base:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
            .res-date-card-base:active { transform: scale(0.94); }
          `}} />

          {/* View All card */}
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className={`res-date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
              selectedDate === ''
                ? 'res-date-card-active bg-[#1E4D2B] border-[#1E4D2B] text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-wide ${selectedDate === '' ? 'text-white/60' : 'text-zinc-400'}`}>View</span>
            <span className="text-[13px] font-black mt-0.5 leading-none">All</span>
          </button>

          {/* Recent 60-day date cards */}
          {recentDays.map((day) => {
            const isActive = selectedDate === day.value;
            const dateObj = new Date(day.value + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-IN', { month: 'short' });
            const isToday = day.label === 'Today';
            const isYesterday = day.label === 'Yesterday';
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDate(isActive ? '' : day.value)}
                className={`res-date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
                  isActive
                    ? 'res-date-card-active bg-[#1E4D2B] border-[#1E4D2B] text-white'
                    : isToday
                    ? 'res-date-card-today bg-[#1E4D2B]/5 border-[#1E4D2B]/30 text-[#1E4D2B]'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
                  isActive ? 'text-white/60' : isToday ? 'text-[#1E4D2B]' : 'text-zinc-400'
                }`}>
                  {isToday ? 'Today' : isYesterday ? 'Yest.' : dayName}
                </span>
                <span className="text-base font-black leading-tight mt-0.5">{dayNum}</span>
                <span className={`text-[9px] font-bold leading-none ${isActive ? 'text-white/50' : 'text-zinc-400'}`}>{monthName}</span>
              </button>
            );
          })}
        </div>

        {/* Filter summary */}
        <div className="flex items-center justify-between border-t border-brand-dark/5 pt-3 text-[10px] font-semibold text-brand-dark/50">
          <div>
            {selectedDate
              ? <><span className="text-brand-dark font-black">{filteredLogs.length}</span> logs for <span className="text-brand-dark font-black">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></>
              : <>Showing <span className="text-brand-dark font-black">{filteredLogs.length}</span> of <span className="text-brand-dark font-black">{logs.length}</span> total logs (all dates)</>
            }
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-dark/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 flex items-center bg-brand-bg/30 border border-brand-dark/10 rounded-xl px-3 py-2">
          <Search className="text-brand-dark/45 mr-2" size={14} />
          <input
            type="text"
            placeholder="Search by admin email or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-brand-dark focus:outline-none placeholder-brand-dark/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-brand-dark/50">Action Filter:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-brand-bg/30 border border-brand-dark/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-brand-dark"
          >
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-brand-dark/10 shadow-sm">
          <Loader2 className="animate-spin text-brand-accent mb-4" size={48} />
          <p className="font-display text-base font-bold text-brand-dark">Loading compliance trail...</p>
        </div>
      ) : (
        /* Compliance Logs Table */
        <div className="bg-white rounded-xl overflow-hidden border border-brand-dark/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-brand-dark text-[#FFFFFF] font-display font-bold uppercase tracking-wider border-b border-brand-dark/15">
                  <th className="p-4 pl-6 text-[10px]">Admin User</th>
                  <th className="p-4 text-[10px]">Action</th>
                  <th className="p-4 text-[10px]">Detailed Description</th>
                  <th className="p-4 text-[10px]">IP Address</th>
                  <th className="p-4 pr-6 text-[10px]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5 text-brand-dark/85">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-brand-dark/50 font-medium">
                      No security audit records match your query.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-bg/25 transition-colors">
                      <td className="p-4 pl-6 font-bold truncate max-w-[180px]">{log.userEmail}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getActionTagStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 leading-relaxed">
                        {log.details && log.details.trim() ? log.details : <span className="text-brand-dark/45 italic">— System Modified</span>}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-brand-dark/50">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="p-4 pr-6 font-mono text-[10px] whitespace-nowrap text-brand-dark/50">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Admin Login History Section ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent flex items-center gap-2">
              <UserCheck size={12} className="text-brand-accent" />
              Access Control
            </span>
            <h2 className="font-display text-xl font-black text-brand-dark mt-1">Admin Login History</h2>
            <p className="text-xs text-brand-dark/60 mt-0.5">Date-wise record of every admin login with photo, location, and device information.</p>
          </div>
          <button
            onClick={() => { setLoadingSessions(true); loadLoginSessions(); }}
            disabled={loadingSessions}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-dark/15 hover:border-brand-accent text-brand-dark hover:text-brand-accent text-[10px] font-bold uppercase transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={12} className={loadingSessions ? 'animate-spin text-brand-accent' : 'text-brand-accent'} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Date Filter Strip for Logins */}
        <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm p-5 space-y-4">
          {/* Strip header */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#1E4D2B]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1E4D2B]/60">Filter by Date — scroll for older dates</span>
            <div className="ml-auto flex items-center gap-2">
              {selectedLoginDate && (
                <button
                  onClick={() => setSelectedLoginDate('')}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1E4D2B] hover:underline"
                >
                  <X size={9} /> Clear
                </button>
              )}
              {/* Calendar picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => loginCalendarInputRef.current?.showPicker()}
                  className={`res-date-card-base flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wide ${
                    selectedLoginDate && recentDays.every(rd => rd.value !== selectedLoginDate)
                      ? 'res-date-card-active bg-[#1E4D2B] border-[#1E4D2B] text-white shadow-md'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-400'
                  }`}
                >
                  <Calendar size={11} />
                  {selectedLoginDate && recentDays.every(rd => rd.value !== selectedLoginDate)
                    ? new Date(selectedLoginDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Pick Date'
                  }
                </button>
                <input
                  ref={loginCalendarInputRef}
                  type="date"
                  value={selectedLoginDate}
                  onChange={(e) => setSelectedLoginDate(e.target.value)}
                  className="absolute opacity-0 pointer-events-none w-0 h-0 top-0 left-0"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Scrollable date cards */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 pt-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {/* View All card */}
            <button
              type="button"
              onClick={() => setSelectedLoginDate('')}
              className={`res-date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
                selectedLoginDate === ''
                  ? 'res-date-card-active bg-[#1E4D2B] border-[#1E4D2B] text-white'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-wide ${selectedLoginDate === '' ? 'text-white/60' : 'text-zinc-400'}`}>View</span>
              <span className="text-[13px] font-black mt-0.5 leading-none">All</span>
            </button>

            {/* Recent 60-day date cards */}
            {recentDays.map((day) => {
              const isActive = selectedLoginDate === day.value;
              const dateObj = new Date(day.value + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              const monthName = dateObj.toLocaleDateString('en-IN', { month: 'short' });
              const isToday = day.label === 'Today';
              const isYesterday = day.label === 'Yesterday';
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedLoginDate(isActive ? '' : day.value)}
                  className={`res-date-card-base flex-shrink-0 flex flex-col items-center justify-center w-[50px] h-[60px] rounded-xl border-2 ${
                    isActive
                      ? 'res-date-card-active bg-[#1E4D2B] border-[#1E4D2B] text-white'
                      : isToday
                      ? 'res-date-card-today bg-[#1E4D2B]/5 border-[#1E4D2B]/30 text-[#1E4D2B]'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
                    isActive ? 'text-white/60' : isToday ? 'text-[#1E4D2B]' : 'text-zinc-400'
                  }`}>
                    {isToday ? 'Today' : isYesterday ? 'Yest.' : dayName}
                  </span>
                  <span className="text-base font-black leading-tight mt-0.5">{dayNum}</span>
                  <span className={`text-[9px] font-bold leading-none ${isActive ? 'text-white/50' : 'text-zinc-400'}`}>{monthName}</span>
                </button>
              );
            })}
          </div>

          {/* Filter summary */}
          <div className="flex items-center justify-between border-t border-brand-dark/5 pt-3 text-[10px] font-semibold text-brand-dark/50">
            <div>
              {selectedLoginDate
                ? <><span className="text-brand-dark font-black">{filteredSessions.length}</span> login records for <span className="text-brand-dark font-black">{new Date(selectedLoginDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></>
                : <>Showing <span className="text-brand-dark font-black">{filteredSessions.length}</span> of <span className="text-brand-dark font-black">{loginSessions.length}</span> total logins (all dates)</>
              }
            </div>
          </div>
        </div>

        {loadingSessions ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-brand-dark/10 shadow-sm">
            <Loader2 className="animate-spin text-brand-accent mb-3" size={32} />
            <p className="text-sm font-semibold text-brand-dark/60">Loading login history...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-brand-dark/10 shadow-sm text-brand-dark/40">
            <UserCheck size={40} className="mb-2 text-brand-dark/20" />
            <p className="text-sm font-semibold">No login records found for this date</p>
            <p className="text-xs mt-1">Try selecting another date or click "View All".</p>
          </div>
        ) : (
          <LoginHistoryCards sessions={filteredSessions} />
        )}
      </div>
    </div>
  );
}

// Groups sessions by calendar date and renders them as cards
function LoginHistoryCards({ sessions }: { sessions: any[] }) {
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    sessions.forEach(s => {
      const dateKey = new Date(s.loginAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return map;
  }, [sessions]);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, daySessions]) => (
        <div key={date} className="space-y-3">
          {/* Date divider */}
          <div className="flex items-center gap-3">
            <Calendar size={12} className="text-brand-accent" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-accent">{date}</span>
            <span className="text-[9px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold">
              {daySessions.length} login{daySessions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 border-t border-brand-dark/10" />
          </div>

          {/* Session cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {daySessions.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm p-4 hover:shadow-md transition-shadow space-y-3">
                {/* Header: Admin Email + Verified Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-brand-dark/5 pb-2.5">
                  <div>
                    <p className="font-bold text-xs text-brand-dark truncate">{s.adminEmail}</p>
                    <span className="text-[9px] text-brand-dark/45 font-mono">ID: {s.id.slice(0, 8)}...</span>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                    <UserCheck size={10} /> Verified
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-[11px] text-brand-dark/70">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2 bg-brand-bg/20 p-2 rounded-xl border border-brand-dark/5">
                    <Clock size={12} className="text-brand-accent shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-brand-dark/50">Date &amp; Time</span>
                      <span className="font-mono text-brand-dark font-semibold">
                        {new Date(s.loginAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Location & Altitude */}
                  <div className="flex items-start gap-2 bg-brand-bg/20 p-2 rounded-xl border border-brand-dark/5">
                    <MapPin size={12} className="text-brand-accent shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] uppercase font-bold text-brand-dark/50">Coordinates &amp; Altitude</span>
                      {s.latitude && s.longitude ? (
                        <a
                          href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-accent hover:underline font-mono text-[10px] font-bold truncate"
                        >
                          Lat: {parseFloat(s.latitude).toFixed(4)}°, Lng: {parseFloat(s.longitude).toFixed(4)}°
                          {s.altitude != null ? ` • Alt: ${parseFloat(s.altitude).toFixed(1)}m` : ''} ↗
                        </a>
                      ) : (
                        <span className="text-brand-dark/40 font-mono text-[10px] italic">Location not captured</span>
                      )}
                    </div>
                  </div>

                  {/* IP Address & Device */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                      <span className="text-[8px] uppercase font-bold text-zinc-400 block">IP Address</span>
                      <span className="font-mono text-[10px] font-bold text-zinc-800 truncate block">{s.ipAddress || '127.0.0.1'}</span>
                    </div>
                    <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                      <span className="text-[8px] uppercase font-bold text-zinc-400 block">Device</span>
                      <span className="font-sans text-[10px] font-semibold text-zinc-800 truncate block" title={s.userAgent || ''}>
                        {s.userAgent ? formatDevice(s.userAgent) : 'Browser'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Format raw User-Agent to clean browser and OS string
function formatDevice(uaString: string): string {
  if (!uaString) return 'Unknown Device';
  
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  
  const ua = uaString.toLowerCase();
  
  // Detect OS
  if (ua.includes('windows phone')) os = 'Windows Phone';
  else if (ua.includes('win') || ua.includes('windows nt')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x') || ua.includes('mac_powerpc')) os = 'macOS';
  else if (ua.includes('iphone') || ua.includes('ipod')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  
  // Detect Browser
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('trident') || ua.includes('msie')) browser = 'Internet Explorer';
  
  return `${os} (${browser})`;
}

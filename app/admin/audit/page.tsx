"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, Search, RefreshCw, Loader2, Calendar,
  UserCheck, MapPin, Clock, X, Globe, Laptop, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getLocalDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const calendarInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [todayValue, setTodayValue] = useState<string>(() => getLocalDateStr(0));

  const loginCalendarInputRef = useRef<HTMLInputElement>(null);
  const [selectedLoginDate, setSelectedLoginDate] = useState<string>('');

  const recentDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 45; i++) {
      const d = new Date(todayValue + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      const value = local.toISOString().split('T')[0];
      let label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      days.push({ label, value });
    }
    return days;
  }, [todayValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newToday = getLocalDateStr(0);
      if (newToday !== todayValue) {
        setTodayValue(newToday);
        setSelectedDate(prev => prev === todayValue ? newToday : prev);
        setSelectedLoginDate(prev => prev === todayValue ? newToday : prev);
        loadLogs(true);
        loadLoginSessions();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [todayValue]);

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
    }, 200);
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

  const getActionBadge = (action: string) => {
    const a = (action || '').toUpperCase();
    if (a.includes('PURGE') || a.includes('DELETE') || a.includes('REMOVE')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {action}
        </span>
      );
    }
    if (a.includes('ADD') || a.includes('CREATE') || a.includes('EXPORT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {action}
        </span>
      );
    }
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('TOGGLE')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans antialiased text-slate-900 pb-12">
      {/* Enterprise Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck size={13} className="text-slate-600" />
              Security &amp; Compliance
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System Audit Logs
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Immutable audit trail of administrator activities, database modifications, and login access events.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-admin-snapshot'))}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <UserCheck size={14} className="text-emerald-400" />
            <span>Verify Login Photo</span>
          </button>

          <button
            onClick={() => loadLogs(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-slate-600' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Calendar size={15} className="text-slate-500" />
            <span>Filter by Date</span>
            {selectedDate && (
              <span className="text-[11px] text-slate-400 font-normal">
                ({filteredLogs.length} events)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <X size={12} />
                <span>Show All Dates</span>
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => calendarInputRef.current?.showPicker()}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar size={13} />
                <span>
                  {selectedDate && recentDays.every(rd => rd.value !== selectedDate)
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Custom Date'}
                </span>
              </button>
              <input
                ref={calendarInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute opacity-0 pointer-events-none w-0 h-0 top-0 left-0"
              />
            </div>
          </div>
        </div>

        {/* Date Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedDate === ''
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            All Time
          </button>

          {recentDays.slice(0, 14).map((day) => {
            const isActive = selectedDate === day.value;
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDate(isActive ? '' : day.value)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {/* Search & Action Filter Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by email, action, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-medium text-slate-500">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
            >
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Enterprise Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-slate-600 mb-3" size={28} />
          <span className="text-xs font-medium text-slate-500">Loading audit records...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-5 font-semibold">Administrator</th>
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-5 text-center text-slate-400 font-medium">
                      No audit records match your current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900 truncate max-w-[200px]">
                        {log.userEmail}
                      </td>
                      <td className="py-3.5 px-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-4 leading-relaxed max-w-md">
                        {log.details && log.details.trim() ? (
                          <span className="text-slate-700">{log.details}</span>
                        ) : (
                          <span className="text-slate-400 italic">— System Operation</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Login Snapshots Section */}
      <div className="space-y-5 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-1">
              <UserCheck size={13} className="text-slate-600" />
              Access History
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Admin Login Sessions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chronological record of login sessions with location metadata and device footprints.</p>
          </div>

          <button
            onClick={() => { setLoadingSessions(true); loadLoginSessions(); }}
            disabled={loadingSessions}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loadingSessions ? 'animate-spin text-slate-500' : 'text-slate-500'} />
            <span>Refresh Sessions</span>
          </button>
        </div>

        {/* Sessions Filter Strip */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">Filter Sessions by Date</span>
            {selectedLoginDate && (
              <button
                onClick={() => setSelectedLoginDate('')}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors flex items-center gap-1"
              >
                <X size={12} />
                <span>Show All Sessions</span>
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLoginDate('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedLoginDate === ''
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              All Dates
            </button>

            {recentDays.slice(0, 10).map((day) => {
              const isActive = selectedLoginDate === day.value;
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedLoginDate(isActive ? '' : day.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions Card Grid */}
        {loadingSessions ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-slate-500 mb-2" size={24} />
            <span className="text-xs text-slate-500">Loading session history...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs shadow-xs">
            No login session records found for the selected timeline.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="truncate">
                    <p className="font-semibold text-xs text-slate-900 truncate">{s.adminEmail}</p>
                    <span className="text-[10px] font-mono text-slate-400">ID: {s.id.slice(0, 8)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <UserCheck size={10} /> Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" /> Timestamp:
                    </span>
                    <span className="font-mono text-[11px] font-medium text-slate-800">
                      {new Date(s.loginAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" /> Location:
                    </span>
                    {s.latitude && s.longitude ? (
                      <a
                        href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <span>{parseFloat(s.latitude).toFixed(3)}°, {parseFloat(s.longitude).toFixed(3)}°</span>
                        <ArrowUpRight size={10} />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Not captured</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Globe size={13} className="text-slate-400" /> IP: <span className="font-mono text-slate-700">{s.ipAddress || '127.0.0.1'}</span>
                    </span>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Laptop size={13} className="text-slate-400" /> <span className="text-slate-700 font-medium">{s.userAgent ? formatDevice(s.userAgent) : 'Browser'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDevice(uaString: string): string {
  if (!uaString) return 'Browser';
  const ua = uaString.toLowerCase();
  let os = 'Desktop';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';
  
  let browser = 'Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';

  return `${os} (${browser})`;
}

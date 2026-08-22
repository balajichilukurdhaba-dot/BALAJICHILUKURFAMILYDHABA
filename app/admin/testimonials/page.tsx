"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, X, Trash2, Star, Edit, Loader2, Sparkles, MessageSquare,
  AlertCircle, ChevronRight, User, ThumbsUp, Eye, EyeOff, Search,
  Plus, CheckCircle2, Image as ImageIcon, ExternalLink
} from 'lucide-react';

const PRESET_AVATARS = [
  '/avatars/google-avatar-1.png',
  '/avatars/google-avatar-2.png',
  '/avatars/google-avatar-3.png',
  '/avatars/google-avatar-4.png',
  '/avatars/google-avatar-5.png',
  '/avatars/google-avatar-6.png',
  '/avatars/google-avatar-7.png',
  '/avatars/google-avatar-8.png',
  '/avatars/google-avatar-9.png',
  '/avatars/google-avatar-10.png',
  '/avatars/google-avatar-11.png',
  '/avatars/google-avatar-12.png',
  '/avatars/google-avatar-13.png',
  '/avatars/google-avatar-14.png',
  '/avatars/google-avatar-15.png',
];

export default function TestimonialsCMS() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [filterMode, setFilterMode] = useState<'All' | 'Approved' | 'Pending'>('All');

  // Form State
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [source, setSource] = useState('Google Reviews');
  const [avatar, setAvatar] = useState('/avatars/google-avatar-1.png');
  const [date, setDate] = useState('6 months ago');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isApproved, setIsApproved] = useState(true);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/testimonials');
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.testimonials || []);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load testimonials', 'error');
    } finally {
      setLoading(false);
    }
  }

  // drops duplicate reviews
  const uniqueTestimonials = useMemo(() => {
    const seen = new Set();
    return testimonials.filter(t => {
      if (!t.id) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [testimonials]);

  const filtered = useMemo(() => {
    return uniqueTestimonials.filter(t => {
      const matchesMode = filterMode === 'All' ? true : filterMode === 'Approved' ? t.isApproved : !t.isApproved;
      if (!matchesMode) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = t.name ? String(t.name).toLowerCase().includes(q) : false;
      const contentMatch = t.content ? String(t.content).toLowerCase().includes(q) : false;
      const roleMatch = t.role ? String(t.role).toLowerCase().includes(q) : false;
      const sourceMatch = t.source ? String(t.source).toLowerCase().includes(q) : false;
      return nameMatch || contentMatch || roleMatch || sourceMatch;
    });
  }, [uniqueTestimonials, filterMode, searchQuery]);

  const broadcastChange = () => {
    try {
      new BroadcastChannel('testimonials-updates').postMessage('update');
      new BroadcastChannel('homepage-updates').postMessage('update');
    } catch (e) {
      // Ignore
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      showToast('Name and review content are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingTestimonial?.id;
      const url = '/api/cms/testimonials';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = isEdit 
        ? {
            id: editingTestimonial.id,
            data: {
              name: name.trim(),
              role: role.trim() || 'Valued Patron',
              content: content.trim(),
              rating,
              source: source.trim() || 'Google Reviews',
              avatar: avatar || null,
              date: date.trim() || 'Just now',
              isApproved,
              order: editingTestimonial.order || 0
            }
          }
        : {
            name: name.trim(),
            role: role.trim() || 'Valued Patron',
            content: content.trim(),
            rating,
            source: source.trim() || 'Google Reviews',
            avatar: avatar || null,
            date: date.trim() || 'Just now',
            isApproved,
            order: 0
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEditingTestimonial(null);
        resetForm();
        loadTestimonials();
        broadcastChange();
        showToast(isEdit ? 'Review updated successfully!' : 'New review published successfully!');
      } else {
        showToast(data.error || 'Failed to save review', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving review to database', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setSource('Google Reviews');
    setAvatar('/avatars/google-avatar-1.png');
    setDate('6 months ago');
    setContent('');
    setRating(5);
    setIsApproved(true);
  };

  const handleStartEdit = (t: any) => {
    setEditingTestimonial(t);
    setName(t.name || '');
    setRole(t.role || '');
    setSource(t.source || 'Google Reviews');
    setAvatar(t.avatar || '/avatars/google-avatar-1.png');
    setDate(t.date || '6 months ago');
    setContent(t.content || '');
    setRating(t.rating || 5);
    setIsApproved(t.isApproved ?? true);
  };

  const handleStartAdd = () => {
    setEditingTestimonial({ id: null });
    resetForm();
  };

  const handleToggleApprove = async (t: any) => {
    const nextApproved = !t.isApproved;
    setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, isApproved: nextApproved } : item));

    try {
      const res = await fetch('/api/cms/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: t.id,
          data: {
            name: t.name,
            role: t.role,
            content: t.content,
            rating: t.rating,
            source: t.source,
            avatar: t.avatar,
            date: t.date,
            isApproved: nextApproved,
            order: t.order
          }
        })
      });
      const data = await res.json();
      if (!data.success) {
        setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, isApproved: t.isApproved } : item));
        showToast(data.error || 'Failed to update approval status', 'error');
      } else {
        broadcastChange();
        showToast(nextApproved ? `Approved "${t.name}" – live on website!` : `Unpublished "${t.name}"`);
      }
    } catch (e) {
      console.error(e);
      setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, isApproved: t.isApproved } : item));
      showToast('Network error updating status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/cms/testimonials?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadTestimonials();
        broadcastChange();
        showToast('Testimonial removed from database');
      } else {
        showToast(data.error || 'Failed to delete testimonial', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error deleting testimonial', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-slate-800 antialiased max-w-7xl mx-auto px-2 sm:px-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-800' 
            : 'bg-rose-950 text-rose-200 border-rose-800'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Social Proof &amp; Reviews CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Customer Reviews &amp; Testimonials</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage verified Google reviews and approve customer feedback for the live website</p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E4D2B] hover:bg-[#163a20] text-white font-semibold text-xs shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Patron Review</span>
        </button>
      </div>

      {/* Controls: Search & Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Approved', 'Pending'] as const).map(mode => {
            const count = uniqueTestimonials.filter(t => mode === 'All' ? true : mode === 'Approved' ? t.isApproved : !t.isApproved).length;
            const isActive = filterMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1E4D2B] text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                <span>{mode === 'All' ? 'All Reviews' : mode === 'Approved' ? 'Live on Website' : 'Pending Moderation'}</span>
                <span className={`text-[10px] font-mono ml-1.5 px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search by patron name, dishes, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="animate-spin text-[#1E4D2B] mb-3" size={36} />
          <p className="text-xs font-semibold text-slate-600">Loading reviews from database...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center flex flex-col items-center shadow-xs">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                <MessageSquare size={26} />
              </div>
              <h3 className="font-bold text-sm text-slate-800">No Testimonials Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery ? 'No reviews matched your search query. Try clearing the search.' : 'No reviews in this category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filtered.map((t) => (
                <div 
                  key={t.id} 
                  className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                    !t.isApproved 
                      ? 'border-amber-300/80 bg-amber-50/20 ring-1 ring-amber-400/20' 
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header: Avatar photo + Author + Stars + Status Badge */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar photo with Google badge */}
                        <div className="relative shrink-0">
                          {t.avatar ? (
                            <img
                              src={t.avatar}
                              alt={t.name}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs bg-slate-100"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                if ((e.target as HTMLElement).nextElementSibling) {
                                  ((e.target as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-11 h-11 bg-slate-100 text-slate-700 border border-slate-200 rounded-full items-center justify-center font-bold text-xs shadow-xs ${t.avatar ? 'hidden' : 'flex'}`}>
                            {t.name ? t.name.slice(0, 2).toUpperCase() : 'CU'}
                          </div>

                          {/* Google G icon badge */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-xs">
                            <svg viewBox="0 0 24 24" width="8" height="8" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                            </svg>
                          </div>
                        </div>

                        {/* Name + Tag + Source info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{t.name}</h4>
                            {t.role && (
                              <span className="text-[10px] px-2 py-0.2 rounded-md font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 truncate max-w-[170px]">
                                {t.role}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {t.source || 'Google Review'} &bull; <span className="font-mono text-slate-500">{t.date || 'Recently'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Stars and Live Status */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < t.rating ? "#F59E0B" : "none"} 
                              className={i < t.rating ? "text-amber-500 fill-current" : "text-slate-200"}
                            />
                          ))}
                        </div>
                        {t.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Check size={10} /> Live on Website
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle size={10} /> Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review quote body */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                      <p className="text-xs text-slate-700 font-sans leading-relaxed italic">
                        "{t.content}"
                      </p>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!t.isApproved ? (
                        <button
                          onClick={() => handleToggleApprove(t)}
                          className="px-3 py-1.5 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 bg-[#1E4D2B] hover:bg-[#163a20] text-white shadow-xs transition-all"
                        >
                          <Check size={13} />
                          <span>Accept &amp; Publish</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleApprove(t)}
                          className="px-3 py-1.5 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                        >
                          <EyeOff size={13} />
                          <span>Unpublish</span>
                        </button>
                      )}

                      {!t.isApproved && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="px-3 py-1.5 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        >
                          <X size={13} />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Review Details"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Full Review Add / Edit Modal --- */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <form onSubmit={handleSave} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-[#1E4D2B]" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingTestimonial.id ? 'Edit Customer Review' : 'Add Patron Review'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTestimonial(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Patron Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Recommended Dish / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paneer Butter Masala & Butter Naan"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Source
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-900 font-medium"
                  >
                    <option value="Google Reviews">Google Reviews</option>
                    <option value="Website Customer Review">Website Customer Review</option>
                    <option value="Local Guide">Local Guide</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Time / Date Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 months ago, a year ago, Just now"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Profile Avatar Photo
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {PRESET_AVATARS.map((avUrl, idx) => (
                    <button
                      key={avUrl}
                      type="button"
                      onClick={() => setAvatar(avUrl)}
                      className={`relative w-10 h-10 rounded-full shrink-0 border-2 transition-all p-0.5 ${
                        avatar === avUrl ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105' : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={avUrl} alt={`Avatar ${idx + 1}`} className="w-full h-full rounded-full object-cover" />
                      {avatar === avUrl && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                          <Check size={8} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Review Content / Feedback *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste patron review or feedback..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-emerald-600 text-slate-900 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Rating Stars (1–5)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={18}
                          fill={star <= rating ? "#F59E0B" : "none"}
                          className={star <= rating ? "text-amber-500 fill-current" : "text-slate-300"}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-slate-700 text-xs">{rating} / 5</span>
                  </div>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1E4D2B] focus:ring-emerald-600"
                    />
                    <span>Show Live on Website Slider</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#1E4D2B] hover:bg-[#163a20] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{saving ? 'Saving...' : editingTestimonial.id ? 'Save Changes' : 'Publish Review'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

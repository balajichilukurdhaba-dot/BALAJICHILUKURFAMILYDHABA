"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, X, Trash2, Star, Edit, Loader2, Sparkles, MessageSquare,
  AlertCircle, ChevronRight, User, ThumbsUp, Eye, EyeOff
} from 'lucide-react';

export default function TestimonialsCMS() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [filterMode, setFilterMode] = useState<'All' | 'Approved' | 'Pending'>('All');

  // Form State
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isApproved, setIsApproved] = useState(false);

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
      if (filterMode === 'Approved') return t.isApproved;
      if (filterMode === 'Pending') return !t.isApproved;
      return true;
    });
  }, [uniqueTestimonials, filterMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

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
              role: editingTestimonial.role || 'Patron',
              content: content.trim(),
              rating,
              source: editingTestimonial.source || 'Direct Submission',
              avatar: editingTestimonial.avatar || null,
              date: editingTestimonial.date || 'Just now',
              isApproved,
              order: editingTestimonial.order || 0
            }
          }
        : {
            name: name.trim(),
            role: 'Patron',
            content: content.trim(),
            rating,
            source: 'Direct Submission',
            avatar: null,
            date: 'Just now',
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
      } else {
        alert(data.error || 'Failed to save review');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating database');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setContent('');
    setRating(5);
    setIsApproved(false);
  };

  const handleToggleApprove = async (t: any) => {
    setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, isApproved: !t.isApproved } : item));

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
            isApproved: !t.isApproved,
            order: t.order
          }
        })
      });
      const data = await res.json();
      if (!data.success) {
        setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, isApproved: t.isApproved } : item));
        alert(data.error || 'Failed to toggle approval status on server');
      }
    } catch (e) {
      console.error(e);
      setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, isApproved: t.isApproved } : item));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/cms/testimonials?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadTestimonials();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-brand-dark/10 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <Sparkles size={12} className="text-brand-accent" />
            Social Proof & Reviews CMS
          </span>
          <h1 className="font-display text-2xl font-black text-brand-dark mt-2">
            Testimonials Editor
          </h1>
          <p className="text-xs text-brand-dark/65 mt-1">
            Approve reviews left by dining patrons to show them on the public landing page slider.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTestimonial({ id: null });
            resetForm();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-[#FFFFFF] font-bold uppercase tracking-wider text-[10px] shadow-sm border border-brand-accent/30 transition-all"
        >
          <span>Add Patron Review</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="animate-spin text-brand-accent mb-4" size={48} />
          <p className="font-display text-base font-bold text-brand-dark">Loading review list...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-brand-dark/10 flex gap-2 shadow-sm">
            {(['All', 'Approved', 'Pending'] as const).map(mode => {
              const count = uniqueTestimonials.filter(t => mode === 'All' ? true : mode === 'Approved' ? t.isApproved : !t.isApproved).length;
              return (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
                    filterMode === mode
                      ? 'bg-brand-accent text-[#FFFFFF] border-brand-accent/30'
                      : 'bg-white hover:bg-brand-bg/30 text-brand-dark/75 border-brand-dark/10'
                  }`}
                >
                  {mode} <span className="text-[10px] opacity-75 font-mono ml-1">({count})</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-brand-dark/10 text-center flex flex-col items-center shadow-sm">
              <AlertCircle className="text-brand-dark/30 mb-4" size={48} />
              <h3 className="font-display text-base font-bold text-brand-dark">No Testimonials Found</h3>
              <p className="text-xs text-brand-dark/60 mt-1">Create or approve reviews to show on landing page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((t) => (
                <div 
                  key={t.id} 
                  className={`bg-white border border-brand-dark/10 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all ${
                    !t.isApproved ? 'border-dashed bg-brand-bg/20 border-brand-dark/20' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Author + Rating + Status Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-bg text-brand-dark border border-brand-dark/15 rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-brand-dark text-xs">{t.name}</h4>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border text-brand-dark/60 bg-brand-bg/60 border-brand-dark/10">
                              {t.role || 'Customer'}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-brand-dark/45 block mt-0.5">
                            Source: {t.source || 'Customer Review'} &bull; {t.date || 'Recently'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < t.rating ? "currentColor" : "none"} 
                              className={i < t.rating ? "text-brand-gold fill-current" : "text-brand-dark/25"}
                            />
                          ))}
                        </div>
                        {t.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Check size={10} /> Live on Website
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle size={10} /> Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review text */}
                    <div className="bg-brand-bg/10 p-3 rounded-xl border border-brand-dark/5">
                      <p className="text-xs text-brand-dark/80 font-sans leading-relaxed italic">
                        "{t.content}"
                      </p>
                    </div>
                  </div>

                  {/* Actions bar: Accept & Reject */}
                  <div className="pt-4 mt-4 border-t border-brand-dark/10 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {!t.isApproved ? (
                        <button
                          onClick={() => handleToggleApprove(t)}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all border border-emerald-700"
                        >
                          <Check size={12} />
                          <span>Accept & Publish</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleApprove(t)}
                          className="px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
                        >
                          <EyeOff size={12} />
                          <span>Unpublish</span>
                        </button>
                      )}

                      {!t.isApproved && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        >
                          <X size={12} />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTestimonial(t);
                          setName(t.name);
                          setContent(t.content);
                          setRating(t.rating);
                          setIsApproved(t.isApproved);
                        }}
                        className="p-2 text-brand-dark/50 hover:text-brand-accent hover:bg-brand-bg/40 rounded-lg transition-colors"
                        title="Edit Review"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* --- Review Form Modal --- */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/45 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSave} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-dark/10 space-y-5">
            <div className="flex justify-between items-center border-b border-brand-dark/5 pb-3">
              <h3 className="font-display font-black text-lg text-brand-dark">
                {editingTestimonial.id ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
              <button type="button" onClick={() => setEditingTestimonial(null)} className="p-1 text-brand-dark/45 hover:text-brand-accent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Patron Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-bg/30 border border-brand-dark/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-accent text-brand-dark"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Review Content *</label>
                <textarea
                  required
                  placeholder="Paste review feedback or comment..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-brand-bg/30 border border-brand-dark/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-accent text-brand-dark"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/65 mb-1.5">Patron Rating (1-5)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-brand-bg/30 border border-brand-dark/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-brand-dark"
                  >
                    {[5, 4, 3, 2, 1].map(r => (
                      <option key={r} value={r}>{r} Stars</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end justify-start pb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-dark/75 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="rounded text-brand-accent focus:ring-brand-accent"
                    />
                    <span>Approve & Show Live</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-brand-dark/5">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2 rounded-xl border border-brand-dark/15 hover:bg-brand-bg/30 text-brand-dark/80 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-[#FFFFFF] text-xs font-bold uppercase tracking-wider shadow-sm border border-brand-accent/30"
              >
                {saving ? 'Saving...' : editingTestimonial.id ? 'Save Changes' : 'Publish Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

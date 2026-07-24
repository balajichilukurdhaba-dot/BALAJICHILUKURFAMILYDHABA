"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Calendar, Clock, MapPin, Tag, 
  X, Check, Loader2, Sparkles, AlertCircle, Building2, Utensils, ChevronDown
} from 'lucide-react';

export default function OffersCMS() {
  const [offers, setOffers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  // Offer fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [badge, setBadge] = useState('Limited Time');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('/menu');
  const [priority, setPriority] = useState(1);
  
  // Custom structured fields (serialized inside description)
  const [descriptionText, setDescriptionText] = useState('');
  const [comboDishes, setComboDishes] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [targetBranches, setTargetBranches] = useState<string[]>([]);

  // Scheduling & expire states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Toggles
  const [isActive, setIsActive] = useState(true);
  const [showOnHomepage, setShowOnHomepage] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [offersRes, branchesRes, menuRes] = await Promise.all([
        fetch('/api/cms/offers'),
        fetch('/api/cms/branches'),
        fetch('/api/cms/menu')
      ]);
      const offersData = await offersRes.json();
      const branchesData = await branchesRes.json();
      const menuData = await menuRes.json();
      
      if (offersData.success) setOffers(offersData.offers);
      if (branchesData.success) setBranches(branchesData.branches);
      if (menuData.success && Array.isArray(menuData.categories)) {
        const list: any[] = [];
        menuData.categories.forEach((cat: any) => {
          if (Array.isArray(cat.dishes)) {
            cat.dishes.forEach((d: any) => {
              list.push({ ...d, categoryName: cat.name });
            });
          }
        });
        setDishes(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Parse structured description helper
  const parseDescription = (desc: string) => {
    try {
      if (desc && desc.trim().startsWith('{')) {
        const parsed = JSON.parse(desc);
        return {
          comboDishes: Array.isArray(parsed.comboDishes) ? parsed.comboDishes : [],
          discountType: parsed.discountType || 'percentage',
          discountValue: parsed.discountValue || '',
          targetBranches: Array.isArray(parsed.targetBranches) ? parsed.targetBranches : [],
          text: parsed.text || ''
        };
      }
    } catch (e) {
      // Fail silently
    }
    return {
      comboDishes: [],
      discountType: 'percentage',
      discountValue: '',
      targetBranches: [],
      text: desc || ''
    };
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Campaign Title is required.');
      return;
    }
    if (!discountValue.trim()) {
      alert('Discount value is required.');
      return;
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      alert('Invalid timing window: Start Date must be before End Date.');
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingOffer;
      const method = isEditing ? 'PUT' : 'POST';

      const serializedDescription = JSON.stringify({
        comboDishes,
        discountType,
        discountValue,
        targetBranches,
        text: descriptionText.trim()
      });

      const formattedPrice = discountType === 'percentage' 
        ? `-${discountValue}% OFF` 
        : `₹${discountValue} OFF`;

      const payload: any = {
        title: title.trim(),
        description: serializedDescription,
        price: formattedPrice,
        badge: badge.trim() || (discountType === 'percentage' ? `${discountValue}% Off` : 'Special Discount'),
        image: image.trim() || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop',
        link: link.trim() || '/menu',
        displayPriority: Number(priority),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive,
        showOnHomepage,
        branchId: targetBranches.length === 1 ? targetBranches[0] : null
      };

      if (isEditing) {
        payload.id = editingOffer.id;
      }

      const res = await fetch('/api/cms/offers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        resetForm();
        loadData();
      } else {
        alert(data.error || 'Failed to save campaign');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (offer: any) => {
    const parsed = parseDescription(offer.description);
    setEditingOffer(offer);
    setTitle(offer.title || '');
    setPrice(offer.price || '');
    setBadge(offer.badge || 'Limited Time');
    setImage(offer.image || '');
    setLink(offer.link || '/menu');
    setPriority(offer.displayPriority || 1);
    setDescriptionText(parsed.text || '');
    setComboDishes(parsed.comboDishes || []);
    setDiscountType(parsed.discountType || 'percentage');
    setDiscountValue(parsed.discountValue || '');
    setTargetBranches(parsed.targetBranches || (offer.branchId ? [offer.branchId] : []));
    
    setStartDate(offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '');
    setEndDate(offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '');
    setIsActive(offer.isActive ?? true);
    setShowOnHomepage(offer.showOnHomepage ?? true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setTitle('');
    setPrice('');
    setBadge('Limited Time');
    setImage('');
    setLink('/menu');
    setPriority(1);
    setDescriptionText('');
    setComboDishes([]);
    setDiscountType('percentage');
    setDiscountValue('');
    setTargetBranches([]);
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setShowOnHomepage(true);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await fetch(`/api/cms/offers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOffers(prev => prev.filter(o => o.id !== id));
      } else {
        alert(data.error || 'Failed to delete offer');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (offer: any) => {
    try {
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !offer.isActive } : o));
      const res = await fetch('/api/cms/offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id,
          data: {
            title: offer.title,
            description: offer.description,
            price: offer.price,
            badge: offer.badge,
            image: offer.image,
            link: offer.link,
            isActive: !offer.isActive,
            startDate: offer.startDate,
            endDate: offer.endDate,
            showOnHomepage: offer.showOnHomepage,
            displayPriority: offer.displayPriority,
            branchId: offer.branchId
          }
        })
      });
      const data = await res.json();
      if (!data.success) {
        setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: offer.isActive } : o));
        alert(data.error || 'Failed to update active status on server');
      }
    } catch (e) {
      console.error(e);
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: offer.isActive } : o));
    }
  };

  const handleBranchCheckboxChange = (branchId: string, checked: boolean) => {
    if (checked) {
      setTargetBranches(prev => [...prev, branchId]);
    } else {
      setTargetBranches(prev => prev.filter(id => id !== branchId));
    }
  };

  const handleDishCheckboxChange = (dishName: string, checked: boolean) => {
    if (checked) {
      setComboDishes(prev => [...prev, dishName]);
    } else {
      setComboDishes(prev => prev.filter(name => name !== dishName));
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-zinc-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-900 inline-block" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Promotions Management</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mt-1">
            Campaigns & Special Offers
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure target outlets, discount rates, schedule validity windows, and featured banners.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-sm transition-all shrink-0"
        >
          <Plus size={14} />
          <span>New Campaign</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <Loader2 className="animate-spin text-zinc-400 mb-3" size={32} />
          <p className="text-xs font-medium text-zinc-600">Loading campaigns data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {offers.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-zinc-200 text-center flex flex-col items-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Tag size={20} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800">No active campaigns</h3>
              <p className="text-xs text-zinc-500 mt-1">Create your first promotion to boost restaurant bookings.</p>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map((offer) => {
                const parsed = parseDescription(offer.description);
                const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
                
                let branchLabel = 'All Outlets';
                if (parsed.targetBranches && parsed.targetBranches.length > 0) {
                  const names = parsed.targetBranches.map((id: any) => branches.find((b: any) => b.id === id)?.name || id);
                  branchLabel = names.join(', ');
                } else if (offer.branchId) {
                  branchLabel = branches.find((b: any) => b.id === offer.branchId)?.name || 'Specified Outlet';
                }

                return (
                  <div 
                    key={offer.id} 
                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      !offer.isActive || isExpired ? 'opacity-70 border-dashed border-zinc-300 bg-zinc-50/50' : 'border-zinc-200'
                    }`}
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative h-44 bg-zinc-950 overflow-hidden">
                        <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        
                        {/* Status badges */}
                        <div className="absolute top-3.5 left-3.5 flex gap-1.5">
                          <span className="bg-zinc-900/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-tight border border-zinc-700/60 backdrop-blur-sm">
                            {offer.badge}
                          </span>
                          
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-tight border backdrop-blur-sm ${
                            isExpired 
                              ? 'bg-rose-500/90 text-white border-rose-400' 
                              : offer.isActive 
                              ? 'bg-emerald-600/90 text-white border-emerald-500' 
                              : 'bg-zinc-800/90 text-zinc-300 border-zinc-700'
                          }`}>
                            {isExpired ? 'Expired' : offer.isActive ? 'Active' : 'Draft'}
                          </span>
                        </div>

                        {/* Top-Right priority rating */}
                        <div className="absolute top-3.5 right-3.5 bg-zinc-900/80 text-zinc-200 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-zinc-700/60 backdrop-blur-sm">
                          Priority #{offer.displayPriority}
                        </div>

                        {/* Text Overlay */}
                        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex justify-between items-end gap-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-base leading-tight truncate">{offer.title}</h3>
                          </div>
                          
                          <span className="font-bold text-white text-lg font-mono shrink-0 bg-zinc-900/70 px-2.5 py-0.5 rounded-lg border border-zinc-700/50 backdrop-blur-sm">
                            {offer.price}
                          </span>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="p-4 sm:p-5 space-y-3.5">
                        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                          {parsed.text || 'No description provided.'}
                        </p>

                        {/* Combo Items tags */}
                        {parsed.comboDishes && parsed.comboDishes.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Included Items</span>
                            {parsed.comboDishes.length > 3 ? (
                              <span className="inline-block bg-zinc-100 border border-zinc-200/80 rounded-md text-[10px] font-semibold text-zinc-700 px-2.5 py-1">
                                {parsed.comboDishes.length > 50 ? 'Applicable across All Menu Items' : `Applicable on ${parsed.comboDishes.length} selected items`}
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {parsed.comboDishes.map((dishName: any, i: number) => (
                                  <span key={i} className="bg-zinc-100 border border-zinc-200/80 rounded-md text-[10px] font-medium text-zinc-700 px-2 py-0.5">
                                    {dishName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Validity Dates */}
                        {(offer.startDate || offer.endDate) && (
                          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80 text-[11px] text-zinc-600 space-y-1">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Campaign Window</span>
                            <div className="flex flex-wrap items-center gap-4 text-[10px]">
                              {offer.startDate && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={12} className="text-zinc-500" />
                                  <span>Start: {new Date(offer.startDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                              {offer.endDate && (
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} className="text-zinc-500" />
                                  <span>End: {new Date(offer.endDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200/80 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.isActive}
                          disabled={isExpired}
                          onChange={() => handleToggleActive(offer)}
                          className="rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900 disabled:opacity-50"
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          {offer.isActive ? 'Active Live' : 'Deactivated'}
                        </span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(offer)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 rounded-lg transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Offer Form Modal --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden my-6"
            >
              <form onSubmit={handleSaveOffer} className="p-6 md:p-8 space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {editingOffer ? 'Edit Campaign' : 'Create Campaign'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Configure campaign details, discount value, targeted outlets, and schedule.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="p-1 text-zinc-400 hover:text-zinc-800 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Campaign Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 text-zinc-900"
                        placeholder="e.g. 15% Off Family Platters"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        value={descriptionText}
                        onChange={(e) => setDescriptionText(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 text-zinc-900"
                        placeholder="Provide details about combo discounts, coupon terms..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Discount Type</label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as any)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all text-zinc-900"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                          Value <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 15 or 150"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 text-zinc-900"
                        />
                      </div>
                    </div>

                    {/* Combo Items */}
                    {(() => {
                      const categories = Array.from(new Set(dishes.map((d: any) => d.categoryName).filter(Boolean)));
                      const filteredDishes = selectedCategory === 'ALL' 
                        ? dishes 
                        : dishes.filter((d: any) => d.categoryName === selectedCategory);
                      const areAllFilteredSelected = filteredDishes.length > 0 && filteredDishes.every((d: any) => comboDishes.includes(d.name));

                      const handleToggleSelectAll = (checked: boolean) => {
                        if (checked) {
                          const namesToAdd = filteredDishes.map((d: any) => d.name);
                          setComboDishes(prev => Array.from(new Set([...prev, ...namesToAdd])));
                        } else {
                          const namesToRemove = new Set(filteredDishes.map((d: any) => d.name));
                          setComboDishes(prev => prev.filter(name => !namesToRemove.has(name)));
                        }
                      };

                      return (
                        <div className="border border-zinc-200/80 rounded-xl p-3.5 space-y-2.5 bg-zinc-50/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Utensils size={13} className="text-zinc-500" />
                              <span className="text-xs font-semibold text-zinc-800">
                                Applicable Dishes <span className="text-zinc-400 font-normal">(Optional)</span>
                              </span>
                              {comboDishes.length > 0 && (
                                <span className="text-[10px] font-bold bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded-full">
                                  {comboDishes.length}
                                </span>
                              )}
                            </div>

                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 cursor-pointer hover:text-zinc-900 select-none">
                              <input
                                type="checkbox"
                                checked={areAllFilteredSelected}
                                onChange={(e) => handleToggleSelectAll(e.target.checked)}
                                className="rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                              />
                              <span>Select All</span>
                            </label>
                          </div>

                          <p className="text-[11px] text-zinc-500 font-normal leading-snug">
                            Select specific items for this offer, or leave unselected to apply across all menu items.
                          </p>

                          {categories.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                                className="w-full bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 flex items-center justify-between transition-colors shadow-sm"
                              >
                                <span>
                                  {selectedCategory === 'ALL' 
                                    ? `All Categories (${dishes.length} items)` 
                                    : `${selectedCategory} (${filteredDishes.length} items)`}
                                </span>
                                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isCatDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-20" onClick={() => setIsCatDropdownOpen(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-52 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-xl py-1 text-xs divide-y divide-zinc-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCategory('ALL');
                                        setIsCatDropdownOpen(false);
                                      }}
                                      className={`w-full px-3.5 py-2 text-left font-medium flex items-center justify-between transition-colors ${
                                        selectedCategory === 'ALL' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'
                                      }`}
                                    >
                                      <span>All Categories</span>
                                      <span className="text-[10px] text-zinc-400 font-mono">({dishes.length})</span>
                                    </button>
                                    {categories.map((cat: any) => {
                                      const count = dishes.filter((d: any) => d.categoryName === cat).length;
                                      return (
                                        <button
                                          key={cat}
                                          type="button"
                                          onClick={() => {
                                            setSelectedCategory(cat);
                                            setIsCatDropdownOpen(false);
                                          }}
                                          className={`w-full px-3.5 py-2 text-left font-medium flex items-center justify-between transition-colors ${
                                            selectedCategory === cat ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'
                                          }`}
                                        >
                                          <span>{cat}</span>
                                          <span className="text-[10px] text-zinc-400 font-mono">({count})</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                            {filteredDishes.length === 0 ? (
                              <span className="text-xs text-zinc-400 italic">No menu items found in this category</span>
                            ) : (
                              filteredDishes.map((dish: any) => (
                                <label key={dish.id} className="flex items-center justify-between gap-2 text-xs text-zinc-700 cursor-pointer hover:text-zinc-900 py-0.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={comboDishes.includes(dish.name)}
                                      onChange={(e) => handleDishCheckboxChange(dish.name, e.target.checked)}
                                      className="rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                                    />
                                    <span className="truncate">{dish.name}</span>
                                  </div>
                                  {selectedCategory === 'ALL' && dish.categoryName && (
                                    <span className="text-[9px] text-zinc-400 font-medium shrink-0">
                                      {dish.categoryName}
                                    </span>
                                  )}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Image URL</label>
                      <input
                        type="text"
                        placeholder="Paste image or media URL"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 text-zinc-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Display Priority</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={priority}
                          onChange={(e) => setPriority(Number(e.target.value))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Promotion Link</label>
                        <input
                          type="text"
                          placeholder="e.g. /menu"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-normal focus:bg-white focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 text-zinc-900"
                        />
                      </div>
                    </div>



                    {/* Date range picker scheduler */}
                    <div className="border border-zinc-200/80 rounded-xl p-3.5 space-y-2.5 bg-zinc-50/50">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-800">
                          Schedule & Validity
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Start Date</label>
                          <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-zinc-900 text-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-zinc-500 mb-1">End Date</label>
                          <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-zinc-900 text-zinc-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnHomepage}
                          onChange={(e) => setShowOnHomepage(e.target.checked)}
                          className="rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                        />
                        <span>Display on Homepage Promotions Slider</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                        />
                        <span>Activate Campaign Immediately</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    <span>{saving ? 'Saving...' : editingOffer ? 'Save Changes' : 'Publish Campaign'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

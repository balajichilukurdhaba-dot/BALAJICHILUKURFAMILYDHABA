"use client";
import React, { useState, useEffect } from 'react';
import { 
  Save, Eye, Globe, ToggleLeft, ToggleRight, Sparkles, Check, 
  Loader2, AlertCircle, RefreshCw, Smartphone, Laptop
} from 'lucide-react';

export default function HomepageCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Split-pane states
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0); // for reloading iframe

  // Form states - draft contents
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroCtaText, setHeroCtaText] = useState('');
  const [heroCtaLink, setHeroCtaLink] = useState('');
  const [heroSecCtaText, setHeroSecCtaText] = useState('');
  const [heroSecCtaLink, setHeroSecCtaLink] = useState('');

  const [announceText, setAnnounceText] = useState('');
  const [announceActive, setAnnounceActive] = useState(true);

  const [aboutHeading, setAboutHeading] = useState('');
  const [aboutSubheading, setAboutSubheading] = useState('');
  const [aboutContent, setAboutContent] = useState('');
  const [aboutImage, setAboutImage] = useState('');
  const [aboutActive, setAboutActive] = useState(true);

  // Section Visibilities
  const [secHero, setSecHero] = useState(true);
  const [secAnnounce, setSecAnnounce] = useState(true);
  const [secFeatured, setSecFeatured] = useState(true);
  const [secOffers, setSecOffers] = useState(true);
  const [secAbout, setSecAbout] = useState(true);
  const [secGallery, setSecGallery] = useState(true);
  const [secTestimonials, setSecTestimonials] = useState(true);
  const [secContact, setSecContact] = useState(true);

  useEffect(() => {
    loadHomepageData();
  }, []);

  async function loadHomepageData() {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/homepage?draft=true');
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        
        // Hero
        const h = s.homepage_hero || {};
        setHeroTitle(h.title || '');
        setHeroSubtitle(h.subtitle || '');
        setHeroVideoUrl(h.videoUrl || '');
        setHeroCtaText(h.ctaText || '');
        setHeroCtaLink(h.ctaLink || '');
        setHeroSecCtaText(h.secondaryCtaText || '');
        setHeroSecCtaLink(h.secondaryCtaLink || '');

        // Announcement
        const a = s.announcement_bar || {};
        setAnnounceText(a.text || '');
        setAnnounceActive(a.isActive !== false);

        // About
        const ab = s.homepage_about || {};
        setAboutHeading(ab.heading || '');
        setAboutSubheading(ab.subheading || '');
        setAboutContent(ab.content || '');
        setAboutImage(ab.image || '');
        setAboutActive(ab.isActive !== false);

        // Sections
        const sec = s.homepage_sections || {};
        setSecHero(sec.hero !== false);
        setSecAnnounce(sec.announcement !== false);
        setSecFeatured(sec.featuredDishes !== false);
        setSecOffers(sec.offers !== false);
        setSecAbout(sec.about !== false);
        setSecGallery(sec.gallery !== false);
        setSecTestimonials(sec.testimonials !== false);
        setSecContact(sec.contact !== false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load homepage settings');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (isPublishing = false) => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      // 3. String trimming parameters on submission
      const payload = {
        action: isPublishing ? 'publish' : 'save_draft',
        homepage_hero: {
          title: heroTitle.trim(),
          subtitle: heroSubtitle.trim(),
          videoUrl: heroVideoUrl.trim(),
          ctaText: heroCtaText.trim(),
          ctaLink: heroCtaLink.trim(),
          secondaryCtaText: heroSecCtaText.trim(),
          secondaryCtaLink: heroSecCtaLink.trim()
        },
        announcement_bar: {
          text: announceText.trim(),
          isActive: announceActive
        },
        homepage_about: {
          heading: aboutHeading.trim(),
          subheading: aboutSubheading.trim(),
          content: aboutContent.trim(),
          image: aboutImage.trim(),
          isActive: aboutActive
        },
        homepage_sections: {
          hero: secHero,
          announcement: secAnnounce,
          featuredDishes: secFeatured,
          offers: secOffers,
          about: secAbout,
          gallery: secGallery,
          testimonials: secTestimonials,
          contact: secContact
        }
      };

      const res = await fetch('/api/cms/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(isPublishing ? 'Changes successfully published live!' : 'Draft saved. Reloading preview...');
        setPreviewKey(prev => prev + 1); // reload preview
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Sparkles size={12} className="text-zinc-400" />
            Homepage CMS
          </span>
          <h1 className="font-display text-2xl font-black text-zinc-800 mt-2">
            Frontpage Setup & Live Preview
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Edit titles, banners, announcements, toggle sections, and preview live on devices before publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-bold uppercase tracking-wider text-[10px] transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={10} className="animate-spin text-zinc-400" /> : <Eye size={12} />}
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold uppercase tracking-wider text-[10px] border border-zinc-700 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={10} className="animate-spin text-zinc-400" /> : <Globe size={12} />}
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-slideDown">
          <Check size={16} className="text-green-600" />
          <span className="text-xs font-bold uppercase tracking-wider">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="animate-spin text-zinc-500 mb-4" size={48} />
          <p className="font-display text-base font-bold text-zinc-700">Loading Settings & Live Preview Iframe...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Form Editors */}
          <div className="lg:col-span-6 space-y-6 max-h-[80vh] overflow-y-auto pr-2 no-scrollbar">
            
            {/* Toggles section */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-zinc-800 border-b border-zinc-100 pb-2">
                Homepage Section Visibilities
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Hero Section</span>
                  <input type="checkbox" checked={secHero} onChange={(e) => setSecHero(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Popup</span>
                  <input type="checkbox" checked={secAnnounce} onChange={(e) => setSecAnnounce(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Signature Dishes</span>
                  <input type="checkbox" checked={secFeatured} onChange={(e) => setSecFeatured(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Promotional Offers</span>
                  <input type="checkbox" checked={secOffers} onChange={(e) => setSecOffers(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">About Us</span>
                  <input type="checkbox" checked={secAbout} onChange={(e) => setSecAbout(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Photo Gallery</span>
                  <input type="checkbox" checked={secGallery} onChange={(e) => setSecGallery(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Testimonials</span>
                  <input type="checkbox" checked={secTestimonials} onChange={(e) => setSecTestimonials(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase">Map & Location</span>
                  <input type="checkbox" checked={secContact} onChange={(e) => setSecContact(e.target.checked)} className="rounded text-zinc-800 focus:ring-zinc-850" />
                </label>
              </div>
            </div>


            {/* Hero Form */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-zinc-800 border-b border-zinc-100 pb-2">
                Hero Fullscreen Video Section
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Hero Main Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authentic Indian Cuisine"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Hero Subtitle</label>
                  <textarea
                    placeholder="Describe the hospitality or location in 1-2 sentences."
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Background YouTube URL (playsinline loop mode)</label>
                  <input
                    type="text"
                    placeholder="Paste embeddable YouTube playlist link"
                    value={heroVideoUrl}
                    onChange={(e) => setHeroVideoUrl(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Primary CTA Button Label</label>
                    <input type="text" value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Primary CTA Link</label>
                    <input type="text" value={heroCtaLink} onChange={(e) => setHeroCtaLink(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Secondary CTA Button Label</label>
                    <input type="text" value={heroSecCtaText} onChange={(e) => setHeroSecCtaText(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Secondary CTA Link</label>
                    <input type="text" value={heroSecCtaLink} onChange={(e) => setHeroSecCtaLink(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* About Section Form */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <h3 className="font-display font-bold text-sm text-zinc-800">About Us Story</h3>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={aboutActive} onChange={(e) => setAboutActive(e.target.checked)} className="rounded text-zinc-800" />
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Active</span>
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">About Section Heading</label>
                  <input type="text" value={aboutHeading} onChange={(e) => setAboutHeading(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Subheading</label>
                  <input type="text" value={aboutSubheading} onChange={(e) => setAboutSubheading(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Story/Content Body</label>
                  <textarea value={aboutContent} onChange={(e) => setAboutContent(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" rows={4} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">About Section Image URL</label>
                  <input type="text" value={aboutImage} onChange={(e) => setAboutImage(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel: Live Preview Iframe */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-8">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-display font-bold text-sm text-zinc-800 flex items-center gap-1.5">
                <Eye size={16} className="text-zinc-500" />
                <span>Live Draft Preview</span>
              </h3>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-all ${
                    previewDevice === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                  title="Desktop View"
                >
                  <Laptop size={14} />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-all ${
                    previewDevice === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone size={14} />
                </button>
                <button
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800"
                  title="Reload Preview Frame"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Iframe Device Frame Mockup */}
            <div className={`mx-auto bg-zinc-950 p-3 rounded-[32px] border-4 border-zinc-850 shadow-2xl transition-all duration-300 relative ${
              previewDevice === 'mobile' ? 'max-w-[340px] h-[550px]' : 'w-full h-[550px]'
            }`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-zinc-950 rounded-b-xl z-20 hidden md:block" />
              
              <iframe
                key={previewKey}
                src="/?preview=true"
                className="w-full h-full rounded-[20px] bg-zinc-50 overflow-hidden border border-zinc-200"
                title="Restaurant Web Live Preview Frame"
              />
            </div>
            
            <p className="text-[10px] text-center text-zinc-400 font-sans leading-relaxed">
              💡 Draft changes are rendered in the preview mock above in real-time. <br />
              Click "Publish Live" at the top to commit your edits to public website visitors.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

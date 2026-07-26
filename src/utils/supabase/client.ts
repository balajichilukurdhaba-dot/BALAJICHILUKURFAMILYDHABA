import { createBrowserClient } from '@supabase/ssr'

const DEFAULT_SUPABASE_URL = "https://wgjrmvybfkgqxlyiscqf.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnanJtdnliZmtncXhseWlzY3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Nzg1MzgsImV4cCI6MjEwMDQ1NDUzOH0.pyYx0Seo8Y6DAUjU1EIJGtCgOFHSDXBEX6BEmrM257Q";

function sanitizeUrl(url: string | undefined): string {
  if (!url) return DEFAULT_SUPABASE_URL;
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  
  cleaned = cleaned.replace(/^(https?)\/\/+/i, '$1://');
  cleaned = cleaned.replace(/^(https?):?\/\/+/i, '$1://');
  
  if ((cleaned.match(/https?:\/\//gi) || []).length > 1 || cleaned.includes('https//') || cleaned.includes('http//')) {
    const parts = cleaned.split(/(?=https?:?\/\/)/i);
    for (const part of parts) {
      let trimmed = part.trim();
      trimmed = trimmed.replace(/^(https?):?\/\/+/i, '$1://');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        cleaned = trimmed;
        break;
      }
    }
  }

  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned || DEFAULT_SUPABASE_URL;
}

export function createClient() {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const sanitizedUrl = sanitizeUrl(originalUrl);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    return createBrowserClient(
      sanitizedUrl,
      anonKey
    );
  } catch (e) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: {}, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      }
    } as any;
  }
}

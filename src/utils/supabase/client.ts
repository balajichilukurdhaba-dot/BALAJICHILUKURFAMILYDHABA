import { createBrowserClient } from '@supabase/ssr'

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  
  // Fix cases where a colon is missing after http/https at the start
  cleaned = cleaned.replace(/^(https?)\/\/+/i, '$1://');
  cleaned = cleaned.replace(/^(https?):?\/\/+/i, '$1://');
  
  // If concatenated multiple times (e.g. https://...https://... or https://...https//...)
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
  return cleaned;
}

export function createClient() {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sanitizedUrl = sanitizeUrl(originalUrl);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client Client-Side Init]');
  console.log('- Raw URL from env:', originalUrl);
  console.log('- Sanitized URL used:', sanitizedUrl);
  const isValidUrl = sanitizedUrl.startsWith('http://') || sanitizedUrl.startsWith('https://');

  // Silent dummy client for missing or invalid env vars
  const dummyClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: {}, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  } as any;

  if (!sanitizedUrl || !anonKey || !isValidUrl) {
    console.warn('[Supabase Client] Missing or invalid URL or Anon Key. Returning dummy client for build-time prerendering.');
    return dummyClient;
  }

  // Also wrap actual client creation in case the key format causes immediate errors
  try {
    return createBrowserClient(
      sanitizedUrl,
      anonKey
    );
  } catch (e) {
    console.warn('[Supabase Client] Failed to create browser client:', e);
    return dummyClient;
  }
}


import { createClient } from '@supabase/supabase-js';

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  cleaned = cleaned.replace(/^(https?)\/\/+/i, '$1://');
  cleaned = cleaned.replace(/^(https?):?\/\/+/i, '$1://');
  if ((cleaned.match(/https?:\/\//gi) || []).length > 1 || cleaned.includes('https//') || cleaned.includes('http//')) {
    const parts = cleaned.split(/(?=https?:?\/\/)/i);
    for (const part of parts) {
      let trimmed = part.trim().replace(/^(https?):?\/\/+/i, '$1://');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        cleaned = trimmed;
        break;
      }
    }
  }
  return cleaned.replace(/\/+$/, '');
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = sanitizeUrl(rawUrl);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function verifySupabaseAdminAuth(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const cleanEmail = email.trim();
  const cleanPassword = password;

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Both email and password are required.' };
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Supabase URL or Anon Key is missing in environment variables.' };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error || !data?.session || !data?.user) {
      let errMsg = error?.message || 'Invalid administrator credentials in Supabase Auth.';
      if (errMsg.toLowerCase().includes('invalid api key')) {
        errMsg = 'Invalid Supabase API Key: Please update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env with the "anon" public key (JWT starting with eyJ...) from Supabase Dashboard -> Settings -> API.';
      }
      return {
        success: false,
        error: errMsg,
      };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to communicate with Supabase Authentication service.',
    };
  }
}

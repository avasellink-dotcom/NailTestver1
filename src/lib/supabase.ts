import { createClient } from '@supabase/supabase-js';

// Ensure we have strings and no whitespace
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Validation of credentials - also check if it's the placeholder from .env.example
export const isSupabaseConfigured = Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_url' &&
    !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
    console.warn('Supabase credentials missing or invalid. Activation system will not work.');
}

// Create client with absolute safety
export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
    isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    }
);

export type ActivationCode = {
    id: string;
    code: string;
    is_used: boolean;
    telegram_id: number | null;
    activated_at: string | null;
    created_at: string;
};

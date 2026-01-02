import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validation of credentials
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url');

if (!isSupabaseConfigured) {
    console.warn('Supabase credentials missing or invalid. Activation system will not work.');
}

export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
    isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

export type ActivationCode = {
    id: string;
    code: string;
    is_used: boolean;
    telegram_id: number | null;
    activated_at: string | null;
    created_at: string;
};

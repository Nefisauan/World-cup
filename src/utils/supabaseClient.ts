import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from '../config';

// Initialize the client dynamically. This function is re-called 
// when the user updates credentials in the UI modal.
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, anonKey } = getSupabaseConfig();
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false, // Disables standard JWT auth since we use simple passcode validation
      }
    });
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
};

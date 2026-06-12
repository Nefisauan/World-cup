export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  // 1. Check browser local storage overrides first (allows settings modal)
  const localUrl = localStorage.getItem('wc26_supabase_url');
  const localKey = localStorage.getItem('wc26_supabase_key');

  if (localUrl && localKey) {
    return {
      url: localUrl.trim(),
      anonKey: localKey.trim(),
    };
  }

  // 2. Fall back to Vite environment variables or default project credentials
  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string || 'https://flayzzdmkyintojrdpxu.supabase.co').trim(),
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'sb_publishable_dBLSK8J6KJW8_BT6fL9WAw_Yag4X14K').trim(),
  };
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  if (url === '' && anonKey === '') {
    localStorage.removeItem('wc26_supabase_url');
    localStorage.removeItem('wc26_supabase_key');
  } else {
    localStorage.setItem('wc26_supabase_url', url.trim());
    localStorage.setItem('wc26_supabase_key', anonKey.trim());
  }
};

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return config.url !== '' && config.anonKey !== '';
};

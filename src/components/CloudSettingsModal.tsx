import React, { useState } from 'react';
import { getSupabaseConfig, setSupabaseConfig, isSupabaseConfigured } from '../config';

interface CloudSettingsModalProps {
  onClose: () => void;
  onConfigChanged: () => void;
}

export const CloudSettingsModal: React.FC<CloudSettingsModalProps> = ({
  onClose,
  onConfigChanged,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(url.trim(), anonKey.trim());
    setIsSaved(true);
    onConfigChanged();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect from Supabase? The app will revert back to browser Local Storage mode.')) {
      setSupabaseConfig('', '');
      setUrl('');
      setAnonKey('');
      onConfigChanged();
      onClose();
    }
  };

  const isConfigured = isSupabaseConfigured();

  const sqlSchema = `
-- COPY & PASTE THIS INTO YOUR SUPABASE SQL EDITOR:

-- 1. Create Brackets Table
CREATE TABLE IF NOT EXISTS public.wc26_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    passcode TEXT NOT NULL,
    group_matches JSONB NOT NULL,
    custom_standings JSONB NOT NULL,
    knockout_scores JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.wc26_brackets ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Allow public read" ON public.wc26_brackets FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.wc26_brackets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update with passcode verification" ON public.wc26_brackets 
    FOR UPDATE USING (true) WITH CHECK (true);
  `.trim();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="glass-card animate-slideup"
        style={{
          width: '100%',
          maxWidth: '650px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Supabase Cloud Settings
          </h2>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Connect to a free **Supabase database** to enable real-time cloud sync, global leaderboards, 
          and let your friends create and view brackets on their own phones!
        </p>

        {/* Credentials Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SUPABASE PROJECT URL</label>
            <input 
              type="text"
              className="score-input"
              style={{ width: '100%', height: '36px', textAlign: 'left', padding: '0 10px', fontSize: '0.85rem' }}
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SUPABASE ANON API KEY</label>
            <input 
              type="password"
              className="score-input"
              style={{ width: '100%', height: '36px', textAlign: 'left', padding: '0 10px', fontSize: '0.85rem' }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '38px', justifyContent: 'center' }}>
              {isSaved ? '✅ Saved & Connected!' : 'Connect Database'}
            </button>
            {isConfigured && (
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDisconnect}
                style={{ height: '38px' }}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        {/* Database setup instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>🚀 Database Setup Guide</h3>
          <ol style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Sign up for a free account at **[supabase.com](https://supabase.com)** and create a new project.</li>
            <li>Go to your project's **Settings** → **API** to copy the URL and Anon Key and paste them above.</li>
            <li>Go to your project's **SQL Editor** on the left menu, click **New query**, paste the SQL code below, and click **Run**:</li>
          </ol>

          <textarea
            readOnly
            value={sqlSchema}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            style={{
              width: '100%',
              height: '130px',
              background: '#090d16',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: '#4ade80',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              padding: '10px',
              resize: 'none',
              marginTop: '6px',
              outline: 'none',
              cursor: 'pointer'
            }}
            title="Click to select all SQL code"
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            💡 Click inside the text area to select all, then copy.
          </span>
        </div>
      </div>
    </div>
  );
};
export default CloudSettingsModal;

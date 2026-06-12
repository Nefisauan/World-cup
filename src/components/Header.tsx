import React from 'react';

interface HeaderProps {
  activeTab: 'groups' | 'thirds' | 'bracket' | 'leaderboard';
  setActiveTab: (tab: 'groups' | 'thirds' | 'bracket' | 'leaderboard') => void;
  onReset: () => void;
  onRandomize: () => void;
  progressPercent: number;
  
  // Profile management props
  profiles: string[];
  activeProfile: string;
  onSwitchProfile: (profile: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (profile: string) => void;
  onExport: () => void;
  onImport: (json: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onReset,
  onRandomize,
  progressPercent,
  profiles,
  activeProfile,
  onSwitchProfile,
  onCreateProfile,
  onDeleteProfile,
  onExport,
  onImport,
}) => {
  return (
    <header className="glass-card app-header animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'stretch' }}>
      {/* Top Row: Title, Profile Switcher, and Export/Import file handlers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="app-title-section">
          <div>
            <h1 className="app-logo">🏆 WC 2026</h1>
            <div className="app-subtitle">Bracket Predictor</div>
          </div>
        </div>

        {/* Profile Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            USER:
          </span>
          <select 
            value={activeProfile} 
            onChange={(e) => onSwitchProfile(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {profiles.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }}
            onClick={() => {
              const name = prompt('Enter a name for the new prediction profile:');
              if (name && name.trim()) {
                onCreateProfile(name.trim());
              }
            }}
            title="Create a new bracket profile"
          >
            ➕ New
          </button>

          {profiles.length > 1 && (
            <button 
              className="btn btn-danger" 
              style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }}
              onClick={() => onDeleteProfile(activeProfile)}
              title="Delete current active profile"
            >
              🗑️ Delete
            </button>
          )}
        </div>

        {/* Export/Import Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onExport} 
            title="Download prediction file (.json)"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            📥 Export JSON
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => document.getElementById('import-file-input')?.click()} 
            title="Upload prediction file (.json)"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            📤 Import JSON
          </button>
          
          <input 
            type="file" 
            id="import-file-input" 
            accept=".json" 
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const text = event.target?.result;
                if (typeof text === 'string') {
                  onImport(text);
                }
              };
              reader.readAsText(file);
              e.target.value = ''; // reset so the same file can be imported again
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

      {/* Bottom Row: Navigation Tabs and Simulation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Group Stage
          </button>
          <button
            className={`tab-btn ${activeTab === 'thirds' ? 'active' : ''}`}
            onClick={() => setActiveTab('thirds')}
          >
            3rd Place Rankings
          </button>
          <button
            className={`tab-btn ${activeTab === 'bracket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bracket')}
          >
            Knockout Bracket
          </button>
          <button
            className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </nav>

        <div className="controls-section">
          <button className="btn btn-primary" onClick={onRandomize} title="Auto-fill prediction randomly for current profile">
            ⚡ Simulate Scores
          </button>
          <button className="btn btn-danger" onClick={onReset} title="Clear predictions for current profile">
            🔄 Reset Predictions
          </button>
          
          <div style={{ minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Predictions Filled</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="prediction-progress-bar">
              <div 
                className="prediction-progress-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;

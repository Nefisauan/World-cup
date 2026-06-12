import React, { useState } from 'react';

interface HeaderProps {
  activeTab: 'groups' | 'thirds' | 'bracket' | 'leaderboard';
  setActiveTab: (tab: 'groups' | 'thirds' | 'bracket' | 'leaderboard') => void;
  onReset: () => void;
  onRandomize: () => void;
  progressPercent: number;
  
  // Local profile props
  profiles: string[];
  activeProfile: string;
  onSwitchProfile: (profile: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (profile: string) => void;
  onExport: () => void;
  onImport: (json: string) => void;

  // Cloud props
  isCloud: boolean;
  cloudUser: string | null;
  onCloudLogin: (username: string, pin: string) => Promise<boolean>;
  onCloudRegister: (username: string, pin: string) => Promise<boolean>;
  onCloudSignOut: () => void;
  onOpenCloudSettings: () => void;
  viewingUser: string | null;
  onExitViewMode: () => void;
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
  isCloud,
  cloudUser,
  onCloudLogin,
  onCloudRegister,
  onCloudSignOut,
  onOpenCloudSettings,
  viewingUser,
  onExitViewMode,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCloudAuth = async (action: 'login' | 'register') => {
    const user = usernameInput.trim();
    const pin = pinInput.trim();
    
    if (!user) {
      alert('Please enter a username.');
      return;
    }
    if (pin.length < 4) {
      alert('PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    try {
      let success = false;
      if (action === 'register') {
        success = await onCloudRegister(user, pin);
      } else {
        success = await onCloudLogin(user, pin);
      }
      if (success) {
        setUsernameInput('');
        setPinInput('');
      }
    } catch (e) {
      console.error(e);
      alert('Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="glass-card app-header animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'stretch' }}>
      
      {/* Viewer Banner Override */}
      {viewingUser && (
        <div 
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'pulseGlow 2s infinite'
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            👁️ Viewing Read-Only predictions of: <span style={{ color: 'var(--accent-gold)' }}>{viewingUser}</span>
          </span>
          <button 
            className="btn btn-danger" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', height: '32px' }}
            onClick={onExitViewMode}
          >
            ❌ Exit View Mode
          </button>
        </div>
      )}

      {/* Top Row: Title, User Switcher / Cloud Join, and Export/Import file handlers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="app-title-section">
          <div>
            <h1 className="app-logo">🏆 WC 2026</h1>
            <div className="app-subtitle">Bracket Predictor</div>
          </div>
        </div>

        {/* User Account / Profile Section */}
        {isCloud ? (
          /* Cloud Mode Header */
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {cloudUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(22, 163, 74, 0.1)', padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-green)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  👤 User: <strong style={{ color: 'var(--accent-green)' }}>{cloudUser}</strong>
                </span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px' }}
                  onClick={onCloudSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <input 
                  type="text"
                  placeholder="Username"
                  className="score-input"
                  style={{ width: '120px', height: '30px', textAlign: 'left', padding: '0 8px', fontSize: '0.8rem' }}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={loading}
                />
                <input 
                  type="password"
                  placeholder="PIN"
                  maxLength={4}
                  className="score-input"
                  style={{ width: '60px', height: '30px', textAlign: 'center', padding: '0', fontSize: '0.8rem' }}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', height: '30px', background: 'var(--accent-green)', color: 'var(--bg-dark)' }}
                  onClick={() => handleCloudAuth('register')}
                  disabled={loading}
                  title="Create username and save predictions to the cloud"
                >
                  Join Pool
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', height: '30px' }}
                  onClick={() => handleCloudAuth('login')}
                  disabled={loading}
                  title="Log in to fetch your cloud predictions"
                >
                  Log In
                </button>
              </div>
            )}
            
            {/* DB settings cog */}
            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 10px', height: '34px', fontSize: '1rem' }}
              onClick={onOpenCloudSettings}
              title="Configure Cloud Database Connection"
            >
              ⚙️
            </button>
          </div>
        ) : (
          /* Local Storage Fallback Mode Header */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              LOCAL:
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

            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 10px', height: '30px', fontSize: '0.85rem' }}
              onClick={onOpenCloudSettings}
              title="Configure Cloud Database Connection"
            >
              ☁️ Connect
            </button>
          </div>
        )}

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
              e.target.value = ''; // reset
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
            disabled={!!viewingUser && activeTab !== 'groups'}
          >
            Group Stage
          </button>
          <button
            className={`tab-btn ${activeTab === 'thirds' ? 'active' : ''}`}
            onClick={() => setActiveTab('thirds')}
            disabled={!!viewingUser && activeTab !== 'thirds'}
          >
            3rd Place Rankings
          </button>
          <button
            className={`tab-btn ${activeTab === 'bracket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bracket')}
            disabled={!!viewingUser && activeTab !== 'bracket'}
          >
            Knockout Bracket
          </button>
          <button
            className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
            disabled={!!viewingUser}
          >
            Leaderboard
          </button>
        </nav>

        <div className="controls-section">
          <button 
            className="btn btn-primary" 
            onClick={onRandomize} 
            title="Auto-fill prediction randomly"
            disabled={!!viewingUser}
          >
            ⚡ Simulate Scores
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onReset} 
            title="Clear current predictions"
            disabled={!!viewingUser}
          >
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

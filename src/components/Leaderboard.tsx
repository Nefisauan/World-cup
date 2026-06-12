import React from 'react';
import type { PointsBreakdown } from '../utils/tournamentLogic';

export interface LeaderboardEntry {
  profileName: string;
  points: PointsBreakdown;
  isReference: boolean;
}

interface LeaderboardProps {
  profiles: string[];
  referenceProfile: string;
  setReferenceProfile: (profile: string) => void;
  leaderboardData: LeaderboardEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  profiles,
  referenceProfile,
  setReferenceProfile,
  leaderboardData,
}) => {
  return (
    <div className="glass-card thirds-container animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selector Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="thirds-header-info">
          <h2>Bracket Pool Leaderboard</h2>
          <p>
            Rankings are calculated by comparing each user profile's predictions against the selected <strong>Reference / Official Results</strong> profile.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '0.5px' }}>
            🎯 REFERENCE RESULTS:
          </span>
          <select 
            value={referenceProfile} 
            onChange={(e) => setReferenceProfile(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {profiles.map((p) => (
              <option key={p} value={p}>{p === 'Default' ? 'Default (Predictions)' : p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="instruction-bubble" style={{ background: 'rgba(234, 179, 8, 0.05)', borderColor: 'rgba(234, 179, 8, 0.2)', color: '#fef08a' }}>
        📢 <strong>How points are scored:</strong>
        <ul style={{ marginLeft: '20px', marginTop: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>⚽ <strong>Group Stage:</strong> +1 pt for correct outcome (Win/Draw/Loss), +3 pts for exact score.</li>
          <li>🔥 <strong>Knockout Match:</strong> +2 pts for correct outcome, +5 pts for exact score.</li>
          <li>🏆 <strong>Correct Advancing Team:</strong> +2 pts for R16, +4 pts for QF, +8 pts for SF, +12 pts for Finalist, +20 pts for Champion.</li>
        </ul>
      </div>

      {/* Leaderboard Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="thirds-styled-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Profile Name</th>
              <th style={{ textAlign: 'center' }}>Group Scores</th>
              <th style={{ textAlign: 'center' }}>Knockout Scores</th>
              <th style={{ textAlign: 'center' }}>Progression Pts</th>
              <th style={{ textAlign: 'center', fontWeight: 800 }}>Total Pts</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, idx) => {
              const isRef = entry.isReference;
              let medal = '';
              if (idx === 0) medal = '🥇';
              else if (idx === 1) medal = '🥈';
              else if (idx === 2) medal = '🥉';

              return (
                <tr 
                  key={entry.profileName}
                  className={`thirds-row-qualify ${idx === 0 ? 'top-8' : ''}`}
                  style={{ opacity: isRef ? 0.6 : 1 }}
                >
                  <td style={{ fontWeight: 800, width: '70px' }}>
                    {medal ? (
                      <span style={{ fontSize: '1.4rem' }}>{medal}</span>
                    ) : (
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-dim)',
                          fontSize: '0.8rem'
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <span style={{ fontSize: '1.1rem' }}>👤</span>
                      <span>{entry.profileName}</span>
                      {isRef && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--accent-gold-glow)', color: 'var(--accent-gold)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--accent-gold)' }}>
                          Reference Source
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {entry.points.groupScorePoints} pts
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {entry.points.knockoutScorePoints} pts
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {entry.points.progressionPoints} pts
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: idx === 0 && !isRef ? 'var(--accent-green)' : 'var(--text-main)' }}>
                    {entry.points.totalPoints} pts
                  </td>
                  <td>
                    {isRef ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Reference</span>
                    ) : (
                      <span className="qualify-label yes" style={{ background: 'rgba(22, 163, 74, 0.15)', color: 'var(--accent-green)', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
                        Competing
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Leaderboard;

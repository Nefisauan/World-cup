import React from 'react';
import { getTeamById } from '../data/teams';
import type { ThirdPlaceStanding } from '../utils/tournamentLogic';

interface ThirdPlacesTableProps {
  thirdPlaces: ThirdPlaceStanding[];
}

export const ThirdPlacesTable: React.FC<ThirdPlacesTableProps> = ({ thirdPlaces }) => {
  return (
    <div className="glass-card thirds-container animate-slideup">
      <div className="thirds-header-info">
        <h2>Best 3rd-Placed Teams Ranking</h2>
        <p>
          The <strong>8 best third-placed teams</strong> across all 12 groups qualify for the Round of 32 knockout stage.
          Tiebreakers are determined by: Points → Goal Difference → Goals Scored → Group Order.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="thirds-styled-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Group</th>
              <th>Team</th>
              <th style={{ textAlign: 'center' }}>MP</th>
              <th style={{ textAlign: 'center' }}>W</th>
              <th style={{ textAlign: 'center' }}>D</th>
              <th style={{ textAlign: 'center' }}>L</th>
              <th style={{ textAlign: 'center' }}>GF</th>
              <th style={{ textAlign: 'center' }}>GA</th>
              <th style={{ textAlign: 'center' }}>GD</th>
              <th style={{ textAlign: 'center' }}>Pts</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {thirdPlaces.map((standing, idx) => {
              const team = getTeamById(standing.teamId);
              if (!team) return null;

              const isTop8 = idx < 8;

              return (
                <tr
                  key={standing.teamId}
                  className={`thirds-row-qualify ${isTop8 ? 'top-8' : ''}`}
                >
                  <td style={{ fontWeight: 700 }}>
                    <span 
                      style={{ 
                        display: 'inline-flex', 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: isTop8 ? 'var(--accent-gold-glow)' : 'rgba(255,255,255,0.05)',
                        color: isTop8 ? 'var(--accent-gold)' : 'var(--text-dim)',
                        border: isTop8 ? '1px solid var(--accent-gold)' : 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    Group {standing.groupId}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <span style={{ fontSize: '1.2rem' }}>{team.flag}</span>
                      <span>{team.name} ({team.id})</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{standing.played}</td>
                  <td style={{ textAlign: 'center' }}>{standing.won}</td>
                  <td style={{ textAlign: 'center' }}>{standing.drawn}</td>
                  <td style={{ textAlign: 'center' }}>{standing.lost}</td>
                  <td style={{ textAlign: 'center' }}>{standing.gf}</td>
                  <td style={{ textAlign: 'center' }}>{standing.ga}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {standing.gd > 0 ? `+${standing.gd}` : standing.gd}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-main)' }}>
                    {standing.points}
                  </td>
                  <td>
                    <span className={`qualify-label ${isTop8 ? 'yes' : 'no'}`}>
                      {isTop8 ? '✅ Qualified' : '❌ Eliminated'}
                    </span>
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
export default ThirdPlacesTable;

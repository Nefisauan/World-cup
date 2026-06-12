import React, { useState } from 'react';
import { getTeamById } from '../data/teams';
import type { Match } from '../data/teams';
import { getMatchWinner } from '../utils/tournamentLogic';

interface KnockoutBracketProps {
  knockoutMatches: Match[];
  updateKnockoutScore: (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined,
    homePenalties?: number,
    awayPenalties?: number
  ) => void;
  isReadOnly?: boolean;
}

type RoundTab = 'ALL' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINALS';

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  knockoutMatches,
  updateKnockoutScore,
  isReadOnly = false,
}) => {
  const [activeRoundTab, setActiveRoundTab] = useState<RoundTab>('ALL');

  const handleScoreChange = (
    matchId: string,
    side: 'home' | 'away',
    val: string
  ) => {
    const score = val === '' ? undefined : parseInt(val, 10);
    const match = knockoutMatches.find((m) => m.id === matchId);
    if (!match) return;

    if (side === 'home') {
      updateKnockoutScore(
        matchId,
        score,
        match.awayScore,
        match.homePenalties,
        match.awayPenalties
      );
    } else {
      updateKnockoutScore(
        matchId,
        match.homeScore,
        score,
        match.homePenalties,
        match.awayPenalties
      );
    }
  };

  const handlePenaltiesChange = (
    matchId: string,
    side: 'home' | 'away',
    val: string
  ) => {
    const pks = val === '' ? undefined : parseInt(val, 10);
    const match = knockoutMatches.find((m) => m.id === matchId);
    if (!match) return;

    if (side === 'home') {
      updateKnockoutScore(
        matchId,
        match.homeScore,
        match.awayScore,
        pks,
        match.awayPenalties
      );
    } else {
      updateKnockoutScore(
        matchId,
        match.homeScore,
        match.awayScore,
        match.homePenalties,
        pks
      );
    }
  };

  // Helper to resolve team ID to Team object or placeholder text
  const resolveTeamDisplay = (
    teamIdOrPlaceholder: string | null,
    defaultPlaceholder: string
  ): { name: string; flag: string; isPlaceholder: boolean; id: string | null } => {
    if (!teamIdOrPlaceholder) {
      return { name: defaultPlaceholder, flag: '❔', isPlaceholder: true, id: null };
    }

    const team = getTeamById(teamIdOrPlaceholder);
    if (team) {
      return { name: team.name, flag: team.flag, isPlaceholder: false, id: team.id };
    }

    // It's a placeholder string (e.g. 'Winner Match 74')
    return {
      name: teamIdOrPlaceholder,
      flag: '⏳',
      isPlaceholder: true,
      id: null,
    };
  };

  // Check if a team is the winner of this match
  const checkIsWinner = (match: Match, teamId: string | null): boolean => {
    if (!teamId) return false;
    const winnerId = getMatchWinner(match);
    return winnerId === teamId;
  };

  // Render a team row inside a match card
  const renderTeamRow = (
    match: Match,
    teamId: string | null,
    placeholderLabel: string,
    score: number | undefined,
    penalties: number | undefined,
    side: 'home' | 'away'
  ) => {
    const { name, flag, isPlaceholder, id } = resolveTeamDisplay(
      teamId,
      placeholderLabel
    );
    const isWinner = id ? checkIsWinner(match, id) : false;
    const isDraw =
      match.homeScore !== undefined &&
      match.awayScore !== undefined &&
      match.homeScore === match.awayScore;

    return (
      <div
        className={`match-card-team-row ${isWinner ? 'winner-row' : ''} ${
          isPlaceholder ? 'placeholder-team' : ''
        }`}
      >
        <div className="team-details-block">
          <span className="team-flag">{flag}</span>
          <span
            style={{
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maxWidth: '130px',
            }}
            title={name}
          >
            {name}
          </span>
        </div>

        <div className="ko-score-inputs">
          {isDraw && !isPlaceholder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span className="penalty-label-tag">PK:</span>
              <input
                type="number"
                min="0"
                className="penalty-trigger-input"
                value={penalties === undefined ? '' : penalties}
                onChange={(e) => handlePenaltiesChange(match.id, side, e.target.value)}
                placeholder="0"
                disabled={isReadOnly}
              />
            </div>
          )}
          <input
            type="number"
            min="0"
            className="score-input"
            value={score === undefined ? '' : score}
            onChange={(e) => handleScoreChange(match.id, side, e.target.value)}
            disabled={isPlaceholder || isReadOnly}
            placeholder="-"
          />
        </div>
      </div>
    );
  };

  // Filters matches by round
  const r32Matches = knockoutMatches.filter((m) => m.stage === 'R32');
  const r16Matches = knockoutMatches.filter((m) => m.stage === 'R16');
  const qfMatches = knockoutMatches.filter((m) => m.stage === 'QF');
  const sfMatches = knockoutMatches.filter((m) => m.stage === 'SF');
  const thirdPlaceMatch = knockoutMatches.find((m) => m.stage === 'third-place');
  const finalMatch = knockoutMatches.find((m) => m.stage === 'final');

  // Champion Team Resolver
  const championId = finalMatch ? getMatchWinner(finalMatch) : null;
  const championTeam = championId ? getTeamById(championId) : null;

  const renderMatchCard = (match: Match, defaultHomeLabel: string, defaultAwayLabel: string) => {
    const isChampionship = match.stage === 'final';

    return (
      <div
        key={match.id}
        className={`glass-card knockout-match-card ${
          isChampionship ? 'championship-card' : ''
        } ${
          match.homeScore !== undefined || match.awayScore !== undefined
            ? 'active-match'
            : ''
        }`}
      >
        <div className="match-header-tag">
          <span>{match.stage === 'third-place' ? '3rd Place Match' : `Match ${match.id.split('-')[1]}`}</span>
          <span>{match.date} • {match.venue}</span>
        </div>

        {renderTeamRow(
          match,
          match.homeTeam,
          defaultHomeLabel,
          match.homeScore,
          match.homePenalties,
          'home'
        )}

        <div style={{ height: '2px' }}></div>

        {renderTeamRow(
          match,
          match.awayTeam,
          defaultAwayLabel,
          match.awayScore,
          match.awayPenalties,
          'away'
        )}
      </div>
    );
  };

  const showColumn = (col: RoundTab) => {
    return activeRoundTab === 'ALL' || activeRoundTab === col;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Navigation tabs for rounds (especially useful on mobile) */}
      <div className="bracket-navigation">
        <button
          className={`bracket-nav-btn ${activeRoundTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveRoundTab('ALL')}
        >
          All Rounds
        </button>
        <button
          className={`bracket-nav-btn ${activeRoundTab === 'R32' ? 'active' : ''}`}
          onClick={() => setActiveRoundTab('R32')}
        >
          Round of 32
        </button>
        <button
          className={`bracket-nav-btn ${activeRoundTab === 'R16' ? 'active' : ''}`}
          onClick={() => setActiveRoundTab('R16')}
        >
          Round of 16
        </button>
        <button
          className={`bracket-nav-btn ${activeRoundTab === 'QF' ? 'active' : ''}`}
          onClick={() => setActiveRoundTab('QF')}
        >
          Quarter-finals
        </button>
        <button
          className={`bracket-nav-btn ${activeRoundTab === 'SF' ? 'active' : ''}`}
          onClick={() => setActiveRoundTab('SF')}
        >
          Semi-finals
        </button>
        <button
          className={`bracket-nav-btn ${activeRoundTab === 'FINALS' ? 'active' : ''}`}
          onClick={() => setActiveRoundTab('FINALS')}
        >
          Finals
        </button>
      </div>

      <div className="instruction-bubble">
        💡 <strong>Knockout stage tips:</strong> Enter normal time score. If the game ends in a draw, 
        dashed yellow <strong>PK</strong> (Penalty Kick) input boxes will appear. Enter penalty scores 
        there to break the tie and advance the winner!
      </div>

      <div className="bracket-scroller">
        <div className="bracket-tree-wrapper">
          {/* Round of 32 */}
          {showColumn('R32') && (
            <div className="bracket-column">
              <h4 className="round-title-banner">Round of 32</h4>
              {r32Matches.map((m, idx) => {
                // Determine placeholders based on official bracket seeds
                const seeds = [
                  ['2A', '2B'],
                  ['1E', '3rd A/B/C/D/F'],
                  ['1F', '2C'],
                  ['1C', '2F'],
                  ['1I', '3rd C/D/F/G/H'],
                  ['2E', '2I'],
                  ['1A', '3rd C/E/F/H/I'],
                  ['1L', '3rd E/H/I/J/K'],
                  ['1D', '3rd B/E/F/I/J'],
                  ['1G', '3rd A/E/H/I/J'],
                  ['2K', '2L'],
                  ['1H', '2J'],
                  ['1B', '3rd E/F/G/I/J'],
                  ['1J', '2H'],
                  ['1K', '3rd D/E/I/J/L'],
                  ['2D', '2G'],
                ];
                return renderMatchCard(m, seeds[idx][0], seeds[idx][1]);
              })}
            </div>
          )}

          {/* Round of 16 */}
          {showColumn('R16') && (
            <div className="bracket-column">
              <h4 className="round-title-banner">Round of 16</h4>
              {r16Matches.map((m, idx) => {
                const parents = [
                  ['Winner M74', 'Winner M77'],
                  ['Winner M73', 'Winner M75'],
                  ['Winner M76', 'Winner M78'],
                  ['Winner M92', 'Winner M80'], // Winner M79 vs Winner M80
                  ['Winner M83', 'Winner M84'],
                  ['Winner M81', 'Winner M82'],
                  ['Winner M86', 'Winner M88'],
                  ['Winner M85', 'Winner M87'],
                ];
                // Wait, let's fix parent 4: match 92 has home Winner M79, away Winner M80
                const homeLabel = idx === 3 ? 'Winner M79' : parents[idx][0];
                return renderMatchCard(m, homeLabel, parents[idx][1]);
              })}
            </div>
          )}

          {/* Quarter-finals */}
          {showColumn('QF') && (
            <div className="bracket-column">
              <h4 className="round-title-banner">Quarter-finals</h4>
              {qfMatches.map((m, idx) => {
                const parents = [
                  ['Winner M89', 'Winner M90'],
                  ['Winner M93', 'Winner M94'],
                  ['Winner M91', 'Winner M92'],
                  ['Winner M95', 'Winner M96'],
                ];
                return renderMatchCard(m, parents[idx][0], parents[idx][1]);
              })}
            </div>
          )}

          {/* Semi-finals */}
          {showColumn('SF') && (
            <div className="bracket-column">
              <h4 className="round-title-banner">Semi-finals</h4>
              {sfMatches.map((m, idx) => {
                const parents = [
                  ['Winner M97', 'Winner M98'],
                  ['Winner M99', 'Winner M100'],
                ];
                return renderMatchCard(m, parents[idx][0], parents[idx][1]);
              })}
            </div>
          )}

          {/* Finals & Champion */}
          {showColumn('FINALS') && (
            <div className="bracket-column" style={{ justifyContent: 'center', gap: '30px' }}>
              <div>
                <h4 className="round-title-banner" style={{ borderBottom: 'none' }}>Championship</h4>
                {finalMatch && renderMatchCard(finalMatch, 'Winner M101', 'Winner M102')}
              </div>

              {/* Champion Box */}
              {championTeam ? (
                <div 
                  className="glass-card animate-slideup" 
                  style={{
                    padding: '20px', 
                    textAlign: 'center',
                    border: '2px solid var(--accent-gold)',
                    background: 'radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(0,0,0,0.4) 100%)',
                    boxShadow: '0 0 25px var(--accent-gold-glow)'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏆</div>
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-gold)' }}>
                    World Cup Champion
                  </h3>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{championTeam.flag}</span>
                    <span>{championTeam.name}</span>
                  </div>
                </div>
              ) : (
                <div 
                  className="glass-card" 
                  style={{
                    padding: '20px', 
                    textAlign: 'center',
                    opacity: 0.4,
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>🏆</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px', color: 'var(--text-dim)' }}>
                    Championship Undecided
                  </div>
                </div>
              )}

              <div>
                <h4 className="round-title-banner" style={{ marginTop: '20px' }}>3rd Place Play-off</h4>
                {thirdPlaceMatch && renderMatchCard(thirdPlaceMatch, 'Loser M101', 'Loser M102')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default KnockoutBracket;

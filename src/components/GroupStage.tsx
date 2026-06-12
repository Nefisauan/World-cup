import { GROUPS_DATA } from '../data/teams';
import type { Match } from '../data/teams';
import { calculateGroupStandings } from '../utils/tournamentLogic';
import type { GroupStanding } from '../utils/tournamentLogic';

interface GroupStageProps {
  matches: Match[];
  customStandingsOrder: { [groupId: string]: string[] };
  updateMatchScore: (matchId: string, homeScore: number | undefined, awayScore: number | undefined) => void;
  updateCustomStandingsOrder: (groupId: string, teamIds: string[]) => void;
  isReadOnly?: boolean;
}

export const GroupStage: React.FC<GroupStageProps> = ({
  matches,
  customStandingsOrder,
  updateMatchScore,
  updateCustomStandingsOrder,
  isReadOnly = false,
}) => {

  const handleScoreChange = (
    matchId: string,
    side: 'home' | 'away',
    val: string
  ) => {
    const score = val === '' ? undefined : parseInt(val, 10);
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    if (side === 'home') {
      updateMatchScore(matchId, score, match.awayScore);
    } else {
      updateMatchScore(matchId, match.homeScore, score);
    }
  };

  const handleReorder = (
    groupId: string,
    standingsList: GroupStanding[],
    index: number,
    direction: 'up' | 'down'
  ) => {
    const currentOrder = standingsList.map((s) => s.teamId);
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    // Swap elements
    const newOrder = [...currentOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    updateCustomStandingsOrder(groupId, newOrder);
  };

  return (
    <div className="groups-grid">
      {GROUPS_DATA.map((group) => {
        // Calculate sorted standings for this group
        const order = customStandingsOrder[group.id];
        const standings = calculateGroupStandings(matches, group.id, order);

        // Filter group matches
        const groupMatches = matches.filter(
          (m) => m.group === group.id && m.stage === 'group'
        );

        return (
          <div key={group.id} className="glass-card group-card animate-slideup">
            <div className="group-header">
              <h3 className="group-title">{group.name}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Drag or use arrows to order
              </span>
            </div>

            {/* Standings Table */}
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="align-left">Pos / Team</th>
                  <th>MP</th>
                  <th>GD</th>
                  <th>GF</th>
                  <th className="cell-bold">Pts</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, idx) => {
                  const team = group.teams.find((t) => t.id === standing.teamId);
                  if (!team) return null;

                  // Define qualification CSS class
                  let qualifyClass = 'no-qualify';
                  if (idx < 2) qualifyClass = 'qualify-top2';
                  else if (idx === 2) qualifyClass = 'qualify-third';

                  return (
                    <tr
                      key={standing.teamId}
                      className={`standings-row ${qualifyClass}`}
                    >
                      <td className="align-left">
                        <div className="team-info">
                          <span className="position-badge">{idx + 1}</span>
                          <span className="team-flag">{team.flag}</span>
                          <span className="team-name-text" title={team.name}>
                            {team.id}
                          </span>
                        </div>
                      </td>
                      <td>{standing.played}</td>
                      <td>{standing.gd > 0 ? `+${standing.gd}` : standing.gd}</td>
                      <td>{standing.gf}</td>
                      <td className="cell-bold">{standing.points}</td>
                      <td>
                        {!isReadOnly && (
                          <div className="reorder-btns">
                            <button
                              className="reorder-btn"
                              disabled={idx === 0}
                              onClick={() => handleReorder(group.id, standings, idx, 'up')}
                              title="Move Team Up"
                            >
                              ▲
                            </button>
                            <button
                              className="reorder-btn"
                              disabled={idx === 3}
                              onClick={() => handleReorder(group.id, standings, idx, 'down')}
                              title="Move Team Down"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Matches List */}
            <div className="group-matches">
              {groupMatches.map((match) => {
                const homeTeamObj = group.teams.find((t) => t.id === match.homeTeam);
                const awayTeamObj = group.teams.find((t) => t.id === match.awayTeam);
                if (!homeTeamObj || !awayTeamObj) return null;

                return (
                  <div key={match.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="match-row-item">
                      <div className="match-team">
                        <span className="team-flag">{homeTeamObj.flag}</span>
                        <span>{homeTeamObj.name}</span>
                      </div>

                      <div className="match-score-inputs">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          className="score-input"
                          value={match.homeScore === undefined ? '' : match.homeScore}
                          onChange={(e) =>
                            handleScoreChange(match.id, 'home', e.target.value)
                          }
                          placeholder="-"
                          disabled={isReadOnly}
                        />
                        <span className="score-divider">:</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          className="score-input"
                          value={match.awayScore === undefined ? '' : match.awayScore}
                          onChange={(e) =>
                            handleScoreChange(match.id, 'away', e.target.value)
                          }
                          placeholder="-"
                          disabled={isReadOnly}
                        />
                      </div>

                      <div className="match-team away">
                        <span>{awayTeamObj.name}</span>
                        <span className="team-flag">{awayTeamObj.flag}</span>
                      </div>
                    </div>
                    <div className="match-meta-info">
                      <span>{match.date}</span>
                      <span>{match.venue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default GroupStage;

import { GROUPS_DATA, initialKnockoutMatches } from '../data/teams';
import type { Match } from '../data/teams';

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

// Calculates group standings based on matches and optional custom ordering override
export const calculateGroupStandings = (
  matches: Match[],
  groupId: string,
  customOrder?: string[]
): GroupStanding[] => {
  const group = GROUPS_DATA.find((g) => g.id === groupId);
  if (!group) return [];

  // Initialize standings
  const standings: { [teamId: string]: GroupStanding } = {};
  group.teams.forEach((team) => {
    standings[team.id] = {
      teamId: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    };
  });

  // Calculate based on matches
  const groupMatches = matches.filter((m) => m.group === groupId && m.stage === 'group');
  groupMatches.forEach((match) => {
    const { homeTeam, awayTeam, homeScore, awayScore } = match;
    if (homeTeam && awayTeam && homeScore !== undefined && awayScore !== undefined) {
      const home = standings[homeTeam];
      const away = standings[awayTeam];

      if (home && away) {
        home.played += 1;
        away.played += 1;
        home.gf += homeScore;
        home.ga += awayScore;
        away.gf += awayScore;
        away.ga += homeScore;

        if (homeScore > awayScore) {
          home.won += 1;
          home.points += 3;
          away.lost += 1;
        } else if (homeScore < awayScore) {
          away.won += 1;
          away.points += 3;
          home.lost += 1;
        } else {
          home.drawn += 1;
          home.points += 1;
          away.drawn += 1;
          away.points += 1;
        }

        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
      }
    }
  });

  const standingsList = Object.values(standings);

  // If a manual user override order is provided, sort strictly by that order.
  // This allows the user to reorder the standings manually.
  if (customOrder && customOrder.length === 4) {
    return [...standingsList].sort((a, b) => {
      return customOrder.indexOf(a.teamId) - customOrder.indexOf(b.teamId);
    });
  }

  // Otherwise, sort by standard FIFA tournament tiebreaker rules
  return [...standingsList].sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal Difference
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 3. Goals For (GF)
    if (b.gf !== a.gf) return b.gf - a.gf;
    
    // 4. Fallback to alphabetical team name
    const teamAName = group.teams.find((t) => t.id === a.teamId)?.name || '';
    const teamBName = group.teams.find((t) => t.id === b.teamId)?.name || '';
    return teamAName.localeCompare(teamBName);
  });
};

export interface ThirdPlaceStanding extends GroupStanding {
  groupId: string;
}

// Gathers the 3rd-placed team from each of the 12 groups and ranks them
export const calculateThirdPlacesRankings = (
  allStandings: { [groupId: string]: GroupStanding[] }
): ThirdPlaceStanding[] => {
  const thirdPlaces: ThirdPlaceStanding[] = [];

  Object.entries(allStandings).forEach(([groupId, standingsList]) => {
    // Group stage has 4 teams, 3rd place is index 2
    if (standingsList.length >= 3) {
      thirdPlaces.push({
        ...standingsList[2],
        groupId,
      });
    }
  });

  // Sort them to find the best 8
  return thirdPlaces.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal Difference
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 3. Goals For
    if (b.gf !== a.gf) return b.gf - a.gf;
    // 4. Fallback: Alphabetical Group Letter
    return a.groupId.localeCompare(b.groupId);
  });
};

interface ThirdPlaceMatchConfig {
  matchId: string;
  allowedGroups: string[];
}

// Backtracking solver to assign 8 qualified 3rd-placed teams to their 8 bracket matchups
export const allocateThirdPlacesToKnockouts = (
  qualifiedGroupLetters: string[] // e.g. ['A', 'C', 'D', 'E', 'F', 'H', 'I', 'J']
): { [matchId: string]: string } | null => {
  const matchConfigs: ThirdPlaceMatchConfig[] = [
    { matchId: 'match-74', allowedGroups: ['A', 'B', 'C', 'D', 'F'] },
    { matchId: 'match-77', allowedGroups: ['C', 'D', 'F', 'G', 'H'] },
    { matchId: 'match-79', allowedGroups: ['C', 'E', 'F', 'H', 'I'] },
    { matchId: 'match-80', allowedGroups: ['E', 'H', 'I', 'J', 'K'] },
    { matchId: 'match-81', allowedGroups: ['B', 'E', 'F', 'I', 'J'] },
    { matchId: 'match-82', allowedGroups: ['A', 'E', 'H', 'I', 'J'] },
    { matchId: 'match-85', allowedGroups: ['E', 'F', 'G', 'I', 'J'] },
    { matchId: 'match-87', allowedGroups: ['D', 'E', 'I', 'J', 'L'] },
  ];

  const result: { [matchId: string]: string } = {};
  const usedGroups = new Set<string>();

  const backtrack = (configIdx: number): boolean => {
    if (configIdx === matchConfigs.length) return true;

    const config = matchConfigs[configIdx];
    for (const groupLetter of qualifiedGroupLetters) {
      if (!usedGroups.has(groupLetter) && config.allowedGroups.includes(groupLetter)) {
        usedGroups.add(groupLetter);
        result[config.matchId] = groupLetter;

        if (backtrack(configIdx + 1)) return true;

        usedGroups.delete(groupLetter);
        delete result[config.matchId];
      }
    }
    return false;
  };

  // Sort alphabetically to guarantee a deterministic matching order
  const sortedQualified = [...qualifiedGroupLetters].sort();
  if (backtrack(0)) {
    return result;
  }

  // Fallback: If backtracking fails due to extreme custom standings combos,
  // we do a greedy assignment as a fail-safe.
  const fallbackResult: { [matchId: string]: string } = {};
  const fallbackUsed = new Set<string>();
  matchConfigs.forEach((config) => {
    const available = sortedQualified.find(
      (g) => !fallbackUsed.has(g) && config.allowedGroups.includes(g)
    );
    if (available) {
      fallbackResult[config.matchId] = available;
      fallbackUsed.add(available);
    } else {
      // Direct fallback: pick any unused qualified group
      const directUnused = sortedQualified.find((g) => !fallbackUsed.has(g));
      if (directUnused) {
        fallbackResult[config.matchId] = directUnused;
        fallbackUsed.add(directUnused);
      }
    }
  });

  return fallbackResult;
};

// Main function to resolve who plays whom in the Round of 32
export const resolveRoundOf32Matchups = (
  groupStandings: { [groupId: string]: GroupStanding[] },
  thirdPlacesRanked: ThirdPlaceStanding[]
): { [matchId: string]: string } => {
  const matchups: { [matchId: string]: string } = {};

  // 1. Assign fixed 1st and 2nd place pairings
  // Match 73: 2A vs 2B
  matchups['match-73-home'] = groupStandings['A']?.[1]?.teamId || '';
  matchups['match-73-away'] = groupStandings['B']?.[1]?.teamId || '';

  // Match 75: 1F vs 2C
  matchups['match-75-home'] = groupStandings['F']?.[0]?.teamId || '';
  matchups['match-75-away'] = groupStandings['C']?.[1]?.teamId || '';

  // Match 76: 1C vs 2F
  matchups['match-76-home'] = groupStandings['C']?.[0]?.teamId || '';
  matchups['match-76-away'] = groupStandings['F']?.[1]?.teamId || '';

  // Match 78: 2E vs 2I
  matchups['match-78-home'] = groupStandings['E']?.[1]?.teamId || '';
  matchups['match-78-away'] = groupStandings['I']?.[1]?.teamId || '';

  // Match 83: 2K vs 2L
  matchups['match-83-home'] = groupStandings['K']?.[1]?.teamId || '';
  matchups['match-83-away'] = groupStandings['L']?.[1]?.teamId || '';

  // Match 84: 1H vs 2J
  matchups['match-84-home'] = groupStandings['H']?.[0]?.teamId || '';
  matchups['match-84-away'] = groupStandings['J']?.[1]?.teamId || '';

  // Match 86: 1J vs 2H
  matchups['match-86-home'] = groupStandings['J']?.[0]?.teamId || '';
  matchups['match-86-away'] = groupStandings['H']?.[1]?.teamId || '';

  // Match 88: 2D vs 2G
  matchups['match-88-home'] = groupStandings['D']?.[1]?.teamId || '';
  matchups['match-88-away'] = groupStandings['G']?.[1]?.teamId || '';

  // Fixed winners mapping
  // Match 74: 1E vs 3rd
  matchups['match-74-home'] = groupStandings['E']?.[0]?.teamId || '';
  // Match 77: 1I vs 3rd
  matchups['match-77-home'] = groupStandings['I']?.[0]?.teamId || '';
  // Match 79: 1A vs 3rd
  matchups['match-79-home'] = groupStandings['A']?.[0]?.teamId || '';
  // Match 80: 1L vs 3rd
  matchups['match-80-home'] = groupStandings['L']?.[0]?.teamId || '';
  // Match 81: 1D vs 3rd
  matchups['match-81-home'] = groupStandings['D']?.[0]?.teamId || '';
  // Match 82: 1G vs 3rd
  matchups['match-82-home'] = groupStandings['G']?.[0]?.teamId || '';
  // Match 85: 1B vs 3rd
  matchups['match-85-home'] = groupStandings['B']?.[0]?.teamId || '';
  // Match 87: 1K vs 3rd
  matchups['match-87-home'] = groupStandings['K']?.[0]?.teamId || '';

  // 2. Resolve third-place assignments
  const qualifiedThirds = thirdPlacesRanked.slice(0, 8);
  const qualifiedGroupLetters = qualifiedThirds.map((t) => t.groupId);

  const thirdPlaceMapping = allocateThirdPlacesToKnockouts(qualifiedGroupLetters);

  if (thirdPlaceMapping) {
    Object.entries(thirdPlaceMapping).forEach(([matchId, groupId]) => {
      // The 3rd place team from this group goes as the away team
      const teamId = groupStandings[groupId]?.[2]?.teamId || '';
      matchups[`${matchId}-away`] = teamId;
    });
  }

  return matchups;
};

// Gets the winner of a knockout match, taking penalties into account if drawn
export const getMatchWinner = (match: Match): string | null => {
  const { homeTeam, awayTeam, homeScore, awayScore, homePenalties, awayPenalties } = match;
  if (!homeTeam || !awayTeam) return null;
  if (homeScore === undefined || awayScore === undefined) return null;

  if (homeScore > awayScore) return homeTeam;
  if (homeScore < awayScore) return awayTeam;

  // Penalties tiebreaker
  if (homePenalties !== undefined && awayPenalties !== undefined) {
    return homePenalties > awayPenalties ? homeTeam : awayTeam;
  }

  // Draw without penalties decided: fallback to home team temporarily
  return homeTeam;
};

// Gets the loser of a knockout match (needed for 3rd place play-off)
export const getMatchLoser = (match: Match): string | null => {
  const { homeTeam, awayTeam, homeScore, awayScore, homePenalties, awayPenalties } = match;
  if (!homeTeam || !awayTeam) return null;
  if (homeScore === undefined || awayScore === undefined) return null;

  if (homeScore > awayScore) return awayTeam;
  if (homeScore < awayScore) return homeTeam;

  if (homePenalties !== undefined && awayPenalties !== undefined) {
    return homePenalties > awayPenalties ? awayTeam : homeTeam;
  }

  return awayTeam;
};

// Main function to calculate all bracket rounds based on scores and standings
export const resolveKnockoutBracket = (
  groupStandings: { [groupId: string]: GroupStanding[] },
  thirdPlacesRanked: ThirdPlaceStanding[],
  knockoutScores: {
    [matchId: string]: {
      homeScore?: number;
      awayScore?: number;
      homePenalties?: number;
      awayPenalties?: number;
    };
  }
): Match[] => {
  // Create a deep copy of initialKnockoutMatches
  const matches = JSON.parse(JSON.stringify(initialKnockoutMatches)) as Match[];

  // Helper to get match by ID in our copied array
  const getMatch = (id: string) => matches.find((m) => m.id === id);

  // Apply scores
  matches.forEach((m) => {
    const scoreObj = knockoutScores[m.id];
    if (scoreObj) {
      m.homeScore = scoreObj.homeScore;
      m.awayScore = scoreObj.awayScore;
      m.homePenalties = scoreObj.homePenalties;
      m.awayPenalties = scoreObj.awayPenalties;
    }
  });

  // 2. Resolve R32 teams
  const r32Matchups = resolveRoundOf32Matchups(groupStandings, thirdPlacesRanked);
  
  // Update R32 team IDs in matches
  for (let id = 73; id <= 88; id++) {
    const m = getMatch(`match-${id}`);
    if (m) {
      m.homeTeam = r32Matchups[`match-${id}-home`] || null;
      m.awayTeam = r32Matchups[`match-${id}-away`] || null;
    }
  }

  // Helper to set team in next round
  const propagateWinner = (fromMatchId: string, toMatchId: string, slot: 'home' | 'away') => {
    const parent = getMatch(fromMatchId);
    const child = getMatch(toMatchId);
    if (parent && child) {
      const winner = getMatchWinner(parent);
      if (slot === 'home') child.homeTeam = winner;
      else child.awayTeam = winner;
    }
  };

  const propagateLoser = (fromMatchId: string, toMatchId: string, slot: 'home' | 'away') => {
    const parent = getMatch(fromMatchId);
    const child = getMatch(toMatchId);
    if (parent && child) {
      const loser = getMatchLoser(parent);
      if (slot === 'home') child.homeTeam = loser;
      else child.awayTeam = loser;
    }
  };

  // 3. Resolve Round of 16
  propagateWinner('match-74', 'match-89', 'home');
  propagateWinner('match-77', 'match-89', 'away');

  propagateWinner('match-73', 'match-90', 'home');
  propagateWinner('match-75', 'match-90', 'away');

  propagateWinner('match-76', 'match-91', 'home');
  propagateWinner('match-78', 'match-91', 'away');

  propagateWinner('match-79', 'match-92', 'home');
  propagateWinner('match-80', 'match-92', 'away');

  propagateWinner('match-83', 'match-93', 'home');
  propagateWinner('match-84', 'match-93', 'away');

  propagateWinner('match-81', 'match-94', 'home');
  propagateWinner('match-82', 'match-94', 'away');

  propagateWinner('match-86', 'match-95', 'home');
  propagateWinner('match-88', 'match-95', 'away');

  propagateWinner('match-85', 'match-96', 'home');
  propagateWinner('match-87', 'match-96', 'away');

  // 4. Resolve Quarter-finals
  propagateWinner('match-89', 'match-97', 'home');
  propagateWinner('match-90', 'match-97', 'away');

  propagateWinner('match-93', 'match-98', 'home');
  propagateWinner('match-94', 'match-98', 'away');

  propagateWinner('match-91', 'match-99', 'home');
  propagateWinner('match-92', 'match-99', 'away');

  propagateWinner('match-95', 'match-100', 'home');
  propagateWinner('match-96', 'match-100', 'away');

  // 5. Resolve Semi-finals
  propagateWinner('match-97', 'match-101', 'home');
  propagateWinner('match-98', 'match-101', 'away');

  propagateWinner('match-99', 'match-102', 'home');
  propagateWinner('match-100', 'match-102', 'away');

  // 6. Resolve Third Place & Final
  propagateLoser('match-101', 'match-103', 'home');
  propagateLoser('match-102', 'match-103', 'away');

  propagateWinner('match-101', 'match-104', 'home');
  propagateWinner('match-102', 'match-104', 'away');

  return matches;
};

export interface PointsBreakdown {
  groupScorePoints: number;
  knockoutScorePoints: number;
  progressionPoints: number;
  totalPoints: number;
}

export const calculatePredictionPoints = (
  predMatches: Match[],
  predKoMatches: Match[],
  refMatches: Match[],
  refKoMatches: Match[]
): PointsBreakdown => {
  let groupScorePoints = 0;
  let knockoutScorePoints = 0;
  let progressionPoints = 0;

  // 1. Group Stage Points
  refMatches.forEach((refM) => {
    if (refM.stage !== 'group') return;
    const predM = predMatches.find((m) => m.id === refM.id);
    if (!predM) return;

    if (
      refM.homeScore !== undefined &&
      refM.awayScore !== undefined &&
      predM.homeScore !== undefined &&
      predM.awayScore !== undefined
    ) {
      const refExact = refM.homeScore === predM.homeScore && refM.awayScore === predM.awayScore;
      if (refExact) {
        groupScorePoints += 3;
      } else {
        const refOutcome = Math.sign(refM.homeScore - refM.awayScore);
        const predOutcome = Math.sign(predM.homeScore - predM.awayScore);
        if (refOutcome === predOutcome) {
          groupScorePoints += 1;
        }
      }
    }
  });

  // 2. Knockout Match Score Points
  refKoMatches.forEach((refM) => {
    const predM = predKoMatches.find((m) => m.id === refM.id);
    if (!predM) return;

    if (
      refM.homeScore !== undefined &&
      refM.awayScore !== undefined &&
      predM.homeScore !== undefined &&
      predM.awayScore !== undefined
    ) {
      const refExact = refM.homeScore === predM.homeScore && refM.awayScore === predM.awayScore;
      if (refExact) {
        knockoutScorePoints += 5;
      } else {
        const refOutcome = Math.sign(refM.homeScore - refM.awayScore);
        const predOutcome = Math.sign(predM.homeScore - predM.awayScore);
        if (refOutcome === predOutcome) {
          knockoutScorePoints += 2;
        }
      }
    }
  });

  // Helper to extract clean team IDs (ignoring placeholders)
  const extractTeams = (matches: Match[], roundStages: string[]): Set<string> => {
    const teams = new Set<string>();
    matches.forEach((m) => {
      if (roundStages.includes(m.stage)) {
        if (m.homeTeam && !m.homeTeam.startsWith('Winner') && !m.homeTeam.startsWith('Loser') && !m.homeTeam.includes('/')) {
          teams.add(m.homeTeam);
        }
        if (m.awayTeam && !m.awayTeam.startsWith('Winner') && !m.awayTeam.startsWith('Loser') && !m.awayTeam.includes('/')) {
          teams.add(m.awayTeam);
        }
      }
    });
    return teams;
  };

  // Helper to get Champion ID from matches list
  const getChampion = (matches: Match[]): string | null => {
    const final = matches.find((m) => m.stage === 'final');
    if (!final) return null;
    return getMatchWinner(final);
  };

  // 3. Progression Points
  // Round of 16 (matches 89-96)
  const refR16 = extractTeams(refKoMatches, ['R16']);
  const predR16 = extractTeams(predKoMatches, ['R16']);
  predR16.forEach((t) => {
    if (refR16.has(t)) progressionPoints += 2;
  });

  // Quarter-finals (matches 97-100)
  const refQF = extractTeams(refKoMatches, ['QF']);
  const predQF = extractTeams(predKoMatches, ['QF']);
  predQF.forEach((t) => {
    if (refQF.has(t)) progressionPoints += 4;
  });

  // Semi-finals (matches 101-102)
  const refSF = extractTeams(refKoMatches, ['SF']);
  const predSF = extractTeams(predKoMatches, ['SF']);
  predSF.forEach((t) => {
    if (refSF.has(t)) progressionPoints += 8;
  });

  // Finalists (match 104)
  const refFinal = extractTeams(refKoMatches, ['final']);
  const predFinal = extractTeams(predKoMatches, ['final']);
  predFinal.forEach((t) => {
    if (refFinal.has(t)) progressionPoints += 12;
  });

  // Champion
  const refChamp = getChampion(refKoMatches);
  const predChamp = getChampion(predKoMatches);
  if (refChamp && predChamp && refChamp === predChamp && !refChamp.startsWith('Winner')) {
    progressionPoints += 20;
  }

  return {
    groupScorePoints,
    knockoutScorePoints,
    progressionPoints,
    totalPoints: groupScorePoints + knockoutScorePoints + progressionPoints,
  };
};


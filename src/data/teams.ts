export interface Team {
  id: string;
  name: string;
  flag: string;
  group: string;
}

export interface Group {
  id: string; // 'A' to 'L'
  name: string; // 'Group A' to 'Group L'
  teams: Team[];
}

export interface Match {
  id: string; // 'match-1' to 'match-104'
  group?: string; // 'A' to 'L' for group stage, undefined for knockouts
  stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'third-place' | 'final';
  homeTeam: string | null; // team ID or placeholder like 'Winner Match 74'
  awayTeam: string | null;
  homeScore?: number;
  awayScore?: number;
  homePenalties?: number; // for knockout tiebreakers
  awayPenalties?: number; // for knockout tiebreakers
  date: string;
  venue: string;
}

export const GROUPS_DATA: Group[] = [
  {
    id: 'A',
    name: 'Group A',
    teams: [
      { id: 'MEX', name: 'Mexico', flag: '🇲🇽', group: 'A' },
      { id: 'RSA', name: 'South Africa', flag: '🇿🇦', group: 'A' },
      { id: 'KOR', name: 'Korea Republic', flag: '🇰🇷', group: 'A' },
      { id: 'CZE', name: 'Czechia', flag: '🇨🇿', group: 'A' },
    ],
  },
  {
    id: 'B',
    name: 'Group B',
    teams: [
      { id: 'CAN', name: 'Canada', flag: '🇨🇦', group: 'B' },
      { id: 'SUI', name: 'Switzerland', flag: '🇨🇭', group: 'B' },
      { id: 'QAT', name: 'Qatar', flag: '🇶🇦', group: 'B' },
      { id: 'BIH', name: 'Bosnia and Herzegovina', flag: '🇧🇦', group: 'B' },
    ],
  },
  {
    id: 'C',
    name: 'Group C',
    teams: [
      { id: 'BRA', name: 'Brazil', flag: '🇧🇷', group: 'C' },
      { id: 'MAR', name: 'Morocco', flag: '🇲🇦', group: 'C' },
      { id: 'HTI', name: 'Haiti', flag: '🇭🇹', group: 'C' },
      { id: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
    ],
  },
  {
    id: 'D',
    name: 'Group D',
    teams: [
      { id: 'USA', name: 'United States', flag: '🇺🇸', group: 'D' },
      { id: 'PAR', name: 'Paraguay', flag: '🇵🇾', group: 'D' },
      { id: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'D' },
      { id: 'TUR', name: 'Türkiye', flag: '🇹🇷', group: 'D' },
    ],
  },
  {
    id: 'E',
    name: 'Group E',
    teams: [
      { id: 'GER', name: 'Germany', flag: '🇩🇪', group: 'E' },
      { id: 'CUW', name: 'Curaçao', flag: '🇨🇼', group: 'E' },
      { id: 'CIV', name: 'Côte d\'Ivoire', flag: '🇨🇮', group: 'E' },
      { id: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'E' },
    ],
  },
  {
    id: 'F',
    name: 'Group F',
    teams: [
      { id: 'NED', name: 'Netherlands', flag: '🇳🇱', group: 'F' },
      { id: 'JPN', name: 'Japan', flag: '🇯🇵', group: 'F' },
      { id: 'TUN', name: 'Tunisia', flag: '🇹🇳', group: 'F' },
      { id: 'SWE', name: 'Sweden', flag: '🇸🇪', group: 'F' },
    ],
  },
  {
    id: 'G',
    name: 'Group G',
    teams: [
      { id: 'BEL', name: 'Belgium', flag: '🇧🇪', group: 'G' },
      { id: 'EGY', name: 'Egypt', flag: '🇪🇬', group: 'G' },
      { id: 'IRN', name: 'Iran', flag: '🇮🇷', group: 'G' },
      { id: 'NZL', name: 'New Zealand', flag: '🇳🇿', group: 'G' },
    ],
  },
  {
    id: 'H',
    name: 'Group H',
    teams: [
      { id: 'ESP', name: 'Spain', flag: '🇪🇸', group: 'H' },
      { id: 'CPV', name: 'Cabo Verde', flag: '🇨🇻', group: 'H' },
      { id: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', group: 'H' },
      { id: 'URU', name: 'Uruguay', flag: '🇺🇾', group: 'H' },
    ],
  },
  {
    id: 'I',
    name: 'Group I',
    teams: [
      { id: 'FRA', name: 'France', flag: '🇫🇷', group: 'I' },
      { id: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'I' },
      { id: 'NOR', name: 'Norway', flag: '🇳🇴', group: 'I' },
      { id: 'IRQ', name: 'Iraq', flag: '🇮🇶', group: 'I' },
    ],
  },
  {
    id: 'J',
    name: 'Group J',
    teams: [
      { id: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'J' },
      { id: 'ALG', name: 'Algeria', flag: '🇩🇿', group: 'J' },
      { id: 'AUT', name: 'Austria', flag: '🇦🇹', group: 'J' },
      { id: 'JOR', name: 'Jordan', flag: '🇯🇴', group: 'J' },
    ],
  },
  {
    id: 'K',
    name: 'Group K',
    teams: [
      { id: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'K' },
      { id: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', group: 'K' },
      { id: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'K' },
      { id: 'COD', name: 'Congo DR', flag: '🇨🇩', group: 'K' },
    ],
  },
  {
    id: 'L',
    name: 'Group L',
    teams: [
      { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
      { id: 'CRO', name: 'Croatia', flag: '🇭🇷', group: 'L' },
      { id: 'GHA', name: 'Ghana', flag: '🇬🇭', group: 'L' },
      { id: 'PAN', name: 'Panama', flag: '🇵🇦', group: 'L' },
    ],
  },
];

// Helper to get a team object by ID
export const getTeamById = (id: string): Team | undefined => {
  for (const group of GROUPS_DATA) {
    const team = group.teams.find((t) => t.id === id);
    if (team) return team;
  }
  return undefined;
};

// Generate the 72 group stage matches dynamically
export const generateGroupMatches = (): Match[] => {
  const matches: Match[] = [];
  let matchCounter = 1;

  GROUPS_DATA.forEach((group) => {
    const [t1, t2, t3, t4] = group.teams;
    
    // Standard round-robin pairings
    const pairings = [
      { home: t1.id, away: t2.id, date: 'June 12', venue: 'Los Angeles / Mexico City' },
      { home: t3.id, away: t4.id, date: 'June 13', venue: 'Boston / Toronto' },
      { home: t1.id, away: t3.id, date: 'June 17', venue: 'Dallas / Houston' },
      { home: t2.id, away: t4.id, date: 'June 18', venue: 'San Francisco / Seattle' },
      { home: t4.id, away: t1.id, date: 'June 22', venue: 'Miami / New York' },
      { home: t2.id, away: t3.id, date: 'June 23', venue: 'Kansas City / Atlanta' },
    ];

    pairings.forEach((p) => {
      matches.push({
        id: `match-${matchCounter++}`,
        group: group.id,
        stage: 'group',
        homeTeam: p.home,
        awayTeam: p.away,
        date: p.date,
        venue: p.venue,
      });
    });
  });

  return matches;
};

// Initialize empty knockout matches (placeholder names before teams qualify)
export const initialKnockoutMatches: Match[] = [
  // Round of 32
  { id: 'match-73', stage: 'R32', homeTeam: '2A', awayTeam: '2B', date: 'June 28', venue: 'Los Angeles' },
  { id: 'match-74', stage: 'R32', homeTeam: '1E', awayTeam: '3rd A/B/C/D/F', date: 'June 29', venue: 'Boston' },
  { id: 'match-75', stage: 'R32', homeTeam: '1F', awayTeam: '2C', date: 'June 29', venue: 'Monterrey' },
  { id: 'match-76', stage: 'R32', homeTeam: '1C', awayTeam: '2F', date: 'June 29', venue: 'Houston' },
  { id: 'match-77', stage: 'R32', homeTeam: '1I', awayTeam: '3rd C/D/F/G/H', date: 'June 30', venue: 'New York/NJ' },
  { id: 'match-78', stage: 'R32', homeTeam: '2E', awayTeam: '2I', date: 'June 30', venue: 'Dallas' },
  { id: 'match-79', stage: 'R32', homeTeam: '1A', awayTeam: '3rd C/E/F/H/I', date: 'June 30', venue: 'Mexico City' },
  { id: 'match-80', stage: 'R32', homeTeam: '1L', awayTeam: '3rd E/H/I/J/K', date: 'June 30', venue: 'Atlanta' },
  { id: 'match-81', stage: 'R32', homeTeam: '1D', awayTeam: '3rd B/E/F/I/J', date: 'July 1', venue: 'San Francisco' },
  { id: 'match-82', stage: 'R32', homeTeam: '1G', awayTeam: '3rd A/E/H/I/J', date: 'July 1', venue: 'Seattle' },
  { id: 'match-83', stage: 'R32', homeTeam: '2K', awayTeam: '2L', date: 'July 2', venue: 'Toronto' },
  { id: 'match-84', stage: 'R32', homeTeam: '1H', awayTeam: '2J', date: 'July 2', venue: 'Los Angeles' },
  { id: 'match-85', stage: 'R32', homeTeam: '1B', awayTeam: '3rd E/F/G/I/J', date: 'July 2', venue: 'Vancouver' },
  { id: 'match-86', stage: 'R32', homeTeam: '1J', awayTeam: '2H', date: 'July 3', venue: 'Miami' },
  { id: 'match-87', stage: 'R32', homeTeam: '1K', awayTeam: '3rd D/E/I/J/L', date: 'July 3', venue: 'Kansas City' },
  { id: 'match-88', stage: 'R32', homeTeam: '2D', awayTeam: '2G', date: 'July 3', venue: 'Dallas' },

  // Round of 16
  { id: 'match-89', stage: 'R16', homeTeam: 'Winner Match 74', awayTeam: 'Winner Match 77', date: 'July 4', venue: 'Philadelphia' },
  { id: 'match-90', stage: 'R16', homeTeam: 'Winner Match 73', awayTeam: 'Winner Match 75', date: 'July 4', venue: 'Houston' },
  { id: 'match-91', stage: 'R16', homeTeam: 'Winner Match 76', awayTeam: 'Winner Match 78', date: 'July 5', venue: 'New York/NJ' },
  { id: 'match-92', stage: 'R16', homeTeam: 'Winner Match 79', awayTeam: 'Winner Match 80', date: 'July 5', venue: 'Mexico City' },
  { id: 'match-93', stage: 'R16', homeTeam: 'Winner Match 83', awayTeam: 'Winner Match 84', date: 'July 6', venue: 'Dallas' },
  { id: 'match-94', stage: 'R16', homeTeam: 'Winner Match 81', awayTeam: 'Winner Match 82', date: 'July 6', venue: 'Seattle' },
  { id: 'match-95', stage: 'R16', homeTeam: 'Winner Match 86', awayTeam: 'Winner Match 88', date: 'July 7', venue: 'Atlanta' },
  { id: 'match-96', stage: 'R16', homeTeam: 'Winner Match 85', awayTeam: 'Winner Match 87', date: 'July 7', venue: 'Vancouver' },

  // Quarter-finals
  { id: 'match-97', stage: 'QF', homeTeam: 'Winner Match 89', awayTeam: 'Winner Match 90', date: 'July 9', venue: 'Boston' },
  { id: 'match-98', stage: 'QF', homeTeam: 'Winner Match 93', awayTeam: 'Winner Match 94', date: 'July 10', venue: 'Los Angeles' },
  { id: 'match-99', stage: 'QF', homeTeam: 'Winner Match 91', awayTeam: 'Winner Match 92', date: 'July 11', venue: 'Miami' },
  { id: 'match-100', stage: 'QF', homeTeam: 'Winner Match 95', awayTeam: 'Winner Match 96', date: 'July 11', venue: 'Kansas City' },

  // Semi-finals
  { id: 'match-101', stage: 'SF', homeTeam: 'Winner Match 97', awayTeam: 'Winner Match 98', date: 'July 14', venue: 'Dallas' },
  { id: 'match-102', stage: 'SF', homeTeam: 'Winner Match 99', awayTeam: 'Winner Match 100', date: 'July 15', venue: 'Atlanta' },

  // Third Place Match
  { id: 'match-103', stage: 'third-place', homeTeam: 'Loser Match 101', awayTeam: 'Loser Match 102', date: 'July 18', venue: 'Miami' },

  // Final
  { id: 'match-104', stage: 'final', homeTeam: 'Winner Match 101', awayTeam: 'Winner Match 102', date: 'July 19', venue: 'New York/NJ' },
];

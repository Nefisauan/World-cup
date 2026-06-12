import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GroupStage from './components/GroupStage';
import ThirdPlacesTable from './components/ThirdPlacesTable';
import KnockoutBracket from './components/KnockoutBracket';
import Leaderboard from './components/Leaderboard';
import type { LeaderboardEntry } from './components/Leaderboard';
import { GROUPS_DATA, generateGroupMatches } from './data/teams';
import type { Match } from './data/teams';
import {
  calculateGroupStandings,
  calculateThirdPlacesRankings,
  resolveKnockoutBracket,
  resolveRoundOf32Matchups,
  calculatePredictionPoints,
} from './utils/tournamentLogic';
import type { GroupStanding } from './utils/tournamentLogic';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'thirds' | 'bracket' | 'leaderboard'>('groups');
  
  // Profile management states
  const [profiles, setProfiles] = useState<string[]>(() => {
    const saved = localStorage.getItem('wc26_profiles');
    return saved ? JSON.parse(saved) : ['Default'];
  });

  const [activeProfile, setActiveProfile] = useState<string>(() => {
    const saved = localStorage.getItem('wc26_active_profile');
    return saved && saved !== '' ? saved : 'Default';
  });

  // Reference profile for leaderboard comparison
  const [referenceProfile, setReferenceProfile] = useState<string>(() => {
    const saved = localStorage.getItem('wc26_reference_profile');
    if (saved && saved !== '') return saved;
    // Fallback: try to select a profile with 'Official' or 'Actual' in it, otherwise default to first
    const savedProfilesList = localStorage.getItem('wc26_profiles');
    if (savedProfilesList) {
      const parsed: string[] = JSON.parse(savedProfilesList);
      const official = parsed.find(p => p.toLowerCase().includes('official') || p.toLowerCase().includes('actual'));
      if (official) return official;
    }
    return 'Default';
  });

  // Group Stage prediction state
  const [groupMatches, setGroupMatches] = useState<Match[]>(() => {
    const initialProfile = localStorage.getItem('wc26_active_profile') || 'Default';
    const saved = localStorage.getItem(`wc26_${initialProfile}_group_matches`);
    return saved ? JSON.parse(saved) : generateGroupMatches();
  });

  // Custom standings ordering overrides
  const [customStandingsOrder, setCustomStandingsOrder] = useState<{ [groupId: string]: string[] }>(() => {
    const initialProfile = localStorage.getItem('wc26_active_profile') || 'Default';
    const saved = localStorage.getItem(`wc26_${initialProfile}_custom_standings`);
    return saved ? JSON.parse(saved) : {};
  });

  // Knockout match scores predictions
  const [knockoutScores, setKnockoutScores] = useState<{
    [matchId: string]: {
      homeScore?: number;
      awayScore?: number;
      homePenalties?: number;
      awayPenalties?: number;
    };
  }>(() => {
    const initialProfile = localStorage.getItem('wc26_active_profile') || 'Default';
    const saved = localStorage.getItem(`wc26_${initialProfile}_knockout_scores`);
    return saved ? JSON.parse(saved) : {};
  });

  // Keep the profile names array in sync
  useEffect(() => {
    localStorage.setItem('wc26_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Sync reference profile state
  useEffect(() => {
    localStorage.setItem('wc26_reference_profile', referenceProfile);
  }, [referenceProfile]);

  // Profile Swapping Logic (synchronous to avoid state race conditions)
  const handleSwitchProfile = (profileName: string) => {
    setActiveProfile(profileName);
    localStorage.setItem('wc26_active_profile', profileName);

    // Synchronously fetch and load keys associated with the target profile
    const savedMatches = localStorage.getItem(`wc26_${profileName}_group_matches`);
    setGroupMatches(savedMatches ? JSON.parse(savedMatches) : generateGroupMatches());

    const savedStandings = localStorage.getItem(`wc26_${profileName}_custom_standings`);
    setCustomStandingsOrder(savedStandings ? JSON.parse(savedStandings) : {});

    const savedKo = localStorage.getItem(`wc26_${profileName}_knockout_scores`);
    setKnockoutScores(savedKo ? JSON.parse(savedKo) : {});
  };

  // Profile Creation
  const handleCreateProfile = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (profiles.includes(trimmed)) {
      alert('Profile name already exists!');
      return;
    }
    const nextProfiles = [...profiles, trimmed];
    setProfiles(nextProfiles);
    handleSwitchProfile(trimmed);
  };

  // Profile Deletion
  const handleDeleteProfile = (profileName: string) => {
    if (profiles.length <= 1) return;
    if (window.confirm(`Are you sure you want to delete profile "${profileName}"?`)) {
      const nextProfiles = profiles.filter((p) => p !== profileName);
      setProfiles(nextProfiles);

      // Clear localStorage entries for this profile
      localStorage.removeItem(`wc26_${profileName}_group_matches`);
      localStorage.removeItem(`wc26_${profileName}_custom_standings`);
      localStorage.removeItem(`wc26_${profileName}_knockout_scores`);

      // Fallback switch
      const fallback = nextProfiles[0];
      handleSwitchProfile(fallback);
      
      // Update reference profile if the deleted one was selected
      if (referenceProfile === profileName) {
        setReferenceProfile(fallback);
      }
    }
  };

  // JSON Export Predictions
  const handleExportJSON = () => {
    const dataToExport = {
      version: 'wc26-v1',
      profileName: activeProfile,
      groupMatches,
      customStandingsOrder,
      knockoutScores,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wc2026_bracket_${activeProfile.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Import Predictions
  const handleImportJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (parsed.version !== 'wc26-v1' || !parsed.groupMatches) {
        alert('Invalid file format. Please upload a valid WC 2026 predictions file.');
        return;
      }

      setGroupMatches(parsed.groupMatches);
      setCustomStandingsOrder(parsed.customStandingsOrder || {});
      setKnockoutScores(parsed.knockoutScores || {});

      // Save to localStorage immediately
      localStorage.setItem(`wc26_${activeProfile}_group_matches`, JSON.stringify(parsed.groupMatches));
      localStorage.setItem(`wc26_${activeProfile}_custom_standings`, JSON.stringify(parsed.customStandingsOrder || {}));
      localStorage.setItem(`wc26_${activeProfile}_knockout_scores`, JSON.stringify(parsed.knockoutScores || {}));

      alert('Predictions imported successfully into the current active profile!');
    } catch (e) {
      alert('Error parsing file. Please make sure it is a valid JSON file.');
    }
  };

  // Derived Standings
  const allGroupStandings: { [groupId: string]: GroupStanding[] } = {};
  GROUPS_DATA.forEach((group) => {
    const customOrder = customStandingsOrder[group.id];
    allGroupStandings[group.id] = calculateGroupStandings(groupMatches, group.id, customOrder);
  });

  // Derived Third Places
  const thirdPlaces = calculateThirdPlacesRankings(allGroupStandings);

  // Derived Knockout Matches
  const knockoutMatches = resolveKnockoutBracket(
    allGroupStandings,
    thirdPlaces,
    knockoutScores
  );

  // Helper to load and resolve target profile data for leaderboard comparison
  const getProfileResolvedData = (pName: string) => {
    let pMatches: Match[];
    let pCustomOrder: { [groupId: string]: string[] };
    let pKoScores: any;

    if (pName === activeProfile) {
      pMatches = groupMatches;
      pCustomOrder = customStandingsOrder;
      pKoScores = knockoutScores;
    } else {
      const savedMatches = localStorage.getItem(`wc26_${pName}_group_matches`);
      pMatches = savedMatches ? JSON.parse(savedMatches) : generateGroupMatches();

      const savedStandings = localStorage.getItem(`wc26_${pName}_custom_standings`);
      pCustomOrder = savedStandings ? JSON.parse(savedStandings) : {};

      const savedKo = localStorage.getItem(`wc26_${pName}_knockout_scores`);
      pKoScores = savedKo ? JSON.parse(savedKo) : {};
    }

    const standings: { [groupId: string]: GroupStanding[] } = {};
    GROUPS_DATA.forEach((group) => {
      standings[group.id] = calculateGroupStandings(pMatches, group.id, pCustomOrder[group.id]);
    });

    const thirdsList = calculateThirdPlacesRankings(standings);
    const koMatchesList = resolveKnockoutBracket(standings, thirdsList, pKoScores);

    return {
      matches: pMatches,
      koMatches: koMatchesList,
    };
  };

  // Generate Leaderboard Rankings
  const refData = getProfileResolvedData(referenceProfile);
  const leaderboardData: LeaderboardEntry[] = profiles.map((pName) => {
    const pData = getProfileResolvedData(pName);
    const points = calculatePredictionPoints(
      pData.matches,
      pData.koMatches,
      refData.matches,
      refData.koMatches
    );
    return {
      profileName: pName,
      points,
      isReference: pName === referenceProfile,
    };
  });

  // Sort Leaderboard: reference profile goes to bottom, competitors sorted by totalPoints desc
  leaderboardData.sort((a, b) => {
    if (a.isReference && !b.isReference) return 1;
    if (!a.isReference && b.isReference) return -1;
    
    if (b.points.totalPoints !== a.points.totalPoints) {
      return b.points.totalPoints - a.points.totalPoints;
    }
    return a.profileName.localeCompare(b.profileName);
  });

  // Calculate prediction progress percentage
  const getProgressPercent = (): number => {
    let completedCount = 0;

    groupMatches.forEach((m) => {
      if (m.homeScore !== undefined && m.awayScore !== undefined) {
        completedCount++;
      }
    });

    Object.values(knockoutScores).forEach((score) => {
      if (score.homeScore !== undefined && score.awayScore !== undefined) {
        completedCount++;
      }
    });

    return (completedCount / 104) * 100;
  };

  // Update score of a group stage match
  const updateMatchScore = (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined
  ) => {
    const nextMatches = groupMatches.map((m) =>
      m.id === matchId ? { ...m, homeScore, awayScore } : m
    );
    setGroupMatches(nextMatches);
    localStorage.setItem(`wc26_${activeProfile}_group_matches`, JSON.stringify(nextMatches));
  };

  // Update custom order of standings in a group (manual override)
  const updateCustomStandingsOrder = (groupId: string, teamIds: string[]) => {
    const nextStandingsOrder = {
      ...customStandingsOrder,
      [groupId]: teamIds,
    };
    setCustomStandingsOrder(nextStandingsOrder);
    localStorage.setItem(`wc26_${activeProfile}_custom_standings`, JSON.stringify(nextStandingsOrder));
  };

  // Update score of a knockout match
  const updateKnockoutScore = (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined,
    homePenalties?: number,
    awayPenalties?: number
  ) => {
    const nextScores = {
      ...knockoutScores,
      [matchId]: {
        homeScore,
        awayScore,
        homePenalties,
        awayPenalties,
      },
    };
    setKnockoutScores(nextScores);
    localStorage.setItem(`wc26_${activeProfile}_knockout_scores`, JSON.stringify(nextScores));
  };

  // Reset current profile's predictions
  const handleReset = () => {
    if (window.confirm(`Are you sure you want to clear predictions for profile "${activeProfile}"?`)) {
      const defaultMatches = generateGroupMatches();
      setGroupMatches(defaultMatches);
      setCustomStandingsOrder({});
      setKnockoutScores({});
      localStorage.removeItem(`wc26_${activeProfile}_group_matches`);
      localStorage.removeItem(`wc26_${activeProfile}_custom_standings`);
      localStorage.removeItem(`wc26_${activeProfile}_knockout_scores`);
    }
  };

  // Simulate Random Scores sequentially for current profile
  const handleRandomize = () => {
    const simulatedGroupMatches = generateGroupMatches().map((m) => {
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);
      return { ...m, homeScore, awayScore };
    });
    setGroupMatches(simulatedGroupMatches);
    setCustomStandingsOrder({}); // Clear overrides
    localStorage.setItem(`wc26_${activeProfile}_group_matches`, JSON.stringify(simulatedGroupMatches));
    localStorage.setItem(`wc26_${activeProfile}_custom_standings`, JSON.stringify({}));

    // Re-calculate standings for simulation
    const simulatedStandings: { [groupId: string]: GroupStanding[] } = {};
    GROUPS_DATA.forEach((group) => {
      simulatedStandings[group.id] = calculateGroupStandings(simulatedGroupMatches, group.id);
    });

    const simulatedThirdsRanked = calculateThirdPlacesRankings(simulatedStandings);

    // Simulate Knockout Matches sequentially
    const simulatedScores: {
      [matchId: string]: {
        homeScore: number;
        awayScore: number;
        homePenalties?: number;
        awayPenalties?: number;
      };
    } = {};

    const getSimulatedWinnerId = (
      matchId: string,
      homeTeamId: string,
      awayTeamId: string
    ): string => {
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);

      if (homeScore > awayScore) {
        simulatedScores[matchId] = { homeScore, awayScore };
        return homeTeamId;
      }
      if (homeScore < awayScore) {
        simulatedScores[matchId] = { homeScore, awayScore };
        return awayTeamId;
      }

      // Tie
      const homePenalties = Math.random() > 0.5 ? 5 : 4;
      const awayPenalties = homePenalties === 5 ? 4 : 5;
      simulatedScores[matchId] = {
        homeScore,
        awayScore,
        homePenalties,
        awayPenalties,
      };

      return homePenalties > awayPenalties ? homeTeamId : awayTeamId;
    };

    // Round of 32 matchups
    const r32Matchups = resolveRoundOf32Matchups(simulatedStandings, simulatedThirdsRanked);
    const r32Winners: { [matchId: string]: string } = {};

    for (let id = 73; id <= 88; id++) {
      const mId = `match-${id}`;
      const home = r32Matchups[`${mId}-home`] || '';
      const away = r32Matchups[`${mId}-away`] || '';
      r32Winners[mId] = getSimulatedWinnerId(mId, home, away);
    }

    // Round of 16
    const r16Winners: { [matchId: string]: string } = {};
    const r16Pairings = [
      { id: 'match-89', home: r32Winners['match-74'], away: r32Winners['match-77'] },
      { id: 'match-90', home: r32Winners['match-73'], away: r32Winners['match-75'] },
      { id: 'match-91', home: r32Winners['match-76'], away: r32Winners['match-78'] },
      { id: 'match-92', home: r32Winners['match-79'], away: r32Winners['match-80'] },
      { id: 'match-93', home: r32Winners['match-83'], away: r32Winners['match-84'] },
      { id: 'match-94', home: r32Winners['match-81'], away: r32Winners['match-82'] },
      { id: 'match-95', home: r32Winners['match-86'], away: r32Winners['match-88'] },
      { id: 'match-96', home: r32Winners['match-85'], away: r32Winners['match-87'] },
    ];

    r16Pairings.forEach((p) => {
      r16Winners[p.id] = getSimulatedWinnerId(p.id, p.home, p.away);
    });

    // Quarter-finals
    const qfWinners: { [matchId: string]: string } = {};
    const qfPairings = [
      { id: 'match-97', home: r16Winners['match-89'], away: r16Winners['match-90'] },
      { id: 'match-98', home: r16Winners['match-93'], away: r16Winners['match-94'] },
      { id: 'match-99', home: r16Winners['match-91'], away: r16Winners['match-92'] },
      { id: 'match-100', home: r16Winners['match-95'], away: r16Winners['match-96'] },
    ];

    qfPairings.forEach((p) => {
      qfWinners[p.id] = getSimulatedWinnerId(p.id, p.home, p.away);
    });

    // Semi-finals
    const sfWinners: { [matchId: string]: string } = {};
    const sfLosers: { [matchId: string]: string } = {};
    const sfPairings = [
      { id: 'match-101', home: qfWinners['match-97'], away: qfWinners['match-98'] },
      { id: 'match-102', home: qfWinners['match-99'], away: qfWinners['match-100'] },
    ];

    sfPairings.forEach((p) => {
      const winner = getSimulatedWinnerId(p.id, p.home, p.away);
      sfWinners[p.id] = winner;
      sfLosers[p.id] = winner === p.home ? p.away : p.home;
    });

    // 3rd Place Match
    getSimulatedWinnerId('match-103', sfLosers['match-101'], sfLosers['match-102']);

    // Final Match
    getSimulatedWinnerId('match-104', sfWinners['match-101'], sfWinners['match-102']);

    setKnockoutScores(simulatedScores);
    localStorage.setItem(`wc26_${activeProfile}_knockout_scores`, JSON.stringify(simulatedScores));
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        onRandomize={handleRandomize}
        progressPercent={getProgressPercent()}
        profiles={profiles}
        activeProfile={activeProfile}
        onSwitchProfile={handleSwitchProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'groups' && (
          <GroupStage
            matches={groupMatches}
            customStandingsOrder={customStandingsOrder}
            updateMatchScore={updateMatchScore}
            updateCustomStandingsOrder={updateCustomStandingsOrder}
          />
        )}

        {activeTab === 'thirds' && (
          <ThirdPlacesTable thirdPlaces={thirdPlaces} />
        )}

        {activeTab === 'bracket' && (
          <KnockoutBracket
            knockoutMatches={knockoutMatches}
            updateKnockoutScore={updateKnockoutScore}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            profiles={profiles}
            referenceProfile={referenceProfile}
            setReferenceProfile={setReferenceProfile}
            leaderboardData={leaderboardData}
          />
        )}
      </main>
    </div>
  );
};

export default App;

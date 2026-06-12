import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GroupStage from './components/GroupStage';
import ThirdPlacesTable from './components/ThirdPlacesTable';
import KnockoutBracket from './components/KnockoutBracket';
import Leaderboard from './components/Leaderboard';
import type { LeaderboardEntry } from './components/Leaderboard';
import CloudSettingsModal from './components/CloudSettingsModal';
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
import { getSupabaseClient } from './utils/supabaseClient';
import { isSupabaseConfigured } from './config';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'thirds' | 'bracket' | 'leaderboard'>('groups');
  
  // Database configuration state
  const [isCloud, setIsCloud] = useState(() => isSupabaseConfigured());
  const [showCloudSettings, setShowCloudSettings] = useState(false);

  // Cloud auth states
  const [cloudUser, setCloudUser] = useState<string | null>(() => localStorage.getItem('wc26_cloud_user'));
  const [cloudUserPin, setCloudUserPin] = useState<string | null>(() => localStorage.getItem('wc26_cloud_pin'));
  
  // Cloud brackets list
  const [cloudBrackets, setCloudBrackets] = useState<any[]>([]);

  // Bracket viewer mode states
  const [viewingUser, setViewingUser] = useState<string | null>(null);

  // Local profile states (for local fallback mode)
  const [profiles, setProfiles] = useState<string[]>(() => {
    const saved = localStorage.getItem('wc26_profiles');
    return saved ? JSON.parse(saved) : ['Default'];
  });

  const [activeProfile, setActiveProfile] = useState<string>(() => {
    const saved = localStorage.getItem('wc26_active_profile');
    return saved && saved !== '' ? saved : 'Default';
  });

  // Reference profile for leaderboard comparison (can be local or cloud username)
  const [referenceProfile, setReferenceProfile] = useState<string>(() => {
    const saved = localStorage.getItem('wc26_reference_profile');
    if (saved && saved !== '') return saved;
    return 'Default';
  });

  // Predictions states (current active profile predictions)
  const [groupMatches, setGroupMatches] = useState<Match[]>(() => {
    const prefix = localStorage.getItem('wc26_cloud_user') 
      ? `cloud_${localStorage.getItem('wc26_cloud_user')}`
      : `local_${localStorage.getItem('wc26_active_profile') || 'Default'}`;
    const saved = localStorage.getItem(`wc26_${prefix}_group_matches`);
    return saved ? JSON.parse(saved) : generateGroupMatches();
  });

  const [customStandingsOrder, setCustomStandingsOrder] = useState<{ [groupId: string]: string[] }>(() => {
    const prefix = localStorage.getItem('wc26_cloud_user') 
      ? `cloud_${localStorage.getItem('wc26_cloud_user')}`
      : `local_${localStorage.getItem('wc26_active_profile') || 'Default'}`;
    const saved = localStorage.getItem(`wc26_${prefix}_custom_standings`);
    return saved ? JSON.parse(saved) : {};
  });

  const [knockoutScores, setKnockoutScores] = useState<{
    [matchId: string]: {
      homeScore?: number;
      awayScore?: number;
      homePenalties?: number;
      awayPenalties?: number;
    };
  }>(() => {
    const prefix = localStorage.getItem('wc26_cloud_user') 
      ? `cloud_${localStorage.getItem('wc26_cloud_user')}`
      : `local_${localStorage.getItem('wc26_active_profile') || 'Default'}`;
    const saved = localStorage.getItem(`wc26_${prefix}_knockout_scores`);
    return saved ? JSON.parse(saved) : {};
  });

  // Keep local profiles list synced in localStorage
  useEffect(() => {
    localStorage.setItem('wc26_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Sync reference profile state
  useEffect(() => {
    localStorage.setItem('wc26_reference_profile', referenceProfile);
  }, [referenceProfile]);

  // Fetch all brackets from Supabase on mount or when cloud changes
  const fetchCloudBrackets = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('wc26_brackets')
        .select('username, group_matches, custom_standings, knockout_scores, updated_at');
      if (error) throw error;
      if (data) {
        setCloudBrackets(data);
      }
    } catch (e) {
      console.error('Error fetching cloud brackets:', e);
    }
  };

  useEffect(() => {
    if (isCloud) {
      fetchCloudBrackets();
    }
  }, [isCloud, cloudUser]);

  // Automatically select Official_Results as the reference profile in cloud mode if it exists
  useEffect(() => {
    if (isCloud && cloudBrackets.length > 0) {
      const hasOfficial = cloudBrackets.some(b => b.username === 'Official_Results');
      if (hasOfficial && referenceProfile !== 'Official_Results') {
        setReferenceProfile('Official_Results');
      }
    }
  }, [isCloud, cloudBrackets, referenceProfile]);

  // Save changes to database dynamically if user is logged in
  const syncToCloud = async (
    matches: Match[],
    standings: any,
    koScores: any
  ) => {
    if (!isCloud || !cloudUser || !cloudUserPin) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client
        .from('wc26_brackets')
        .upsert({
          username: cloudUser,
          passcode: cloudUserPin,
          group_matches: matches,
          custom_standings: standings,
          knockout_scores: koScores,
          updated_at: new Date().toISOString()
        }, { onConflict: 'username' });
      
      if (error) throw error;
    } catch (e) {
      console.error('Error syncing predictions to cloud:', e);
    }
  };

  // Local Profile Swapping
  const handleSwitchLocalProfile = (profileName: string) => {
    setActiveProfile(profileName);
    localStorage.setItem('wc26_active_profile', profileName);

    const prefix = `local_${profileName}`;
    const savedMatches = localStorage.getItem(`wc26_${prefix}_group_matches`);
    setGroupMatches(savedMatches ? JSON.parse(savedMatches) : generateGroupMatches());

    const savedStandings = localStorage.getItem(`wc26_${prefix}_custom_standings`);
    setCustomStandingsOrder(savedStandings ? JSON.parse(savedStandings) : {});

    const savedKo = localStorage.getItem(`wc26_${prefix}_knockout_scores`);
    setKnockoutScores(savedKo ? JSON.parse(savedKo) : {});
  };

  const handleCreateLocalProfile = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (profiles.includes(trimmed)) {
      alert('Profile name already exists!');
      return;
    }
    const nextProfiles = [...profiles, trimmed];
    setProfiles(nextProfiles);
    handleSwitchLocalProfile(trimmed);
  };

  const handleDeleteLocalProfile = (profileName: string) => {
    if (profiles.length <= 1) return;
    if (window.confirm(`Are you sure you want to delete profile "${profileName}"?`)) {
      const nextProfiles = profiles.filter((p) => p !== profileName);
      setProfiles(nextProfiles);

      const prefix = `local_${profileName}`;
      localStorage.removeItem(`wc26_${prefix}_group_matches`);
      localStorage.removeItem(`wc26_${prefix}_custom_standings`);
      localStorage.removeItem(`wc26_${prefix}_knockout_scores`);

      const fallback = nextProfiles[0];
      handleSwitchLocalProfile(fallback);
      if (referenceProfile === profileName) {
        setReferenceProfile(fallback);
      }
    }
  };

  // Supabase Cloud Registration / Join Pool
  const handleCloudRegister = async (username: string, pin: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      alert('Database connection is not configured.');
      return false;
    }

    try {
      // Check if username is taken
      const { data, error: selectError } = await client
        .from('wc26_brackets')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (selectError) throw selectError;
      if (data) {
        alert('Username is already taken. Please choose another one or click Log In.');
        return false;
      }

      // Insert new profile
      const { error: insertError } = await client
        .from('wc26_brackets')
        .insert({
          username,
          passcode: pin,
          group_matches: groupMatches,
          custom_standings: customStandingsOrder,
          knockout_scores: knockoutScores
        });

      if (insertError) throw insertError;

      setCloudUser(username);
      setCloudUserPin(pin);
      localStorage.setItem('wc26_cloud_user', username);
      localStorage.setItem('wc26_cloud_pin', pin);
      
      // Save predictions locally with cloud prefix
      const prefix = `cloud_${username}`;
      localStorage.setItem(`wc26_${prefix}_group_matches`, JSON.stringify(groupMatches));
      localStorage.setItem(`wc26_${prefix}_custom_standings`, JSON.stringify(customStandingsOrder));
      localStorage.setItem(`wc26_${prefix}_knockout_scores`, JSON.stringify(knockoutScores));

      alert(`Joined cloud pool successfully as "${username}"!`);
      fetchCloudBrackets();
      return true;
    } catch (e) {
      console.error(e);
      alert('Error joining pool. Please make sure the SQL schema was run in your Supabase project.');
      return false;
    }
  };

  // Supabase Cloud Login
  const handleCloudLogin = async (username: string, pin: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { data, error } = await client
        .from('wc26_brackets')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        alert('Username not found. Click Join Pool to register.');
        return false;
      }

      if (data.passcode !== pin) {
        alert('Incorrect PIN passcode! Please try again.');
        return false;
      }

      // Successful login
      setCloudUser(username);
      setCloudUserPin(pin);
      localStorage.setItem('wc26_cloud_user', username);
      localStorage.setItem('wc26_cloud_pin', pin);

      // Load their cloud predictions into active state
      setGroupMatches(data.group_matches);
      setCustomStandingsOrder(data.custom_standings || {});
      setKnockoutScores(data.knockout_scores || {});

      // Cache locally
      const prefix = `cloud_${username}`;
      localStorage.setItem(`wc26_${prefix}_group_matches`, JSON.stringify(data.group_matches));
      localStorage.setItem(`wc26_${prefix}_custom_standings`, JSON.stringify(data.custom_standings || {}));
      localStorage.setItem(`wc26_${prefix}_knockout_scores`, JSON.stringify(data.knockout_scores || {}));

      alert(`Welcome back, ${username}! Predictions synced.`);
      fetchCloudBrackets();
      return true;
    } catch (e) {
      console.error(e);
      alert('Login failed. Please verify credentials.');
      return false;
    }
  };

  // Sign out of Cloud Pool
  const handleCloudSignOut = () => {
    setCloudUser(null);
    setCloudUserPin(null);
    localStorage.removeItem('wc26_cloud_user');
    localStorage.removeItem('wc26_cloud_pin');

    // Switch back to Default local profile
    handleSwitchLocalProfile('Default');
  };

  // Log in as Official_Results to edit official scores
  const handleAdminAccess = async (pin: string) => {
    if (pin !== '2026') {
      alert('Incorrect Admin PIN!');
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      alert('Database is not connected.');
      return;
    }

    try {
      // Check if Official_Results exists in the DB
      const { data, error } = await client
        .from('wc26_brackets')
        .select('username')
        .eq('username', 'Official_Results')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create the Official_Results user if it doesn't exist yet
        const { error: insertError } = await client
          .from('wc26_brackets')
          .insert({
            username: 'Official_Results',
            passcode: '2026',
            group_matches: generateGroupMatches(),
            custom_standings: {},
            knockout_scores: {}
          });

        if (insertError) throw insertError;
        alert('Created the "Official_Results" profile in the database! Logging you in now...');
      }

      // Switch profile/login to Official_Results
      const success = await handleCloudLogin('Official_Results', '2026');
      if (success) {
        setReferenceProfile('Official_Results');
      }
      
    } catch (e) {
      console.error(e);
      alert('Failed to access official results. Please try again.');
    }
  };

  // Triggered when Cloud settings config is saved in modal
  const handleConfigChanged = () => {
    const configured = isSupabaseConfigured();
    setIsCloud(configured);
    if (!configured) {
      handleCloudSignOut();
    }
  };

  // JSON Export Predictions
  const handleExportJSON = () => {
    const filename = isCloud && cloudUser ? cloudUser : activeProfile;
    const dataToExport = {
      version: 'wc26-v1',
      profileName: filename,
      groupMatches,
      customStandingsOrder,
      knockoutScores,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wc2026_bracket_${filename.replace(/\s+/g, '_')}.json`;
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

      // Save locally
      const prefix = isCloud && cloudUser ? `cloud_${cloudUser}` : `local_${activeProfile}`;
      localStorage.setItem(`wc26_${prefix}_group_matches`, JSON.stringify(parsed.groupMatches));
      localStorage.setItem(`wc26_${prefix}_custom_standings`, JSON.stringify(parsed.customStandingsOrder || {}));
      localStorage.setItem(`wc26_${prefix}_knockout_scores`, JSON.stringify(parsed.knockoutScores || {}));

      // If cloud user is logged in, sync to database immediately
      if (isCloud && cloudUser && cloudUserPin) {
        syncToCloud(parsed.groupMatches, parsed.customStandingsOrder || {}, parsed.knockoutScores || {});
      }

      alert('Predictions imported successfully!');
    } catch (e) {
      alert('Error parsing file. Please make sure it is a valid JSON file.');
    }
  };

  // Helper to load resolved matches data for any bracket profile (local or cloud)
  const getProfileResolvedData = (pName: string) => {
    let pMatches: Match[];
    let pCustomOrder: { [groupId: string]: string[] };
    let pKoScores: any;

    if (isCloud) {
      // Look up in cloud brackets
      const matched = cloudBrackets.find((b) => b.username === pName);
      if (matched) {
        pMatches = matched.group_matches;
        pCustomOrder = matched.custom_standings || {};
        pKoScores = matched.knockout_scores || {};
      } else {
        // Fallback to active state if matching active user
        if (pName === cloudUser) {
          pMatches = groupMatches;
          pCustomOrder = customStandingsOrder;
          pKoScores = knockoutScores;
        } else {
          pMatches = generateGroupMatches();
          pCustomOrder = {};
          pKoScores = {};
        }
      }
    } else {
      // Local Storage Mode
      if (pName === activeProfile) {
        pMatches = groupMatches;
        pCustomOrder = customStandingsOrder;
        pKoScores = knockoutScores;
      } else {
        const prefix = `local_${pName}`;
        const savedMatches = localStorage.getItem(`wc26_${prefix}_group_matches`);
        pMatches = savedMatches ? JSON.parse(savedMatches) : generateGroupMatches();

        const savedStandings = localStorage.getItem(`wc26_${prefix}_custom_standings`);
        pCustomOrder = savedStandings ? JSON.parse(savedStandings) : {};

        const savedKo = localStorage.getItem(`wc26_${prefix}_knockout_scores`);
        pKoScores = savedKo ? JSON.parse(savedKo) : {};
      }
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
      customStandings: pCustomOrder,
      knockoutScores: pKoScores
    };
  };

  // Peer Bracket Viewer Mode resolver
  const activeViewData = viewingUser ? getProfileResolvedData(viewingUser) : null;

  // Standings rendering values (either our active bracket or the viewed friend's bracket)
  const activeMatchesToRender = activeViewData ? activeViewData.matches : groupMatches;
  const activeStandingsToRender: { [groupId: string]: GroupStanding[] } = {};
  
  GROUPS_DATA.forEach((group) => {
    const order = activeViewData 
      ? activeViewData.customStandings[group.id] 
      : customStandingsOrder[group.id];
    activeStandingsToRender[group.id] = calculateGroupStandings(
      activeMatchesToRender, 
      group.id, 
      order
    );
  });

  const activeThirdsToRender = calculateThirdPlacesRankings(activeStandingsToRender);
  const activeKoMatchesToRender = activeViewData 
    ? activeViewData.koMatches 
    : resolveKnockoutBracket(activeStandingsToRender, activeThirdsToRender, knockoutScores);

  // Generate Leaderboard List (compares competitors to the reference profile)
  const refData = getProfileResolvedData(referenceProfile);
  const leaderboardList: LeaderboardEntry[] = (isCloud ? cloudBrackets.map((b) => b.username) : profiles).map((pName) => {
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

  // Sort: Reference profile stays at the bottom, others sorted by totalPoints desc
  leaderboardList.sort((a, b) => {
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
      if (m.homeScore !== undefined && m.awayScore !== undefined) completedCount++;
    });
    Object.values(knockoutScores).forEach((score) => {
      if (score.homeScore !== undefined && score.awayScore !== undefined) completedCount++;
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

    const prefix = isCloud && cloudUser ? `cloud_${cloudUser}` : `local_${activeProfile}`;
    localStorage.setItem(`wc26_${prefix}_group_matches`, JSON.stringify(nextMatches));

    syncToCloud(nextMatches, customStandingsOrder, knockoutScores);
  };

  // Update custom order of standings in a group (manual override)
  const updateCustomStandingsOrder = (groupId: string, teamIds: string[]) => {
    const nextStandingsOrder = {
      ...customStandingsOrder,
      [groupId]: teamIds,
    };
    setCustomStandingsOrder(nextStandingsOrder);

    const prefix = isCloud && cloudUser ? `cloud_${cloudUser}` : `local_${activeProfile}`;
    localStorage.setItem(`wc26_${prefix}_custom_standings`, JSON.stringify(nextStandingsOrder));

    syncToCloud(groupMatches, nextStandingsOrder, knockoutScores);
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

    const prefix = isCloud && cloudUser ? `cloud_${cloudUser}` : `local_${activeProfile}`;
    localStorage.setItem(`wc26_${prefix}_knockout_scores`, JSON.stringify(nextScores));

    syncToCloud(groupMatches, customStandingsOrder, nextScores);
  };

  // Reset current predictions
  const handleReset = () => {
    const userLabel = isCloud && cloudUser ? cloudUser : activeProfile;
    if (window.confirm(`Clear all predictions for user "${userLabel}"?`)) {
      const defaultMatches = generateGroupMatches();
      setGroupMatches(defaultMatches);
      setCustomStandingsOrder({});
      setKnockoutScores({});
      
      const prefix = isCloud && cloudUser ? `cloud_${cloudUser}` : `local_${activeProfile}`;
      localStorage.removeItem(`wc26_${prefix}_group_matches`);
      localStorage.removeItem(`wc26_${prefix}_custom_standings`);
      localStorage.removeItem(`wc26_${prefix}_knockout_scores`);

      syncToCloud(defaultMatches, {}, {});
    }
  };

  // Simulate Random Scores sequentially
  const handleRandomize = () => {
    const simulatedGroupMatches = generateGroupMatches().map((m) => {
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);
      return { ...m, homeScore, awayScore };
    });
    setGroupMatches(simulatedGroupMatches);
    setCustomStandingsOrder({});

    const prefix = isCloud && cloudUser ? `cloud_${cloudUser}` : `local_${activeProfile}`;
    localStorage.setItem(`wc26_${prefix}_group_matches`, JSON.stringify(simulatedGroupMatches));
    localStorage.setItem(`wc26_${prefix}_custom_standings`, JSON.stringify({}));

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
    localStorage.setItem(`wc26_${prefix}_knockout_scores`, JSON.stringify(simulatedScores));

    syncToCloud(simulatedGroupMatches, {}, simulatedScores);
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
        onSwitchProfile={handleSwitchLocalProfile}
        onCreateProfile={handleCreateLocalProfile}
        onDeleteProfile={handleDeleteLocalProfile}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        
        // Cloud props
        isCloud={isCloud}
        cloudUser={cloudUser}
        onCloudLogin={handleCloudLogin}
        onCloudRegister={handleCloudRegister}
        onCloudSignOut={handleCloudSignOut}
        onOpenCloudSettings={() => setShowCloudSettings(true)}
        viewingUser={viewingUser}
        onExitViewMode={() => setViewingUser(null)}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'groups' && (
          <GroupStage
            matches={activeMatchesToRender}
            customStandingsOrder={customStandingsOrder}
            updateMatchScore={updateMatchScore}
            updateCustomStandingsOrder={updateCustomStandingsOrder}
            isReadOnly={!!viewingUser}
          />
        )}

        {activeTab === 'thirds' && (
          <ThirdPlacesTable thirdPlaces={activeThirdsToRender} />
        )}

        {activeTab === 'bracket' && (
          <KnockoutBracket
            knockoutMatches={activeKoMatchesToRender}
            updateKnockoutScore={updateKnockoutScore}
            isReadOnly={!!viewingUser}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            profiles={isCloud ? cloudBrackets.map(b => b.username) : profiles}
            referenceProfile={referenceProfile}
            setReferenceProfile={setReferenceProfile}
            leaderboardData={leaderboardList}
            onViewBracket={(username) => {
              setViewingUser(username);
              setActiveTab('groups'); // jump back to view their group predictions
            }}
            onAdminAccess={isCloud ? handleAdminAccess : undefined}
          />
        )}
      </main>

      {/* Supabase Connection Setup Dialog */}
      {showCloudSettings && (
        <CloudSettingsModal
          onClose={() => setShowCloudSettings(false)}
          onConfigChanged={handleConfigChanged}
        />
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as XLSX from 'xlsx';

const getTeamLogo = (team) => {
  if (!team) return '';
  return team.logo ? (team.logo.startsWith('http') ? team.logo : `http://localhost:5000/${team.logo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(team.tag || team.name || 'T')}&background=random&color=fff&size=200&bold=true`;
};

// Recursive Match Node Component for perfect tree alignment
const MatchNode = ({ match, allMatches, openMatchModal }) => {
  const children = allMatches.filter(m => m.nextMatchNumber === match.matchNumber).sort((a, b) => a.matchNumber - b.matchNumber);

  return (
    <div className="flex items-center">
      {/* Children Subtrees */}
      {children.length > 0 && (
        <div className="flex flex-col justify-center relative">
          {/* Vertical Trunk Connecting the Children */}
          {children.length > 1 && (
            <div className="absolute right-0 top-[25%] bottom-[25%] w-[3px] bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          )}
          
          {children.map((child) => (
            <div key={child._id} className="flex items-center relative py-6 pr-8">
              <MatchNode match={child} allMatches={allMatches} openMatchModal={openMatchModal} />
              {/* Horizontal Line out of the child to the trunk */}
              <div className="absolute right-0 top-1/2 w-8 border-t-[3px] border-slate-300 dark:border-slate-600 rounded-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Horizontal Line from Trunk to Parent */}
      {children.length > 0 && (
        <div className="w-8 border-t-[3px] border-slate-300 dark:border-slate-600 rounded-full"></div>
      )}

      {/* Current Match Box */}
      <div 
        onClick={() => openMatchModal(match)}
        className={`w-[260px] flex-shrink-0 bg-surface border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${match.status === 'completed' ? 'border-slate-300' : match.status === 'live' ? 'border-primary shadow-sm' : 'border-slate-300/50'} rounded-[8px] overflow-hidden relative z-10`}
      >
        <div className="bg-slate-50 px-4 py-2 flex justify-between items-center text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider border-b border-slate-300">
          <span>Match {match.matchNumber}</span>
          <span className={match.status === 'live' ? 'text-primary' : ''}>
            {match.status === 'completed' ? 'Final' : match.status}
          </span>
        </div>

        {/* Team A */}
        <div className={`p-4 border-b border-border/50 flex justify-between items-center ${match.winner?._id === match.teamA?._id ? 'bg-primary/10' : ''}`}>
          <div className="flex items-center gap-3 truncate">
            {match.teamA ? (
              <>
                <img src={getTeamLogo(match.teamA)} alt="logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                <span className={`font-bold text-[1rem] truncate ${match.winner?._id === match.teamA._id ? 'text-primary' : 'text-text'}`}>
                  {match.teamA.name}
                </span>
                {match.winner?._id === match.teamA._id && <i className="fa-solid fa-crown text-accent text-[0.8rem]"></i>}
              </>
            ) : (
              <span className="font-medium text-[0.9rem] text-text-secondary italic">TBD</span>
            )}
          </div>
          <span className={`font-bold text-[1.1rem] ${match.winner?._id === match.teamA?._id ? 'text-primary' : 'text-text-secondary'}`}>
            {match.scoreA ?? '-'}
          </span>
        </div>

        {/* Team B */}
        <div className={`p-4 flex justify-between items-center ${match.winner?._id === match.teamB?._id ? 'bg-primary/10' : ''}`}>
          <div className="flex items-center gap-3 truncate">
            {match.teamB ? (
              <>
                <img src={getTeamLogo(match.teamB)} alt="logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                <span className={`font-bold text-[1rem] truncate ${match.winner?._id === match.teamB._id ? 'text-primary' : 'text-text'}`}>
                  {match.teamB.name}
                </span>
                {match.winner?._id === match.teamB._id && <i className="fa-solid fa-crown text-accent text-[0.8rem]"></i>}
              </>
            ) : (
              <span className="font-medium text-[0.9rem] text-text-secondary italic">TBD</span>
            )}
          </div>
          <span className={`font-bold text-[1.1rem] ${match.winner?._id === match.teamB?._id ? 'text-primary' : 'text-text-secondary'}`}>
            {match.scoreB ?? '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

const TournamentBracket = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ML Feature States
  const [predictionData, setPredictionData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Player Stats Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsMatchData, setStatsMatchData] = useState(null); // { match, teamAPlayers, teamBPlayers }
  const [playerStatsInput, setPlayerStatsInput] = useState({}); // { [userId]: { kills: '', deaths: '', ... } }
  const [statsFields, setStatsFields] = useState([]);
  const [submittingStats, setSubmittingStats] = useState(false);

  // Game stats field config (mirrors backend)
  const GAME_STATS_FIELDS = {
    'Valorant': ['kills', 'deaths', 'assists', 'headshots'],
    'Counter-Strike 2': ['kills', 'deaths', 'assists', 'headshots'],
    'BGMI': ['kills', 'deaths', 'damage'],
    'Free Fire': ['kills', 'deaths', 'damage'],
    'Dota 2': ['kills', 'deaths', 'assists'],
    'League of Legends': ['kills', 'deaths', 'assists'],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournRes, matchRes] = await Promise.all([
          expressApi.get(`/api/tournaments/${id}`),
          expressApi.get(`/api/matches/tournament/${id}`)
        ]);

        if (tournRes.data.success) {
          setTournament(tournRes.data.data);
        }
        if (matchRes.data.success) {
          setMatches(matchRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bracket data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Real-Time Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleScoreUpdated = (updatedMatch) => {
      // Re-fetch all matches to ensure full populated data is consistent across all clients
      if (updatedMatch.tournament === id) {
        expressApi.get(`/api/matches/tournament/${id}`).then(res => {
          if (res.data.success) {
            setMatches(res.data.data);
          }
        });
      }
    };

    const handleMatchCompleted = (updatedMatch) => {
      // Match completion might affect next matches, so we refetch all matches to ensure bracket lines and next round propagate properly
      if (updatedMatch.tournament === id) {
        expressApi.get(`/api/matches/tournament/${id}`).then(res => {
          if (res.data.success) {
            setMatches(res.data.data);
          }
        });
      }
    };

    const handleTournamentCompleted = (data) => {
      if (data.tournamentId === id) {
        setTournament(prev => prev ? { ...prev, status: 'completed', winner: data.winner } : prev);
      }
    };

    socket.on('score_updated', handleScoreUpdated);
    socket.on('match_completed', handleMatchCompleted);
    socket.on('tournament_completed', handleTournamentCompleted);

    return () => {
      socket.off('score_updated', handleScoreUpdated);
      socket.off('match_completed', handleMatchCompleted);
      socket.off('tournament_completed', handleTournamentCompleted);
    };
  }, [socket, id]);

  // Keep selectedMatch in sync when matches update via socket
  useEffect(() => {
    if (selectedMatch) {
      const updated = matches.find(m => m._id === selectedMatch._id);
      if (updated && (updated.scoreA !== selectedMatch.scoreA || updated.scoreB !== selectedMatch.scoreB)) {
        setSelectedMatch(updated);
        // Automatically re-fetch prediction to update the UI progress bar if it's currently open
        if (predictionData) {
          fetchPrediction(updated._id);
        }
      }
    }
  }, [matches, selectedMatch, predictionData]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedMatch || showStatsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMatch, showStatsModal]);

  const isOrganizer = user && tournament && tournament.organizer?._id === user.id;

  const openMatchModal = (match) => {
    setSelectedMatch(match);
    setScoreA(match.scoreA !== null ? match.scoreA.toString() : '0');
    setScoreB(match.scoreB !== null ? match.scoreB.toString() : '0');
  };

  const closeMatchModal = () => {
    setSelectedMatch(null);
    setPredictionData(null);
    setSummaryData(null);
  };

  const fetchPrediction = async (matchId) => {
    setLoadingPrediction(true);
    try {
      const res = await expressApi.get(`/api/matches/${matchId}/prediction`);
      if (res.data.success) {
        setPredictionData(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load prediction');
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleGenerateSummary = async (matchId) => {
    setLoadingSummary(true);
    try {
      const res = await expressApi.post(`/api/matches/${matchId}/summary`);
      if (res.data.success) {
        // Update local state to show the new summary immediately
        setSelectedMatch(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleLiveScoreUpdate = async (e) => {
    e.preventDefault();
    if (!isOrganizer) return;
    setSubmitting('live');
    try {
      const res = await expressApi.patch(`/api/matches/${selectedMatch._id}/score`, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB)
      });
      if (res.data.success) {
        // Just update local match without closing modal by refetching to ensure full team population
        expressApi.get(`/api/matches/tournament/${id}`).then(resMatches => {
          if (resMatches.data.success) {
            setMatches(resMatches.data.data);
          }
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update live score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!isOrganizer) return;

    setSubmitting('final');
    try {
      const res = await expressApi.post(`/api/matches/${selectedMatch._id}/result`, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB)
      });

      if (res.data.success) {
        // Re-fetch matches and tournament
        const [matchRes, tournRes] = await Promise.all([
          expressApi.get(`/api/matches/tournament/${id}`),
          expressApi.get(`/api/tournaments/${id}`)
        ]);

        if (matchRes.data.success) {
          setMatches(matchRes.data.data);
        }
        if (tournRes.data.success) {
          setTournament(tournRes.data.data);
        }

        closeMatchModal();

        // Open Player Stats modal if both teams exist
        if (selectedMatch.teamA && selectedMatch.teamB && tournament) {
          openStatsModal(selectedMatch);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
    }
  };

  // Open the player stats entry modal
  const openStatsModal = async (match) => {
    try {
      const game = tournament?.game || 'Valorant';
      const fields = GAME_STATS_FIELDS[game] || ['kills', 'deaths'];
      setStatsFields(fields);

      const res = await expressApi.get(`/api/playerstats/match-players/${match.teamA._id}/${match.teamB._id}`);
      if (res.data.success) {
        const { teamA, teamB } = res.data.data;
        setStatsMatchData({ match, teamA, teamB, game });

        // Initialize empty stats for all players (or pre-fill if editing)
        const initStats = {};
        [...teamA.players, ...teamB.players].forEach(p => {
          initStats[p._id] = {};
          const existingStats = match.playerStats?.[p._id] || {};
          fields.forEach(f => { 
            initStats[p._id][f] = existingStats[f] !== undefined ? existingStats[f] : ''; 
          });
        });
        setPlayerStatsInput(initStats);
        setShowStatsModal(true);
      }
    } catch (err) {
      console.error('Failed to load players for stats:', err);
    }
  };

  const downloadTemplateForMatch = async (match) => {
    try {
      const game = tournament?.game || 'Valorant';
      const fields = GAME_STATS_FIELDS[game] || ['kills', 'deaths'];
      
      const res = await expressApi.get(`/api/playerstats/match-players/${match.teamA._id}/${match.teamB._id}`);
      if (res.data.success) {
        const { teamA, teamB } = res.data.data;
        
        const rows = [];
        teamA.players.forEach(p => {
          const row = { Team: teamA.name, Player: p.name, PlayerID: p._id };
          fields.forEach(f => row[f] = 0);
          rows.push(row);
        });
        
        teamB.players.forEach(p => {
          const row = { Team: teamB.name, Player: p.name, PlayerID: p._id };
          fields.forEach(f => row[f] = 0);
          rows.push(row);
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stats');
        XLSX.writeFile(workbook, `Match_${match.matchNumber}_Stats_Template.xlsx`);
      }
    } catch (err) {
      console.error('Failed to download template', err);
      alert('Could not download template right now.');
    }
  };

  const handleDownloadTemplate = () => {
    if (!statsMatchData) return;
    
    const rows = [];
    statsMatchData.teamA.players.forEach(p => {
      const row = { Team: statsMatchData.teamA.name, Player: p.name, PlayerID: p._id };
      statsFields.forEach(f => row[f] = playerStatsInput[p._id]?.[f] || 0);
      rows.push(row);
    });
    
    statsMatchData.teamB.players.forEach(p => {
      const row = { Team: statsMatchData.teamB.name, Player: p.name, PlayerID: p._id };
      statsFields.forEach(f => row[f] = playerStatsInput[p._id]?.[f] || 0);
      rows.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stats');
    XLSX.writeFile(workbook, `Match_${statsMatchData.match.matchNumber}_Stats.xlsx`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const newStatsInput = { ...playerStatsInput };

      json.forEach(row => {
        const pId = row.PlayerID;
        if (pId && newStatsInput[pId]) {
          statsFields.forEach(f => {
            if (row[f] !== undefined) {
              newStatsInput[pId][f] = row[f];
            }
          });
        }
      });

      setPlayerStatsInput(newStatsInput);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  const handleStatChange = (playerId, field, value) => {
    setPlayerStatsInput(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value }
    }));
  };

  const handleSubmitStats = async () => {
    if (!statsMatchData) return;
    setSubmittingStats(true);
    try {
      const players = Object.entries(playerStatsInput).map(([userId, stats]) => ({
        userId,
        stats
      }));

      await expressApi.post('/api/playerstats/submit', {
        matchId: statsMatchData.match._id,
        game: statsMatchData.game,
        players
      });

      // Refetch matches to update the local state with the newly saved playerStats
      const matchRes = await expressApi.get(`/api/matches/tournament/${id}`);
      if (matchRes.data.success) {
        setMatches(matchRes.data.data);
      }

      setShowStatsModal(false);
      setStatsMatchData(null);
      setPlayerStatsInput({});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit player stats');
    } finally {
      setSubmittingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20 flex justify-center items-center min-h-[calc(100vh-80px)]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container py-20 flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Tournament not found'}</p>
          <Link to="/tournaments" className="btn-primary">Return to Board</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 pb-6 border-b border-border">
        <div>
          <Link to={`/tournaments/${id}`} className="text-primary hover:text-primary-hover font-bold text-[0.8rem] flex items-center gap-2 w-fit mb-2">
            <i className="fa-solid fa-arrow-left"></i> Back to Details
          </Link>
          <h1 className="text-[1.5rem] sm:text-[2rem] font-bold text-text">{tournament.title} <span className="text-primary">Bracket</span></h1>
        </div>
        <div className="bg-surface border border-border px-5 py-2.5 rounded-[4px] text-text text-[0.85rem] font-bold shadow-sm flex items-center">
          <i className="fa-solid fa-gamepad mr-2"></i> {tournament.game}
        </div>
      </div>

      {/* Winner Celebration Banner */}
      {tournament.status === 'completed' && tournament.winner && (
        <div className="mb-12 bg-surface border-2 border-accent/50 rounded-[8px] p-8 text-center relative overflow-hidden shadow-sm animate-fade-in">
          <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

          <i className="fa-solid fa-trophy text-6xl text-accent mb-6 animate-bounce"></i>
          <h2 className="text-[1.2rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Tournament Champion</h2>
          <h1 className="text-[3rem] sm:text-[4rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-300 to-accent leading-tight mb-2 drop-shadow-lg">
            {tournament.winner.name}
          </h1>
          <p className="text-[1.2rem] text-text font-bold">[{tournament.winner.tag}]</p>
        </div>
      )}

      {/* Bracket Board */}
      <div className="overflow-x-auto pb-10 custom-scrollbar">
        {matches.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            <i className="fa-solid fa-sitemap text-4xl mb-4 opacity-50"></i>
            <p>Bracket has not been generated yet.</p>
          </div>
        ) : (
          <>
            {tournament?.bracketType === 'round-robin' ? (
              <div className="flex gap-12 min-w-max">
                {Array.from(new Set(matches.map(m => m.round))).sort().map(round => (
                  <div key={round} className="flex flex-col gap-8 justify-around min-w-[280px]">
                    <h4 className="text-center font-bold text-primary mb-4 text-[0.9rem] uppercase tracking-widest bg-primary/10 py-2.5 rounded-xl border border-primary/20 shadow-sm">
                      Round {round}
                    </h4>

                    {matches.filter(m => m.round === round).sort((a, b) => a.matchNumber - b.matchNumber).map(match => (
                      <div
                        key={match._id}
                        onClick={() => openMatchModal(match)}
                        className={`glass-panel border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${match.status === 'completed' ? 'border-border' : match.status === 'live' ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border/50'} rounded-xl overflow-hidden relative`}
                      >
                        <div className="bg-black/5 dark:bg-black/30 px-4 py-2 flex justify-between items-center text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider border-b border-border">
                          <span>Match {match.matchNumber}</span>
                          <span className={match.status === 'live' ? 'text-primary' : ''}>
                            {match.status === 'completed' ? 'Final' : match.status}
                          </span>
                        </div>

                        {/* Team A */}
                        <div className={`p-4 border-b border-border/50 flex justify-between items-center ${match.winner?._id === match.teamA?._id ? 'bg-primary/10' : ''}`}>
                          <div className="flex items-center gap-3 truncate">
                            {match.teamA ? (
                              <>
                                <img src={getTeamLogo(match.teamA)} alt="logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                                <span className={`font-bold text-[1rem] truncate ${match.winner?._id === match.teamA._id ? 'text-primary' : 'text-text'}`}>
                                  {match.teamA.name}
                                </span>
                                {match.winner?._id === match.teamA._id && <i className="fa-solid fa-crown text-accent text-[0.8rem]"></i>}
                              </>
                            ) : (
                              <span className="font-medium text-[0.9rem] text-text-secondary italic">TBD</span>
                            )}
                          </div>
                          <span className={`font-bold text-[1.1rem] ${match.winner?._id === match.teamA?._id ? 'text-primary' : 'text-text-secondary'}`}>
                            {match.scoreA ?? '-'}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className={`p-4 flex justify-between items-center ${match.winner?._id === match.teamB?._id ? 'bg-primary/10' : ''}`}>
                          <div className="flex items-center gap-3 truncate">
                            {match.teamB ? (
                              <>
                                <img src={getTeamLogo(match.teamB)} alt="logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                                <span className={`font-bold text-[1rem] truncate ${match.winner?._id === match.teamB._id ? 'text-primary' : 'text-text'}`}>
                                  {match.teamB.name}
                                </span>
                                {match.winner?._id === match.teamB._id && <i className="fa-solid fa-crown text-accent text-[0.8rem]"></i>}
                              </>
                            ) : (
                              <span className="font-medium text-[0.9rem] text-text-secondary italic">TBD</span>
                            )}
                          </div>
                          <span className={`font-bold text-[1.1rem] ${match.winner?._id === match.teamB?._id ? 'text-primary' : 'text-text-secondary'}`}>
                            {match.scoreB ?? '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Headers */}
                <div className="flex mb-6 w-max">
                  {Array.from({ length: Math.max(...matches.map(m => m.round)) }).map((_, i) => {
                    const isFinal = i + 1 === Math.max(...matches.map(m => m.round));
                    return (
                      <div key={i} className="w-[260px] mr-[4rem] flex-shrink-0 text-center font-bold text-primary text-[0.9rem] uppercase tracking-widest bg-primary/10 py-2.5 rounded-xl border border-primary/20 shadow-sm">
                        {isFinal ? 'Final' : `Round ${i + 1}`}
                      </div>
                    );
                  })}
                </div>
                
                {/* Bracket Tree */}
                <div className="flex w-max items-center pb-20 pt-4">
                  {matches.filter(m => m.nextMatchNumber === null).map(finalMatch => (
                     <MatchNode key={finalMatch._id} match={finalMatch} allMatches={matches} openMatchModal={openMatchModal} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Match Score Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-slate-300 rounded-[8px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden animate-slide-up">
            <div className="bg-slate-50 p-4 border-b border-slate-300 flex justify-between items-center">
              <h3 className="text-lg font-bold text-text uppercase tracking-widest">
                Match {selectedMatch.matchNumber} Details
              </h3>
              <button onClick={closeMatchModal} className="text-text-secondary hover:text-red-500 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {!isOrganizer ? (
                // Public View (Read-Only)
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                    <div className="flex-1 flex flex-col items-center text-center">
                      <img src={getTeamLogo(selectedMatch.teamA)} alt="logo" className="w-10 h-10 rounded-full object-cover mb-2" />
                      <p className="font-bold text-text text-xl truncate w-full">{selectedMatch.teamA?.name || 'TBD'}</p>
                      {selectedMatch.winner?._id === selectedMatch.teamA?._id && <i className="fa-solid fa-crown text-accent mt-2 text-xl"></i>}
                    </div>
                    <div className="px-4 sm:px-6 text-2xl sm:text-3xl font-bold text-primary">
                      {selectedMatch.scoreA ?? '-'} <span className="text-text-secondary mx-1 sm:mx-2 text-lg sm:text-xl">vs</span> {selectedMatch.scoreB ?? '-'}
                    </div>
                    <div className="flex-1 flex flex-col items-center text-center">
                      <img src={getTeamLogo(selectedMatch.teamB)} alt="logo" className="w-10 h-10 rounded-full object-cover mb-2" />
                      <p className="font-bold text-text text-xl truncate w-full">{selectedMatch.teamB?.name || 'TBD'}</p>
                      {selectedMatch.winner?._id === selectedMatch.teamB?._id && <i className="fa-solid fa-crown text-accent mt-2 text-xl"></i>}
                    </div>
                  </div>

                  <div className="text-center bg-slate-100 py-3 rounded-[4px] border border-slate-200">
                    <p className="text-text-secondary text-sm uppercase tracking-widest font-bold">Status: <span className={selectedMatch.status === 'live' ? 'text-primary' : 'text-text'}>{selectedMatch.status}</span></p>
                  </div>
                </div>
              ) : (
                // Organizer View (Editable Form)
                <form className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center gap-2 sm:gap-4">
                    <div className="flex-1 text-center">
                      <p className="font-bold text-text mb-3 truncate">{selectedMatch.teamA?.name || 'TBD'}</p>
                      <input
                        type="number"
                        min="0"
                        value={scoreA}
                        onChange={(e) => setScoreA(e.target.value)}
                        disabled={!selectedMatch.teamA || selectedMatch.status === 'completed'}
                        className="input-field text-center text-2xl font-bold p-4 w-full"
                      />
                    </div>

                    <div className="font-bold text-text-secondary text-xl pt-8">VS</div>

                    <div className="flex-1 text-center">
                      <p className="font-bold text-text mb-3 truncate">{selectedMatch.teamB?.name || 'TBD'}</p>
                      <input
                        type="number"
                        min="0"
                        value={scoreB}
                        onChange={(e) => setScoreB(e.target.value)}
                        disabled={!selectedMatch.teamB || selectedMatch.status === 'completed'}
                        className="input-field text-center text-2xl font-bold p-4 w-full"
                      />
                    </div>
                  </div>

                  {selectedMatch.status === 'completed' ? (
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-[4px]">
                        <p className="text-primary font-bold uppercase tracking-widest text-[0.9rem]">This match has been completed.</p>
                        <p className="text-text-secondary text-sm font-bold mt-1">Winner: <span className="text-text">{selectedMatch.winner?.name}</span></p>
                      </div>
                      {/* Button to enter stats for completed match */}
                      {selectedMatch.teamA && selectedMatch.teamB && (
                        <button
                          type="button"
                          onClick={() => { closeMatchModal(); openStatsModal(selectedMatch); }}
                          className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 py-3 rounded-[4px] font-bold text-[0.85rem] uppercase tracking-widest transition-all"
                        >
                          <i className="fa-solid fa-chart-bar mr-2"></i>Enter Player Stats
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedMatch.teamA && selectedMatch.teamB && (
                        <div className="flex justify-end mb-2">
                          <button
                            type="button"
                            onClick={() => downloadTemplateForMatch(selectedMatch)}
                            className="text-[0.7rem] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                          >
                            <i className="fa-solid fa-file-excel"></i> Pre-Download Stats Template
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleLiveScoreUpdate}
                          disabled={submitting || !selectedMatch.teamA || !selectedMatch.teamB}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-text border border-border hover:border-slate-400 py-4 rounded-[4px] font-bold text-[0.85rem] uppercase tracking-widest transition-all"
                        >
                          {submitting === 'live' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Update Live Score'}
                        </button>
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={submitting || !selectedMatch.teamA || !selectedMatch.teamB}
                        className="flex-1 btn-primary py-4 !text-[0.85rem]"
                      >
                        {submitting === 'final' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Submit Final Result'}
                      </button>
                    </div>
                  </div>
                  )}
                </form>
              )}

              {/* ML Features Section */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-microchip text-accent"></i> AI Analysis
                </h4>

                {selectedMatch.status !== 'completed' && selectedMatch.teamA && selectedMatch.teamB && (
                  <div className="bg-slate-100 p-4 rounded-[6px] border border-slate-200">
                    <button 
                      onClick={() => fetchPrediction(selectedMatch._id)}
                      disabled={loadingPrediction}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-[4px] font-bold text-[0.8rem] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      {loadingPrediction ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Live Prediction</>}
                    </button>

                    {predictionData && (
                      <div className="mt-4 animate-fade-in">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-blue-600">{selectedMatch.teamA.name} ({predictionData.team_a_prob}%)</span>
                          <span className="text-red-500">{selectedMatch.teamB.name} ({predictionData.team_b_prob}%)</span>
                        </div>
                        <div className="w-full h-3 bg-red-400 rounded-full overflow-hidden flex">
                          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${predictionData.team_a_prob}%` }}></div>
                        </div>
                        <p className="text-[0.7rem] text-text-secondary mt-3 text-center">
                          Based on historical win rates (Team A: {predictionData.team_a_stats.win_rate.toFixed(2)} vs Team B: {predictionData.team_b_stats.win_rate.toFixed(2)})
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedMatch.status === 'completed' && selectedMatch.nextMatchNumber === null && selectedMatch.summary && (
                  <div className="bg-slate-100 p-4 rounded-[6px] border border-slate-200">
                    <div className="p-4 bg-white border border-slate-200 rounded text-[0.85rem] text-text font-medium italic animate-fade-in shadow-sm">
                      <i className="fa-solid fa-quote-left text-accent mr-2 opacity-50"></i>
                      {selectedMatch.summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Stats Modal */}
      {showStatsModal && statsMatchData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-slate-300 rounded-[8px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-300 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-text uppercase tracking-widest">
                  <i className="fa-solid fa-chart-bar mr-2 text-accent"></i>Player Stats
                </h3>
                <p className="text-[0.75rem] text-text-secondary font-medium mt-0.5">
                  Match {statsMatchData.match.matchNumber} • {statsMatchData.game}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownloadTemplate} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors">
                  <i className="fa-solid fa-download mr-1.5"></i>Template
                </button>
                <label className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors cursor-pointer">
                  <i className="fa-solid fa-upload mr-1.5"></i>Upload
                  <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-grow p-6 space-y-8">

              {/* Stat Field Labels */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-widest">Fields:</span>
                {statsFields.map(f => (
                  <span key={f} className="text-[0.7rem] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">{f}</span>
                ))}
              </div>

              {/* Team A Players */}
              <div>
                <h4 className="text-[0.85rem] font-bold text-text uppercase tracking-widest border-b border-border pb-2 mb-4 flex items-center">
                  <img src={getTeamLogo(statsMatchData.teamA)} alt="logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                  {statsMatchData.teamA.name} [{statsMatchData.teamA.tag}]
                </h4>
                <div className="space-y-3">
                  {statsMatchData.teamA.players.map(player => (
                    <div key={player._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-bg border border-border rounded-[6px] p-3">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                          {player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fa-solid fa-user text-slate-400 text-[0.7rem]"></i>
                          )}
                        </div>
                        <span className="font-bold text-[0.85rem] text-text truncate">{player.name}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap flex-1">
                        {statsFields.map(field => (
                          <div key={field} className="flex flex-col">
                            <label className="text-[0.6rem] font-bold text-text-secondary uppercase tracking-wider mb-0.5">{field}</label>
                            <input
                              type="number"
                              min="0"
                              value={playerStatsInput[player._id]?.[field] || ''}
                              onChange={(e) => handleStatChange(player._id, field, e.target.value)}
                              className="w-[70px] h-[36px] text-center bg-white border border-border rounded-[4px] text-[0.85rem] font-bold text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B Players */}
              <div>
                <h4 className="text-[0.85rem] font-bold text-text uppercase tracking-widest border-b border-border pb-2 mb-4 flex items-center">
                  <img src={getTeamLogo(statsMatchData.teamB)} alt="logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                  {statsMatchData.teamB.name} [{statsMatchData.teamB.tag}]
                </h4>
                <div className="space-y-3">
                  {statsMatchData.teamB.players.map(player => (
                    <div key={player._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-bg border border-border rounded-[6px] p-3">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                          {player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fa-solid fa-user text-slate-400 text-[0.7rem]"></i>
                          )}
                        </div>
                        <span className="font-bold text-[0.85rem] text-text truncate">{player.name}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap flex-1">
                        {statsFields.map(field => (
                          <div key={field} className="flex flex-col">
                            <label className="text-[0.6rem] font-bold text-text-secondary uppercase tracking-wider mb-0.5">{field}</label>
                            <input
                              type="number"
                              min="0"
                              value={playerStatsInput[player._id]?.[field] || ''}
                              onChange={(e) => handleStatChange(player._id, field, e.target.value)}
                              className="w-[70px] h-[36px] text-center bg-white border border-border rounded-[4px] text-[0.85rem] font-bold text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-slate-50 flex justify-end items-center flex-shrink-0">
              <button
                onClick={handleSubmitStats}
                disabled={submittingStats}
                className="btn-primary py-2.5"
              >
                {submittingStats ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-save mr-2"></i>}
                Save Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;

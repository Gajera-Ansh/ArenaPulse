import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedMatch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMatch]);

  const isOrganizer = user && tournament && tournament.organizer?._id === user.id;

  const openMatchModal = (match) => {
    setSelectedMatch(match);
    setScoreA(match.scoreA !== null ? match.scoreA.toString() : '0');
    setScoreB(match.scoreB !== null ? match.scoreB.toString() : '0');
  };

  const closeMatchModal = () => {
    setSelectedMatch(null);
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
        // We need to re-fetch matches and tournament because the tournament might have concluded
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
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-[2rem] font-bold text-text">{tournament.title} <span className="text-primary">Bracket</span></h1>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-slate-300 rounded-[8px] shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="bg-slate-50 p-4 border-b border-slate-300 flex justify-between items-center">
              <h3 className="text-lg font-bold text-text uppercase tracking-widest">
                Match {selectedMatch.matchNumber} Details
              </h3>
              <button onClick={closeMatchModal} className="text-text-secondary hover:text-red-500 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {!isOrganizer ? (
                // Public View (Read-Only)
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 text-center">
                      <p className="font-bold text-text text-xl truncate">{selectedMatch.teamA?.name || 'TBD'}</p>
                      {selectedMatch.winner?._id === selectedMatch.teamA?._id && <i className="fa-solid fa-crown text-accent mt-2 text-xl"></i>}
                    </div>
                    <div className="px-6 text-3xl font-bold text-primary">
                      {selectedMatch.scoreA ?? '-'} <span className="text-text-secondary mx-2 text-xl">vs</span> {selectedMatch.scoreB ?? '-'}
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-bold text-text text-xl truncate">{selectedMatch.teamB?.name || 'TBD'}</p>
                      {selectedMatch.winner?._id === selectedMatch.teamB?._id && <i className="fa-solid fa-crown text-accent mt-2 text-xl"></i>}
                    </div>
                  </div>

                  <div className="text-center bg-slate-100 py-3 rounded-[4px] border border-slate-200">
                    <p className="text-text-secondary text-sm uppercase tracking-widest font-bold">Status: <span className={selectedMatch.status === 'live' ? 'text-primary' : 'text-text'}>{selectedMatch.status}</span></p>
                  </div>
                </div>
              ) : (
                // Organizer View (Editable Form)
                <form className="space-y-6">
                  <div className="flex justify-between items-center gap-4">
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
                    <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-[4px]">
                      <p className="text-primary font-bold uppercase tracking-widest text-[0.9rem]">This match has been completed.</p>
                      <p className="text-text-secondary text-sm font-bold mt-1">Winner: <span className="text-text">{selectedMatch.winner?.name}</span></p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleLiveScoreUpdate}
                        disabled={submitting || !selectedMatch.teamA || !selectedMatch.teamB}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-text border border-border hover:border-slate-400 py-4 rounded-[4px] font-bold text-[1rem] transition-all"
                      >
                        {submitting === 'live' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Update Live Score'}
                      </button>
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={submitting || !selectedMatch.teamA || !selectedMatch.teamB}
                        className="flex-1 btn-primary py-4 text-[1rem]"
                      >
                        {submitting === 'final' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Submit Final Result'}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;

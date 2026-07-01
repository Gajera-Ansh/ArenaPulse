import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';

const TournamentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Enrollment Modal States
  const [showModal, setShowModal] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  const fetchMyTeams = async () => {
    try {
      setTeamsLoading(true);
      const res = await expressApi.get('/api/teams');
      if (res.data.success) {
        // Handle both populated and unpopulated captain fields
        setMyTeams(res.data.data.filter(team => {
          const captainId = typeof team.captain === 'object' ? team.captain._id : team.captain;
          return captainId === user.id;
        }));
      }
    } catch (err) {
      setEnrollError('Failed to load your teams.');
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setEnrollError('');
    setEnrollSuccess(false);
    fetchMyTeams();
  };

  const handleEnroll = async (team) => {
    try {
      setEnrolling(true);
      setEnrollError('');

      // Validation Step: Check if team roster size perfectly matches tournament requirement
      const requiredSize = tournament.playersPerTeam || 5;
      const currentSize = team.players?.length || 1;

      if (currentSize !== requiredSize) {
        setEnrollError(`Invalid Roster! This tournament strictly requires ${requiredSize} players per team. Your team currently has ${currentSize} confirmed players. Please update your team roster in the My Teams page.`);
        return;
      }

      // Check if team has pending invitations
      if (team.pendingPlayers && team.pendingPlayers.length > 0) {
        setEnrollError(`Pending Invitations! Your team has ${team.pendingPlayers.length} pending player(s). All players must accept their invitations before you can enroll in a tournament.`);
        return;
      }

      const res = await expressApi.post('/api/registrations', {
        teamId: team._id,
        tournamentId: id
      });
      if (res.data.success) {
        setEnrollSuccess(true);
        // Optimistically increment enrolled count
        setTournament(prev => ({ ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 }));

        // Fetch registration immediately so the UI updates without refresh
        const regRes = await expressApi.get(`/api/registrations/tournament/${id}`);
        if (regRes.data.success) {
          const registration = regRes.data.data.find(reg =>
            reg.team && (reg.team.captain === user.id || reg.team.players.some(p => typeof p === 'object' ? p._id === user.id : p === user.id))
          );
          if (registration) {
            setMyRegistration(registration);
          }
        }
      }
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Failed to enroll team.');
    } finally {
      setEnrolling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };
  const [myRegistration, setMyRegistration] = useState(null);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchTournamentAndRegistration = async () => {
      try {
        const res = await expressApi.get(`/api/tournaments/${id}`);
        let fetchedTournament = null;
        if (res.data.success) {
          fetchedTournament = res.data.data;
          setTournament(fetchedTournament);
        }

        if (user) {
          const regRes = await expressApi.get(`/api/registrations/tournament/${id}`);
          if (regRes.data.success) {
            const allRegs = regRes.data.data;

            // Set myRegistration for players
            const registration = allRegs.find(reg =>
              reg.team && (reg.team.captain === user.id || reg.team.players.some(p => typeof p === 'object' ? p._id === user.id : p === user.id))
            );
            if (registration) {
              setMyRegistration(registration);
            }

            // If user is organizer, set allRegistrations
            if (fetchedTournament && fetchedTournament.organizer?._id === user.id) {
              setAllRegistrations(allRegs);
            }
          }
        }
      } catch (err) {
        if (!tournament) setError(err.response?.data?.message || 'Failed to load tournament details');
      } finally {
        setLoading(false);
      }
    };
    fetchTournamentAndRegistration();
  }, [id, user]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const handleOrganizerAction = async (regId, status) => {
    try {
      setActionLoading(regId);
      const res = await expressApi.patch(`/api/registrations/${regId}/status`, { status });
      if (res.data.success) {
        setAllRegistrations(prev => prev.map(reg => reg._id === regId ? { ...reg, status } : reg));
      }
    } catch (err) {
      console.error("Failed to update registration status", err);
      alert(err.response?.data?.message || "Failed to update registration status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseRegistrations = async () => {
    if (!window.confirm("Are you sure you want to close registrations early? New teams will no longer be able to enroll.")) return;

    try {
      // Set the deadline slightly in the past so it evaluates to closed immediately
      const newDeadline = new Date(Date.now() - 60000).toISOString();
      const res = await expressApi.put(`/api/tournaments/${id}`, { registrationDeadline: newDeadline });

      if (res.data.success) {
        setTournament({ ...tournament, registrationDeadline: newDeadline });
        alert("Registrations are now closed!");
      }
    } catch (err) {
      console.error("Failed to close registrations", err);
      alert(err.response?.data?.message || "Failed to close registrations");
    }
  };

  const handleStartTournament = async () => {
    if (!window.confirm("Are you sure you want to start the tournament? This will generate the brackets and cannot be undone.")) return;

    try {
      const res = await expressApi.post(`/api/tournaments/${id}/start`);
      if (res.data.success) {
        alert("Bracket generated successfully!");
        window.location.reload(); // Refresh to see matches
      }
    } catch (err) {
      console.error("Failed to start tournament", err);
      alert(err.response?.data?.message || "Failed to start tournament");
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
      <div className="container py-20 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="max-w-md w-full bg-surface p-8 rounded-[8px] border border-border text-center shadow-sm">
          <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500/80 mb-4"></i>
          <h2 className="text-[1.5rem] font-bold text-text mb-2">Tournaments Not Found</h2>
          <p className="text-text-secondary mb-8">{error || "This tournament may have been deleted or doesn't exist."}</p>
          <Link to="/tournaments" className="btn-primary w-full">
            <i className="fa-solid fa-arrow-left"></i> Return to Board
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === tournament.organizer?._id;

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)]">

      {/* Back Button */}
      <Link to="/tournaments" className="text-primary hover:text-primary-hover font-bold text-[0.9rem] flex items-center gap-2 w-fit transition-transform hover:-translate-x-1 mb-6">
        <i className="fa-solid fa-arrow-left"></i> Back to Board
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header Banner */}
          <div className="bg-surface border border-border rounded-[8px] overflow-hidden shadow-sm">
            <div className="min-h-[10rem] sm:min-h-[14rem] pt-16 bg-surface relative border-b border-border flex items-end p-6 sm:p-8 overflow-hidden">
              
              {/* Visible Cyber Design (matching tournament cards) */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 12px)' }}></div>
              <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none"></div>

              <div className="absolute top-4 right-4 z-10">
                <span className={`px-4 py-1.5 rounded-[4px] text-[0.75rem] font-bold uppercase tracking-widest shadow-sm ${(tournament.status === 'open' && new Date(tournament.registrationDeadline) >= new Date()) ? 'bg-primary text-white' :
                  tournament.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                    'bg-background border border-border text-text-secondary'
                  }`}>
                  {tournament.status === 'open' && new Date(tournament.registrationDeadline) < new Date() ? 'closed' : tournament.status}
                </span>
              </div>
              <div className="relative z-10">
                <span className="inline-block bg-accent/10 border border-accent/20 px-3 py-1 rounded-[4px] text-[0.8rem] font-bold text-accent tracking-wider mb-3 shadow-sm backdrop-blur-sm">
                  {tournament.game}
                </span>
                <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-text leading-tight uppercase tracking-tight drop-shadow-sm">{tournament.title}</h1>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col gap-5 bg-background border-t border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 border border-border rounded-full flex items-center justify-center text-text-secondary text-xl overflow-hidden shrink-0">
                  {tournament.organizer?.avatar ? (
                    <img src={tournament.organizer.avatar} alt="Organizer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <i className="fa-solid fa-user-shield"></i>
                  )}
                </div>
                <div>
                  <p className="text-[0.75rem] text-text-secondary font-bold uppercase tracking-widest mb-0.5">Organized By</p>
                  <p className="text-[1rem] font-bold text-text">{tournament.organizer?.name || 'Unknown Commander'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {tournament.status !== 'open' && (
                  <Link to={`/tournaments/${id}/bracket`} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-primary to-accent border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    <i className={`fa-solid ${tournament.status === 'completed' ? 'fa-trophy' : 'fa-sitemap'}`}></i> {tournament.status === 'completed' ? 'View Final Bracket' : 'View Live Bracket'}
                  </Link>
                )}

                {isOrganizer && (
                  <>
                    {tournament.status === 'open' && (
                      <>
                        {new Date() < new Date(tournament.registrationDeadline) && (
                          <button onClick={handleCloseRegistrations} className="btn-outline flex items-center gap-2 hover:bg-red-300/20 hover:text-red-500 hover:border-red-500/30">
                            <i className="fa-solid fa-lock"></i> Close Reg.
                          </button>
                        )}
                        {new Date() < new Date(tournament.startDate) ? (
                          <button
                            disabled
                            className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2"
                            title={`Active when Live Matches begin: ${formatDate(tournament.startDate)}`}
                          >
                            <i className="fa-solid fa-clock"></i> Start Tournament
                          </button>
                        ) : (
                          <button onClick={handleStartTournament} className="btn-primary flex items-center gap-2">
                            <i className="fa-solid fa-play"></i> Start Tournament
                          </button>
                        )}
                      </>
                    )}
                    {['open', 'draft'].includes(tournament.status) && (
                      <Link to={`/tournaments/${id}/edit`} className="btn-outline flex items-center gap-2">
                        <i className="fa-solid fa-pen"></i> Edit Mode
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Winner Celebration Banner */}
          {tournament.status === 'completed' && tournament.winner && (
            <div className="bg-surface border-2 border-accent/50 rounded-[8px] p-8 text-center relative overflow-hidden shadow-sm animate-fade-in mt-8">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

              <i className="fa-solid fa-trophy text-6xl text-accent mb-6 animate-bounce"></i>
              <h2 className="text-[1.1rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Tournament Champion</h2>
              <h1 className="text-[3rem] sm:text-[4rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-300 to-accent leading-tight mb-2 drop-shadow-lg">
                {tournament.winner.name}
              </h1>
              <p className="text-[1.2rem] text-text font-bold">[{tournament.winner.tag}]</p>
            </div>
          )}

          {/* Rules Section */}
          <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm">
            <h3 className="text-[1.1rem] font-bold text-text uppercase tracking-widest border-b border-border pb-3 mb-6 flex items-center gap-3">
              <i className="fa-solid fa-clipboard-list text-primary"></i> Tournament Briefing
            </h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-[1rem] text-text-secondary whitespace-pre-wrap leading-relaxed">
                {tournament.rules || 'No briefing or rules provided for this tournament. Standby for further comms.'}
              </p>
            </div>
          </div>

          {/* Organizer Registration Management Section */}
          {isOrganizer && (
            <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm mt-8">
              <h3 className="text-[1.1rem] font-bold text-text uppercase tracking-widest border-b border-border pb-3 mb-6 flex items-center gap-3">
                <i className="fa-solid fa-clipboard-check text-primary"></i> Manage Registrations
              </h3>

              {allRegistrations.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center">
                  <i className="fa-solid fa-users-slash text-text-secondary text-2xl mb-3"></i>
                  <p className="text-text-secondary text-[0.95rem]">No teams have applied for this tournament yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allRegistrations.map(reg => (
                    <div key={reg._id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[1.1rem] font-bold text-text">{reg.team?.name}</h4>
                          <span className="text-[0.7rem] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded uppercase tracking-wider">[{reg.team?.tag}]</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-2 py-1 rounded text-[0.7rem] font-bold uppercase tracking-widest ${reg.status === 'approved' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                            reg.status === 'rejected' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                              reg.status === 'awaiting_players' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                                'bg-primary/20 text-primary border border-primary/30'
                            }`}>
                            {reg.status.replace('_', ' ')}
                          </span>
                          <span className="text-[0.8rem] text-text-secondary">
                            <i className="fa-solid fa-user-group mr-1"></i> {reg.team?.players?.length || 0} Players
                          </span>
                          {reg.status === 'awaiting_players' && reg.pendingPlayers && (
                            <span className="text-[0.8rem] text-orange-400">
                              <i className="fa-solid fa-clock mr-1"></i> Waiting on {reg.pendingPlayers.length} player(s)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {tournament.status === 'open' && (
                          <>
                            {reg.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleOrganizerAction(reg._id, 'approved')}
                                  disabled={actionLoading === reg._id}
                                  className="flex-1 md:flex-none bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/30 font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-all flex items-center justify-center gap-2"
                                >
                                  {actionLoading === reg._id ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOrganizerAction(reg._id, 'rejected')}
                                  disabled={actionLoading === reg._id}
                                  className="flex-1 md:flex-none bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-all flex items-center justify-center gap-2"
                                >
                                  {actionLoading === reg._id ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-xmark"></i>}
                                  Reject
                                </button>
                              </>
                            )}
                            {reg.status === 'approved' && (
                              <button
                                onClick={() => handleOrganizerAction(reg._id, 'rejected')}
                                disabled={actionLoading === reg._id}
                                className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-transparent hover:border-red-500/30 font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-all flex items-center justify-center gap-2"
                              >
                                {actionLoading === reg._id ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-ban"></i>}
                                Revoke
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">

          {/* Action Card */}
          <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm relative overflow-hidden">

            <h3 className="text-[0.9rem] font-bold text-text uppercase tracking-widest border-b border-border pb-3 mb-6">Enrollment</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-text-secondary text-[0.8rem] uppercase font-bold"><i className="fa-solid fa-users w-6"></i> Spots Filled</span>
                <span className="font-bold text-text"><strong className="text-primary">{tournament.enrolledCount || 0}</strong> / {tournament.maxTeams}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-text-secondary text-[0.8rem] uppercase font-bold"><i className="fa-solid fa-user-group w-6"></i> Players/Team</span>
                <span className="font-bold text-text">{tournament.playersPerTeam || 5}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-text-secondary text-[0.8rem] uppercase font-bold"><i className="fa-solid fa-trophy w-6"></i> Prize Pool</span>
                <span className="font-bold text-accent">{tournament.prizePool || 'Glory & Honor'}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-text-secondary text-[0.8rem] uppercase font-bold"><i className="fa-solid fa-sitemap w-6"></i> Format</span>
                <span className="font-bold text-text capitalize">{tournament.bracketType?.replace('-', ' ') || 'Single elimination'}</span>
              </div>
            </div>

            {!user ? (
              <Link to="/login" className="btn-primary w-full justify-center flex items-center gap-2 py-3.5 text-[1rem]">
                <i className="fa-solid fa-right-to-bracket"></i> Login to Register
              </Link>
            ) : isOrganizer ? (
              <div className="bg-white/5 border border-border rounded-xl p-4 text-center">
                <p className="text-[0.85rem] text-text-secondary font-medium">You are the organizer of this tournament.</p>
              </div>
            ) : myRegistration ? (
              <div className="bg-white/5 border border-border rounded-xl p-5 shadow-inner">
                <h4 className="text-[1.1rem] font-bold text-text mb-3 text-center">Team {myRegistration.team.name} Status</h4>
                <div className="flex justify-center mb-4">
                  <span className={`px-3 py-1 rounded text-[0.8rem] font-bold uppercase tracking-widest ${myRegistration.status === 'approved' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                    myRegistration.status === 'rejected' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      myRegistration.status === 'awaiting_players' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                        'bg-primary/20 text-primary border border-primary/30'
                    }`}>
                    {myRegistration.status.replace('_', ' ')}
                  </span>
                </div>
                {myRegistration.status === 'rejected' && (
                  <p className="text-[0.85rem] text-red-400 text-center mb-4">{myRegistration.note || 'Your registration was rejected.'}</p>
                )}
                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                  <p className="text-[0.8rem] text-text-secondary uppercase font-bold tracking-wider mb-2">Roster Readiness</p>
                  {myRegistration.team.players.map(player => {
                    const isPending = myRegistration.pendingPlayers?.some(p => p._id === (player._id || player));
                    const isCaptain = (player._id || player) === myRegistration.team.captain;
                    return (
                      <div key={player._id || player} className="flex items-center justify-between">
                        <span className="text-[0.9rem] text-text flex items-center gap-2">
                          <i className={`fa-solid fa-circle text-[0.5rem] ${isPending ? 'text-orange-500' : 'text-green-500'}`}></i>
                          {player.name || 'Player'}
                          {isCaptain && <i className="fa-solid fa-crown text-accent text-[0.7rem] ml-1" title="Captain"></i>}
                        </span>
                        <span className={`text-[0.75rem] font-bold ${isPending ? 'text-orange-500' : 'text-green-500'}`}>
                          {isPending ? 'Pending' : 'Ready'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : tournament.status !== 'open' || new Date(tournament.registrationDeadline) < new Date() ? (
              <button disabled className="btn bg-black/5 text-text-secondary w-full border border-border cursor-not-allowed">
                <i className="fa-solid fa-lock"></i> Registration Closed
              </button>
            ) : (
              <button onClick={handleOpenModal} className="btn-primary w-full justify-center text-[1rem] py-3">
                <i className="fa-solid fa-right-to-bracket"></i> Enroll Team
              </button>
            )}

          </div>

          {/* Timeline Card */}
          <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm">
            <h3 className="text-[0.9rem] font-bold text-text uppercase tracking-widest border-b border-border pb-3 mb-6">Tournament Timeline</h3>

            <div className="relative border-l-2 border-border ml-2 sm:ml-3 space-y-8 py-2">

              {/* Timeline Item 1 */}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-primary"></div>
                <h4 className="text-[0.85rem] font-bold text-primary uppercase tracking-widest mb-1">Registration Closes</h4>
                <p className="text-[1rem] font-medium text-text">{formatDate(tournament.registrationDeadline)}</p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-accent"></div>
                <h4 className="text-[0.85rem] font-bold text-accent uppercase tracking-widest mb-1">Live Matches Begin</h4>
                <p className="text-[1rem] font-medium text-text">{formatDate(tournament.startDate)}</p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-border"></div>
                <h4 className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-widest mb-1">Estimated End Date</h4>
                <p className="text-[1rem] font-medium text-text">{formatDate(tournament.endDate)}</p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Enrollment Modal */}
      {
        showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-[8px] w-full max-w-md overflow-hidden shadow-xl relative">

              {/* Modal Header */}
              <div className="p-6 border-b border-border flex justify-between items-center bg-black/20">
                <h3 className="text-[1.2rem] font-bold text-text uppercase">Select Team to Enroll</h3>
                <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {enrollError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-3 mb-6 text-[0.85rem] font-medium flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {enrollError}
                  </div>
                )}

                {enrollSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <h4 className="text-[1.2rem] font-bold text-text mb-2">Enrollment Successful!</h4>
                    <p className="text-text-secondary text-[0.95rem] mb-6">Your team has been enrolled successfully.</p>
                    <button onClick={() => setShowModal(false)} className="btn-primary w-full justify-center">
                      Acknowledge
                    </button>
                  </div>
                ) : teamsLoading ? (
                  <div className="py-12 flex justify-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
                  </div>
                ) : myTeams.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-white/5 text-text-secondary border border-border rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                      <i className="fa-solid fa-users-slash"></i>
                    </div>
                    <h4 className="text-[1.1rem] font-bold text-text mb-2">No Team Found</h4>
                    <p className="text-text-secondary text-[0.95rem] mb-6">You don't have any teams available for enrollment.</p>
                    <Link to="/teams/create" className="btn-primary w-full justify-center flex items-center gap-2">
                      <i className="fa-solid fa-plus"></i> Create a Team
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[0.85rem] text-text-secondary mb-4">Select which team you want to lead into this tournament. Only teams where you are Captain are shown.</p>
                    {myTeams.map(team => (
                      <div key={team._id} className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:border-primary/50 transition-colors">
                        <div>
                          <h5 className="font-bold text-text text-[1rem] leading-tight">{team.name}</h5>
                          <span className="text-[0.75rem] text-primary font-bold tracking-widest uppercase">[{team.tag}]</span>
                        </div>
                        <button
                          onClick={() => handleEnroll(team)}
                          disabled={enrolling}
                          className="bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 py-2 px-4 rounded-lg font-bold text-[0.85rem] transition-all disabled:opacity-50"
                        >
                          {enrolling ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Enroll'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      }

    </div >
  );
};

export default TournamentDetails;

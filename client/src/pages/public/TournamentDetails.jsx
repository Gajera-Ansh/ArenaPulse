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

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await expressApi.get(`/api/tournaments/${id}`);
        if (res.data.success) {
          setTournament(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tournament details');
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [id]);

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
        <div className="max-w-md w-full glass-panel p-8 rounded-[24px] border border-border text-center shadow-xl">
          <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500/80 mb-4"></i>
          <h2 className="text-[1.5rem] font-bold text-text mb-2">Tournaments Not Found</h2>
          <p className="text-text-secondary mb-8">{error || "This tournament may have been deleted or doesn't exist."}</p>
          <Link to="/tournaments" className="btn-primary inline-flex items-center gap-2">
            <i className="fa-solid fa-arrow-left"></i> Return to Board
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === tournament.organizer?._id;

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)]">
      {/* Ambient Backgrounds */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Back Button */}
      <Link to="/tournaments" className="text-primary hover:text-primary-hover font-bold text-[0.9rem] flex items-center gap-2 w-fit transition-transform hover:-translate-x-1 mb-6">
        <i className="fa-solid fa-arrow-left"></i> Back to Board
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header Banner */}
          <div className="glass-panel border border-border rounded-[24px] overflow-hidden shadow-xl">
            <div className="min-h-[10rem] sm:min-h-[14rem] pt-16 bg-gradient-to-r from-background-light to-background relative border-b border-white/5 flex items-end p-6 sm:p-8">
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-1.5 rounded-full text-[0.75rem] font-bold uppercase tracking-widest shadow-md ${(tournament.status === 'open' && new Date(tournament.registrationDeadline) >= new Date()) ? 'bg-primary text-white' :
                  tournament.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                    'bg-white/10 text-text-secondary'
                  }`}>
                  {tournament.status === 'open' && new Date(tournament.registrationDeadline) < new Date() ? 'closed' : tournament.status}
                </span>
              </div>
              <div>
                <span className="inline-block bg-accent/20 border border-accent/30 backdrop-blur-md px-3 py-1 rounded text-[0.8rem] font-bold text-accent tracking-wider mb-3 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                  {tournament.game}
                </span>
                <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-text leading-tight">{tournament.title}</h1>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 border border-border rounded-full flex items-center justify-center text-text-secondary text-xl overflow-hidden">
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

              {isOrganizer && (
                <Link to={`/tournaments/${id}/edit`} className="btn-outline flex items-center gap-2">
                  <i className="fa-solid fa-pen"></i> Edit Mode
                </Link>
              )}
            </div>
          </div>

          {/* Rules Section */}
          <div className="glass-panel border border-border rounded-[24px] p-6 sm:p-8 shadow-xl">
            <h3 className="text-[1.2rem] font-bold text-text uppercase border-b border-border pb-3 mb-6 flex items-center gap-3">
              <i className="fa-solid fa-clipboard-list text-primary"></i> Tournament Briefing
            </h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-[1rem] text-text-secondary whitespace-pre-wrap leading-relaxed">
                {tournament.rules || 'No briefing or rules provided for this tournament. Standby for further comms.'}
              </p>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">

          {/* Action Card */}
          <div className="glass-panel border border-border rounded-[24px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>

            <h3 className="text-[1.2rem] font-bold text-text uppercase mb-6">Enrollment</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-text-secondary text-[0.9rem]"><i className="fa-solid fa-users w-6"></i> Spots Filled</span>
                <span className="font-bold text-text"><strong className="text-primary">{tournament.enrolledCount || 0}</strong> / {tournament.maxTeams}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-text-secondary text-[0.9rem]"><i className="fa-solid fa-user-group w-6"></i> Players/Team</span>
                <span className="font-bold text-text">{tournament.playersPerTeam || 5}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-text-secondary text-[0.9rem]"><i className="fa-solid fa-trophy w-6"></i> Prize Pool</span>
                <span className="font-bold text-accent">{tournament.prizePool || 'Glory & Honor'}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-text-secondary text-[0.9rem]"><i className="fa-solid fa-sitemap w-6"></i> Format</span>
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
            ) : tournament.status !== 'open' || new Date(tournament.registrationDeadline) < new Date() ? (
              <button disabled className="bg-white/5 text-text-secondary font-bold py-3.5 px-4 w-full rounded-xl flex items-center justify-center gap-2 text-[1rem] cursor-not-allowed border border-border">
                <i className="fa-solid fa-lock"></i> Registration Closed
              </button>
            ) : (
              <button onClick={handleOpenModal} className="bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 w-full rounded-xl transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-[1rem]">
                <i className="fa-solid fa-right-to-bracket"></i> Enroll Team
              </button>
            )}

          </div>

          {/* Timeline Card */}
          <div className="glass-panel border border-border rounded-[24px] p-6 sm:p-8 shadow-xl">
            <h3 className="text-[1.2rem] font-bold text-text uppercase mb-6">Tournament Timeline</h3>

            <div className="relative border-l-2 border-white/10 ml-2 sm:ml-3 space-y-8 py-2">

              {/* Timeline Item 1 */}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary"></div>
                <h4 className="text-[0.85rem] font-bold text-primary uppercase tracking-widest mb-1">Registration Closes</h4>
                <p className="text-[1rem] font-medium text-text">{formatDate(tournament.registrationDeadline)}</p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-accent"></div>
                <h4 className="text-[0.85rem] font-bold text-accent uppercase tracking-widest mb-1">Live Matches Begin</h4>
                <p className="text-[1rem] font-medium text-text">{formatDate(tournament.startDate)}</p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-white/20"></div>
                <h4 className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-widest mb-1">Estimated End Date</h4>
                <p className="text-[1rem] font-medium text-text">{formatDate(tournament.endDate)}</p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-border rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl relative">

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
      )}

    </div>
  );
};

export default TournamentDetails;

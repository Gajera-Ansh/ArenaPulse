import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tournaments, setTournaments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');

  // Rating Modal States
  const [pendingRatings, setPendingRatings] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'organizer' && user?.id) {
          const res = await expressApi.get(`/api/tournaments?organizer=${user.id}`);
          if (res.data.success) {
            setTournaments(res.data.data);
          }
        }

        if (user?.role === 'player') {
          const [invRes, enrRes, activeEnrRes, ratingRes] = await Promise.all([
            expressApi.get('/api/teams/invitations'),
            expressApi.get('/api/registrations/pending-enrollments'),
            expressApi.get('/api/registrations/my-active-enrollments'),
            expressApi.get('/api/tournaments/pending/ratings')
          ]);

          if (invRes.data.success) setInvitations(invRes.data.data);
          if (enrRes.data.success) setEnrollments(enrRes.data.data);
          if (activeEnrRes.data.success) {
            const enrolledTournaments = activeEnrRes.data.data
              .filter(reg => reg.tournament)
              .map(reg => ({
                ...reg.tournament,
                myTeamId: reg.team?._id
              }));
            setTournaments(enrolledTournaments);
          }
          if (ratingRes.data.success && ratingRes.data.data.length > 0) {
            setPendingRatings(ratingRes.data.data);
            setShowRatingModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleInviteAction = async (teamId, action) => {
    try {
      const res = await expressApi.post(`/api/teams/${teamId}/${action}`);
      if (res.data.success) {
        setInvitations(prev => prev.filter(inv => inv._id !== teamId));
      }
    } catch (err) {
      console.error(`Failed to ${action} invite`, err);
    }
  };

  const handleEnrollmentAction = async (registrationId, action) => {
    try {
      const res = await expressApi.post(`/api/registrations/${registrationId}/${action}`);
      if (res.data.success) {
        setEnrollments(prev => prev.filter(enr => enr._id !== registrationId));
      }
    } catch (err) {
      console.error(`Failed to ${action} enrollment`, err);
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'organizer') return 'bg-accent/10 text-accent border border-accent/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  };

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden">

      <div className="w-full">

        {/* Dashboard Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-1 overflow-x-auto hide-scrollbar">
          {['overview', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-t-xl font-bold text-[0.9rem] uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-primary text-white shadow-md transform translate-y-1'
                : 'text-text-secondary hover:bg-white/10 hover:text-text'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm min-h-[500px] flex flex-col flex-grow">

          {activeTab === 'overview' && (
            <div className="animate-fade-in flex flex-col flex-grow">

              {/* Pending Invitations Section */}
              {user?.role === 'player' && invitations.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[1.25rem] font-bold text-text uppercase mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-envelope-open-text text-accent"></i> Pending Draft Requests
                  </h3>
                  <div className="flex flex-col gap-4">
                    {invitations.map(inv => (
                      <div key={inv._id} className="bg-white/5 border border-accent/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(251,191,36,0.05)] transition-all hover:bg-white/10 hover:border-accent/50">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <img 
                              src={inv.logo ? (inv.logo.startsWith('http') ? inv.logo : `http://localhost:5000/${inv.logo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.tag || inv.name)}&background=random&color=fff&size=200&bold=true`} 
                              alt={`${inv.name} Logo`} 
                              className="w-8 h-8 rounded border border-border object-cover" 
                            />
                            <h4 className="text-[1.1rem] font-bold text-text">{inv.name}</h4>
                            <span className="text-[0.7rem] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded uppercase tracking-wider">{inv.tag}</span>
                          </div>
                          <p className="text-[0.85rem] text-text-secondary">
                            Invited by <strong className="text-black">{inv.captain?.name}</strong> for {inv.game}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button onClick={() => handleInviteAction(inv._id, 'accept')} className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20">
                            <i className="fa-solid fa-check"></i> Accept
                          </button>
                          <button onClick={() => handleInviteAction(inv._id, 'decline')} className="flex-1 sm:flex-none bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-text-secondary hover:border-red-500/30 border border-transparent font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-colors flex items-center justify-center gap-2">
                            <i className="fa-solid fa-xmark"></i> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Deployments Section */}
              {user?.role === 'player' && enrollments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[1.25rem] font-bold text-text uppercase mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-rocket text-primary"></i> Pending Tournament Enrollments
                  </h3>
                  <div className="flex flex-col gap-4">
                    {enrollments.map(enr => (
                      <div key={enr._id} className="bg-white/5 border border-primary/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(34,197,94,0.05)] transition-all hover:bg-white/10 hover:border-primary/50">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[1.1rem] font-bold text-text line-clamp-1">{enr.tournament?.title}</h4>
                          </div>
                          <p className="text-[0.85rem] text-text-secondary">
                            Team <strong className="text-black">{enr.team?.name}</strong> wants to enroll here. Are you available to play?
                          </p>
                          <p className="text-[0.75rem] text-primary mt-1 font-medium">
                            <i className="fa-regular fa-calendar mr-1"></i> {formatDate(enr.tournament?.startDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button onClick={() => handleEnrollmentAction(enr._id, 'accept')} className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20">
                            <i className="fa-solid fa-check"></i> Ready
                          </button>
                          <button onClick={() => handleEnrollmentAction(enr._id, 'decline')} className="flex-1 sm:flex-none bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-text-secondary hover:border-red-500/30 border border-transparent font-bold py-2 px-4 rounded-lg text-[0.85rem] transition-colors flex items-center justify-center gap-2">
                            <i className="fa-solid fa-xmark"></i> Unavailable
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-[1.25rem] font-bold text-text uppercase flex items-center gap-2">
                  <i className={`fa-solid ${user?.role === 'organizer' ? 'fa-tower-broadcast text-primary' : 'fa-gamepad text-accent'}`}></i>
                  {user?.role === 'organizer' ? 'Active Tournaments' : 'My Enrollments'}
                </h3>
                {user?.role === 'organizer' && (
                  <Link to="/tournaments/create" className="btn-primary text-[0.8rem] py-2 px-4 w-full sm:w-auto whitespace-nowrap">
                    <i className="fa-solid fa-plus"></i> New Tournament
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="flex-grow flex items-center justify-center">
                  <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
                </div>
              ) : (
                <>
                  {tournaments.filter(t => t.status !== 'completed').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in mb-12">
                      {tournaments.filter(t => t.status !== 'completed').map((t) => (
                        <div key={t._id} className="bg-surface border border-slate-300 rounded-[8px] overflow-hidden hover:border-primary transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 group flex flex-col h-full">
                          {/* Card Banner */}
                          <div className="h-20 bg-surface relative p-4 border-b border-border overflow-hidden">
                            {/* Visible Cyber Design */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 12px)' }}></div>
                            <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none"></div>

                            <div className="absolute top-3 right-3 z-10">
                              <span className={`px-2.5 py-1 rounded-[4px] text-[0.65rem] font-bold uppercase tracking-widest shadow-sm ${(t.status === 'open' && new Date(t.registrationDeadline) >= new Date()) ? 'bg-primary text-white' :
                                t.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                                  'bg-background border border-border text-text-secondary'
                                }`}>
                                {t.status === 'open' && new Date(t.registrationDeadline) < new Date() ? 'closed' : t.status}
                              </span>
                            </div>
                            <span className="inline-block bg-accent/10 border border-accent/20 px-3 py-1 rounded-[4px] text-[0.7rem] font-bold text-accent tracking-wider relative z-10 shadow-sm backdrop-blur-sm">
                              {t.game}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 flex-grow flex flex-col">
                            <h4 className="text-[1.1rem] font-bold text-text leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                              {t.title}
                            </h4>

                            <div className="space-y-2 mt-auto">
                              <div className="flex items-center text-[0.85rem] text-text-secondary">
                                <i className="fa-solid fa-clock w-5 text-center mr-2 text-primary"></i>
                                <span>Reg. Closes: <strong className="text-text">{formatDate(t.registrationDeadline)}</strong></span>
                              </div>
                              <div className="flex items-center text-[0.85rem] text-text-secondary">
                                <i className="fa-regular fa-calendar w-5 text-center mr-2"></i>
                                <span>{formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
                              </div>
                              <div className="flex items-center text-[0.85rem] text-text-secondary">
                                <i className="fa-solid fa-trophy w-5 text-center mr-2 text-accent"></i>
                                <span className="font-bold text-text">{t.prizePool || 'Glory & Honor'}</span>
                              </div>
                              <div className="flex items-center text-[0.85rem] text-text-secondary">
                                <i className="fa-solid fa-users w-5 text-center mr-2"></i>
                                <span><strong className="text-text">{t.enrolledCount || 0}</strong> / <strong className="text-text">{t.maxTeams}</strong> Teams Applied</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="p-4 border-t border-border bg-background">
                            <Link to={`/tournaments/${t._id}`} className="block w-full text-center bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-[4px] transition-all text-[0.85rem] uppercase tracking-wider shadow-sm">
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-dashed border-black/30 rounded-xl p-5 sm:p-8 text-center flex flex-col items-center justify-center flex-grow">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-text-secondary text-2xl mb-4 mt-20">
                        <i className={`fa-solid ${user?.role === 'organizer' ? 'fa-tower-broadcast' : 'fa-gamepad'}`}></i>
                      </div>
                      <h4 className="text-[1.1rem] font-bold text-text mb-2">
                        {user?.role === 'organizer' ? 'No Active Tournaments' : 'No Active Enrollments'}
                      </h4>
                      <p className="text-[0.9rem] text-text-secondary mb-6 max-w-md mx-auto">
                        {user?.role === 'organizer'
                          ? "You haven't launched any active tournaments yet. Start organizing to build your community."
                          : "You aren't deployed in any active tournaments. Browse the tournament board to join the fight."}
                      </p>
                      <Link to="/tournaments" className="btn-outline mb-20">
                        Browse Tournaments
                      </Link>
                    </div>
                  )}

                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (() => {
            const completedHistory = tournaments.filter(t => t.status === 'completed');
            let winCount = 0;
            let lossCount = 0;
            if (user?.role === 'player') {
              winCount = completedHistory.filter(t => String(t.winner) === String(t.myTeamId)).length;
              lossCount = completedHistory.length - winCount;
            }

            return (
              <div className="animate-fade-in flex flex-col flex-grow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-[1.25rem] font-bold text-text uppercase flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-primary"></i> Tournament History
                  </h3>
                  
                  {/* Filter Controls (Only for players) */}
                  {user?.role === 'player' && (
                    <div className="flex bg-black/10 border border-border rounded-[4px] p-1">
                      <button 
                        onClick={() => setHistoryFilter('all')} 
                        className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-all ${historyFilter === 'all' ? 'bg-surface shadow-sm text-text' : 'text-text-secondary hover:text-text'}`}
                      >
                        All ({completedHistory.length})
                      </button>
                      <button 
                        onClick={() => setHistoryFilter('win')} 
                        className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-all ${historyFilter === 'win' ? 'bg-emerald-500/10 text-emerald-500 shadow-sm' : 'text-text-secondary hover:text-emerald-500'}`}
                      >
                        Wins ({winCount})
                      </button>
                      <button 
                        onClick={() => setHistoryFilter('loss')} 
                        className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-all ${historyFilter === 'loss' ? 'bg-red-500/10 text-red-500 shadow-sm' : 'text-text-secondary hover:text-red-500'}`}
                      >
                        Losses ({lossCount})
                      </button>
                    </div>
                  )}
                </div>

                {completedHistory.filter(t => (
                  user?.role === 'organizer' || historyFilter === 'all' ? true : 
                  historyFilter === 'win' ? String(t.winner) === String(t.myTeamId) : 
                  String(t.winner) !== String(t.myTeamId)
                )).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedHistory.filter(t => (
                      user?.role === 'organizer' || historyFilter === 'all' ? true : 
                      historyFilter === 'win' ? String(t.winner) === String(t.myTeamId) : 
                      String(t.winner) !== String(t.myTeamId)
                    )).map((t) => {
                      const isWin = user?.role === 'player' ? String(t.winner) === String(t.myTeamId) : false;
                      return (
                      <div key={t._id} className={`bg-surface border ${user?.role === 'player' ? (isWin ? 'border-emerald-500/30' : 'border-red-500/30') : 'border-slate-300'} rounded-[8px] overflow-hidden hover:border-primary transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 group flex flex-col h-full opacity-70 hover:opacity-100`}>
                        <div className="h-20 bg-surface relative p-4 border-b border-border overflow-hidden">
                          {/* Visible Cyber Design */}
                          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 12px)' }}></div>
                          <div className={`absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l ${user?.role === 'player' ? (isWin ? 'from-emerald-500/20' : 'from-red-500/20') : 'from-primary/20'} to-transparent pointer-events-none`}></div>

                          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
                            <span className="px-2.5 py-1 rounded-[4px] text-[0.65rem] font-bold uppercase tracking-widest shadow-sm bg-background border border-border text-text-secondary">
                              Completed
                            </span>
                            {user?.role === 'player' && (
                              isWin ? (
                                <span className="text-emerald-500 text-[0.65rem] font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded shadow-sm border border-emerald-500/30">
                                  Victory
                                </span>
                              ) : (
                                <span className="text-red-500 text-[0.65rem] font-bold uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded shadow-sm border border-red-500/30">
                                  Defeat
                                </span>
                              )
                            )}
                          </div>
                          <span className="inline-block bg-accent/10 border border-accent/20 px-3 py-1 rounded-[4px] text-[0.7rem] font-bold text-accent tracking-wider relative z-10 shadow-sm backdrop-blur-sm">
                            {t.game}
                          </span>
                        </div>

                        <div className="p-5 flex-grow flex flex-col">
                          <h4 className="text-[1.1rem] font-bold text-text leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {t.title}
                          </h4>
                          <div className="space-y-2 mt-auto">
                            <div className="flex items-center text-[0.85rem] text-text-secondary">
                              <i className="fa-solid fa-trophy w-5 text-center mr-2 text-accent"></i>
                              <span className="font-bold text-text">{t.prizePool || 'Glory & Honor'}</span>
                            </div>
                            <div className="flex items-center text-[0.85rem] text-text-secondary">
                              <i className="fa-solid fa-calendar-check w-5 text-center mr-2"></i>
                              <span>Ended: <strong className="text-text">{formatDate(t.endDate)}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-border bg-background">
                          <Link to={`/tournaments/${t._id}`} className="block w-full text-center bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-[4px] transition-all text-[0.85rem] uppercase tracking-wider shadow-sm">
                            View Details
                          </Link>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center justify-center flex-grow py-12">
                    <i className="fa-solid fa-list-check text-4xl text-text-secondary mb-4 opacity-50"></i>
                    <h3 className="text-[1.25rem] font-bold text-text mb-2">No History Yet</h3>
                    <p className="text-text-secondary">Your past combat records will appear here.</p>
                  </div>
                )}
              </div>
            );
          })()}



        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && pendingRatings.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-[8px] p-6 max-w-md w-full shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none"></div>
            
            <h3 className="text-xl font-bold text-text uppercase tracking-wide mb-2 flex items-center gap-2 relative z-10">
              <i className="fa-solid fa-star text-accent"></i> Rate Organizer
            </h3>
            <p className="text-sm text-text-secondary mb-6 relative z-10">
              The tournament <strong>{pendingRatings[0]?.title}</strong> has concluded! How would you rate your experience with the organizer?
            </p>

            <div 
              className="flex justify-center gap-2 mb-8 relative z-10"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoverRating || currentRating);
                return (
                  <button
                    key={star}
                    onClick={() => setCurrentRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    className={`text-4xl transition-all focus:outline-none ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(234,88,12,0.6)] scale-110' : 'text-text-secondary/50 hover:text-text-secondary/80'}`}
                  >
                    <i className={isActive ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 relative z-10">
              <button
                onClick={() => {
                  const remaining = pendingRatings.slice(1);
                  setPendingRatings(remaining);
                  if (remaining.length === 0) setShowRatingModal(false);
                  setCurrentRating(0); // Reset for next modal
                }}
                className="btn-outline px-4 py-2"
                disabled={submittingRating}
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  setSubmittingRating(true);
                  try {
                    await expressApi.post(`/api/tournaments/${pendingRatings[0]._id}/rate`, { rating: currentRating || 5 }); // Default to 5 if somehow 0
                    const remaining = pendingRatings.slice(1);
                    setPendingRatings(remaining);
                    if (remaining.length === 0) setShowRatingModal(false);
                    setCurrentRating(0); // Reset for next modal
                  } catch (err) {
                    console.error('Failed to submit rating', err);
                  } finally {
                    setSubmittingRating(false);
                  }
                }}
                className="btn-accent px-6 py-2"
                disabled={submittingRating}
              >
                {submittingRating ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

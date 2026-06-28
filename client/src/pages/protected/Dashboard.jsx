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
          const [invRes, enrRes] = await Promise.all([
            expressApi.get('/api/teams/invitations'),
            expressApi.get('/api/registrations/pending-enrollments')
          ]);

          if (invRes.data.success) setInvitations(invRes.data.data);
          if (enrRes.data.success) setEnrollments(enrRes.data.data);
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
      {/* Ambient Backgrounds */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full">

        {/* Dashboard Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-1 overflow-x-auto hide-scrollbar">
          {['overview', 'tournaments', 'settings'].map((tab) => (
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
        <div className="glass-panel border border-border rounded-[24px] p-6 sm:p-8 shadow-xl min-h-[500px] flex flex-col">

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
                          <div className="flex items-center gap-2 mb-1">
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

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[1.25rem] font-bold text-text uppercase">
                  {user?.role === 'organizer' ? 'Active Tournaments' : 'My Enrollments'}
                </h3>
                {user?.role === 'organizer' && (
                  <Link to="/tournaments/create" className="btn-primary text-[0.8rem] py-2 px-4">
                    <i className="fa-solid fa-plus"></i> New Tournament
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="flex-grow flex items-center justify-center">
                  <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
                </div>
              ) : tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {tournaments.map((t) => (
                    <div key={t._id} className="glass-panel border border-border rounded-[20px] overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 group flex flex-col h-full">
                      {/* Card Banner */}
                      <div className="h-20 bg-gradient-to-r from-background-light to-background relative p-4 border-b border-white/5">
                        <div className="absolute top-3 right-3">
                          <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest shadow-sm ${(t.status === 'open' && new Date(t.registrationDeadline) >= new Date()) ? 'bg-primary text-white' :
                              t.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                                'bg-white/10 text-text-secondary'
                            }`}>
                            {t.status === 'open' && new Date(t.registrationDeadline) < new Date() ? 'closed' : t.status}
                          </span>
                        </div>
                        <span className="inline-block bg-accent/20 border border-accent/30 backdrop-blur-md px-3 py-1 rounded text-[0.7rem] font-bold text-accent tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.15)]">
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
                      <div className="p-4 border-t border-border bg-black/20">
                        <Link to={`/tournaments/${t._id}`} className="block w-full text-center bg-white/5 hover:bg-primary/20 text-text hover:text-primary border border-white/10 hover:border-primary/50 font-bold py-2 rounded-lg transition-all text-[0.85rem] uppercase tracking-wider">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center flex-grow">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-text-secondary text-2xl mb-4">
                    <i className={`fa-solid ${user?.role === 'organizer' ? 'fa-tower-broadcast' : 'fa-gamepad'}`}></i>
                  </div>
                  <h4 className="text-[1.1rem] font-bold text-text mb-2">
                    {user?.role === 'organizer' ? 'No Active Tournaments' : 'No Active Enrollments'}
                  </h4>
                  <p className="text-[0.9rem] text-text-secondary mb-6 max-w-md mx-auto">
                    {user?.role === 'organizer'
                      ? "You haven't launched any tournaments yet. Start organizing to build your community."
                      : "You aren't deployed in any active tournaments. Browse the tournament board to join the fight."}
                  </p>
                  <Link to="/tournaments" className="btn-outline">
                    Browse Tournaments
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center flex-grow">
              <i className="fa-solid fa-list-check text-4xl text-text-secondary mb-4 opacity-50"></i>
              <h3 className="text-[1.25rem] font-bold text-text mb-2">Tournament History</h3>
              <p className="text-text-secondary">Your past combat records will appear here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center flex-grow">
              <i className="fa-solid fa-gear text-4xl text-text-secondary mb-4 opacity-50"></i>
              <h3 className="text-[1.25rem] font-bold text-text mb-2">System Settings</h3>
              <p className="text-text-secondary">Account configuration options coming online soon.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;

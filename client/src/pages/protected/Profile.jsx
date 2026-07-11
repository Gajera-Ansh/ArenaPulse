import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import expressApi from '../../api/expressApi';
import { Link, useParams } from 'react-router-dom';
import { SUPPORTED_GAMES } from '../../utils/constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-[8px] p-3 shadow-lg">
        <p className="text-gray-100 font-bold text-sm">{data.tournament}</p>
        <p className="text-gray-400 text-xs mb-2 pb-2 border-b border-[#334155]">{data.date}</p>
        <p className="text-[#3b82f6] text-sm font-medium">Match K/D: <span className="font-bold">{data.match_kd}</span></p>
        <p className="text-[#10b981] text-sm font-medium">Moving Avg: <span className="font-bold">{data.moving_avg_kd}</span></p>
      </div>
    );
  }
  return null;
};

const OrganizerRatingTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-[8px] p-3 shadow-lg">
        <p className="text-gray-100 font-bold text-sm">{data.fullTitle}</p>
        <p className="text-gray-400 text-xs mb-2 pb-2 border-b border-[#334155]">{data.date}</p>
        <p className="text-[#ea580c] text-sm font-medium">Average Rating: <span className="font-bold">{data.rating} / 5</span></p>
      </div>
    );
  }
  return null;
};

const Profile = () => {
  const { user: authUser } = useAuth();
  const { id } = useParams();
  
  const [profileUser, setProfileUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [organizedTournaments, setOrganizedTournaments] = useState([]);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [playerStats, setPlayerStats] = useState(null);
  const [selectedGame, setSelectedGame] = useState(SUPPORTED_GAMES[0]);
  const [analyticsData, setAnalyticsData] = useState([]);
  
  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ reason: 'Cheating/Hacking', description: '', evidenceUrl: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');

  const isOwnProfile = !id || (authUser && id === authUser.id);
  const user = isOwnProfile ? authUser : profileUser;

  useEffect(() => {
    if (user?.role === 'organizer') {
      setActiveTab('tournaments');
    } else if (user?.role === 'admin') {
      setActiveTab('overview');
    } else if (user?.role === 'player') {
      setActiveTab('teams');
    }
  }, [user?.role]);

  useEffect(() => {
    if (showReportModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      document.documentElement.style.overflow = 'unset';
    };
  }, [showReportModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let targetUserId = authUser?.id;
        
        let targetRole = authUser?.role;
        if (!isOwnProfile) {
          const userRes = await expressApi.get(`/api/users/${id}`);
          if (userRes.data.success) {
            setProfileUser({ ...userRes.data.data, id: userRes.data.data._id });
            targetUserId = id;
            targetRole = userRes.data.data.role;
          } else {
             return;
          }
        }

        if (targetRole === 'organizer') {
          const res = await expressApi.get(`/api/tournaments?organizer=${targetUserId}`);
          if (res.data.success) {
            setOrganizedTournaments(res.data.data);
          }
        } else {
          const endpoints = isOwnProfile ? [
            expressApi.get('/api/teams'),
            expressApi.get('/api/registrations/my-active-enrollments'),
            expressApi.get('/api/playerstats/me'),
            fetch(`${import.meta.env.VITE_DJANGO_URL}/analytics/player/${targetUserId}/`).then(res => res.json()).catch(() => null)
          ] : [
            expressApi.get(`/api/teams/user/${targetUserId}`),
            expressApi.get(`/api/registrations/user/${targetUserId}`),
            expressApi.get(`/api/playerstats/user/${targetUserId}`),
            fetch(`${import.meta.env.VITE_DJANGO_URL}/analytics/player/${targetUserId}/`).then(res => res.json()).catch(() => null)
          ];

          const [teamRes, histRes, statsRes, analyticsRes] = await Promise.all(endpoints);
          
          if (teamRes.data.success) {
            setTeams(teamRes.data.data);
          }
          if (histRes.data.success) {
            const enrolledTournaments = histRes.data.data
              .filter(reg => reg.tournament)
              .map(reg => ({
                ...reg.tournament,
                myTeamId: reg.team?._id
              }));
            setTournamentHistory(enrolledTournaments);
          }
          if (statsRes.data.success) {
            setPlayerStats(statsRes.data.data.gameStats || {});
          }
          if (analyticsRes && analyticsRes.success) {
            setAnalyticsData(analyticsRes.data.history);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (authUser || id) {
       fetchData();
    }
  }, [authUser, id, isOwnProfile, profileUser?.role]);

  const submitReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportError('');
    setReportSuccess('');
    
    try {
      const res = await expressApi.post('/api/reports', {
        reportedUserId: id,
        ...reportData
      });
      if (res.data.success) {
        setReportSuccess('Report submitted successfully. Admins will review this shortly.');
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess('');
          setReportData({ reason: 'Cheating/Hacking', description: '', evidenceUrl: '' });
        }, 3000);
      }
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  };

  if (!user) {
    return (
      <div className="container py-32 flex justify-center items-center min-h-[calc(100vh-80px)]">
        <i className="fa-solid fa-circle-notch fa-spin text-5xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-12 animate-fade-in relative min-h-[calc(100vh-80px)]">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[2rem] font-bold text-text uppercase tracking-tight">{isOwnProfile ? 'Profile' : 'Player Card'}</h1>
        <p className="text-text-secondary font-medium">
          {isOwnProfile ? 'Your centralized hub for performance stats, team participation, and overall ArenaPulse journey.' : `Viewing ${user?.name || 'Player'}'s public ArenaPulse details.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Sidebar - Profile Card */}
        <div className="bg-surface border border-border rounded-[8px] p-8 shadow-lg text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

          <div className="relative mx-auto mb-6" style={{ width: '120px', height: '120px' }}>
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse-glow"></div>
            <div className="absolute inset-2 bg-background rounded-full"></div>
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-surface shadow-xl flex items-center justify-center bg-slate-100">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <i className="fa-solid fa-user text-4xl text-slate-400"></i>
              )}
            </div>
            {user?.banned ? (
              <div className="absolute bottom-0 right-1 w-5 h-5 bg-red-500 border-2 border-surface rounded-full shadow-sm flex items-center justify-center" title="Banned">
                <i className="fa-solid fa-ban text-white text-[8px]"></i>
              </div>
            ) : (
              <div className="absolute bottom-0 right-1 w-5 h-5 bg-green-500 border-2 border-surface rounded-full shadow-sm" title="Online"></div>
            )}
          </div>

          <h2 className="text-2xl font-black text-text uppercase tracking-tight">{user?.name}</h2>
          <p className="text-text-secondary text-sm mb-4">{user?.email}</p>

          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            {user?.role}
          </div>

          {user?.bio && (
            <div className="mb-6 p-4 bg-black/5 rounded-[4px] text-sm text-text-secondary text-left italic border-l-2 border-primary/30">
              "{user.bio}"
            </div>
          )}

          <div className="flex flex-col gap-3 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-border/50">
              <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-calendar-plus mr-2 w-4"></i>Joined</span>
              <span className="text-text font-medium text-sm">{formatDate(user?.createdAt || Date.now())}</span>
            </div>
            {user?.role !== 'admin' && (
              <>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-shield-halved mr-2 w-4"></i>{user?.role === 'organizer' ? 'Hosted' : 'Teams'}</span>
                  <span className="text-text font-bold text-sm text-primary">{user?.role === 'organizer' ? organizedTournaments.length : teams.length}</span>
                </div>
                {user?.role === 'player' && (
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-sitemap mr-2 w-4"></i>Tournaments</span>
                    <span className="text-text font-bold text-sm text-primary">{tournamentHistory.length}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-trophy mr-2 w-4"></i>{user?.role === 'organizer' ? 'Status' : 'Win Rate'}</span>
                  <span className="text-text font-bold text-sm text-emerald-500">
                    {user?.role === 'organizer' ? 'Active' : (() => {
                      if (!tournamentHistory || tournamentHistory.length === 0) return '0%';
                      const completedTournaments = tournamentHistory.filter(t => t.status === 'completed');
                      if (completedTournaments.length === 0) return '0%';
                      const wins = completedTournaments.filter(t => t.winner && t.winner.toString() === t.myTeamId?.toString()).length;
                      return `${Math.round((wins / completedTournaments.length) * 100)}%`;
                    })()}
                  </span>
                </div>
              </>
            )}
          </div>

          {isOwnProfile ? (
            <Link to="/settings" className="block w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-text border border-border hover:border-primary/50 rounded-[4px] text-sm font-bold transition-colors">
              <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
            </Link>
          ) : authUser && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="block w-full mt-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 rounded-[4px] text-sm font-bold transition-colors"
            >
              <i className="fa-solid fa-flag mr-2"></i> Report User
            </button>
          )}
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px]">

          {/* Tabs Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {(user?.role === 'organizer' ? ['tournaments', 'analytics'] : user?.role === 'admin' ? ['overview'] : ['teams', 'performance', 'history']).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-6 py-3 rounded-[4px] text-[0.85rem] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-surface border border-border text-text-secondary hover:bg-white/5 hover:text-text'
                  }`}
              >
                {tab === 'teams' ? <><i className="fa-solid fa-users mr-2"></i> Participations</> :
                  tab === 'performance' ? <><i className="fa-solid fa-chart-line mr-2"></i> Performance</> :
                    tab === 'history' ? <><i className="fa-solid fa-clock-rotate-left mr-2"></i> Match History</> :
                      tab === 'tournaments' ? <><i className="fa-solid fa-sitemap mr-2"></i> Hosted Tournaments</> :
                        tab === 'overview' ? <><i className="fa-solid fa-shield-halved mr-2"></i> Overview</> :
                        <><i className="fa-solid fa-chart-pie mr-2"></i> Organizer Analytics</>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm flex flex-col flex-grow">

            {/* Admin: Overview Tab */}
            {activeTab === 'overview' && (
              <div className="bg-white/5 border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center flex-grow animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center text-3xl mb-4">
                  <i className="fa-solid fa-user-shield"></i>
                </div>
                <h4 className="text-[1.5rem] font-bold text-text mb-3">Admin Account</h4>
                <p className="text-[1rem] text-text-secondary max-w-lg mx-auto">
                  This is an administrative account. Player statistics, team participations, and match history are not tracked for administrators.
                </p>
              </div>
            )}

            {/* Organizer: Tournaments Tab */}
            {activeTab === 'tournaments' && (
              <div className="animate-fade-in flex flex-col flex-grow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                    <i className="fa-solid fa-sitemap text-primary"></i> Hosted Tournaments
                  </h3>
                  {isOwnProfile && (
                    <Link to="/tournaments/create" className="btn-primary text-xs py-2 px-4 w-full sm:w-auto whitespace-nowrap">
                      <i className="fa-solid fa-plus mr-2"></i> Create New
                    </Link>
                  )}
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
                  </div>
                ) : organizedTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {organizedTournaments.map(tournament => (
                      <Link to={`/tournaments/${tournament._id}`} key={tournament._id} className={`block bg-black/10 border border-border rounded-[8px] p-5 transition-all hover:border-primary/50 group`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-text group-hover:text-primary transition-colors">{tournament.title}</h4>
                            <div className="text-sm text-text-secondary mt-1">{tournament.game} • {tournament.bracketType === 'round-robin' ? 'Round Robin' : 'Single Elim'}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-[4px] text-[0.7rem] font-bold uppercase tracking-wider ${tournament.status === 'live' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
                              tournament.status === 'completed' ? 'bg-primary-light text-primary border border-[#BFDBFE]' :
                                'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                            }`}>
                            {tournament.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
                          <div>
                            <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Teams</span>
                            <span className="font-bold text-text"><i className="fa-solid fa-users text-primary mr-1"></i> {tournament.maxTeams}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Format</span>
                            <span className="font-bold text-text"><i className="fa-solid fa-user-group text-accent mr-1"></i> {tournament.playersPerTeam}v{tournament.playersPerTeam}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Prize</span>
                            <span className="font-bold text-emerald-500"><i className="fa-solid fa-sack-dollar mr-1"></i> {tournament.prizePool || 'None'}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Start Date</span>
                            <span className="font-bold text-text"><i className="fa-regular fa-calendar mr-1"></i> {new Date(tournament.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/5 rounded-[8px] border border-dashed border-border flex flex-col items-center justify-center flex-grow">
                    <i className="fa-solid fa-sitemap text-4xl text-text-secondary/50 mb-4 mt-12"></i>
                    <h4 className="text-lg font-bold text-text mb-2">No Tournaments Hosted</h4>
                    <p className="text-text-secondary text-sm mb-12 max-w-sm mx-auto">You haven't organized any tournaments yet. Start hosting to build your reputation!</p>
                  </div>
                )}
              </div>
            )}

            {/* Organizer: Analytics Tab */}
            {activeTab === 'analytics' && (() => {
              const ratingData = organizedTournaments
                .filter(t => t.status === 'completed')
                .map(t => {
                  let avg = null;
                  if (t.ratings && t.ratings.length > 0) {
                    avg = t.ratings.reduce((acc, r) => acc + r.rating, 0) / t.ratings.length;
                  }
                  return {
                    name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
                    fullTitle: t.title,
                    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(t.endDate || t.startDate)),
                    rawDate: new Date(t.endDate || t.startDate).getTime(),
                    rating: avg ? parseFloat(avg.toFixed(1)) : null
                  };
                })
                .filter(d => d.rating !== null)
                .sort((a, b) => a.rawDate - b.rawDate);

              const totalRatings = organizedTournaments.reduce((acc, t) => acc + (t.ratings ? t.ratings.length : 0), 0);
              const sumRatings = organizedTournaments.reduce((acc, t) => acc + (t.ratings ? t.ratings.reduce((s, r) => s + r.rating, 0) : 0), 0);
              const overallRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 'N/A';

              return (
                <div className="animate-fade-in flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                      <i className="fa-solid fa-chart-pie text-accent"></i> Organizer Analytics
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                      <i className="fa-solid fa-sitemap text-primary text-xl mb-2"></i>
                      <p className="text-2xl font-black text-text">{organizedTournaments.length}</p>
                      <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Total Matches</p>
                    </div>
                    <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                      <i className="fa-solid fa-star text-accent text-xl mb-2"></i>
                      <p className="text-2xl font-black text-text flex items-center justify-center gap-1">
                        {overallRating} {overallRating !== 'N/A' && <span className="text-sm text-accent"><i className="fa-solid fa-star"></i></span>}
                      </p>
                      <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Average Rating</p>
                    </div>
                  </div>

                  {/* Rating Graph */}
                  <div className="bg-surface border border-border rounded-[8px] p-6 mb-4">
                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6 border-b border-border/50 pb-2">Tournament Rating History</h4>
                    
                    {ratingData.length > 0 ? (
                      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                        <div className="h-[250px] min-w-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ratingData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                              <XAxis 
                                dataKey="name" 
                                stroke="#64748b" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false}
                                dy={10}
                              />
                              <YAxis 
                                domain={[0, 5]} 
                                ticks={[1, 2, 3, 4, 5]}
                                stroke="#64748b" 
                                fontSize={11}
                                tickLine={false} 
                                axisLine={false}
                              />
                              <Tooltip content={<OrganizerRatingTooltip />} />
                              <Line 
                                type="monotone" 
                                dataKey="rating" 
                                name="Avg Rating"
                                stroke="#ea580c" 
                                strokeWidth={3}
                                dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[200px] flex flex-col items-center justify-center text-text-secondary">
                        <i className="fa-solid fa-chart-line text-3xl mb-2 opacity-30"></i>
                        <p>Not enough ratings collected yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Teams (Participations) Tab */}
            {activeTab === 'teams' && (
              <div className="animate-fade-in flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-text uppercase mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-shield text-primary"></i> My Squads
                </h3>

                {loading ? (
                  <div className="py-20 flex justify-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
                  </div>
                ) : teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map(team => (
                      <Link 
                        to={team.isFormerMember ? '#' : `/teams/${team._id}/edit`} 
                        key={team._id} 
                        onClick={(e) => {
                          if (team.isFormerMember) {
                            e.preventDefault();
                            alert('You are no longer an active member of this team. You cannot view their private dashboard.');
                          }
                        }}
                        className={`bg-black/10 border border-border rounded-[8px] p-5 transition-all ${
                          isOwnProfile && !team.isFormerMember ? 'hover:border-primary/50 hover:-translate-y-1 group cursor-pointer' 
                          : team.isFormerMember && isOwnProfile ? 'hover:bg-black/20 cursor-pointer opacity-75' 
                          : 'pointer-events-none'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <img
                            src={team.logo ? (team.logo.startsWith('http') ? team.logo : `http://localhost:5000/${team.logo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(team.tag || team.name)}&background=random&color=fff&size=200&bold=true`}
                            alt={`${team.name} Logo`}
                            className={`w-12 h-12 rounded bg-surface border border-border object-cover shadow-sm transition-colors ${
                              !team.isFormerMember && isOwnProfile ? 'group-hover:border-primary/50' 
                              : team.isFormerMember ? 'grayscale' : ''
                            }`}
                          />
                          <div>
                            <h4 className={`text-lg font-bold text-text leading-tight transition-colors ${
                              !team.isFormerMember && isOwnProfile ? 'group-hover:text-primary' : ''
                            }`}>{team.name}</h4>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-xs bg-primary/20 text-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">[{team.tag}]</span>
                              {team.isFormerMember && (
                                 <span className="text-xs bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Former Member</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!team.isFormerMember && (
                          <div className="flex items-center justify-between text-sm text-text-secondary mt-2">
                            <span className="flex items-center gap-2"><i className="fa-solid fa-users text-primary"></i> {team.players?.length || 1} Members</span>
                            <span className="flex items-center gap-2"> {team.tournamentCount || 0} Tournaments</span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/5 rounded-[8px] border border-dashed border-border">
                    <i className="fa-solid fa-users-slash text-4xl text-text-secondary/50 mb-4"></i>
                    <h4 className="text-lg font-bold text-text mb-2">No Participations Yet</h4>
                    <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">You aren't a part of any teams right now. Create a team or get invited to join the arena!</p>
                    {isOwnProfile && (
                      <Link to="/teams/create" className="btn-primary">
                        <i className="fa-solid fa-plus mr-2"></i> Create Team
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (() => {
              const getDisplayStats = () => {
                if (!playerStats) return { kills: 0, deaths: 0, assists: 0, damage: 0, kd: '0.00' };

                const stats = playerStats[selectedGame] || { kills: 0, deaths: 0, assists: 0, damage: 0 };
                const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : (stats.kills > 0 ? stats.kills.toFixed(2) : '0.00');
                return { kills: stats.kills || 0, deaths: stats.deaths || 0, assists: stats.assists || 0, damage: stats.damage || 0, kd };
              };

                const currentStats = getDisplayStats();
                const isBattleRoyale = selectedGame === 'BGMI' || selectedGame === 'Free Fire';

              return (
                <div className="animate-fade-in flex flex-col flex-grow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                      <i className="fa-solid fa-chart-pie text-accent"></i> Combat Analytics
                    </h3>
                    <select
                      value={selectedGame}
                      onChange={(e) => setSelectedGame(e.target.value)}
                      className="bg-background border border-border text-text text-sm rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-primary w-full sm:w-auto"
                    >
                      {SUPPORTED_GAMES.map(game => (
                        <option key={game} value={game}>{game}</option>
                      ))}
                    </select>
                  </div>

                  {/* Real Data Rendering */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                      <i className="fa-solid fa-crosshairs text-primary text-xl mb-2"></i>
                      <p className="text-3xl font-black text-text">{currentStats.kills}</p>
                      <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Total Kills</p>
                    </div>
                    <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                      <i className="fa-solid fa-skull text-red-500 text-xl mb-2"></i>
                      <p className="text-3xl font-black text-text">{currentStats.deaths}</p>
                      <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Total Deaths</p>
                    </div>
                    {isBattleRoyale ? (
                      <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                        <i className="fa-solid fa-burst text-orange-500 text-xl mb-2"></i>
                        <p className="text-3xl font-black text-text">{currentStats.damage}</p>
                        <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Damage</p>
                      </div>
                    ) : (
                      <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                        <i className="fa-solid fa-hands-helping text-blue-400 text-xl mb-2"></i>
                        <p className="text-3xl font-black text-text">{currentStats.assists}</p>
                        <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Assists</p>
                      </div>
                    )}
                    <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                      <i className="fa-solid fa-percent text-accent text-xl mb-2"></i>
                      <p className="text-3xl font-black text-text">{currentStats.kd}</p>
                      <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">K/D Ratio</p>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-[8px] p-6 flex flex-col flex-grow mt-4">
                    <h4 className="text-md font-bold text-text mb-4 uppercase tracking-wider">K/D Performance Trend</h4>
                    {analyticsData.length > 0 ? (
                      <div className="flex-grow w-full overflow-x-auto custom-scrollbar pb-2">
                        <div className="h-[300px] min-w-[600px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analyticsData.filter(d => d.game === selectedGame)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="tournament" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ paddingTop: '10px' }} />
                              <Line type="monotone" name="Match K/D" dataKey="match_kd" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                              <Line type="monotone" name="Moving Avg (3-Match)" dataKey="moving_avg_kd" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center justify-center flex-grow text-text-secondary py-12">
                        <i className="fa-solid fa-chart-line text-4xl mb-4 opacity-30"></i>
                        <p>Play more matches to generate your performance trend graph.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {activeTab === 'history' && (() => {
              const completedHistory = tournamentHistory.filter(t => t.status === 'completed');
              const winCount = completedHistory.filter(t => String(t.winner) === String(t.myTeamId)).length;
              const lossCount = completedHistory.length - winCount;

              return (
                <div className="animate-fade-in flex flex-col flex-grow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-[1.25rem] font-bold text-text uppercase flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-primary"></i> Tournament History
                    </h3>

                    {/* Filter Controls */}
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
                  </div>

                  {completedHistory.filter(t => (
                    historyFilter === 'all' ? true :
                      historyFilter === 'win' ? String(t.winner) === String(t.myTeamId) :
                        String(t.winner) !== String(t.myTeamId)
                  )).length > 0 ? (
                    <div className="space-y-4">
                      {completedHistory.filter(t => (
                        historyFilter === 'all' ? true :
                          historyFilter === 'win' ? String(t.winner) === String(t.myTeamId) :
                            String(t.winner) !== String(t.myTeamId)
                      )).map((t) => {
                        const isWin = String(t.winner) === String(t.myTeamId);
                        return (
                          <Link to={`/tournaments/${t._id}`} key={t._id} className={`block bg-black/10 border border-border rounded-[8px] p-5 transition-all relative overflow-hidden ${isOwnProfile ? 'hover:border-primary/50 group' : 'pointer-events-none'}`}>
                            {/* Win/Loss background subtle gradient */}
                            <div className={`absolute right-0 top-0 bottom-0 w-32 pointer-events-none opacity-20 bg-gradient-to-l ${isWin ? 'from-emerald-500' : 'from-red-500'} to-transparent`}></div>

                            <div className="flex justify-between items-start mb-3 relative z-10">
                              <div>
                                <h4 className="text-lg font-bold text-text group-hover:text-primary transition-colors">{t.title}</h4>
                                <div className="text-sm text-text-secondary mt-1">{t.game} • {t.bracketType === 'round-robin' ? 'Round Robin' : 'Single Elim'}</div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="px-2 py-1 rounded-[4px] text-[0.7rem] font-bold uppercase tracking-wider bg-primary-light text-primary border border-[#BFDBFE]">
                                  Completed
                                </span>
                                {isWin ? (
                                  <span className="text-emerald-500 text-[0.8rem] font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20">
                                    <i className="fa-solid fa-crown"></i> Victory
                                  </span>
                                ) : (
                                  <span className="text-red-500 text-[0.8rem] font-bold uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-red-500/20">
                                    <i className="fa-solid fa-xmark"></i> Defeat
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
                              <div>
                                <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Teams</span>
                                <span className="font-bold text-text"><i className="fa-solid fa-users text-primary mr-1"></i> {t.enrolledCount || 0}/{t.maxTeams}</span>
                              </div>
                              <div>
                                <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Format</span>
                                <span className="font-bold text-text"><i className="fa-solid fa-user-group text-accent mr-1"></i> {t.playersPerTeam || 5}v{t.playersPerTeam || 5}</span>
                              </div>
                              <div>
                                <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Prize</span>
                                <span className="font-bold text-emerald-500"><i className="fa-solid fa-sack-dollar mr-1"></i> {t.prizePool || 'Glory'}</span>
                              </div>
                              <div>
                                <span className="block text-[0.65rem] text-text-secondary font-bold uppercase tracking-widest mb-1">Ended</span>
                                <span className="font-bold text-text"><i className="fa-regular fa-calendar-check mr-1"></i> {new Date(t.endDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </Link>
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

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-[8px] p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-text-secondary hover:text-text">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            
            <h3 className="text-xl font-bold text-text uppercase tracking-wide mb-2 flex items-center gap-2">
              <i className="fa-solid fa-flag text-red-500"></i> Report User
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              Reporting <strong>{user?.name}</strong>. Please provide details and evidence if possible. False reports may result in a ban.
            </p>

            {reportError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-[4px] p-3 mb-4 text-sm font-medium">
                {reportError}
              </div>
            )}
            
            {reportSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-[4px] p-3 mb-4 text-sm font-medium">
                {reportSuccess}
              </div>
            )}

            <form onSubmit={submitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Reason</label>
                <select 
                  value={reportData.reason}
                  onChange={(e) => setReportData({...reportData, reason: e.target.value})}
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-text focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="Cheating/Hacking">Cheating / Hacking</option>
                  <option value="Toxicity/Harassment">Toxicity / Harassment</option>
                  <option value="Smurfing">Smurfing</option>
                  <option value="Griefing">Griefing / Throwing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Description</label>
                <textarea 
                  value={reportData.description}
                  onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  placeholder="Describe exactly what happened..."
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-text focus:outline-none focus:border-red-500 min-h-[100px]"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Evidence URL</label>
                <input 
                  type="url"
                  value={reportData.evidenceUrl}
                  onChange={(e) => setReportData({...reportData, evidenceUrl: e.target.value})}
                  placeholder="Link to YouTube, Twitch Clip, Streamable, etc."
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-text focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowReportModal(false)} className="px-5 py-2.5 text-text-secondary hover:text-text font-bold text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={reportLoading || reportSuccess} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-[4px] font-bold text-sm transition-colors disabled:opacity-50">
                  {reportLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

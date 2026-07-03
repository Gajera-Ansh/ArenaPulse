import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import expressApi from '../../api/expressApi';
import { Link } from 'react-router-dom';
import { SUPPORTED_GAMES } from '../../utils/constants';

const Profile = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [organizedTournaments, setOrganizedTournaments] = useState([]);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [playerStats, setPlayerStats] = useState(null);
  const [selectedGame, setSelectedGame] = useState('All Games');

  useEffect(() => {
    if (user?.role === 'organizer') {
      setActiveTab('tournaments');
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user?.role === 'organizer') {
          const res = await expressApi.get(`/api/tournaments?organizer=${user.id}`);
          if (res.data.success) {
            setOrganizedTournaments(res.data.data);
          }
        } else {
          const [teamRes, histRes, statsRes] = await Promise.all([
            expressApi.get('/api/teams'),
            expressApi.get('/api/registrations/my-active-enrollments'),
            expressApi.get('/api/playerstats/me')
          ]);
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
        }
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="container py-8 sm:py-12 animate-fade-in relative min-h-[calc(100vh-80px)]">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[2rem] font-bold text-text uppercase tracking-tight">Profile</h1>
        <p className="text-text-secondary font-medium">
          Your centralized hub for performance stats, team participation, and overall ArenaPulse journey.
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
            <div className="absolute bottom-0 right-1 w-5 h-5 bg-green-500 border-2 border-surface rounded-full shadow-sm" title="Online"></div>
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
            <div className="flex justify-between items-center pb-3 border-b border-border/50">
              <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-shield-halved mr-2 w-4"></i>{user?.role === 'organizer' ? 'Hosted' : 'Teams'}</span>
              <span className="text-text font-bold text-sm text-primary">{user?.role === 'organizer' ? organizedTournaments.length : teams.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-trophy mr-2 w-4"></i>{user?.role === 'organizer' ? 'Status' : 'Win Rate'}</span>
              <span className="text-text font-bold text-sm text-emerald-500">{user?.role === 'organizer' ? 'Active' : 'TBD%'}</span>
            </div>
          </div>
          
          <Link to="/settings" className="block w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-text border border-border hover:border-primary/50 rounded-[4px] text-sm font-bold transition-colors">
            <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
          </Link>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px]">
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {(user?.role === 'organizer' ? ['tournaments', 'analytics'] : ['teams', 'performance', 'history']).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-6 py-3 rounded-[4px] text-[0.85rem] font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface border border-border text-text-secondary hover:bg-white/5 hover:text-text'
                }`}
              >
                {tab === 'teams' ? <><i className="fa-solid fa-users mr-2"></i> Participations</> : 
                 tab === 'performance' ? <><i className="fa-solid fa-chart-line mr-2"></i> Performance</> : 
                 tab === 'history' ? <><i className="fa-solid fa-clock-rotate-left mr-2"></i> Match History</> :
                 tab === 'tournaments' ? <><i className="fa-solid fa-sitemap mr-2"></i> Hosted Tournaments</> :
                 <><i className="fa-solid fa-chart-pie mr-2"></i> Organizer Analytics</>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm flex flex-col flex-grow">
            
            {/* Organizer: Tournaments Tab */}
            {activeTab === 'tournaments' && (
              <div className="animate-fade-in flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                    <i className="fa-solid fa-sitemap text-primary"></i> Hosted Tournaments
                  </h3>
                  <Link to="/tournaments/create" className="btn-primary text-xs py-2 px-4">
                    <i className="fa-solid fa-plus mr-2"></i> Create New
                  </Link>
                </div>
                
                {loading ? (
                  <div className="py-20 flex justify-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
                  </div>
                ) : organizedTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {organizedTournaments.map(tournament => (
                      <Link to={`/tournaments/${tournament._id}/edit`} key={tournament._id} className="block bg-black/10 border border-border rounded-[8px] p-5 hover:border-primary/50 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-text group-hover:text-primary transition-colors">{tournament.title}</h4>
                            <div className="text-sm text-text-secondary mt-1">{tournament.game} • {tournament.bracketType === 'round-robin' ? 'Round Robin' : 'Single Elim'}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-[4px] text-[0.7rem] font-bold uppercase tracking-wider ${
                            tournament.status === 'live' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
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
            {activeTab === 'analytics' && (
              <div className="animate-fade-in flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-accent"></i> Organizer Analytics
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-sitemap text-primary text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">{organizedTournaments.length}</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Tournaments Hosted</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-users text-blue-500 text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">{organizedTournaments.reduce((acc, t) => acc + (t.maxTeams || 0), 0)}</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Total Teams Capacity</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-circle-check text-emerald-500 text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">{organizedTournaments.filter(t => t.status === 'completed').length}</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Completed Events</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-star text-accent text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">100%</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Organizer Rating</p>
                  </div>
                </div>
              </div>
            )}

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
                      <Link to={`/teams/${team._id}/edit`} key={team._id} className="bg-black/10 border border-border rounded-[8px] p-5 hover:border-primary/50 transition-all hover:-translate-y-1 group">
                        <div className="flex items-center gap-4 mb-4">
                          <img 
                            src={team.logo ? (team.logo.startsWith('http') ? team.logo : `http://localhost:5000/${team.logo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(team.tag || team.name)}&background=random&color=fff&size=200&bold=true`} 
                            alt={`${team.name} Logo`} 
                            className="w-12 h-12 rounded bg-surface border border-border object-cover shadow-sm group-hover:border-primary/50 transition-colors" 
                          />
                          <div>
                            <h4 className="text-lg font-bold text-text leading-tight group-hover:text-primary transition-colors">{team.name}</h4>
                            <span className="text-xs bg-primary/20 text-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">[{team.tag}]</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-text-secondary">
                          <span className="flex items-center gap-2"><i className="fa-solid fa-users text-primary"></i> {team.players?.length || 1} Members</span>
                          <span className="flex items-center gap-2"> {team.tournamentCount || 0} Tournaments</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/5 rounded-[8px] border border-dashed border-border">
                    <i className="fa-solid fa-users-slash text-4xl text-text-secondary/50 mb-4"></i>
                    <h4 className="text-lg font-bold text-text mb-2">No Participations Yet</h4>
                    <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">You aren't a part of any teams right now. Create a team or get invited to join the arena!</p>
                    <Link to="/teams/create" className="btn-primary">
                      <i className="fa-solid fa-plus mr-2"></i> Create Team
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (() => {
              const getDisplayStats = () => {
                if (!playerStats) return { kills: 0, deaths: 0, assists: 0, kd: '0.00' };
                
                if (selectedGame === 'All Games') {
                  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
                  Object.values(playerStats).forEach(stats => {
                    totalKills += stats.kills || 0;
                    totalDeaths += stats.deaths || 0;
                    totalAssists += stats.assists || 0;
                  });
                  const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : (totalKills > 0 ? totalKills.toFixed(2) : '0.00');
                  return { kills: totalKills, deaths: totalDeaths, assists: totalAssists, kd };
                } else {
                  const stats = playerStats[selectedGame] || { kills: 0, deaths: 0, assists: 0 };
                  const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : (stats.kills > 0 ? stats.kills.toFixed(2) : '0.00');
                  return { kills: stats.kills || 0, deaths: stats.deaths || 0, assists: stats.assists || 0, kd };
                }
              };
              
              const currentStats = getDisplayStats();

              return (
              <div className="animate-fade-in flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-accent"></i> Combat Analytics
                  </h3>
                  <select 
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="bg-background border border-border text-text text-sm rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-primary"
                  >
                    <option value="All Games">All Games</option>
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
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-hands-helping text-blue-400 text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">{currentStats.assists}</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Assists</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-percent text-accent text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">{currentStats.kd}</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">K/D Ratio</p>
                  </div>
                </div>

                <div className="bg-black/5 border border-dashed border-border rounded-[8px] p-8 text-center flex flex-col items-center justify-center flex-grow mt-4">
                  <i className="fa-solid fa-chart-line text-text-secondary/50 text-4xl mb-4"></i>
                  <h4 className="text-lg font-bold text-text mb-2">Django Graph Area</h4>
                  <p className="text-text-secondary text-sm">Once the Django Microservice is live, the visual Python charts will be injected here.</p>
                </div>
              </div>
              );
            })()}

            {activeTab === 'history' && (
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
                      All
                    </button>
                    <button 
                      onClick={() => setHistoryFilter('win')} 
                      className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-all ${historyFilter === 'win' ? 'bg-emerald-500/10 text-emerald-500 shadow-sm' : 'text-text-secondary hover:text-emerald-500'}`}
                    >
                      Wins
                    </button>
                    <button 
                      onClick={() => setHistoryFilter('loss')} 
                      className={`px-4 py-1.5 rounded-[3px] text-xs font-bold uppercase tracking-widest transition-all ${historyFilter === 'loss' ? 'bg-red-500/10 text-red-500 shadow-sm' : 'text-text-secondary hover:text-red-500'}`}
                    >
                      Losses
                    </button>
                  </div>
                </div>

                {tournamentHistory.filter(t => t.status === 'completed' && (
                  historyFilter === 'all' ? true : 
                  historyFilter === 'win' ? String(t.winner) === String(t.myTeamId) : 
                  String(t.winner) !== String(t.myTeamId)
                )).length > 0 ? (
                  <div className="space-y-4">
                    {tournamentHistory.filter(t => t.status === 'completed' && (
                      historyFilter === 'all' ? true : 
                      historyFilter === 'win' ? String(t.winner) === String(t.myTeamId) : 
                      String(t.winner) !== String(t.myTeamId)
                    )).map((t) => {
                      const isWin = String(t.winner) === String(t.myTeamId);
                      return (
                      <Link to={`/tournaments/${t._id}`} key={t._id} className="block bg-black/10 border border-border rounded-[8px] p-5 hover:border-primary/50 transition-all group relative overflow-hidden">
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
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

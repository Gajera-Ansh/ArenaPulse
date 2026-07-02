import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import expressApi from '../../api/expressApi';
import { Link } from 'react-router-dom';
import { SUPPORTED_GAMES } from '../../utils/constants';

const Profile = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await expressApi.get('/api/teams');
        if (res.data.success) {
          setTeams(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch teams", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

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
                <i className="fa-solid fa-user text-4xl text-slate-300"></i>
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
              <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-shield-halved mr-2 w-4"></i>Teams</span>
              <span className="text-text font-bold text-sm text-primary">{teams.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-xs uppercase font-bold tracking-widest"><i className="fa-solid fa-trophy mr-2 w-4"></i>Win Rate</span>
              <span className="text-text font-bold text-sm text-emerald-500">TBD%</span>
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
            {['teams', 'performance', 'history'].map((tab) => (
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
                 <><i className="fa-solid fa-clock-rotate-left mr-2"></i> Match History</>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-surface border border-border rounded-[8px] p-6 sm:p-8 shadow-sm flex-grow">
            
            {/* Teams (Participations) Tab */}
            {activeTab === 'teams' && (
              <div className="animate-fade-in">
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
            {activeTab === 'performance' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-text uppercase flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-accent"></i> Combat Analytics
                  </h3>
                  <select className="bg-background border border-border text-text text-sm rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-primary">
                    <option>All Games</option>
                    {SUPPORTED_GAMES.map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                </div>

                {/* Coming Soon State or Mock Data */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-crosshairs text-primary text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">0</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Total Kills</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-skull text-red-500 text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">0</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Total Deaths</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-hands-helping text-blue-400 text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">0</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">Assists</p>
                  </div>
                  <div className="bg-black/10 border border-border rounded-[8px] p-4 text-center">
                    <i className="fa-solid fa-percent text-accent text-xl mb-2"></i>
                    <p className="text-3xl font-black text-text">0.00</p>
                    <p className="text-[0.65rem] text-text-secondary uppercase font-bold tracking-widest mt-1">K/D Ratio</p>
                  </div>
                </div>

                <div className="bg-black/5 border border-dashed border-border rounded-[8px] p-8 text-center flex flex-col items-center justify-center">
                  <i className="fa-solid fa-chart-line text-text-secondary/50 text-4xl mb-4"></i>
                  <h4 className="text-lg font-bold text-text mb-2">No Data Available</h4>
                  <p className="text-text-secondary text-sm">Play more matches in tournaments to generate your performance analytics.</p>
                </div>
              </div>
            )}

            {/* Match History Tab */}
            {activeTab === 'history' && (
              <div className="animate-fade-in text-center py-16">
                <i className="fa-solid fa-clock-rotate-left text-text-secondary/30 text-5xl mb-4"></i>
                <h4 className="text-lg font-bold text-text mb-2">Match History</h4>
                <p className="text-text-secondary text-sm max-w-sm mx-auto">Your recent tournament matches and results will be displayed here.</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

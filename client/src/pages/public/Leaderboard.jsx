import React, { useState, useEffect } from 'react';
import expressApi from '../../api/expressApi';
import { SUPPORTED_GAMES } from '../../utils/constants';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('teams');
  const [filterGame, setFilterGame] = useState(SUPPORTED_GAMES[0]); // Default to first game
  const [teamData, setTeamData] = useState([]);
  const [playerData, setPlayerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { game: filterGame };
        if (activeTab === 'teams') {
          const res = await expressApi.get('/api/leaderboard/teams', { params });
          if (res.data.success) setTeamData(res.data.data);
        } else {
          const res = await expressApi.get('/api/playerstats/leaderboard', { params });
          if (res.data.success) setPlayerData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, filterGame]);

  const getRankStyle = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400/20 to-yellow-500/5 border-l-4 border-l-yellow-400';
    if (index === 1) return 'bg-gradient-to-r from-gray-300/20 to-gray-400/5 border-l-4 border-l-gray-400';
    if (index === 2) return 'bg-gradient-to-r from-amber-600/15 to-amber-700/5 border-l-4 border-l-amber-600';
    return 'border-l-4 border-l-transparent';
  };

  const getRankIcon = (index) => {
    if (index === 0) return <span className="text-yellow-500 text-[1.3rem]">🥇</span>;
    if (index === 1) return <span className="text-gray-400 text-[1.3rem]">🥈</span>;
    if (index === 2) return <span className="text-amber-600 text-[1.3rem]">🥉</span>;
    return <span className="text-text-secondary font-bold text-[1rem]">#{index + 1}</span>;
  };

  return (
    <div className="container py-8 sm:py-12 min-h-[calc(100vh-80px)]">

      {/* Header */}
      <div className="mb-8 sm:mb-10 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-text uppercase tracking-tight mb-2 sm:mb-4 drop-shadow-md leading-tight">
          Leaderboard
        </h1>
        <p className="text-text-secondary font-medium text-[0.95rem] sm:text-[1.1rem]">
          Global rankings across all ArenaPulse tournaments. See who dominates the arena.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-surface border border-border rounded-[8px] p-4 sm:p-5 mb-8 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">

        {/* Tabs */}
        <div className="flex bg-bg border border-border rounded-[6px] p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-[4px] text-[0.85rem] font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === 'teams'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text hover:bg-white/60'
              }`}
          >
            <i className="fa-solid fa-users mr-2"></i>Teams
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-[4px] text-[0.85rem] font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === 'players'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text hover:bg-white/60'
              }`}
          >
            <i className="fa-solid fa-user mr-2"></i>Players
          </button>
        </div>

        {/* Game Filter */}
        <div className="relative w-full sm:w-52">
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="w-full h-[44px] bg-bg border border-border rounded-[4px] px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer text-[0.9rem]"
          >
            {SUPPORTED_GAMES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[0.75rem]"></i>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-surface border border-border rounded-[8px] shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3.5 bg-bg border-b border-border text-[0.7rem] font-bold text-text-secondary uppercase tracking-[0.15em]">
          <div className="col-span-1 text-center">Rank</div>
          <div className={activeTab === 'teams' ? 'col-span-4' : 'col-span-3'}>{activeTab === 'teams' ? 'Team' : 'Player'}</div>
          {activeTab === 'players' && <div className="col-span-2">Team</div>}
          
          {activeTab === 'players' && <div className="col-span-1 text-center" title="Matches Played">M</div>}
          
          <div className={`${activeTab === 'teams' ? 'col-span-2' : 'col-span-1'} text-center`} title="Kills">{activeTab === 'teams' ? 'W' : 'K'}</div>
          <div className={`${activeTab === 'teams' ? 'col-span-2' : 'col-span-1'} text-center`} title="Deaths">{activeTab === 'teams' ? 'L' : 'D'}</div>
          
          {activeTab === 'players' && <div className="col-span-1 text-center" title="Assists">A</div>}
          {activeTab === 'players' && <div className="col-span-1 text-center" title="Headshots">HS</div>}
          
          <div className="col-span-1 text-center">{activeTab === 'teams' ? 'Win%' : 'K/D'}</div>
          
          {activeTab === 'teams' && (
            <div className="col-span-2 text-center">
              <i className="fa-solid fa-trophy mr-1 text-accent"></i>Titles
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-text-secondary text-[0.9rem] font-medium">Loading rankings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && ((activeTab === 'teams' && teamData.length === 0) || (activeTab === 'players' && playerData.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <i className="fa-solid fa-ranking-star text-[3rem] text-border"></i>
            <p className="text-text-secondary text-[1rem] font-medium">No ranking data yet.</p>
            <p className="text-text-secondary text-[0.85rem]">
              Rankings will appear after matches are played in tournaments.
            </p>
          </div>
        )}

        {/* Team Rows */}
        {!loading && activeTab === 'teams' && teamData.map((entry, index) => (
          <div
            key={entry.team._id}
            className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 sm:px-6 py-4 items-center border-b border-border/50 hover:bg-primary/[0.03] transition-colors ${getRankStyle(index)}`}
          >
            {/* Rank */}
            <div className="col-span-1 flex items-center justify-center">
              {getRankIcon(index)}
            </div>

            {/* Team Info */}
            <div className="col-span-4 flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[6px] bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src={entry.team.logo ? (entry.team.logo.startsWith('http') ? entry.team.logo : `http://localhost:5000/${entry.team.logo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.team.tag || entry.team.name)}&background=random&color=fff&size=200&bold=true`} 
                  alt={entry.team.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[0.95rem] text-text truncate">{entry.team.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider">[{entry.team.tag}]</span>
                  <span className="text-[0.65rem] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{entry.team.game}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="col-span-2 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">W:</span>
              <span className="font-bold text-[1rem] text-emerald-600">{entry.wins}</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">L:</span>
              <span className="font-bold text-[1rem] text-red-500">{entry.losses}</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Win%:</span>
              <span className={`font-bold text-[0.9rem] ${entry.winRate >= 60 ? 'text-emerald-600' : entry.winRate >= 40 ? 'text-text' : 'text-red-500'}`}>
                {entry.winRate}%
              </span>
            </div>
            <div className="col-span-2 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Titles:</span>
              {entry.tournamentsWon > 0 ? (
                <span className="inline-flex items-center gap-1 bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-[4px] font-bold text-[0.85rem]">
                  <i className="fa-solid fa-trophy text-[0.75rem]"></i> {entry.tournamentsWon}
                </span>
              ) : (
                <span className="text-text-secondary text-[0.85rem]">—</span>
              )}
            </div>
          </div>
        ))}

        {/* Player Rows */}
        {!loading && activeTab === 'players' && playerData.map((entry, index) => (
          <div
            key={entry.player._id}
            className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 sm:px-6 py-4 items-center border-b border-border/50 hover:bg-primary/[0.03] transition-colors ${getRankStyle(index)}`}
          >
            {/* Rank */}
            <div className="col-span-1 flex items-center justify-center">
              {getRankIcon(index)}
            </div>

            {/* Player Info */}
            <div className="col-span-3 flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {entry.player.avatar ? (
                  <img src={entry.player.avatar} alt={entry.player.name} className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-user text-primary text-[1rem]"></i>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[0.95rem] text-text truncate">{entry.player.name}</div>
              </div>
            </div>

            {/* Team Info */}
            <div className="col-span-2 min-w-0">
              {entry.team ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.8rem] font-semibold text-text-secondary truncate">{entry.team.name}</span>
                  <span className="text-[0.65rem] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{entry.team.game}</span>
                </div>
              ) : (
                <span className="text-[0.8rem] text-text-secondary italic">No team</span>
              )}
            </div>

            {/* Stats */}
            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Matches:</span>
              <span className="font-bold text-[0.95rem] text-text-secondary">{entry.matches || 0}</span>
            </div>
            
            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Kills:</span>
              <span className="font-bold text-[1rem] text-emerald-600">{entry.kills || 0}</span>
            </div>
            
            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Deaths:</span>
              <span className="font-bold text-[1rem] text-red-500">{entry.deaths || 0}</span>
            </div>

            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Assists:</span>
              <span className="font-bold text-[0.95rem] text-blue-500">{entry.assists || 0}</span>
            </div>

            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">Headshots:</span>
              <span className="font-bold text-[0.95rem] text-orange-500">{entry.headshots || 0}</span>
            </div>

            <div className="col-span-1 text-center">
              <span className="sm:hidden text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider mr-2">K/D:</span>
              <span className={`font-bold text-[0.9rem] ${parseFloat(entry.kdRatio) >= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                {entry.kdRatio || '0.00'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;

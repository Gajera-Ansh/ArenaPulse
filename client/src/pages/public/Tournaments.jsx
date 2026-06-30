import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        let url = '/api/tournaments';
        if (filterGame) {
          url += `?game=${encodeURIComponent(filterGame)}`;
        }
        const res = await expressApi.get(url);
        if (res.data.success) {
          setTournaments(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [filterGame]);

  const filteredTournaments = tournaments.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    t.status === 'open'
  );

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden flex flex-col">
    
      {/* Header Section */}
      <div className="mb-8 sm:mb-10 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-[2rem] sm:text-[3rem] font-bold text-text uppercase tracking-tight mb-2 sm:mb-4 drop-shadow-md leading-tight">Tournament Board</h1>
        <p className="text-text-secondary font-medium text-[0.95rem] sm:text-[1.1rem]">
          Browse active tournaments and find your next challenge. Enroll your team and dominate the arena.
        </p>
      </div>

      {/* Controls & Filters */}
      <div className="glass-panel border border-border rounded-2xl p-4 sm:p-6 mb-8 sm:mb-10 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between mx-0 sm:mx-4 lg:mx-0">
        <div className="relative flex-grow w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
          <input 
            type="text" 
            placeholder="Search tournaments by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[48px] bg-white/5 border border-border rounded-xl pl-12 pr-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[0.9rem] sm:text-[1rem]"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="w-full md:w-48 h-[48px] bg-white/5 border border-border rounded-xl px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer text-[0.9rem] sm:text-[1rem]"
          >
            <option value="">All Games</option>
            <option value="Valorant">Valorant</option>
            <option value="League of Legends">League of Legends</option>
            <option value="Counter-Strike 2">Counter-Strike 2</option>
            <option value="BGMI">BGMI</option>
            <option value="Free Fire">Free Fire</option>
            <option value="Dota 2">Dota 2</option>
            <option value="Rocket League">Rocket League</option>
          </select>
        </div>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i>
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
          {filteredTournaments.map((t) => (
            <div key={t._id} className="glass-panel border border-border rounded-[20px] overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 group flex flex-col h-full">
              
              {/* Card Banner */}
              <div className="h-24 bg-gradient-to-r from-background-light to-background relative p-5 border-b border-white/5">
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest shadow-sm ${
                    (t.status === 'open' && new Date(t.registrationDeadline) >= new Date()) ? 'bg-primary text-white' : 
                    t.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 
                    'bg-white/10 text-text-secondary'
                  }`}>
                    {t.status === 'open' && new Date(t.registrationDeadline) < new Date() ? 'closed' : t.status}
                  </span>
                </div>
                <span className="inline-block bg-accent/20 border border-accent/30 backdrop-blur-md px-3 py-1 rounded text-[0.7rem] font-bold text-accent mb-2 tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                  {t.game}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-grow flex flex-col">
                <h4 className="text-[1.2rem] font-bold text-text leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {t.title}
                </h4>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center text-[0.85rem] text-text-secondary">
                    <i className="fa-solid fa-clock w-5 text-center mr-2 text-primary"></i>
                    <span>Reg. Closes: <strong className="text-text">{formatDate(t.registrationDeadline)}</strong></span>
                  </div>
                  <div className="flex items-center text-[0.85rem] text-text-secondary">
                    <i className="fa-regular fa-calendar w-5 text-center mr-2"></i>
                    <span>
                      {formatDate(t.startDate)} - {formatDate(t.endDate)}
                    </span>
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
                <Link to={`/tournaments/${t._id}`} className="block w-full text-center bg-white/5 hover:bg-primary/20 text-text hover:text-primary border border-white/10 hover:border-primary/50 font-bold py-2.5 rounded-lg transition-all text-[0.85rem] uppercase tracking-wider">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center flex-grow animate-fade-in">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-text-secondary text-3xl mb-6">
            <i className="fa-solid fa-ghost"></i>
          </div>
          <h4 className="text-[1.5rem] font-bold text-text mb-3">No Tournaments Found</h4>
          <p className="text-[1rem] text-text-secondary max-w-lg mx-auto">
            We couldn't find any tournaments matching your current filters or search query. Check back later or adjust your parameters.
          </p>
        </div>
      )}
    </div>
  );
};

export default Tournaments;

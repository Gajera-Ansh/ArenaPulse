import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { SUPPORTED_GAMES } from '../../utils/constants';

const Tournaments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get('status') || 'open';
  
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
    t.status === filterStatus
  );

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden flex flex-col">

      {/* Header Section */}
      <div className="mb-8 sm:mb-10 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-text uppercase tracking-tight mb-2 sm:mb-4 drop-shadow-md leading-tight">
          {filterStatus === 'completed' ? 'Completed Tournaments' : 'Tournament Board'}
        </h1>
        <p className="text-text-secondary font-medium text-[0.95rem] sm:text-[1.1rem]">
          {filterStatus === 'completed' 
            ? 'Browse past tournaments to view final brackets and champions.'
            : 'Browse active tournaments and find your next challenge. Enroll your team and dominate the arena.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border pb-1">
        <button 
          onClick={() => setSearchParams({ status: 'open' })} 
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${filterStatus === 'open' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text'}`}
        >
          <i className="fa-solid fa-door-open mr-2"></i> Open Registration
        </button>
        <button 
          onClick={() => setSearchParams({ status: 'completed' })} 
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${filterStatus === 'completed' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text'}`}
        >
          <i className="fa-solid fa-trophy mr-2"></i> Completed
        </button>
      </div>

      {/* Controls & Filters */}
      <div className="bg-surface border border-border rounded-[8px] p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mx-0 sm:mx-4 lg:mx-0">
        <div className="relative flex-grow w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
          <input
            type="text"
            placeholder="Search tournaments by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[48px] bg-background border border-border rounded-[4px] pl-12 pr-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[0.9rem] sm:text-[1rem]"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <select
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
              className="w-full h-[48px] bg-background border border-border rounded-[4px] px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer text-[0.9rem] sm:text-[1rem]"
            >
              <option value="">All Games</option>
              {SUPPORTED_GAMES.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[0.8rem]"></i>
          </div>
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
            <div key={t._id} className="bg-surface border border-slate-300 rounded-[8px] overflow-hidden hover:border-primary transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 group flex flex-col h-full">

              {/* Card Banner */}
              <div className="h-24 bg-surface relative p-5 border-b border-border overflow-hidden">
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
                <span className="inline-block bg-accent/10 border border-accent/20 px-3 py-1 rounded-[4px] text-[0.7rem] font-bold text-accent mb-2 tracking-wider relative z-10 shadow-sm backdrop-blur-sm">
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

              <div className="p-4 border-t border-border bg-background">
                <Link to={`/tournaments/${t._id}`} className="block w-full text-center bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-[4px] transition-all text-[0.85rem] uppercase tracking-wider shadow-sm">
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await expressApi.get('/api/teams');
      if (res.data.success) {
        setTeams(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to disband this team? This cannot be undone.")) {
      try {
        setActionLoading(id);
        const res = await expressApi.delete(`/api/teams/${id}`);
        if (res.data.success) {
          setTeams(teams.filter(t => t._id !== id));
        }
      } catch (err) {
        console.error("Failed to delete team", err);
        alert(err.response?.data?.message || 'Failed to delete team');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden flex flex-col">

      {/* Header Section */}
      <div className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[2rem] font-bold text-text uppercase tracking-tight leading-tight mb-1">My Teams</h1>
          <p className="text-text-secondary font-medium text-[0.95rem]">
            Manage your rosters and command your teams.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[0.9rem]"></i>
            <input 
              type="text" 
              placeholder="Search teams by name or tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-panel pl-10 pr-4 py-2 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[0.9rem]"
            />
          </div>
          <Link to="/teams/create" className="btn-primary w-full sm:w-auto whitespace-nowrap">
            <i className="fa-solid fa-plus text-[0.8rem]"></i> Create Team
          </Link>
        </div>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i>
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
          {filteredTeams.map((t) => (
            <div key={t._id} className="bg-surface border border-slate-300 rounded-[8px] overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg group flex flex-col h-full relative">
              {/* Card Banner */}
              <div className="bg-black/5 relative p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h4 className="text-[1.1rem] font-bold text-text uppercase tracking-tight group-hover:text-primary transition-colors">
                    {t.name} <span className="text-[0.75rem] text-text-secondary tracking-widest ml-1">[{t.tag}]</span>
                  </h4>
                </div>
                <div className="flex gap-2">
                  {t.captain?._id === user?.id || t.captain === user?.id ? (
                    <>
                      <Link to={`/teams/${t._id}/edit`} className="w-8 h-8 rounded bg-black/5 hover:bg-black/10 border border-transparent hover:border-border flex items-center justify-center text-text-secondary hover:text-text transition-colors">
                        <i className="fa-solid fa-pen text-[0.8rem]"></i>
                      </Link>
                      <button 
                        onClick={() => handleDelete(t._id)}
                        disabled={actionLoading === t._id}
                        className="w-8 h-8 rounded bg-black/5 hover:bg-red-500 hover:text-white border border-transparent flex items-center justify-center text-text-secondary transition-colors disabled:opacity-50"
                      >
                        {actionLoading === t._id ? <i className="fa-solid fa-circle-notch fa-spin text-[0.8rem]"></i> : <i className="fa-solid fa-trash text-[0.8rem]"></i>}
                      </button>
                    </>
                  ) : (
                    <Link to={`/teams/${t._id}/edit`} className="w-8 h-8 rounded bg-black/5 hover:bg-black/10 border border-transparent hover:border-border flex items-center justify-center text-text-secondary hover:text-text transition-colors" title="View Team">
                      <i className="fa-solid fa-eye text-[0.8rem]"></i>
                    </Link>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm overflow-hidden">
                    {t.captain?.avatar ? <img src={t.captain.avatar} alt="Captain" className="w-full h-full object-cover" /> : <i className="fa-solid fa-crown"></i>}
                  </div>
                  <div>
                    <p className="text-[0.65rem] text-primary font-bold uppercase tracking-widest">Captain</p>
                    <p className="text-[0.9rem] font-bold text-text">{t.captain?.name || 'Unknown'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[0.75rem] text-text-secondary font-bold uppercase tracking-widest mb-3">Roster ({t.players?.length || 1}/10)</p>
                  <div className="flex flex-wrap gap-2">
                    {t.players?.filter(p => p._id !== t.captain?._id).map(p => (
                      <span key={p._id} className="bg-white/5 border border-border px-3 py-1.5 rounded-lg text-[0.8rem] text-text-secondary flex items-center gap-2">
                        {p.name}
                      </span>
                    ))}
                    {(!t.players || t.players.length === 1) && (
                      <span className="text-[0.8rem] text-text-secondary italic">No other players yet. Form your squad!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center flex-grow animate-fade-in">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-text-secondary text-3xl mb-6">
            <i className="fa-solid fa-users-slash"></i>
          </div>
          <h4 className="text-[1.5rem] font-bold text-text mb-3">No Teams Found</h4>
          <p className="text-[1rem] text-text-secondary max-w-lg mx-auto mb-6">
            {searchQuery ? "You have no teams matching that search." : "You haven't created any teams yet! Create your first team to start competing."}
          </p>
          {!searchQuery && (
            <Link to="/teams/create" className="btn-primary">
              <i className="fa-solid fa-plus"></i> Create a Team
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Teams;

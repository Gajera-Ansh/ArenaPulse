import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCustomGame, setIsCustomGame] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: 'Valorant'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await expressApi.get(`/api/teams/${id}`);
        if (res.data.success) {
          const t = res.data.data;
          
          const standardGames = ['Valorant', 'League of Legends', 'Counter-Strike 2', 'BGMI', 'Free Fire', 'Dota 2', 'Rocket League'];
          if (!standardGames.includes(t.game)) {
            setIsCustomGame(true);
          }

          setFormData({
            name: t.name || '',
            tag: t.tag || '',
            game: t.game || ''
          });

          // Set selected players, filtering out the captain (who is the current user)
          const captainId = typeof t.captain === 'object' ? t.captain._id : t.captain;
          if (t.players) {
            const squad = t.players.filter(p => String(p._id) !== String(captainId));
            setSelectedPlayers(squad);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load team data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await expressApi.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}&role=player`);
          if (res.data.success) {
            const results = res.data.data.filter(p => 
              String(p._id) !== String(user?.id || user?._id) && !selectedPlayers.some(sp => String(sp._id) === String(p._id))
            );
            setSearchResults(results);
          }
        } catch (err) {
          console.error("Failed to search users", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedPlayers, user?.id]);

  const handleAddPlayer = (player) => {
    if (selectedPlayers.length >= 9) return;
    setSelectedPlayers([...selectedPlayers, player]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers(selectedPlayers.filter(p => p._id !== playerId));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        players: selectedPlayers.map(p => p._id)
      };
      
      const res = await expressApi.put(`/api/teams/${id}`, payload);

      if (res.data.success) {
        navigate('/teams');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container py-20 flex justify-center items-center min-h-[calc(100vh-80px)]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Ambient Backgrounds */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="mb-8 flex items-center justify-between max-w-xl mx-auto">
        <div>
          <Link to="/teams" className="text-primary hover:text-primary-hover font-bold text-[0.9rem] flex items-center gap-2 mb-2 w-fit transition-transform hover:-translate-x-1">
            <i className="fa-solid fa-arrow-left"></i> Back to My Teams
          </Link>
          <h1 className="text-[2.5rem] font-bold text-text uppercase tracking-tight">Edit Team</h1>
          <p className="text-text-secondary font-medium">Update team details and manage your players.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="glass-panel border border-border rounded-[24px] p-8 sm:p-10 shadow-xl">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-4 mb-8 text-[0.9rem] font-medium flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation text-lg"></i>
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Team Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength="30"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="e.g. Cloud9"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Team Tag (Max 5 Chars)</label>
              <input
                type="text"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                maxLength="5"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
                placeholder="e.g. C9"
                required
              />
            </div>

            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Primary Game</label>
              <select
                name="game"
                value={isCustomGame ? 'Custom' : formData.game}
                onChange={(e) => {
                  if (e.target.value === 'Custom') {
                    setIsCustomGame(true);
                    setFormData({ ...formData, game: '' });
                  } else {
                    setIsCustomGame(false);
                    setFormData({ ...formData, game: e.target.value });
                  }
                }}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                required
              >
                <option value="Valorant">Valorant</option>
                <option value="League of Legends">League of Legends</option>
                <option value="Counter-Strike 2">Counter-Strike 2</option>
                <option value="BGMI">BGMI</option>
                <option value="Free Fire">Free Fire</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Rocket League">Rocket League</option>
                <option value="Custom">Custom (Type manually)</option>
              </select>

              {isCustomGame && (
                <input
                  type="text"
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all mt-3 animate-fade-in"
                  placeholder="Enter custom game name"
                  required
                />
              )}
            </div>

            {/* Player Roster */}
            <div className="mt-8 pt-6 border-t border-border">
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-3">Team Roster ({selectedPlayers.length + 1}/10)</label>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="bg-primary/20 border border-primary/30 text-primary px-4 py-2 rounded-xl text-[0.9rem] font-bold flex items-center gap-2 shadow-sm">
                  <i className="fa-solid fa-crown text-[0.8rem]"></i> You (Captain)
                </div>
                {selectedPlayers.map(p => (
                  <div key={p._id} className="bg-white/5 border border-border text-text px-4 py-2 rounded-xl text-[0.9rem] font-medium flex items-center gap-2 hover:border-red-500/50 transition-colors group">
                    {p.name}
                    <button type="button" onClick={() => handleRemovePlayer(p._id)} className="text-text-secondary group-hover:text-red-400 transition-colors ml-1">
                      <i className="fa-solid fa-xmark text-[0.8rem]"></i>
                    </button>
                  </div>
                ))}
              </div>

              {selectedPlayers.length < 9 && (
                <div className="relative mt-2">
                  <i className="fa-solid fa-user-plus absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search players by username..."
                    className="w-full bg-black/20 border border-border rounded-xl pl-12 pr-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[0.95rem]"
                  />
                  {isSearching && <i className="fa-solid fa-circle-notch fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-primary"></i>}

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-background border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors" onClick={() => handleAddPlayer(u)}>
                          <span className="text-[0.95rem] font-medium text-text">{u.name}</span>
                          <button type="button" className="text-primary bg-primary/10 hover:bg-primary/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                            <i className="fa-solid fa-plus text-[0.8rem]"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2 w-full justify-center"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fa-solid fa-check"></i>
              )}
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default EditTeam;

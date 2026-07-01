import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';

const CreateTeam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      
      const res = await expressApi.post('/api/teams', payload);

      if (res.data.success) {
        // Redirect to the Teams board where they can see their new team
        navigate('/teams');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden">


      <div className="mb-8 border-b border-border pb-6 flex items-center justify-between">
        <div>
          <Link to="/teams" className="text-primary hover:text-primary-hover font-bold text-[0.8rem] flex items-center gap-2 mb-3 uppercase tracking-wider transition-all hover:-translate-x-1 w-fit">
            <i className="fa-solid fa-arrow-left"></i> Back to Teams
          </Link>
          <h1 className="text-[2rem] font-bold text-text uppercase tracking-tight">Create Team</h1>
          <p className="text-text-secondary font-medium">Create a new esports roster to enroll in tournaments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-panel p-6 sm:p-8">

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
              <div className="relative">
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
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
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
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[0.8rem]"></i>
              </div>

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
                    className="w-full bg-white border border-border rounded-xl pl-12 pr-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[0.95rem]"
                  />
                  {isSearching && <i className="fa-solid fa-circle-notch fa-spin absolute right-4 top-1/3 -translate-y-1/2 text-primary"></i>}

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 hover:bg-black/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors" onClick={() => handleAddPlayer(u)}>
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
              className="btn-primary w-full"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fa-solid fa-shield-halved"></i>
              )}
              {loading ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="glass-panel p-6 border-l-[3px] border-l-accent">
            <h3 className="text-[0.9rem] font-bold text-text uppercase tracking-widest mb-2">Notice</h3>
            <p className="text-[0.8rem] text-text-secondary">
              As the creator of this team, you will automatically be assigned as the Captain. You can invite up to 9 other players to join your roster.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CreateTeam;

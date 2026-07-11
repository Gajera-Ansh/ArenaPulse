import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_GAMES } from '../../utils/constants';

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tournamentCount, setTournamentCount] = useState(0);
  const [isCaptain, setIsCaptain] = useState(false);
  const [captainInfo, setCaptainInfo] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: 'Valorant'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await expressApi.get(`/api/teams/${id}`);
        if (res.data.success) {
          const t = res.data.data;

          setFormData({
            name: t.name || '',
            tag: t.tag || '',
            game: t.game || ''
          });

          if (t.logo) {
            // Check if logo is full url or local path
            setLogoPreview(t.logo.startsWith('http') ? t.logo : `http://localhost:5000/${t.logo}`);
          }

          // Set selected players, filtering out the captain (who is the current user)
          const captainId = typeof t.captain === 'object' ? t.captain._id : t.captain;
          const userIsCaptain = String(user?.id || user?._id) === String(captainId);
          setIsCaptain(userIsCaptain);

          let squad = [];
          if (t.players) {
            squad = [
              ...squad,
              ...t.players
                .filter(p => String(p._id) !== String(captainId))
                .map(p => ({ ...p, status: 'ready' }))
            ];
          }
          if (t.pendingPlayers) {
            squad = [
              ...squad,
              ...t.pendingPlayers.map(p => ({ ...p, status: 'pending' }))
            ];
          }
          setSelectedPlayers(squad);

          // Also set the captain info so we can display it
          if (typeof t.captain === 'object') {
            setCaptainInfo(t.captain);
          }

          setTournamentCount(t.tournamentCount || 0);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load team data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTeam();
  }, [id, user]);

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
    setSelectedPlayers([...selectedPlayers, { ...player, status: 'pending' }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers(selectedPlayers.filter(p => p._id !== playerId));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB.');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('tag', formData.tag);
      payload.append('game', formData.game);
      if (selectedPlayers.length > 0) {
        payload.append('players', JSON.stringify(selectedPlayers.map(p => p._id)));
      }
      if (logoFile) {
        payload.append('logo', logoFile);
      }

      const res = await expressApi.put(`/api/teams/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

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

      <div className="mb-8 border-b border-border pb-6 flex items-center justify-between">
        <div>
          <Link to="/teams" className="text-primary hover:text-primary-hover font-bold text-[0.8rem] flex items-center gap-2 mb-3 uppercase tracking-wider transition-all hover:-translate-x-1 w-fit">
            <i className="fa-solid fa-arrow-left"></i> Back to Teams
          </Link>
          <h1 className="text-[2rem] font-bold text-text uppercase tracking-tight">{isCaptain ? 'Team Command Center' : 'Team Roster'}</h1>
          <p className="text-text-secondary font-medium">{isCaptain ? 'Manage settings and active roster.' : 'View team data.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-panel p-6">

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
                disabled={!isCaptain}
                className={`w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${!isCaptain ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="e.g. Cloud9"
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
                disabled={!isCaptain}
                className={`w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase ${!isCaptain ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="e.g. C9"
                required
              />
            </div>

            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Team Logo (Optional)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-shield text-text-secondary text-2xl"></i>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoChange}
                  disabled={!isCaptain}
                  className={`block w-full text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-[4px] file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary-hover ${!isCaptain ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Primary Game</label>
              <div className="relative">
                <select
                  name="game"
                  value={formData.game}
                  disabled={!isCaptain}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer ${!isCaptain ? 'opacity-70 cursor-not-allowed' : ''}`}
                  required
                >
                  {SUPPORTED_GAMES.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[0.8rem]"></i>
              </div>
            </div>

            {/* Player Roster */}
            <div className="mt-8 pt-6 border-t border-border">
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-3">Team Roster ({selectedPlayers.length + 1}/10)</label>

              <div className="flex flex-col gap-3 mb-4">
                <div className="bg-primary/20 border border-primary/30 text-primary px-4 py-3 rounded-xl text-[0.9rem] font-bold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-crown text-[0.8rem]"></i>
                    {isCaptain ? 'You (Captain)' : (captainInfo?.name || 'Captain')}
                    {captainInfo?.banned && <i className="fa-solid fa-ban text-red-500 text-[10px]" title="Banned"></i>}
                  </span>
                  <span className="text-[0.75rem] bg-primary/20 px-2 py-0.5 rounded text-primary">Ready</span>
                </div>
                {selectedPlayers.map(p => {
                  const isMe = String(p._id) === String(user?.id || user?._id);
                  return (
                    <div key={p._id} className="bg-white/5 border border-border text-text px-4 py-3 rounded-xl text-[0.9rem] font-medium flex items-center justify-between group">
                      <span className="flex items-center gap-2">
                        <i className={`fa-solid fa-circle text-[0.5rem] ${p.status === 'pending' ? 'text-orange-500' : 'text-green-500'}`}></i>
                        {p.name} {isMe && <span className="text-text-secondary text-[0.75rem]">(You)</span>}
                        {p.banned && <i className="fa-solid fa-ban text-red-500 text-[10px]" title="Banned"></i>}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[0.75rem] font-bold uppercase tracking-wider ${p.status === 'pending' ? 'text-orange-500' : 'text-green-500'}`}>
                          {p.status}
                        </span>
                        {isCaptain && (
                          <button type="button" onClick={() => handleRemovePlayer(p._id)} className="text-text-secondary hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 w-6 h-6 rounded flex items-center justify-center">
                            <i className="fa-solid fa-xmark text-[0.8rem]"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isCaptain && selectedPlayers.length < 9 && (
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

          {isCaptain && (
            <div className="mt-10 pt-6 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-check"></i>
                )}
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          )}

        </form>

        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-[0.9rem] font-bold text-text uppercase tracking-widest border-b border-border pb-3 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-[8px] p-4 border border-border">
                <p className="text-text-secondary text-[0.7rem] uppercase font-bold">Roster Size</p>
                <p className="text-xl font-bold">{(selectedPlayers.length + 1) || 1}</p>
              </div>
              <div className="bg-surface rounded-[8px] p-4 border border-border">
                <p className="text-text-secondary text-[0.7rem] uppercase font-bold">Tournaments</p>
                <p className="text-xl font-bold">{tournamentCount}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-l-[3px] border-l-accent">
            <h3 className="text-[0.9rem] font-bold text-text uppercase tracking-widest mb-2">Notice</h3>
            <p className="text-[0.8rem] text-text-secondary">
              Only the team captain can edit the team's public information and manage the roster. Changing the primary game does not remove existing players.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EditTeam;

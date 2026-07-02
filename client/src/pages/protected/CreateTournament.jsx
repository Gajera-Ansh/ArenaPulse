import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { SUPPORTED_GAMES } from '../../utils/constants';

const CreateTournament = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get tomorrow's local date at 00:00 to prevent selecting today
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  const minDateTime = tomorrow.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    title: '',
    game: 'Valorant',
    bracketType: 'single-elimination',
    maxTeams: 16,
    playersPerTeam: 5,
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    prizePool: '',
    rules: '',
    status: 'open' // Set default status to open so it shows up in public list immediately
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (new Date(formData.registrationDeadline) > new Date(formData.startDate)) {
        throw new Error('Registration deadline must be before start date');
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        throw new Error('End date must be after start date');
      }

      const payload = {
        ...formData,
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const res = await expressApi.post('/api/tournaments', payload);

      if (res.data.success) {
        navigate('/dashboard'); // Redirect back to dashboard on success
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden">


      <div className="mb-8 border-b border-border pb-6 flex items-center justify-between">
        <div>
          <Link to="/dashboard" className="text-primary hover:text-primary-hover font-bold text-[0.8rem] flex items-center gap-2 mb-3 uppercase tracking-wider transition-all hover:-translate-x-1 w-fit">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>
          <h1 className="text-[2rem] font-bold text-text uppercase tracking-tight">Launch Tournament</h1>
          <p className="text-text-secondary font-medium">Configure and deploy a new tournament to the network.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-3 glass-panel p-6 sm:p-8">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-4 mb-8 text-[0.9rem] font-medium flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation text-lg"></i>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left Column */}
            <div className="space-y-6">
              <h3 className="text-[0.9rem] font-bold text-text uppercase border-b border-border pb-2 mb-4 tracking-widest">Core Specifications</h3>

              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Tournament Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Neon Horizon Masters"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Game Designation</label>
                <div className="relative">
                  <select
                    name="game"
                    value={formData.game}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                    required
                  >
                    {SUPPORTED_GAMES.map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm"></i>
                </div>
              </div>

              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Bracket Type</label>
                <div className="relative">
                  <select
                    name="bracketType"
                    value={formData.bracketType}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="single-elimination">Single Elimination</option>
                    <option value="round-robin">Round Robin</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-xs"></i>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Max Teams</label>
                  <input
                    type="number"
                    name="maxTeams"
                    value={formData.maxTeams}
                    onChange={handleChange}
                    min="4"
                    max="64"
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Players/Team</label>
                  <input
                    type="number"
                    name="playersPerTeam"
                    value={formData.playersPerTeam}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Initial Status</label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="draft">Draft (Hide from public)</option>
                    <option value="open">Open (Live & Accepting Teams)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm"></i>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <h3 className="text-[0.9rem] font-bold text-text uppercase border-b border-border pb-2 mb-4 tracking-widest">Logistics & Rewards</h3>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    min={minDateTime}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Game Start Date</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={formData.registrationDeadline || minDateTime}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Game End Date</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || minDateTime}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Prize Pool</label>
                <input
                  type="text"
                  name="prizePool"
                  value={formData.prizePool}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. $500 or 10,000 V-Bucks"
                />
              </div>

            </div>
          </div>

          {/* Full Width Section */}
          <div className="mt-8">
            <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Rules & Description</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              rows="6"
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              placeholder="Provide tournament venue, rules, Discord links, and scheduling details..."
            ></textarea>
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
                <i className="fa-solid fa-rocket"></i>
              )}
              {loading ? 'Initializing...' : 'Deploy Tournament'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="glass-panel p-6 border-l-[3px] border-l-primary">
            <h3 className="text-[0.9rem] font-bold text-text uppercase tracking-widest mb-2">Notice</h3>
            <p className="text-[0.8rem] text-text-secondary">
              Deploying a tournament is permanent. Make sure all your rules and team size limits are correct before launching. You will be able to start the tournament from the organizer dashboard once enough teams register.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CreateTournament;

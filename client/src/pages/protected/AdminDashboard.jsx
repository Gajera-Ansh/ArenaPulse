import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expressApi from '../../api/expressApi';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalTournaments: 0, activeTournaments: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [reports, setReports] = useState([]);

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        expressApi.get('/api/admin/stats'),
        expressApi.get('/api/admin/users'),
        expressApi.get('/api/reports')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
      if (reportsRes.data.success) {
        setReports(reportsRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleBan = async (userId, reportId = null) => {
    try {
      const res = await expressApi.patch(`/api/admin/users/${userId}/ban`, { reportId });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, banned: res.data.data.banned } : u));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle ban status');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await expressApi.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const res = await expressApi.patch(`/api/reports/${reportId}/status`, { status: 'resolved' });
      if (res.data.success) {
        setReports(reports.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
      }
    } catch (err) {
      alert('Failed to resolve report');
    }
  };
  
  const handleDismissReport = async (reportId) => {
    try {
      const res = await expressApi.patch(`/api/reports/${reportId}/status`, { status: 'dismissed' });
      if (res.data.success) {
        setReports(reports.map(r => r._id === reportId ? { ...r, status: 'dismissed' } : r));
      }
    } catch (err) {
      alert('Failed to dismiss report');
    }
  };

  if (loading) {
    return (
      <div className="container py-20 flex justify-center items-center min-h-[calc(100vh-80px)]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-20 flex justify-center min-h-[calc(100vh-80px)]">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-[8px] text-center max-w-lg">
          <i className="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-12 min-h-[calc(100vh-80px)]">
      <div className="mb-8">
        <h1 className="text-[2rem] font-bold text-text mb-2"><i className="fa-solid fa-shield-halved text-primary mr-3"></i> Admin Command Center</h1>
        <p className="text-text-secondary">Platform oversight and user management.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[0.8rem] text-text-secondary uppercase font-bold tracking-widest mb-1">Total Users</p>
            <p className="text-[2rem] font-bold text-text leading-none">{stats.totalUsers}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl">
            <i className="fa-solid fa-users"></i>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[0.8rem] text-text-secondary uppercase font-bold tracking-widest mb-1">All Tournaments</p>
            <p className="text-[2rem] font-bold text-text leading-none">{stats.totalTournaments}</p>
          </div>
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xl">
            <i className="fa-solid fa-trophy"></i>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[0.8rem] text-text-secondary uppercase font-bold tracking-widest mb-1">Active Events</p>
            <p className="text-[2rem] font-bold text-text leading-none">{stats.activeTournaments}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 text-xl">
            <i className="fa-solid fa-bolt"></i>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border pb-1">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text'}`}
        >
          <i className="fa-solid fa-users mr-2"></i> User Management
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'reports' ? 'text-red-500 border-b-2 border-red-500' : 'text-text-secondary hover:text-text'}`}
        >
          <i className="fa-solid fa-flag mr-2"></i> Reports Queue {reports.filter(r => r.status === 'pending').length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{reports.filter(r => r.status === 'pending').length}</span>}
        </button>
      </div>

      {/* User Management Table */}
      {activeTab === 'users' && (
      <div className="bg-surface border border-border rounded-[8px] shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-[1.2rem] font-bold text-text">User Management</h2>
          <div className="relative w-full sm:w-[300px]">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[0.9rem]"></i>
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-[4px] pl-10 pr-4 py-2 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[0.9rem]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">User</th>
                <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Email</th>
                <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Role</th>
                <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <Link to={`/profile/${u._id}`} className="flex items-center gap-3 group w-fit">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-white shadow-sm shrink-0">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" /> : <i className="fa-solid fa-user text-slate-400 text-xs"></i>}
                      </div>
                      <span className="font-medium text-text group-hover:text-primary transition-colors">{u.name}</span>
                    </Link>
                  </td>
                  <td className="p-4 text-text-secondary text-[0.9rem]">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[0.75rem] font-bold uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                      u.role === 'organizer' ? 'bg-primary/20 text-primary border border-primary/30' :
                      'bg-white/10 text-text-secondary border border-border'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[0.75rem] font-bold uppercase tracking-widest ${u.banned ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}`}>
                      {u.banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleBan(u._id)}
                      disabled={u._id === user?.id} // Cannot ban self
                      className={`px-3 py-1.5 rounded text-[0.8rem] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${u.banned ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                      {u.banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-text-secondary">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Reports Queue Table */}
      {activeTab === 'reports' && (
        <div className="bg-surface border border-border rounded-[8px] shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-border">
            <h2 className="text-[1.2rem] font-bold text-text">Player Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Reported User</th>
                  <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Reason</th>
                  <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Description & Evidence</th>
                  <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[0.8rem] font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map(r => (
                  <tr key={r._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <Link to={`/profile/${r.reportedUser?._id}`} className="flex items-center gap-3 group w-fit">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {r.reportedUser?.avatar ? <img src={r.reportedUser.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <i className="fa-solid fa-user text-slate-400 text-xs"></i>}
                        </div>
                        <div>
                          <p className="font-medium text-text group-hover:text-primary transition-colors">{r.reportedUser?.name || 'Unknown'}</p>
                          <p className="text-[0.7rem] text-text-secondary group-hover:text-text-secondary/70 transition-colors">Reported by: {r.reportedBy?.name || 'Unknown'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[0.75rem] font-bold uppercase tracking-widest">
                        {r.reason}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-[0.85rem] text-text truncate mb-1" title={r.description}>{r.description}</p>
                      {r.evidenceUrl && (
                        <a href={r.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-[0.75rem] text-primary hover:underline">
                          <i className="fa-solid fa-link mr-1"></i> View Evidence
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[0.75rem] font-bold uppercase tracking-widest ${r.status === 'pending' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : r.status === 'resolved' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {r.status === 'pending' ? (
                          <>
                            <button onClick={() => { handleToggleBan(r.reportedUser?._id, r._id); handleResolveReport(r._id); }} className="px-3 py-1.5 rounded text-[0.75rem] font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 w-full text-center transition-colors shadow-sm">
                              Ban & Resolve
                            </button>
                            <button onClick={() => handleDismissReport(r._id)} className="px-3 py-1.5 rounded text-[0.75rem] font-bold uppercase tracking-wider bg-white/5 border border-border text-text hover:bg-white/10 w-full text-center transition-colors">
                              Dismiss
                            </button>
                          </>
                        ) : (
                          <span className="text-[0.75rem] text-text-secondary italic">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-text-secondary">No reports in queue.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const getRoleBadgeClass = (role) => {
    if (role === 'organizer') return 'bg-accent/10 text-accent border border-accent/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  };

  return (
    <div className="container py-8 sm:py-12 relative min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Ambient Backgrounds */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full">

        {/* Dashboard Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-1 overflow-x-auto hide-scrollbar">
          {['overview', 'tournaments', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-t-xl font-bold text-[0.9rem] uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
                  ? 'bg-primary text-white shadow-md transform translate-y-1'
                  : 'text-text-secondary hover:bg-white/10 hover:text-text'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-panel border border-border rounded-[24px] p-6 sm:p-8 shadow-xl min-h-[500px] flex flex-col">

          {activeTab === 'overview' && (
            <div className="animate-fade-in flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[1.25rem] font-black text-text uppercase">Active Operations</h3>
                {user?.role === 'organizer' && (
                  <Link to="/tournaments/create" className="btn-primary text-[0.8rem] py-2 px-4">
                    <i className="fa-solid fa-plus"></i> New Tournament
                  </Link>
                )}
              </div>

              <div className="bg-white/5 border border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center flex-grow">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-text-secondary text-2xl mb-4">
                  <i className="fa-solid fa-tower-broadcast"></i>
                </div>
                <h4 className="text-[1.1rem] font-bold text-text mb-2">No Active Tournaments</h4>
                <p className="text-[0.9rem] text-text-secondary mb-6 max-w-md mx-auto">
                  {user?.role === 'organizer'
                    ? "You haven't launched any tournaments yet. Start organizing to build your community."
                    : "You aren't deployed in any active operations. Browse the tournament board to join the fight."}
                </p>
                <Link to="/tournaments" className="btn-outline">
                  Browse Tournaments
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center flex-grow">
              <i className="fa-solid fa-list-check text-4xl text-text-secondary mb-4 opacity-50"></i>
              <h3 className="text-[1.25rem] font-bold text-text uppercase mb-2">Tournament History</h3>
              <p className="text-text-secondary">Your past combat records will appear here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in text-center flex flex-col items-center justify-center flex-grow">
              <i className="fa-solid fa-gear text-4xl text-text-secondary mb-4 opacity-50"></i>
              <h3 className="text-[1.25rem] font-bold text-text uppercase mb-2">System Settings</h3>
              <p className="text-text-secondary">Account configuration options coming online soon.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;

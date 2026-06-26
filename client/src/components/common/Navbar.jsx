import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-panel border-b border-border py-4 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-[1.25rem] text-primary">
          <div className="w-9 h-9 bg-primary rounded-[10px] flex items-center justify-center text-white text-[1.1rem]">
            ⚡
          </div>
          ArenaPulse
        </Link>
        
        <ul className="hidden md:flex items-center gap-8 list-none">
          <li><Link to="/tournaments" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors">Tournaments</Link></li>
          <li><Link to="/leaderboard" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors">Leaderboard</Link></li>
        </ul>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors hidden sm:block">Dashboard</Link>
              <button onClick={logout} className="btn-outline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Log In</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

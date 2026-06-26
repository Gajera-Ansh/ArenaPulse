import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="glass-panel border-b border-border py-3 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 font-extrabold text-[1.25rem] text-primary">
          <img src="/logo.png" alt="ArenaPulse Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          ArenaPulse
        </Link>
        
        <ul className="hidden md:flex items-center gap-8 list-none">
          <li><Link to="/tournaments" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors">Tournaments</Link></li>
          {user?.role !== 'organizer' && (
            <li><Link to="/teams" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors">Teams</Link></li>
          )}
          <li><Link to="/leaderboard" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors">Leaderboard</Link></li>
        </ul>

        <div className="flex gap-4 items-center">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-white/50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-border focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-white shadow-sm">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <i className="fa-solid fa-user text-slate-400 text-sm"></i>
                  )}
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-[0.8rem] font-bold text-text leading-tight">{user.name}</span>
                  <span className="text-[0.65rem] font-medium text-text-secondary uppercase tracking-widest">{user.role}</span>
                </div>
                <i className={`fa-solid fa-chevron-down text-[0.6rem] text-text-secondary ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                  <div className="p-4 border-b border-border bg-slate-50/50">
                    <p className="text-[0.75rem] font-medium text-text-secondary">Signed in as</p>
                    <p className="text-[0.85rem] font-bold text-text truncate">{user.email}</p>
                  </div>
                  
                  <div className="p-2">
                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-text hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-table-columns w-4 text-center"></i> Dashboard
                    </Link>
                    
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-text hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-pen-to-square w-4 text-center"></i> Edit Profile
                    </button>
                    
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-text hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-gear w-4 text-center"></i> Settings
                    </button>
                  </div>
                  
                  <div className="p-2 border-t border-border">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline hidden sm:flex">Log In</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import expressApi from '../../api/expressApi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    if (user) {
      try {
        const res = await expressApi.get('/api/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await expressApi.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await expressApi.delete('/api/notifications');
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = (
    <>
      <li><Link to="/tournaments" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors block py-2 md:py-0">Tournaments</Link></li>
      {user && user.role !== 'organizer' && (
        <li><Link to="/teams" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors block py-2 md:py-0">Teams</Link></li>
      )}
      <li><Link to="/leaderboard" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors block py-2 md:py-0">Leaderboard</Link></li>
    </>
  );

  return (
    <nav className="glass-panel border-b border-border py-3 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 font-extrabold text-[1.25rem] text-primary">
          <img src="/logo.png" alt="ArenaPulse Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <span className="hidden sm:inline">ArenaPulse</span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-8 list-none">
          {navLinks}
        </ul>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative flex items-center" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-full text-text-secondary hover:text-text hover:bg-white/10 transition-colors focus:outline-none"
                >
                  <i className="fa-solid fa-bell text-[1.1rem]"></i>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-[-50px] sm:right-0 top-[120%] mt-1 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/10">
                      <h3 className="font-bold text-text text-[0.95rem]">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearNotifications}
                          className="text-[0.75rem] text-text-secondary hover:text-red-500 font-medium transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto hide-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-text-secondary text-[0.85rem]">
                          You have no notifications.
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          // Calculate relative time
                          const getRelativeTime = (dateString) => {
                            const date = new Date(dateString);
                            const now = new Date();
                            const diffInSeconds = Math.floor((now - date) / 1000);

                            if (diffInSeconds < 60) return 'Just now';
                            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                            return `${Math.floor(diffInSeconds / 86400)}d ago`;
                          };

                          return (
                            <div
                              key={notif._id}
                              onClick={() => {
                                if (!notif.read) handleMarkAsRead(notif._id);
                              }}
                              className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${!notif.read ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-white/5'}`}
                            >
                              <div className="flex gap-3">
                                <div className="pt-0.5">
                                  {notif.type === 'success' && <i className="fa-solid fa-circle-check text-green-400"></i>}
                                  {notif.type === 'warning' && <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>}
                                  {notif.type === 'info' && <i className="fa-solid fa-circle-info text-primary"></i>}
                                  {notif.type === 'invite' && <i className="fa-solid fa-envelope-open-text text-accent"></i>}
                                  {notif.type === 'match' && <i className="fa-solid fa-gamepad text-purple-400"></i>}
                                  {!['success', 'warning', 'info', 'invite', 'match'].includes(notif.type) && <i className="fa-solid fa-bell text-text-secondary"></i>}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-[0.85rem] leading-tight ${!notif.read ? 'text-text font-bold' : 'text-text-secondary'}`}>
                                    {notif.message}
                                  </p>
                                  <p className="text-[0.7rem] text-text-secondary/70 mt-1.5 font-medium tracking-wide">
                                    {getRelativeTime(notif.createdAt)}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
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
                  <i className={`fa-solid fa-chevron-down text-[0.6rem] text-text-secondary ml-1 transition-transform hidden sm:inline ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-border bg-black/10">
                      <p className="text-[0.75rem] font-medium text-text-secondary">Signed in as</p>
                      <p className="text-[0.85rem] font-bold text-text truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-text hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                      >
                        <i className="fa-solid fa-user w-4 text-center"></i> Profile
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-text hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                      >
                        <i className="fa-solid fa-table-columns w-4 text-center"></i> Dashboard
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-[0.85rem] font-medium text-text hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                      >
                        <i className="fa-solid fa-gear w-4 text-center"></i> Settings
                      </Link>
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

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text hover:bg-white/10 transition-colors focus:outline-none"
              >
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-[1.2rem]`}></i>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline hidden sm:flex !px-4 !py-2 !text-[0.75rem]">Log In</Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 !text-[0.75rem]">Sign Up</Link>

              {/* Mobile Hamburger for guests */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text hover:bg-white/10 transition-colors focus:outline-none"
              >
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-[1.2rem]`}></i>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border mt-3 animate-fade-in">
          <ul className="container flex flex-col gap-1 py-4 list-none">
            {navLinks}
            {!user && (
              <li className="pt-3 mt-2 border-t border-border">
                <Link to="/login" className="text-[0.9rem] font-medium text-text-secondary hover:text-text transition-colors block py-2">Log In</Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

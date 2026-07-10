import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [activeTab, setActiveTab] = useState('compete');
  const [isAnimating, setIsAnimating] = useState(false);
  const activeTabRef = useRef(activeTab);

  // Keep ref in sync with state for event listeners
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Handle smooth transition between tabs
  const handleTabChange = (key) => {
    if (key === activeTabRef.current) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(key);
      setIsAnimating(false);
    }, 150);
  };

  const panelContent = {
    compete: {
      title: "Enter the Arena.",
      desc: "Step into the fray. Form your squad, join high-stakes tournaments, and battle against top-tier opponents. Track live match data, climb the ranks, and forge your legacy.",
      cta: "Find a Tournament",
      ctaLink: "/tournaments",
      visual: (
        <div className="w-full h-full bg-surface border border-slate-300 rounded-[8px] p-4 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">

          <div className="flex justify-between items-center relative z-10 border-b border-border/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-[0.75rem] font-bold tracking-widest text-text-secondary uppercase">Grand Final</span>
            </div>
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-widest">Valorant</span>
          </div>

          <div className="flex justify-between items-center relative z-10 mt-8">
            {/* Team 1 */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-sm border border-border group-hover:-translate-y-1 transition-transform">
                <i className="fa-solid fa-shield-halved text-[1.5rem] sm:text-[2.2rem] text-primary"></i>
              </div>
              <div className="font-bold text-[1.1rem]">Sentinels</div>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center px-2 sm:px-4">
              <div className="text-[0.7rem] sm:text-[0.85rem] font-bold text-accent uppercase tracking-widest mb-1">Map 3: Ascent</div>
              <div className="text-[2.5rem] sm:text-[4rem] leading-none font-bold text-text tracking-tighter flex items-center">
                13<span className="text-border mx-2 sm:mx-3 font-light text-[2rem] sm:text-[3rem]">-</span>11
              </div>
              <div className="text-[0.8rem] text-text-secondary font-medium mt-2 flex items-center gap-2 bg-bg px-3 py-1 rounded-full">
                <i className="fa-solid fa-users text-[0.9rem]"></i> 45.2k watching
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-sm border border-border group-hover:-translate-y-1 transition-transform delay-75">
                <i className="fa-solid fa-crosshairs text-[1.5rem] sm:text-[2.2rem] text-slate-700"></i>
              </div>
              <div className="font-bold text-[1.1rem]">Fnatic</div>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    organize: {
      title: "Run the Show.",
      desc: "Your complete tournament OS. Ditch the spreadsheets and manage massive events effortlessly with automated brackets, live WebSockets, and one-click team approvals.",
      cta: "Create an Event",
      ctaLink: "/register",
      visual: (
        <div className="w-full h-full bg-surface border border-slate-300 rounded-[8px] p-4 sm:p-8 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>

          {/* Animated Bracket Graphic */}
          <div className="relative w-full max-w-[400px] mx-auto h-[120px] sm:h-[160px]">
            {/* Round 1 */}
            <div className="absolute left-0 top-0 w-[90px] sm:w-[120px] h-9 sm:h-10 bg-white border border-border rounded-xl shadow-sm flex items-center px-2 sm:px-3 font-bold text-[0.7rem] sm:text-[0.8rem]">Team Alpha</div>
            <div className="absolute left-0 bottom-0 w-[90px] sm:w-[120px] h-9 sm:h-10 bg-white border border-border rounded-xl shadow-sm flex items-center px-2 sm:px-3 font-bold text-[0.7rem] sm:text-[0.8rem]">Team Bravo</div>

            {/* Connecting Lines */}
            <div className="absolute left-[120px] top-[19px] w-8 border-b-2 border-border"></div>
            <div className="absolute left-[120px] bottom-[19px] w-8 border-b-2 border-border"></div>
            <div className="absolute left-[150px] top-[20px] w-0.5 h-[120px] bg-border"></div>
            <div className="absolute left-[150px] right-[140px] top-1/2 border-b-2 border-primary"></div>

            {/* Round 2 (Winner) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[140px] h-12 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center font-bold text-[0.9rem] ring-4 ring-primary/20">
              <i className="fa-solid fa-trophy mr-2 text-yellow-300"></i> Team Alpha
            </div>

            {/* Scanning Effect */}
            <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>

          <div className="mt-8 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-bolt text-[1.1rem] text-primary animate-pulse"></i>
            <span className="text-[0.85rem] font-bold text-text-secondary">Bracket engine calculating permutations...</span>
          </div>
        </div>
      )
    },
    dominate: {
      title: "Data is Power.",
      desc: "Outsmart the competition with AI. Our machine learning pipeline breaks down every match to deliver predictive win-probabilities, deep K/D/A analysis, and personalized heatmaps.",
      cta: "View Leaderboard",
      ctaLink: "/leaderboard",
      visual: (
        <div className="w-full h-full bg-surface border border-slate-300 rounded-[8px] p-4 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                <i className="fa-solid fa-chart-simple text-[1.2rem] text-accent"></i>
              </div>
              <h3 className="font-bold text-[1.1rem] text-text">AI Performance Metrics</h3>
            </div>

            <div className="space-y-4 flex-grow">
              <div>
                <div className="flex justify-between text-[0.85rem] mb-2 text-text">
                  <span className="font-medium text-text-secondary">Win Probability Matrix</span>
                  <span className="font-bold text-primary">78%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-[78%] relative">
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[0.85rem] mb-2 text-text">
                  <span className="font-medium text-text-secondary">K/D/A Spread</span>
                  <span className="font-bold text-accent">1.45 Ratio</span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div className="bg-accent h-full rounded-full w-[65%]"></div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center gap-5">
                <div className="w-12 h-12 rounded-full border-[3px] border-amber-500 bg-amber-50 flex items-center justify-center font-bold text-[1.3rem] text-amber-500 shadow-sm">
                  G
                </div>
                <div>
                  <div className="text-[0.65rem] text-text-secondary uppercase tracking-widest font-bold mb-0.5">Neural Net Classification</div>
                  <div className="font-bold text-[1.1rem] text-amber-500 tracking-wide">GOLD III <span className="text-text-secondary font-normal text-sm ml-1">(Top 14%)</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden relative">

      {/* LEFT SIDE: Interactive Typography Menu */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 lg:py-0 border-b lg:border-b-0 lg:border-r border-border/40 bg-transparent z-10 lg:h-full">

        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-text text-white px-3 py-1.5 rounded-[4px] shadow-lg mb-5 relative overflow-hidden group cursor-default">
            <div className="absolute inset-0 bg-primary/20 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
            <i className="fa-solid fa-wave-square text-[0.9rem] text-primary-light"></i>
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.15em] relative z-10">ArenaPulse OS v2.0</span>
            <div className="w-[1px] h-3 bg-white/20 relative z-10 mx-1"></div>
            <span className="relative z-10 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-text-secondary text-[1rem] leading-relaxed max-w-[400px]">
            The ultimate command center for competitive esports. Choose a module to initialize system tournaments.
          </p>
        </div>

        <nav className="flex flex-col items-start gap-4 sm:gap-6 relative w-max">
          {Object.keys(panelContent).map((key) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onMouseEnter={() => handleTabChange(key)}
                onClick={() => handleTabChange(key)}
                className={`w-fit text-left text-[2.5rem] sm:text-[3rem] md:text-[4rem] xl:text-[5rem] font-bold uppercase tracking-tighter leading-[0.85] transition-all duration-500 ease-out relative group flex items-center
                  ${isActive ? 'text-text scale-[1.03] translate-x-4' : 'text-transparent hover:text-text/20 hover:translate-x-2'}`}
                style={!isActive ? { WebkitTextStroke: '2px rgba(100, 116, 139, 0.2)' } : {}}
              >
                {isActive && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex items-center animate-pulse -rotate-90">
                    <i className="fa-solid fa-level-down-alt fa-flip-horizontal text-[2rem] text-primary"></i>
                  </div>
                )}
                {key}
              </button>
            )
          })}
        </nav>
      </div>

      {/* RIGHT SIDE: Dynamic Display Panel */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 lg:px-20 xl:px-24 relative z-10 lg:h-full">

        {/* Container with fixed width/height to prevent jumping */}
        <div className="w-full max-w-[650px] flex flex-col justify-center lg:h-full lg:max-h-[600px]">

          <div className={`transition-all duration-300 ease-in-out flex flex-col justify-center h-full
            ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

            <div className="mb-6">
              <h2 className="text-[2.2rem] lg:text-[2.8rem] font-bold text-text mb-3 leading-[1.1] tracking-tight">
                {panelContent[activeTab].title}
              </h2>
              <p className="text-[1rem] lg:text-[1.05rem] text-text-secondary leading-relaxed max-w-[480px]">
                {panelContent[activeTab].desc}
              </p>
            </div>

            {/* Dynamic Visual Box */}
            <div className="h-[260px] sm:h-[320px] mb-6 sm:mb-8 w-full shrink-0">
              {panelContent[activeTab].visual}
            </div>

            <div className="mt-auto pb-4">
              <Link
                to={panelContent[activeTab].ctaLink}
                className="inline-flex items-center justify-center gap-2 bg-text text-white hover:bg-primary px-7 py-3.5 rounded-[4px] font-bold text-[1rem] transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-primary/25"
              >
                {panelContent[activeTab].cta} <i className="fa-solid fa-chevron-right text-[0.9rem]"></i>
              </Link>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
};

export default Home;

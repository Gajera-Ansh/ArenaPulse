import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Zap, BarChart2, Smartphone, ShieldCheck, Crosshair, Users } from 'lucide-react';

const Home = () => {
  return (
    <div>
      {/* ASYMMETRICAL HERO */}
      <section className="pt-16 pb-20 px-4 overflow-hidden relative">
        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            
            {/* Left Content */}
            <div className="w-full lg:w-1/2 text-left">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-[0.85rem] font-semibold px-4 py-1.5 rounded-full mb-6 border border-[#BFDBFE]">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Season 4 Registration Open
              </div>
              
              <h1 className="text-[3rem] lg:text-[4rem] font-extrabold leading-[1.1] mb-6 tracking-tight text-text">
                Your Arena. <br />
                Your Rules. <br />
                <span className="text-primary relative inline-block">
                  Total Glory.
                  {/* Decorative underline */}
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-accent/20 -z-10 rounded-sm transform -rotate-1"></span>
                </span>
              </h1>
              
              <p className="text-[1.15rem] text-text-secondary mb-10 leading-relaxed max-w-[500px]">
                Stop wrestling with spreadsheets. ArenaPulse handles the brackets, live scores, and matchmaking so you can focus on the game.
              </p>
              
              <div className="flex gap-4 flex-wrap">
                <Link to="/register" className="btn-primary px-8 py-3.5 text-[1rem]">Start Competing →</Link>
                <div className="flex items-center gap-4 px-4 py-2 border-l-2 border-border">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400"></div>
                  </div>
                  <span className="text-[0.85rem] text-text-secondary font-medium">Join 2,400+ players</span>
                </div>
              </div>
            </div>

            {/* Right Visual - Mock Live Match Card */}
            <div className="w-full lg:w-[45%] relative perspective-1000">
              {/* Background decorative blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-light to-accent-light rounded-full blur-[80px] -z-10 opacity-70"></div>
              
              <div className="card p-6 border border-border/50 bg-white/90 backdrop-blur-xl shadow-xl transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 relative">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                  <span className="game-badge">Valorant Final</span>
                  <span className="badge-live animate-pulse">● LIVE</span>
                </div>
                
                <div className="flex justify-between items-center mb-8 px-2">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-[12px] flex items-center justify-center mb-3 shadow-sm border border-border">
                      <ShieldCheck size={28} className="text-primary" />
                    </div>
                    <div className="font-bold">Sentinels</div>
                    <div className="text-[0.8rem] text-text-secondary">#1 Seed</div>
                  </div>
                  
                  <div className="text-center px-6">
                    <div className="text-[3rem] font-extrabold tracking-tighter text-text">13<span className="text-border mx-2">-</span>11</div>
                    <div className="text-[0.85rem] font-medium text-accent">Map 3: Ascent</div>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-[12px] flex items-center justify-center mb-3 shadow-sm border border-border">
                      <Crosshair size={28} className="text-slate-700" />
                    </div>
                    <div className="font-bold">Fnatic</div>
                    <div className="text-[0.8rem] text-text-secondary">#2 Seed</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 text-[0.85rem] text-text-secondary flex justify-between items-center">
                  <div className="flex items-center gap-2"><Users size={16}/> 1.2k watching</div>
                  <Link to="/tournaments" className="text-primary font-semibold hover:underline">Watch Stream</Link>
                </div>
              </div>
              
              {/* Floating element 1 */}
              <div className="absolute -bottom-6 -left-8 card p-4 flex items-center gap-3 shadow-lg bg-white transform rotate-[3deg] animate-bounce" style={{animationDuration: '3s'}}>
                <Trophy className="text-accent" size={24} />
                <div>
                  <div className="text-[0.75rem] text-text-secondary uppercase font-bold tracking-wider">Prize Pool</div>
                  <div className="font-extrabold text-[1.1rem]">$10,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-border bg-white/50 py-8 mb-16">
        <div className="container flex justify-around flex-wrap gap-8">
          <div><span className="text-[1.5rem] font-extrabold text-text mr-2">180+</span><span className="text-[0.9rem] text-text-secondary">Tournaments Hosted</span></div>
          <div><span className="text-[1.5rem] font-extrabold text-text mr-2">12K+</span><span className="text-[0.9rem] text-text-secondary">Matches Played</span></div>
          <div><span className="text-[1.5rem] font-extrabold text-text mr-2">99.9%</span><span className="text-[0.9rem] text-text-secondary">Uptime</span></div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="pb-20">
        <div className="container">
          <div className="flex items-end justify-between mb-10 border-b border-border pb-4">
            <h2 className="text-[2rem] font-bold tracking-tight text-text">Pro-level tools.</h2>
            <p className="text-text-secondary hidden sm:block">Everything you need to run an event.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-8 col-span-1 md:col-span-2 bg-gradient-to-br from-white to-primary-light/30 border-primary/20">
              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[1.5rem] mb-6 bg-primary text-white shadow-md">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-[1.3rem] font-bold mb-3">AI-Powered Insights</h3>
              <p className="text-[0.95rem] text-text-secondary leading-relaxed max-w-[400px]">
                Our Python ML pipeline analyzes player performance to generate win probabilities and tier classifications automatically.
              </p>
            </div>
            
            <div className="card p-8">
              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[1.5rem] mb-6 bg-accent-light text-accent">
                <Zap size={24} />
              </div>
              <h3 className="text-[1.1rem] font-bold mb-2">WebSockets</h3>
              <p className="text-[0.9rem] text-text-secondary leading-relaxed">
                Scores sync instantly. When an admin updates a match, the whole bracket updates.
              </p>
            </div>

            <div className="card p-8">
              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[1.5rem] mb-6 bg-[#ECFEFF] text-[#0891B2]">
                <Smartphone size={24} />
              </div>
              <h3 className="text-[1.1rem] font-bold mb-2">QR Check-in</h3>
              <p className="text-[0.9rem] text-text-secondary leading-relaxed">
                Scan players at the door. Verify attendance instantly on match day.
              </p>
            </div>
            
            <div className="card p-8 col-span-1 md:col-span-2">
              <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[1.5rem] mb-6 bg-[#F5F3FF] text-[#7C3AED]">
                <Trophy size={24} />
              </div>
              <h3 className="text-[1.3rem] font-bold mb-3">Automated Brackets</h3>
              <p className="text-[0.95rem] text-text-secondary leading-relaxed max-w-[400px]">
                Click "Lock Registrations" and let our bracket generator build the entire single or double elimination tree automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-16 bg-text text-white">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-[1.8rem] font-extrabold mb-2">Ready to enter the arena?</h2>
            <p className="text-[1rem] opacity-70">Takes 30 seconds to sign up.</p>
          </div>
          <Link to="/register" className="btn-primary bg-primary text-white border-0 hover:bg-primary-light hover:text-primary">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

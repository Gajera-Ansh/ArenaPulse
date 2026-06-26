import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginAccount, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginAccount(email, password);
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google token:', tokenResponse);
      if (googleLogin) {
        await googleLogin(tokenResponse.access_token);
        navigate('/dashboard');
      }
    },
    onError: () => console.log('Login Failed'),
  });

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden py-12">
      
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[24px] p-8 sm:p-10 shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-[12px] text-white text-[1.5rem] mb-4 shadow-lg shadow-primary/20">
              ⚡
            </div>
            <h1 className="text-[2rem] font-black text-text mb-2">Welcome Back</h1>
            <p className="text-text-secondary text-[0.95rem]">Enter your credentials to access the system.</p>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-800 hover:bg-slate-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm mb-8"
          >
            <i className="fa-brands fa-google text-red-600 text-[1.1rem]"></i>
            Continue with Google
          </button>

          <div className="flex items-center mb-8">
            <div className="flex-1 border-b border-white/10"></div>
            <span className="px-4 text-[0.75rem] font-bold text-text-secondary uppercase tracking-widest">Or Use Email</span>
            <div className="flex-1 border-b border-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="commander@squad.com"
                autoFocus
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" className="text-[0.75rem] font-bold text-primary hover:text-primary-hover transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors focus:outline-none"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 mt-4">
              Initialize Connection
            </button>
          </form>

        </div>

        <p className="text-center text-text-secondary text-[0.9rem] mt-8 font-medium">
          New to the Arena? <Link to="/register" className="text-primary hover:text-primary-hover font-bold ml-1">Create a profile</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

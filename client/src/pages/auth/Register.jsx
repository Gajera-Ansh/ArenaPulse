import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player'
  });
  const { registerAccount, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return alert("Passwords don't match!");
    }
    try {
      await registerAccount({
        name: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      navigate('/dashboard');
    } catch (error) {
      alert('Registration failed. Please try again.');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google token:', tokenResponse);
      if (googleLogin) {
        try {
          await googleLogin(tokenResponse.access_token, formData.role);
          navigate('/dashboard');
        } catch (error) {
          alert('Google login failed. Please check the backend server console for errors.');
          console.error(error);
        }
      }
    },
    onError: () => console.log('Login Failed'),
  });

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden py-12">

      {/* Ambient Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-accent/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[24px] p-8 sm:p-10 shadow-2xl">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="ArenaPulse Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-[2rem] font-bold text-text mb-2">Create Profile</h1>
            <p className="text-text-secondary text-[0.95rem]">Join thousands of players and organizers.</p>
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
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'player' })}
                className={`py-3 rounded-xl border font-bold text-[0.85rem] transition-all ${formData.role === 'player'
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-white/5 border-white/10 text-text-secondary hover:text-text hover:border-white/20'
                  }`}
              >
                <i className="fa-solid fa-gamepad mr-2"></i> Player
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'organizer' })}
                className={`py-3 rounded-xl border font-bold text-[0.85rem] transition-all ${formData.role === 'organizer'
                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/25'
                    : 'bg-white/5 border-white/10 text-text-secondary hover:text-text hover:border-white/20'
                  }`}
              >
                <i className="fa-solid fa-trophy mr-2"></i> Organizer
              </button>
            </div>

            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Player Tag / Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="e.g. Faker"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="commander@squad.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-10 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors focus:outline-none"
                  >
                    <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Confirm</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-10 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors focus:outline-none"
                  >
                    <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 mt-4">
              Deploy Account
            </button>
          </form>

        </div>

        <p className="text-center text-text-secondary text-[0.9rem] mt-8 font-medium">
          Already have clearance? <Link to="/login" className="text-primary hover:text-primary-hover font-bold ml-1">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

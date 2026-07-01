import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import expressApi from '../../api/expressApi';

const Login = () => {
  const [step, setStep] = useState('email'); // 'email', 'password', 'forgot_request', 'forgot_verify', 'forgot_reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { loginAccount, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (googleLogin) {
        try {
          await googleLogin(tokenResponse.access_token);
          navigate('/dashboard');
        } catch (error) {
          setErrorMsg('Google login failed. Please check the backend server console for errors.');
        }
      }
    },
    onError: () => setErrorMsg('Login Failed'),
  });

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStep('password');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loginAccount(email, password);
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await expressApi.post('/api/auth/forgot-password-otp', { email });
      if (res.data.success) {
        setSuccessMsg('An OTP has been sent to your email.');
        setStep('forgot_verify');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP. Is this email registered?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await expressApi.post('/api/auth/verify-forgot-password-otp', { email, otp });
      if (res.data.success) {
        setSuccessMsg('OTP verified. Please enter your new password.');
        setStep('forgot_reset');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await expressApi.post('/api/auth/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        setSuccessMsg('Password reset successfully! Please log in with your new password.');
        setStep('password');
        setPassword('');
        setOtp('');
        setNewPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden py-12">


      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-surface border border-slate-300 rounded-[8px] p-8 sm:p-10 shadow-sm">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="ArenaPulse Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-[2rem] font-bold text-text mb-2">
              {step === 'email' || step === 'password' ? 'Welcome Back' : 'Reset Password'}
            </h1>
            <p className="text-text-secondary text-[0.95rem]">
              {step === 'email' ? 'Enter your email to continue.' :
                step === 'password' ? 'Enter your password to access the system.' :
                  'Follow the steps to recover your account.'}
            </p>
          </div>

          {(step === 'email' || step === 'password') && (
            <>
              <button
                onClick={() => handleGoogleLogin()}
                className="w-full bg-slate-200 hover:bg-slate-300 text-text border border-border hover:bg-black/5 font-bold py-3.5 rounded-[4px] transition-all flex items-center justify-center gap-3 shadow-sm mb-6"
              >
                <i className="fa-brands fa-google text-red-600 text-[1.1rem]"></i>
                Continue with Google
              </button>

              <div className="flex items-center mb-6">
                <div className="flex-1 border-b border-border"></div>
                <span className="px-4 text-[0.75rem] font-bold text-text-secondary uppercase tracking-widest">Or Use Email</span>
                <div className="flex-1 border-b border-border"></div>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-[4px] text-[0.9rem] flex items-center gap-2 animate-fade-in font-bold">
              <i className="fa-solid fa-circle-exclamation"></i>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-[4px] text-[0.9rem] flex items-center gap-2 animate-fade-in font-bold">
              <i className="fa-solid fa-circle-check"></i>
              {successMsg}
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-[4px] px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="commander@squad.com"
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-[4px] transition-all shadow-lg hover:-translate-y-0.5 mt-4">
                Next
              </button>
            </form>
          )}

          {/* STEP 2: PASSWORD */}
          {step === 'password' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full bg-surface border border-border rounded-[4px] px-4 py-3.5 text-text-secondary opacity-70 cursor-not-allowed pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setPassword(''); setErrorMsg(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.8rem] text-primary font-bold hover:text-primary-hover"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest">Password</label>
                  <button type="button" onClick={() => setStep('forgot_request')} className="text-[0.75rem] font-bold text-primary hover:text-primary-hover transition-colors">Forgot?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface border border-border rounded-[4px] px-4 py-3.5 pr-12 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors focus:outline-none"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-[4px] transition-all shadow-lg hover:-translate-y-0.5 mt-4">
                {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Log In'}
              </button>
            </form>
          )}

          {/* STEP 3: FORGOT REQUEST */}
          {step === 'forgot_request' && (
            <form onSubmit={handleForgotRequest} className="space-y-5">
              <div className="bg-primary/10 border border-primary/20 rounded-[4px] p-4 text-[0.85rem] text-text mb-4 text-center">
                We will send a 6-digit OTP to <strong>{email}</strong> to verify your identity.
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={isLoading} className="btn-primary flex-grow">
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
                <button type="button" onClick={() => setStep('password')} className="btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: FORGOT VERIFY */}
          {step === 'forgot_verify' && (
            <form onSubmit={handleForgotVerify} className="space-y-5">
              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2 text-center">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="e.g. 123456"
                  className="w-full bg-surface border border-border rounded-[4px] px-4 py-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center tracking-[0.5em] font-bold text-xl"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={isLoading || otp.length !== 6} className="btn-primary flex-grow">
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => setStep('password')} className="btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: FORGOT RESET */}
          {step === 'forgot_reset' && (
            <form onSubmit={handleForgotReset} className="space-y-5">
              <div>
                <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-border rounded-[4px] px-4 py-3.5 pr-12 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={isLoading || newPassword.length < 6} className="btn-primary flex-grow">
                  {isLoading ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

        </div>

        <p className="text-center text-text-secondary text-[0.9rem] mt-8 font-medium">
          New to the Arena? <Link to="/register" className="text-primary hover:text-primary-hover font-bold ml-1">Create a profile</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

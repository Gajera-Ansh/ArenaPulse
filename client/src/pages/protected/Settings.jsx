import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import expressApi from '../../api/expressApi';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });
  
  // Avatar Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Status State
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [passwordStep, setPasswordStep] = useState('request'); // 'request', 'verify', 'reset'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatus({ type: '', message: '' });
  };

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await expressApi.put('/api/users/profile', formData);
      if (res.data.success) {
        setUser(res.data.data);
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update profile.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Image must be smaller than 5MB.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await expressApi.patch('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setUser(res.data.data); // Updates Navbar instantly
        setStatus({ type: 'success', message: 'Avatar updated successfully!' });
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to upload avatar.' 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRequestOTP = async () => {
    setIsPasswordLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await expressApi.post('/api/users/request-password-otp');
      if (res.data.success) {
        setStatus({ type: 'success', message: 'An OTP has been sent to your email.' });
        setPasswordStep('verify');
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send OTP.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await expressApi.post('/api/users/verify-password-otp', { otp });
      if (res.data.success) {
        setStatus({ type: 'success', message: 'OTP verified. Please enter your new password.' });
        setPasswordStep('reset');
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Invalid or expired OTP.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await expressApi.post('/api/users/change-password', { otp, newPassword });
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Password updated successfully!' });
        setPasswordStep('request');
        setOtp('');
        setNewPassword('');
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 animate-fade-in relative flex-grow">
      
      <div className="mb-8 max-w-5xl mx-auto">
        <h1 className="text-[2.5rem] font-bold text-text uppercase tracking-tight">Settings</h1>
        <p className="text-text-secondary font-medium">Manage your account and profile preferences.</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => handleTabChange('profile')}
            className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-3 ${activeTab === 'profile' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface hover:bg-white/5 text-text-secondary hover:text-text border border-transparent'}`}
          >
            <i className="fa-solid fa-user w-5 text-center"></i> Profile
          </button>
          <button 
            onClick={() => handleTabChange('security')}
            className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-3 ${activeTab === 'security' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface hover:bg-white/5 text-text-secondary hover:text-text border border-transparent'}`}
          >
            <i className="fa-solid fa-shield-halved w-5 text-center"></i> Security
          </button>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-3">
          <div className="bg-surface border border-border rounded-[24px] p-8 shadow-xl">
            
            {status.message && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-medium text-[0.9rem] ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                <i className={`fa-solid ${status.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'} text-lg`}></i>
                {status.message}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <h2 className="text-[1.5rem] font-bold text-text uppercase mb-6 border-b border-border pb-4">Public Profile</h2>
                
                {/* Avatar Section */}
                <div className="mb-8 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative group">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-user text-3xl text-text-secondary"></i>
                    )}
                    
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      {isUploading ? (
                        <i className="fa-solid fa-circle-notch fa-spin text-white text-xl"></i>
                      ) : (
                        <i className="fa-solid fa-camera text-white text-xl"></i>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-[1rem] font-bold text-text mb-1">Profile Picture</h3>
                    <p className="text-[0.8rem] text-text-secondary mb-3">JPG, GIF or PNG. Max size of 5MB.</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="btn-outline px-4 py-2 text-[0.8rem]"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Display Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleProfileChange}
                      className="w-full bg-black/20 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Bio / Gaming History</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleProfileChange}
                      rows="4"
                      className="w-full bg-black/20 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      placeholder="Tell the community about yourself..."
                    ></textarea>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button type="submit" disabled={isSaving} className="btn-primary px-8">
                      {isSaving ? (
                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Saving...</>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <h2 className="text-[1.5rem] font-bold text-text uppercase mb-6 border-b border-border pb-4">Security</h2>
                
                <div className="bg-black/20 border border-border rounded-xl p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-[1.1rem] font-bold text-text mb-2">Change Password</h3>
                    <p className="text-[0.85rem] text-text-secondary">
                      To protect your account, we will send a 6-digit one-time password (OTP) to your registered email address before allowing a password reset.
                    </p>
                  </div>

                  {passwordStep === 'request' && (
                    <button 
                      onClick={handleRequestOTP} 
                      disabled={isPasswordLoading} 
                      className="btn-primary"
                    >
                      {isPasswordLoading ? (
                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Sending...</>
                      ) : (
                        <><i className="fa-solid fa-envelope"></i> Send OTP to Email</>
                      )}
                    </button>
                  )}

                  {passwordStep === 'verify' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4 max-w-sm">
                      <div>
                        <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          placeholder="e.g. 123456"
                          className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center tracking-[0.5em] font-bold text-lg"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={isPasswordLoading || otp.length !== 6} className="btn-primary flex-grow">
                          {isPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button type="button" onClick={() => setPasswordStep('request')} className="btn-outline">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {passwordStep === 'reset' && (
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                      <div>
                        <label className="block text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-border rounded-xl px-4 py-3.5 pr-12 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                      <div className="flex gap-3">
                        <button type="submit" disabled={isPasswordLoading || newPassword.length < 6} className="btn-primary flex-grow">
                          {isPasswordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                        <button type="button" onClick={() => setPasswordStep('request')} className="btn-outline">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/protected/Dashboard';
import CreateTournament from './pages/protected/CreateTournament';
import EditTournament from './pages/protected/EditTournament';
import CreateTeam from './pages/protected/CreateTeam';
import EditTeam from './pages/protected/EditTeam';
import Tournaments from './pages/public/Tournaments';
import TournamentDetails from './pages/public/TournamentDetails';
import TournamentBracket from './pages/public/TournamentBracket';
import Teams from './pages/public/Teams';
import Leaderboard from './pages/public/Leaderboard';
import Settings from './pages/protected/Settings';
import Profile from './pages/protected/Profile';


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen relative">
            {/* Aurora Background Effects */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
              <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-60 animate-aurora"></div>
              <div className="absolute top-[30%] -right-[15%] w-[50%] h-[70%] rounded-full bg-accent/15 blur-[120px] mix-blend-screen opacity-50 animate-aurora-delayed"></div>
              <div className="absolute -bottom-[20%] left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen opacity-40 animate-aurora-slow"></div>
            </div>
            
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/profile/:id" element={<Profile />} />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                <Route path="/tournaments/create" element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <CreateTournament />
                  </ProtectedRoute>
                } />

                <Route path="/tournaments/:id/edit" element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <EditTournament />
                  </ProtectedRoute>
                } />

                <Route path="/teams/create" element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <CreateTeam />
                  </ProtectedRoute>
                } />

                <Route path="/teams/:id/edit" element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <EditTeam />
                  </ProtectedRoute>
                } />

                <Route path="/teams" element={
                  <ProtectedRoute allowedRoles={['player']}>
                    <Teams />
                  </ProtectedRoute>
                } />

                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournaments/:id" element={
                  <ProtectedRoute>
                    <TournamentDetails />
                  </ProtectedRoute>
                } />
                <Route path="/tournaments/:id/bracket" element={<TournamentBracket />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

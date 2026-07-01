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
import Settings from './pages/protected/Settings';

// Placeholders for other pages
const Leaderboard = () => <div className="container pt-20"><h1>Leaderboard</h1></div>;

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
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

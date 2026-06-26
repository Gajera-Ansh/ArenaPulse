import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/public/Home';

// Placeholders for auth pages
const Login = () => <div className="container pt-20"><h1>Login</h1></div>;
const Register = () => <div className="container pt-20"><h1>Register</h1></div>;
const Dashboard = () => <div className="container pt-20"><h1>Dashboard</h1></div>;
const Tournaments = () => <div className="container pt-20"><h1>Tournaments</h1></div>;
const Leaderboard = () => <div className="container pt-20"><h1>Leaderboard</h1></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

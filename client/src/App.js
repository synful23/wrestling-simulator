// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateCompany from './pages/CreateCompany';
import Companies from './pages/Companies';
import CompanyManagement from './pages/CompanyManagement';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import WrestlerForm from './pages/WrestlerForm';
import RosterPage from './pages/RosterPage';
import WrestlerDetail from './pages/WrestlerDetail';
import FreeAgents from './pages/FreeAgents';
import VenuesPage from './pages/VenuesPage';
import VenueForm from './pages/VenueForm';
import ShowsPage from './pages/ShowsPage';
import ShowForm from './pages/ShowForm';
import ShowBooking from './pages/ShowBooking';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/create-company" element={
              <PrivateRoute>
                <CreateCompany />
              </PrivateRoute>
            } />
            <Route path="/companies" element={<Companies />} />
            <Route path="/company/:companyId" element={
              <PrivateRoute>
                <CompanyManagement />
              </PrivateRoute>
            } />
            <Route path="/wrestlers/new" element={
              <PrivateRoute>
                <WrestlerForm />
              </PrivateRoute>
            } />
            <Route path="/wrestlers/edit/:id" element={
              <PrivateRoute>
                <WrestlerForm />
              </PrivateRoute>
            } />
            <Route path="/wrestlers/:id" element={<WrestlerDetail />} />
            <Route path="/roster/:companyId" element={<RosterPage />} />
            <Route path="/free-agents" element={<FreeAgents />} />

            <Route path="/venues" element={<VenuesPage />} />
            <Route path="/venues/new" element={
              <PrivateRoute>
                <VenueForm />
              </PrivateRoute>
            } />
            <Route path="/venues/:id" element={<VenueForm />} />
            <Route path="/shows" element={<ShowsPage />} />
            <Route path="/shows/company/:companyId" element={<ShowsPage />} />
            <Route path="/shows/new" element={
              <PrivateRoute>
                <ShowForm />
              </PrivateRoute>
            } />
            <Route path="/shows/:id/edit" element={
              <PrivateRoute>
                <ShowForm />
              </PrivateRoute>
            } />
            <Route path="/shows/:id/book" element={
              <PrivateRoute>
                <ShowBooking />
              </PrivateRoute>
            } />
            
            {/* Add the new profile route */}
            <Route path="/profile" element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            } />
          </Routes>
        </div>
        
        {/* Simple footer */}
        <footer className="bg-dark text-white mt-5 py-4">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h5>Wrestling Booking Simulator</h5>
                <p className="small">Create your dream wrestling company, manage talent, book shows, and compete with other promoters!</p>
              </div>
              <div className="col-md-3">
                <h6>Quick Links</h6>
                <ul className="list-unstyled">
                  <li><a href="/companies" className="text-white-50">Companies</a></li>
                  <li><a href="/free-agents" className="text-white-50">Free Agents</a></li>
                  <li><a href="/venues" className="text-white-50">Venues</a></li>
                  <li><a href="/shows" className="text-white-50">Shows</a></li>
                </ul>
              </div>
              <div className="col-md-3">
                <h6>Community</h6>
                <ul className="list-unstyled">
                  <li><a href={process.env.REACT_APP_DISCORD_INVITE || "#"} className="text-white-50" target="_blank" rel="noopener noreferrer">Join Discord</a></li>
                </ul>
              </div>
            </div>
            <hr className="my-3 bg-secondary" />
            <div className="text-center">
              <p className="small text-muted mb-0">&copy; {new Date().getFullYear()} Wrestling Booking Simulator. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </Router>
    </AuthProvider>
  );
}

export default App;
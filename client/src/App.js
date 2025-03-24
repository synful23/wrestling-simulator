// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateCompany from './pages/CreateCompany';
import Companies from './pages/Companies';
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
import DebugPanel from './components/DebugPanel';
import CompanyDetails from './pages/CompanyDetails';
import ChampionshipsPage from './pages/ChampionshipsPage';
import ChampionshipForm from './pages/ChampionshipForm';
import ChampionshipDetail from './pages/ChampionshipDetail';



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
            <Route path="/debug" element={<DebugPanel />} />
            <Route path="/companies" element={<Companies />} />
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
            <Route path="/championships" element={<ChampionshipsPage />} />
            <Route path="/championships/company/:companyId" element={<ChampionshipsPage />} />
            <Route path="/championships/new" element={
              <PrivateRoute>
                <ChampionshipForm />
              </PrivateRoute>
            } />
            <Route path="/championships/:id" element={<ChampionshipDetail />} />
            <Route path="/championships/:id/edit" element={
              <PrivateRoute>
                <ChampionshipForm />
              </PrivateRoute>
            } />
            {/* Add the new company details route */}
            <Route path="/company/:id" element={
              <PrivateRoute>
                <CompanyDetails />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
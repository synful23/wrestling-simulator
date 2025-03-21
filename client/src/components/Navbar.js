// src/components/Navbar.js
import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [companies, setCompanies] = useState([]);

  // Fetch user's companies when the user is logged in
  useEffect(() => {
    const fetchUserCompanies = async () => {
      if (user) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { 
            withCredentials: true 
          });
          setCompanies(res.data);
        } catch (err) {
          console.error('Error fetching user companies:', err);
        }
      }
    };

    fetchUserCompanies();
  }, [user]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">Wrestling Booking Simulator</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/companies">Companies</Link>
            </li>
            <li className="nav-item">
  <Link className="nav-link" to="/shows">Shows</Link>
</li>
<li className="nav-item">
  <Link className="nav-link" to="/venues">Venues</Link>
</li>
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                
                {/* Roster Dropdown Menu */}
                {user && companies && companies.length > 0 && (
  <li className="nav-item dropdown">
    <a
      className="nav-link dropdown-toggle"
      href="#"
      role="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      onClick={(e) => e.preventDefault()}
    >
      Rosters
    </a>
    <ul className="dropdown-menu">
      {companies.map(company => (
        <li key={company._id}>
          <Link className="dropdown-item" to={`/roster/${company._id}`}>
            {company.name}
          </Link>
        </li>
      ))}
    </ul>
  </li>
)}
                <li className="nav-item">
  <Link className="nav-link" to="/free-agents">Free Agents</Link>
</li>
                <li className="nav-item">
                  <Link className="nav-link" to="/create-company">Create Company</Link>
                </li>
                <li className="nav-item">
                  <button onClick={logout} className="btn btn-danger btn-sm mt-1">Logout</button>
                </li>
                <li className="nav-item">
                  <div className="d-flex align-items-center ms-3">
                    <img src={user.avatar || 'https://via.placeholder.com/30'} 
                         alt="Avatar" 
                         className="rounded-circle me-2" 
                         style={{width: '30px', height: '30px', objectFit: 'cover'}} />
                    <span className="text-light">{user.username}</span>
                  </div>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-primary" to="/login">Login with Discord</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
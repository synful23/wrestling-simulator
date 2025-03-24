import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [companies, setCompanies] = useState([]);

  // Fetch user companies when logged in
  useEffect(() => {
    const fetchUserCompanies = async () => {
      if (user) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, {
            withCredentials: true,
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
    <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'} mb-4`}>
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          Main Event: Online
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/companies">
                Companies
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/shows">
                Shows
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/venues">
                Venues
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/championships">
                Championships
              </Link>
            </li>
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <button onClick={logout} className="btn btn-danger btn-sm mt-1">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-primary" to="/login">
                  Login with Discord
                </Link>
              </li>
            )}
            {/* Dark Mode Toggle */}
            <li className="nav-item ms-3">
              <button onClick={toggleTheme} className="btn btn-outline-secondary">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// src/pages/Home.js - Fixed version
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFistRaised, FaBuilding, FaCalendarAlt, FaUsers, FaTrophy, FaChartLine } from 'react-icons/fa';

const Home = () => {
  return (
    <div>
      {/* Hero Section with inline style instead of CSS background */}
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8))',
        color: 'white',
        textAlign: 'center',
        padding: '5rem 1rem',
        marginTop: '-1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 text-center">
              <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
                <FaBuilding style={{ marginRight: '0.5rem', color: 'white' }} />
                Wrestling Booking Simulator
              </h1>
              <p style={{ fontSize: '1.5rem', maxWidth: '600px', margin: '0 auto 2rem', opacity: '0.9' }}>
                Create your dream wrestling company, manage talent, book shows, and compete with other promoters!
              </p>
              <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
                <Link
                  to="/login"
                  className="btn btn-primary btn-lg px-5 py-3 m-2"
                >
                  Get Started
                </Link>
                <Link
                  to="/companies"
                  className="btn btn-outline-light btn-lg px-5 py-3 m-2"
                >
                  View Companies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container my-5">
        <h2 className="text-center mb-5" style={{ 
          fontWeight: '700', 
          marginBottom: '1.5rem', 
          paddingBottom: '0.5rem',
          borderBottom: '2px solid #E2E8F0'
        }}>
          How It Works
        </h2>
        
        <div className="row g-4">
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" style={{ 
              borderRadius: '0.75rem',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}>
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: '2.5rem', color: '#B91C1C', marginBottom: '1rem' }}>
                  <FaBuilding />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Create Your Company
                </h3>
                <p>
                  Choose a name, upload a logo, and establish your wrestling promotion in one of many available territories.
                  Build your brand from the ground up.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" style={{ 
              borderRadius: '0.75rem',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}>
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: '2.5rem', color: '#B91C1C', marginBottom: '1rem' }}>
                  <FaUsers />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Build Your Roster
                </h3>
                <p>
                  Scout and sign talented wrestlers, negotiate contracts, and assemble a balanced roster of superstars
                  to make your shows exciting.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" style={{ 
              borderRadius: '0.75rem',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}>
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: '2.5rem', color: '#B91C1C', marginBottom: '1rem' }}>
                  <FaCalendarAlt />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Book Shows
                </h3>
                <p>
                  Create exciting match cards, develop storylines, and build your audience week after week.
                  Make strategic decisions to maximize ratings.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-4 mt-2">
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" style={{ 
              borderRadius: '0.75rem',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}>
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: '2.5rem', color: '#B91C1C', marginBottom: '1rem' }}>
                  <FaTrophy />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Book Venues
                </h3>
                <p>
                  Choose from various venues around the world, from small arenas to massive stadiums.
                  Each venue affects attendance, atmosphere, and your company's prestige.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" style={{ 
              borderRadius: '0.75rem',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}>
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: '2.5rem', color: '#B91C1C', marginBottom: '1rem' }}>
                  <FaChartLine />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Grow Your Company
                </h3>
                <p>
                  Manage finances, increase popularity, and build a loyal fanbase.
                  Make smart business decisions to ensure long-term success.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" style={{ 
              borderRadius: '0.75rem',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}>
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: '2.5rem', color: '#B91C1C', marginBottom: '1rem' }}>
                  <FaFistRaised />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  Compete For Glory
                </h3>
                <p>
                  Rise through the ranks and compete with other promoters to become the top wrestling company in the world.
                  Dominate ratings and build a wrestling empire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Getting Started Section */}
      <div style={{ backgroundColor: '#F8FAFC', padding: '3rem 0' }}>
        <div className="container">
          <h2 className="text-center mb-5" style={{ 
            fontWeight: '700', 
            marginBottom: '1.5rem', 
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #E2E8F0'
          }}>
            Ready to Start Your Wrestling Empire?
          </h2>
          
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              {/* No image here to avoid dependency issues */}
              <div style={{
                height: '300px',
                backgroundColor: '#1E293B',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <div className="text-center">
                  <FaFistRaised style={{ fontSize: '5rem', marginBottom: '1rem' }} />
                  <h3 className="text-white">Wrestling Booking Simulator</h3>
                  <p>Create, Manage, Compete</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '0.75rem' }}>
                <div className="card-body p-4">
                  <h3 className="mb-4">Get Started in Minutes</h3>
                  
                  <ul className="list-unstyled">
                    <li className="mb-3 d-flex align-items-center">
                      <span className="badge bg-primary rounded-circle me-3">1</span>
                      <span>Create an account using Discord</span>
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <span className="badge bg-primary rounded-circle me-3">2</span>
                      <span>Found your wrestling company</span>
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <span className="badge bg-primary rounded-circle me-3">3</span>
                      <span>Sign wrestlers to build your roster</span>
                    </li>
                    <li className="mb-3 d-flex align-items-center">
                      <span className="badge bg-primary rounded-circle me-3">4</span>
                      <span>Book and run your first show</span>
                    </li>
                  </ul>
                  
                  <div className="text-center mt-4">
                    <Link to="/login" className="btn btn-primary btn-lg px-5 py-2">
                      Start Your Company
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-4xl font-bold mb-6">Wrestling Booking Simulator</h1>
        <p className="text-xl mb-8">
          Create your dream wrestling company, manage talent, book shows, and compete with other promoters!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/companies"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            View Companies
          </Link>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Create Your Company</h2>
          <p className="text-gray-600">
            Choose a name, upload a logo, and establish your wrestling promotion in one of many available territories.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Book Shows</h2>
          <p className="text-gray-600">
            Create exciting match cards, develop storylines, and build your audience week after week.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Compete for Glory</h2>
          <p className="text-gray-600">
            Rise through the ranks and compete with other promoters to become the top wrestling company in the world.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const Wrestler = require('../models/Wrestler');


// Check if user is authenticated middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

// @route   GET /api/auth/discord
// @desc    Authenticate with Discord
// @access  Public
router.get('/discord', passport.authenticate('discord'));

// @route   GET /api/auth/discord/callback
// @desc    Discord auth callback
// @access  Public
router.get(
  '/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=server_membership`,
    failureMessage: true
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', isAuthenticated, (req, res) => {
  res.json(req.user);
});

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// @route   GET /api/auth/error
// @desc    Get authentication error
// @access  Public
router.get('/error', (req, res) => {
  const error = req.session.messages ? req.session.messages[req.session.messages.length - 1] : null;
  res.json({ error });
});

// @route   GET /api/auth/stats
// @desc    Get user stats including money and achievements
// @access  Private
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    // Get full user with all details
    const user = await User.findById(req.user.id)
      .populate('companies', 'name logo');
    
    // Default values for fields that might not exist yet
    let userData = {
      money: user.money || 500000, // Default starting money
      achievements: user.achievements || [],
      level: user.level || 1,
      experience: user.experience || 0,
      xpForNextLevel: 100, // Fixed for now
      xpProgress: 0,
      totalAssets: user.money || 500000,
      weeklyExpenses: 0,
      companies: user.companies || [],
      wrestlers: [],
    };
    
    // Calculate XP progress percentage
    userData.xpProgress = (userData.experience / userData.xpForNextLevel) * 100;
    
    // Count all wrestlers across all companies
    if (user.companies && user.companies.length > 0) {
      try {
        // Get company IDs
        const companyIds = user.companies.map(company => company._id);
        
        // Query for all wrestlers belonging to any of these companies
        const wrestlerCount = await Wrestler.countDocuments({
          'contract.company': { $in: companyIds }
        });
        
        // Get sample of wrestlers (first 10) for display
        const sampleWrestlers = await Wrestler.find({
          'contract.company': { $in: companyIds }
        })
        .select('name image')
        .limit(10);
        
        userData.wrestlers = sampleWrestlers;
        userData.wrestlerCount = wrestlerCount;
      } catch (wrestlerErr) {
        console.error('Error counting wrestlers:', wrestlerErr);
        // Default values remain in place
      }
    }
    
    // Return user stats
    res.json(userData);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
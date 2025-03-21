// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');

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

module.exports = router;
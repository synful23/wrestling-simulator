// routes/venues.js - Update to use admin middleware
const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const Company = require('../models/Company');
const upload = require('../middleware/upload');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// @route   POST /api/venues
// @desc    Create a new venue
// @access  Admin only
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
  try {
    // Only admins can create venues
    const {
      name,
      location,
      capacity,
      rentalCost,
      prestige,
      description,
      isAvailable,
      owner,
      maintenanceCost,
      profitShare
    } = req.body;

    // Validate required fields
    if (!name || !location || !capacity || !rentalCost) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create the venue
    const venue = new Venue({
      name,
      location,
      capacity: parseInt(capacity),
      rentalCost: parseFloat(rentalCost),
      prestige: parseInt(prestige) || 50,
      description,
      isAvailable: isAvailable === 'true' || isAvailable === true,
      owner: owner || null
    });

    // Optional fields for company-owned venues
    if (owner) {
      // Check if the owner company exists
      const company = await Company.findById(owner);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      venue.maintenanceCost = parseFloat(maintenanceCost) || 0;
      venue.profitShare = parseFloat(profitShare) || 0;
    }

    // Add image if uploaded
    if (req.file) {
      venue.image = `/api/uploads/${req.file.filename}`;
    }

    await venue.save();
    res.status(201).json(venue);
  } catch (err) {
    console.error('Error creating venue:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Other routes stay the same as before but update the following:

// @route   PUT /api/venues/:id
// @desc    Update venue
// @access  Admin only
router.put('/:id', isAdmin, upload.single('image'), async (req, res) => {
  // same code as before
});

// @route   DELETE /api/venues/:id
// @desc    Delete venue
// @access  Admin only
router.delete('/:id', isAdmin, async (req, res) => {
  // same code as before
});

// Keep the GET routes as public for everyone to view venues
// ...

module.exports = router;
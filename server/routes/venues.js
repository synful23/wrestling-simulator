// server/routes/venues.js
const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const Company = require('../models/Company');
const upload = require('../middleware/upload');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// @route   GET /api/venues
// @desc    Get all venues with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/venues - Query params:', req.query);
    const query = {};
    
    // Filter for available venues
    if (req.query.available === 'true') {
      query.isAvailable = true;
    }
    
    // Filter by capacity
    if (req.query.minCapacity) {
      query.capacity = { $gte: parseInt(req.query.minCapacity) };
    }
    
    if (req.query.maxCapacity) {
      query.capacity = { ...query.capacity, $lte: parseInt(req.query.maxCapacity) };
    }
    
    // Filter by location
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }
    
    // Filter by owner company
    if (req.query.owner) {
      query.owner = req.query.owner;
    }
    
    console.log('Venue query:', query);
    const venues = await Venue.find(query)
      .populate('owner', 'name')
      .sort({ prestige: -1 });
    
    console.log(`Found ${venues.length} venues`);
    res.json(venues);
  } catch (err) {
    console.error('Error fetching venues:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/venues/:id
// @desc    Get venue by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('owner', 'name');
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (err) {
    console.error('Error fetching venue:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// @route   PUT /api/venues/:id
// @desc    Update venue
// @access  Admin only
router.put('/:id', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
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
    
    // Update fields
    if (name) venue.name = name;
    if (location) venue.location = location;
    if (capacity) venue.capacity = parseInt(capacity);
    if (rentalCost) venue.rentalCost = parseFloat(rentalCost);
    if (prestige) venue.prestige = parseInt(prestige);
    if (description !== undefined) venue.description = description;
    if (isAvailable !== undefined) venue.isAvailable = isAvailable === 'true' || isAvailable === true;
    
    // Update owner and related fields
    if (owner) {
      // Check if the owner company exists
      const company = await Company.findById(owner);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      venue.owner = owner;
      venue.maintenanceCost = parseFloat(maintenanceCost) || 0;
      venue.profitShare = parseFloat(profitShare) || 0;
    } else if (owner === '') {
      // Remove owner
      venue.owner = null;
      venue.maintenanceCost = 0;
      venue.profitShare = 0;
    }
    
    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (venue.image) {
        const oldImagePath = path.join(__dirname, '..', venue.image.replace('/api', ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      venue.image = `/api/uploads/${req.file.filename}`;
    }
    
    await venue.save();
    res.json(venue);
  } catch (err) {
    console.error('Error updating venue:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/venues/:id
// @desc    Delete venue
// @access  Admin only
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // Delete venue image if exists
    if (venue.image) {
      const imagePath = path.join(__dirname, '..', venue.image.replace('/api', ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await venue.deleteOne(); // Use deleteOne instead of remove which is deprecated
    res.json({ message: 'Venue deleted successfully' });
  } catch (err) {
    console.error('Error deleting venue:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
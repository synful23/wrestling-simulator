// routes/companies.js
const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const upload = require('../middleware/upload'); // Import the upload middleware
const fs = require('fs');
const path = require('path');

// Check if user is authenticated middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

// @route   POST /api/companies
// @desc    Create a new wrestling company
// @access  Private
router.post('/', isAuthenticated, upload.single('logo'), async (req, res) => {
  try {
    const { name, location, description } = req.body;

    // Basic validation
    if (!name || !location || !description) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ message: 'A company with that name already exists' });
    }
    
    // Get full user with methods
    const user = await User.findById(req.user.id);
    
    // Cost to create a company
    const companyCost = 200000; // $200,000
    
    // Check if user has enough money
    if (!user.canCreateCompany(companyCost)) {
      return res.status(400).json({ 
        message: `You need $${companyCost.toLocaleString()} to create a company. You have $${user.money.toLocaleString()}.`
      });
    }
    
    // Deduct the cost
    user.money -= companyCost;

    // Create new company
    const newCompany = new Company({
      name,
      location,
      description,
      owner: user._id,
      money: 100000 // Starting company money
    });

    // If logo was uploaded, add it to the company
    if (req.file) {
      newCompany.logo = `/api/uploads/${req.file.filename}`;
    }

    // Save company
    await newCompany.save();

    // Add company to user's companies array
    user.companies.push(newCompany._id);
    
    // Add achievement for creating a company
    await user.addAchievement(
      'company_created',
      `Created a new wrestling company: ${name}`,
      50000 // $50,000 bonus for creating first company
    );
    
    // Save user
    await user.save();
    
    // Attempt to send Discord webhook notification
    try {
      await discordWebhook.notifyNewCompany(newCompany, user);
    } catch (webhookErr) {
      console.error('Error sending webhook notification:', webhookErr);
      // Continue anyway - webhook is not critical
    }

    res.status(201).json({ 
      company: newCompany,
      userMoney: user.money
    });
  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/companies
// @desc    Get all wrestling companies
// @access  Public
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/companies/user
// @desc    Get current user's wrestling companies
// @access  Private
router.get('/user', isAuthenticated, async (req, res) => {
  try {
    const companies = await Company.find({ owner: req.user.id }).sort({
      createdAt: -1
    });
    res.json(companies);
  } catch (err) {
    console.error('Error fetching user companies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/companies/:id
// @desc    Get a wrestling company by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate(
      'owner',
      'username avatar'
    );
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json(company);
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update a wrestling company
// @access  Private
router.put('/:id', isAuthenticated, upload.single('logo'), async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Check if user is the company owner
    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this company' });
    }
    
    const { name, location, description } = req.body;
    
    // Update company fields
    company.name = name || company.name;
    company.location = location || company.location;
    company.description = description || company.description;
    
    // Handle logo update if provided
    if (req.file) {
      // Delete old logo if exists
      if (company.logo) {
        const oldLogoPath = path.join(__dirname, '..', company.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      company.logo = `/uploads/${req.file.filename}`;
    }
    
    await company.save();
    res.json(company);
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/companies/:id
// @desc    Delete a wrestling company
// @access  Private
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Check if user is the company owner
    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this company' });
    }
    
    // Delete company logo if exists
    if (company.logo) {
      const logoPath = path.join(__dirname, '..', company.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }
    
    // Remove company from user's companies array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { companies: company._id }
    });
    
    // Delete the company
    await company.remove();
    
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error('Error deleting company:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
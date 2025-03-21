// server/routes/wrestlers.js - Optimized version
const express = require('express');
const router = express.Router();
const Wrestler = require('../models/Wrestler');
const User = require('../models/User');
const Company = require('../models/Company');
const upload = require('../middleware/upload');
const { isAuthenticated, isAdmin, canManageWrestler } = require('../middleware/auth');
const discordWebhook = require('../utils/discordWebhook');
const mongoose = require('mongoose');

// Add index to improve query performance
if (!Wrestler.schema.indexes().some(idx => idx[0]['contract.company'] === 1)) {
  Wrestler.schema.index({ 'contract.company': 1 });
  console.log('Added index to Wrestler.contract.company');
}

// @route   GET /api/wrestlers
// @desc    Get all wrestlers with optional pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/wrestlers - Fetching wrestlers');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Optional filtering
    const filter = {};
    if (req.query.style) filter.style = req.query.style;
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.freeAgent === 'true') filter['contract.company'] = { $exists: false };
    
    // Set a timeout for this query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timed out')), 5000)
    );
    
    // Create the query but limit the fields we're retrieving
    const wrestlersPromise = Wrestler.find(filter, {
      name: 1,
      gender: 1,
      style: 1,
      image: 1,
      attributes: 1,
      popularity: 1,
      salary: 1,
      contract: 1,
      hometown: 1,
      age: 1,
      experience: 1,
      bio: 1,
      signatureMoves: 1,
      finisher: 1,
      isActive: 1,
      isInjured: 1
    })
    .populate('contract.company', 'name logo')
    .skip(skip)
    .limit(limit)
    .lean() // Use lean() for better performance
    .exec();
    
    // Race the timeout against the query
    const wrestlers = await Promise.race([wrestlersPromise, timeoutPromise]);
    
    console.log(`Found ${wrestlers?.length || 0} wrestlers`);
    res.json(wrestlers || []);
  } catch (err) {
    console.error('Error fetching wrestlers:', err);
    // Send an empty array instead of an error to prevent blocking clients
    res.json([]);
  }
});

// @route   GET /api/wrestlers/:id
// @desc    Get wrestler by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log(`GET /api/wrestlers/${req.params.id}`);
    const wrestler = await Wrestler.findById(req.params.id)
      .populate('contract.company', 'name logo owner');
    
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    res.json(wrestler);
  } catch (err) {
    console.error('Error fetching wrestler:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/wrestlers/company/:companyId
// @desc    Get wrestlers by company
// @access  Public
router.get('/company/:companyId', async (req, res) => {
  try {
    console.log(`GET /api/wrestlers/company/${req.params.companyId}`);
    
    // Set a timeout for this query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timed out')), 5000)
    );
    
    // Create the query with limited fields
    const wrestlersPromise = Wrestler.find({ 
      'contract.company': req.params.companyId 
    }, {
      name: 1, 
      gender: 1,
      style: 1,
      image: 1,
      attributes: 1,
      popularity: 1,
      salary: 1,
      contract: 1,
      hometown: 1,
      age: 1,
      experience: 1,
      bio: 1,
      signatureMoves: 1,
      finisher: 1,
      isActive: 1,
      isInjured: 1
    })
    .lean()
    .exec();
    
    // Race the timeout against the query
    const wrestlers = await Promise.race([wrestlersPromise, timeoutPromise]);
    
    console.log(`Found ${wrestlers?.length || 0} wrestlers for company ${req.params.companyId}`);
    res.json(wrestlers || []);
  } catch (err) {
    console.error(`Error fetching company wrestlers:`, err);
    // Send an empty array instead of an error
    res.json([]);
  }
});

// @route   POST /api/wrestlers
// @desc    Create a new wrestler
// @access  Admin only
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      gender,
      style,
      strength,
      agility,
      charisma,
      technical,
      popularity,
      salary,
      companyId,
      contractLength,
      exclusive,
      hometown,
      age,
      experience,
      bio,
      signatureMoves,
      finisher
    } = req.body;

    // Create new wrestler
    const wrestler = new Wrestler({
      name,
      gender,
      style,
      attributes: {
        strength: strength || 50,
        agility: agility || 50,
        charisma: charisma || 50,
        technical: technical || 50
      },
      popularity: popularity || 50,
      salary: salary || 50000,
      hometown,
      age,
      experience,
      bio,
      signatureMoves: signatureMoves ? signatureMoves.split(',').map(move => move.trim()) : [],
      finisher
    });

    // If company is specified, add contract details
    if (companyId) {
      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      wrestler.contract = {
        company: companyId,
        startDate: new Date(),
        length: contractLength || 12,
        exclusive: exclusive === 'true' || exclusive === true
      };
    }

    // If image was uploaded, add it to the wrestler
    if (req.file) {
      wrestler.image = `/api/uploads/${req.file.filename}`;
    }

    // Save wrestler
    await wrestler.save();

    // If wrestler is signed to a company, update company's finances
    if (companyId) {
      await Company.findByIdAndUpdate(companyId, {
        $inc: { 'money': -wrestler.salary }
      });
    }

    res.status(201).json(wrestler);
  } catch (err) {
    console.error('Error creating wrestler:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/wrestlers/:id
// @desc    Update wrestler
// @access  Admin or owner
router.put('/:id', isAuthenticated, canManageWrestler, upload.single('image'), async (req, res) => {
  try {
    let wrestler = await Wrestler.findById(req.params.id)
      .populate('contract.company', 'owner');
    
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    const {
      name,
      gender,
      style,
      strength,
      agility,
      charisma,
      technical,
      popularity,
      salary,
      companyId,
      contractLength,
      exclusive,
      isActive,
      isInjured,
      hometown,
      age,
      experience,
      bio,
      signatureMoves,
      finisher
    } = req.body;

    // Update basic info
    if (name) wrestler.name = name;
    if (gender) wrestler.gender = gender;
    if (style) wrestler.style = style;
    if (strength) wrestler.attributes.strength = parseInt(strength);
    if (agility) wrestler.attributes.agility = parseInt(agility);
    if (charisma) wrestler.attributes.charisma = parseInt(charisma);
    if (technical) wrestler.attributes.technical = parseInt(technical);
    if (popularity) wrestler.popularity = parseInt(popularity);
    
    // Only admins can change salary
    if (salary && req.user.isAdmin) {
      wrestler.salary = parseInt(salary);
    }
    
    if (isActive !== undefined) wrestler.isActive = isActive === 'true' || isActive === true;
    if (isInjured !== undefined) wrestler.isInjured = isInjured === 'true' || isInjured === true;
    if (hometown) wrestler.hometown = hometown;
    if (age) wrestler.age = parseInt(age);
    if (experience) wrestler.experience = parseInt(experience);
    if (bio) wrestler.bio = bio;
    if (signatureMoves) wrestler.signatureMoves = signatureMoves.split(',').map(move => move.trim());
    if (finisher) wrestler.finisher = finisher;

    // Only admins can change contract details
    if (req.user.isAdmin && companyId) {
      // Contract with new or different company
      wrestler.contract = {
        company: companyId,
        startDate: new Date(),
        length: contractLength || 12,
        exclusive: exclusive === 'true' || exclusive === true
      };
    }

    // Handle image upload
    if (req.file) {
      wrestler.image = `/api/uploads/${req.file.filename}`;
    }
    
    await wrestler.save();
    res.json(wrestler);
  } catch (err) {
    console.error('Error updating wrestler:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/wrestlers/:id
// @desc    Delete wrestler
// @access  Admin only
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const wrestler = await Wrestler.findById(req.params.id);
    
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    await wrestler.deleteOne();
    res.json({ message: 'Wrestler deleted successfully' });
  } catch (err) {
    console.error('Error deleting wrestler:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/wrestlers/:id/sign/:companyId
// @desc    Sign wrestler to a company
// @access  Company Owner
router.post('/:id/sign/:companyId', isAuthenticated, async (req, res) => {
  try {
    const wrestler = await Wrestler.findById(req.params.id);
    const company = await Company.findById(req.params.companyId);
    
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Check if user owns the company
    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to sign wrestlers for this company' });
    }
    
    // Check if company can afford the wrestler
    if (company.money < wrestler.salary) {
      return res.status(400).json({ message: 'Not enough funds to sign this wrestler' });
    }
    
    // Update wrestler contract
    wrestler.contract = {
      company: req.params.companyId,
      startDate: new Date(),
      length: req.body.contractLength || 12,
      exclusive: req.body.exclusive === 'true' || req.body.exclusive === true
    };
    
    await wrestler.save();
    
    // Update company finances
    company.money -= wrestler.salary;
    await company.save();
    
    // Add wrestler to user's purchased wrestlers
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { purchasedWrestlers: wrestler._id }
    });
    
    // Send Discord webhook notification
    try {
      await discordWebhook.notifyWrestlerSigned(wrestler, company, req.user);
    } catch (webhookErr) {
      console.error('Error sending webhook notification:', webhookErr);
      // Don't block the main operation if webhook fails
    }
    
    res.json(wrestler);
  } catch (err) {
    console.error('Error signing wrestler:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/wrestlers/:id/release
// @desc    Release wrestler from contract
// @access  Company Owner or Admin
router.post('/:id/release', isAuthenticated, async (req, res) => {
  try {
    const wrestler = await Wrestler.findById(req.params.id)
      .populate('contract.company', 'owner');
    
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    // Check if wrestler has a contract
    if (!wrestler.contract || !wrestler.contract.company) {
      return res.status(400).json({ message: 'Wrestler does not have a contract' });
    }
    
    // Check if user is authorized to release the wrestler
    if (!req.user.isAdmin && wrestler.contract.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to release this wrestler' });
    }
    
    // Remove wrestler from user's purchased wrestlers
    if (wrestler.contract.company.owner) {
      await User.findByIdAndUpdate(wrestler.contract.company.owner, {
        $pull: { purchasedWrestlers: wrestler._id }
      });
    }
    
    // Remove contract
    wrestler.contract = undefined;
    await wrestler.save();
    
    res.json({ message: 'Wrestler released from contract' });
  } catch (err) {
    console.error('Error releasing wrestler:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
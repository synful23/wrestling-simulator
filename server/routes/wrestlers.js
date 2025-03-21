// routes/wrestlers.js - Update to use admin middleware
const express = require('express');
const router = express.Router();
const Wrestler = require('../models/Wrestler');
const User = require('../models/User');
const Company = require('../models/Company');
const upload = require('../middleware/upload');
const { isAuthenticated, isAdmin, canManageWrestler } = require('../middleware/auth');
const discordWebhook = require('../utils/discordWebhook');

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

// @route   GET /api/wrestlers
// @desc    Get all wrestlers
// @access  Public
router.get('/', async (req, res) => {
  // Same as before - everyone can see wrestlers
});

// @route   GET /api/wrestlers/:id
// @desc    Get wrestler by ID
// @access  Public
router.get('/:id', async (req, res) => {
  // Same as before - everyone can see wrestler details
});

// @route   GET /api/wrestlers/company/:companyId
// @desc    Get wrestlers by company
// @access  Public
router.get('/company/:companyId', async (req, res) => {
  // Same as before - everyone can see company rosters
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
    
    // Update wrestler (same code as before)
    // ...

    // Add the logic for updating the wrestler
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
      // Add code to handle image update (same as before)
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
  // Same code as before
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
    await discordWebhook.notifyWrestlerSigned(wrestler, company, req.user);
    
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

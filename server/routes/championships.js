// routes/championships.js
const express = require('express');
const router = express.Router();
const Championship = require('../models/Championship');
const Company = require('../models/Company');
const Wrestler = require('../models/Wrestler');
const upload = require('../middleware/upload');
const { isAuthenticated } = require('../middleware/auth');

// Check if user is the company owner
const isCompanyOwner = async (req, res, next) => {
  try {
    const companyId = req.body.company || req.params.companyId;
    
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage championships for this company' });
    }
    
    next();
  } catch (err) {
    console.error('Error checking company ownership:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/championships
// @desc    Create a new championship
// @access  Private - Company Owner
router.post('/', isAuthenticated, isCompanyOwner, upload.single('image'), async (req, res) => {
  try {

    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    console.log('User:', req.user);

    const { 
        company, 
        name, 
        description = '', 
        weight = 'Heavyweight', 
        prestige = 50, 
        isActive = true 
      } = req.body;

    // Validate required fields with more detailed error
    if (!company) {
        return res.status(400).json({ 
          message: 'Company is required',
          details: { company, name }
        });
      }
  
      if (!name) {
        return res.status(400).json({ 
          message: 'Championship name is required',
          details: { company, name }
        });
      }

    // Create the championship
    const championship = new Championship({
      company,
      name,
      description,
      weight: weight || 'Heavyweight',
      prestige: prestige || 50
    });

    // Add image if uploaded
    if (req.file) {
      championship.image = `/api/uploads/${req.file.filename}`;
    }

    // Save championship
    await championship.save();

    res.status(201).json(championship);
} catch (err) {
    console.error('Full error details:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// @route   GET /api/championships
// @desc    Get all championships with optional company filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const query = {};
    
    // Filter by company if provided
    if (req.query.company) {
      query.company = req.query.company;
    }
    
    // Filter by active status
    if (req.query.active === 'true') {
      query.isActive = true;
    } else if (req.query.active === 'false') {
      query.isActive = false;
    }
    
    // Filter by weight class
    if (req.query.weight) {
      query.weight = req.query.weight;
    }
    
    const championships = await Championship.find(query)
      .populate('company', 'name logo')
      .populate('currentHolder', 'name image popularity')
      .sort({ prestige: -1 });
    
    res.json(championships);
  } catch (err) {
    console.error('Error fetching championships:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/championships/company/:companyId
// @desc    Get championships for a specific company
// @access  Public
router.get('/company/:companyId', async (req, res) => {
    try {
      console.log('Fetching championships for company ID:', req.params.companyId);
      const championships = await Championship.find({ company: req.params.companyId });
      console.log('Found championships:', championships);
      res.json(championships);
    } catch (err) {
      console.error('Error fetching company championships:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// @route   GET /api/championships/:id
// @desc    Get championship by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const championship = await Championship.findById(req.params.id)
      .populate('company', 'name logo owner')
      .populate('currentHolder', 'name image popularity gender style')
      .populate({
        path: 'titleHistory.holder',
        select: 'name image popularity'
      })
      .populate({
        path: 'titleHistory.wonFrom',
        select: 'name image'
      })
      .populate({
        path: 'titleHistory.wonAt',
        select: 'name date'
      })
      .populate({
        path: 'titleHistory.defenses.against',
        select: 'name image'
      })
      .populate({
        path: 'titleHistory.defenses.show',
        select: 'name date'
      });
    
    if (!championship) {
      return res.status(404).json({ message: 'Championship not found' });
    }
    
    res.json(championship);
  } catch (err) {
    console.error('Error fetching championship:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/championships/:id
// @desc    Update championship
// @access  Private - Company Owner
router.put('/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const championship = await Championship.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!championship) {
      return res.status(404).json({ message: 'Championship not found' });
    }
    
    // Check if user is authorized to update this championship
    if (championship.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this championship' });
    }
    
    const { name, description, weight, prestige, isActive } = req.body;
    
    // Update fields
    if (name) championship.name = name;
    if (description !== undefined) championship.description = description;
    if (weight) championship.weight = weight;
    if (prestige) championship.prestige = parseInt(prestige);
    if (isActive !== undefined) championship.isActive = isActive === 'true' || isActive === true;
    
    // Add image if uploaded
    if (req.file) {
      championship.image = `/api/uploads/${req.file.filename}`;
    }
    
    await championship.save();
    res.json(championship);
  } catch (err) {
    console.error('Error updating championship:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/championships/:id
// @desc    Delete championship
// @access  Private - Company Owner
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const championship = await Championship.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!championship) {
      return res.status(404).json({ message: 'Championship not found' });
    }
    
    // Check if user is authorized to delete this championship
    if (championship.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this championship' });
    }
    
    await championship.remove();
    res.json({ message: 'Championship deleted successfully' });
  } catch (err) {
    console.error('Error deleting championship:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/championships/:id/holder
// @desc    Set championship holder
// @access  Private - Company Owner
router.post('/:id/holder', isAuthenticated, async (req, res) => {
  try {
    const championship = await Championship.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!championship) {
      return res.status(404).json({ message: 'Championship not found' });
    }
    
    // Check if user is authorized
    if (championship.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this championship' });
    }
    
    const { wrestlerId, wonFromId, showId } = req.body;
    
    // Validate wrestler
    const wrestler = await Wrestler.findById(wrestlerId);
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    // Check if wrestler belongs to the same company
    if (!wrestler.contract || wrestler.contract.company.toString() !== championship.company.toString()) {
      return res.status(400).json({ message: 'Wrestler must be under contract with the same company' });
    }
    
    // Set the new champion
    await championship.setChampion(wrestlerId, wonFromId, showId);
    
    // Update wrestler's popularity (championship holder gets a boost)
    wrestler.popularity = Math.min(100, wrestler.popularity + 5);
    await wrestler.save();
    
    // Get fully populated championship
    const updatedChampionship = await Championship.findById(championship._id)
      .populate('company', 'name logo owner')
      .populate('currentHolder', 'name image popularity')
      .populate({
        path: 'titleHistory.holder',
        select: 'name image'
      });
    
    res.json(updatedChampionship);
  } catch (err) {
    console.error('Error setting championship holder:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/championships/:id/defense
// @desc    Record a championship defense
// @access  Private - Company Owner
router.post('/:id/defense', isAuthenticated, async (req, res) => {
  try {
    const championship = await Championship.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!championship) {
      return res.status(404).json({ message: 'Championship not found' });
    }
    
    // Check if user is authorized
    if (championship.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this championship' });
    }
    
    // Check if championship has a current holder
    if (!championship.currentHolder) {
      return res.status(400).json({ message: 'Championship does not have a current holder' });
    }
    
    const { againstId, showId, quality } = req.body;
    
    // Validate challenger
    const challenger = await Wrestler.findById(againstId);
    if (!challenger) {
      return res.status(404).json({ message: 'Challenger wrestler not found' });
    }
    
    // Record the defense
    await championship.addDefense(againstId, showId, quality);
    
    // Boost champion's popularity (successful defense)
    const champion = await Wrestler.findById(championship.currentHolder);
    if (champion) {
      champion.popularity = Math.min(100, champion.popularity + 2);
      await champion.save();
    }
    
    // Get fully populated championship
    const updatedChampionship = await Championship.findById(championship._id)
      .populate('company', 'name logo owner')
      .populate('currentHolder', 'name image popularity')
      .populate({
        path: 'titleHistory.holder',
        select: 'name image'
      })
      .populate({
        path: 'titleHistory.defenses.against',
        select: 'name image'
      });
    
    res.json(updatedChampionship);
  } catch (err) {
    console.error('Error recording championship defense:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/championships/wrestler/:wrestlerId
// @desc    Get championships for a specific wrestler (current and past)
// @access  Public
router.get('/wrestler/:wrestlerId', async (req, res) => {
  try {
    // Find championships where wrestler is current holder
    const currentTitles = await Championship.find({ currentHolder: req.params.wrestlerId })
      .populate('company', 'name logo')
      .sort({ prestige: -1 });
    
    // Find championships where wrestler was previously a holder
    const formerTitles = await Championship.find({
      currentHolder: { $ne: req.params.wrestlerId },
      'titleHistory.holder': req.params.wrestlerId
    })
    .populate('company', 'name logo')
    .sort({ prestige: -1 });
    
    res.json({
      current: currentTitles,
      former: formerTitles
    });
  } catch (err) {
    console.error('Error fetching wrestler championships:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
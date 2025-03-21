// routes/shows.js
const express = require('express');
const router = express.Router();
const Show = require('../models/Show');
const Company = require('../models/Company');
const Wrestler = require('../models/Wrestler');
const Venue = require('../models/Venue');

// Check if user is authenticated middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

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
      return res.status(403).json({ message: 'Not authorized to manage shows for this company' });
    }
    
    next();
  } catch (err) {
    console.error('Error checking company ownership:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if a show is not completed
const isShowEditable = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    if (show.status === 'Completed') {
      return res.status(403).json({ message: 'Completed shows cannot be modified' });
    }
    
    next();
  } catch (err) {
    console.error('Error checking show status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate match quality
const calculateMatchQuality = async (match) => {
  try {
    // Get the wrestlers involved
    const wrestlers = await Wrestler.find({
      _id: { $in: match.wrestlers.map(w => w.wrestler) }
    });
    
    if (wrestlers.length === 0) {
      return 2.5; // Default average rating
    }
    
    // Calculate base quality from wrestler stats
    let totalPopularity = 0;
    let totalSkill = 0;
    
    for (const wrestler of wrestlers) {
      totalPopularity += wrestler.popularity;
      
      // Calculate wrestler skill based on attributes
      const { strength, agility, charisma, technical } = wrestler.attributes;
      let skillFactor = 0;
      
      // Weight attributes differently based on match type
      switch (match.matchType) {
        case 'Technical':
          skillFactor = (technical * 0.5) + (agility * 0.2) + (strength * 0.1) + (charisma * 0.2);
          break;
        case 'High-Flyer':
          skillFactor = (agility * 0.5) + (technical * 0.2) + (strength * 0.1) + (charisma * 0.2);
          break;
        case 'Powerhouse':
          skillFactor = (strength * 0.5) + (technical * 0.2) + (agility * 0.1) + (charisma * 0.2);
          break;
        default:
          skillFactor = (technical * 0.3) + (agility * 0.2) + (strength * 0.2) + (charisma * 0.3);
      }
      
      totalSkill += skillFactor;
    }
    
    // Average popularity and skill
    const avgPopularity = totalPopularity / wrestlers.length;
    const avgSkill = totalSkill / wrestlers.length;
    
    // Calculate base quality (1-5 scale)
    let baseQuality = ((avgPopularity / 20) + (avgSkill / 20)) / 2;
    
    // Adjust for match factors
    if (match.isChampionshipMatch) {
      baseQuality += 0.5; // Championship matches are usually better
    }
    
    if (match.stipulation) {
      baseQuality += 0.3; // Stipulation matches add excitement
    }
    
    // Adjust for match position (main events should be better)
    const positionBonus = match.position / 10;
    baseQuality += positionBonus;
    
    // Random factor (±0.5 stars)
    const randomFactor = (Math.random() - 0.5) * 1;
    
    // Final quality (clamped between 1-5)
    const finalQuality = Math.max(1, Math.min(5, baseQuality + randomFactor));
    
    return parseFloat(finalQuality.toFixed(1));
  } catch (err) {
    console.error('Error calculating match quality:', err);
    return 2.5; // Default on error
  }
};

// Helper function to calculate segment quality
const calculateSegmentQuality = async (segment) => {
  try {
    if (!segment.wrestlers || segment.wrestlers.length === 0) {
      return segment.plannedQuality || 3;
    }
    
    // Get the wrestlers involved
    const wrestlers = await Wrestler.find({
      _id: { $in: segment.wrestlers }
    });
    
    if (wrestlers.length === 0) {
      return segment.plannedQuality || 3;
    }
    
    // Calculate average charisma
    const avgCharisma = wrestlers.reduce((sum, w) => sum + w.attributes.charisma, 0) / wrestlers.length;
    
    // Base quality from planned quality
    let baseQuality = segment.plannedQuality || 3;
    
    // Adjust based on charisma
    const charismaAdjustment = (avgCharisma - 50) / 25; // ±2 stars based on charisma
    
    // Random factor (±0.5 stars)
    const randomFactor = (Math.random() - 0.5) * 1;
    
    // Final quality (clamped between 1-5)
    const finalQuality = Math.max(1, Math.min(5, baseQuality + charismaAdjustment + randomFactor));
    
    return parseFloat(finalQuality.toFixed(1));
  } catch (err) {
    console.error('Error calculating segment quality:', err);
    return segment.plannedQuality || 3;
  }
};

// Helper function to calculate show attendance
const calculateAttendance = async (show, venue) => {
  try {
    const company = await Company.findById(show.company);
    
    if (!company || !venue) {
      return Math.floor(venue.capacity * 0.5); // 50% attendance as default
    }
    
    // Base attendance is company popularity as percentage of venue capacity
    let baseAttendance = venue.capacity * (company.popularity / 100);
    
    // Adjust for show type
    switch (show.showType) {
      case 'Pay-Per-View':
        baseAttendance *= 1.2; // PPVs draw bigger crowds
        break;
      case 'Special Event':
        baseAttendance *= 1.1; // Special events draw slightly bigger crowds
        break;
      case 'House Show':
        baseAttendance *= 0.8; // House shows draw smaller crowds
        break;
    }
    
    // Adjust for venue prestige
    const prestigeFactor = venue.prestige / 50;
    baseAttendance *= prestigeFactor;
    
    // Factor in ticket price (higher prices reduce attendance)
    const priceFactor = 1 - ((show.ticketPrice - 20) / 100);
    baseAttendance *= Math.max(0.7, Math.min(1.3, priceFactor));
    
    // Random factor (±10%)
    const randomFactor = 0.9 + (Math.random() * 0.2);
    baseAttendance *= randomFactor;
    
    // Ensure a minimum attendance of 10% capacity
    baseAttendance = Math.max(venue.capacity * 0.1, baseAttendance);
    
    // Can't exceed venue capacity
    return Math.min(venue.capacity, Math.floor(baseAttendance));
  } catch (err) {
    console.error('Error calculating attendance:', err);
    return venue ? Math.floor(venue.capacity * 0.5) : 1000; // Fallback
  }
};

// Helper function to calculate show financial results
const calculateFinancials = async (show, venue, attendance) => {
  try {
    // Calculate revenue
    const ticketRevenue = attendance * show.ticketPrice;
    
    // Merchandise revenue (average $5-15 per attendee)
    const merchPerAttendee = 5 + (Math.random() * 10);
    const merchandiseRevenue = attendance * merchPerAttendee;
    
    // Costs
    const venueRentalCost = venue.rentalCost;
    
    // Production costs depend on show type
    let productionCost = 5000; // Base cost
    switch (show.showType) {
      case 'Pay-Per-View':
        productionCost = 50000;
        break;
      case 'Special Event':
        productionCost = 25000;
        break;
      case 'Weekly TV':
        productionCost = 15000;
        break;
      case 'House Show':
        productionCost = 5000;
        break;
    }
    
    // Talent costs (weekly salary for all wrestlers on the show)
    let talentCost = 0;
    
    // Get unique wrestlers from matches and segments
    const wrestlerIds = new Set();
    
    show.matches.forEach(match => {
      match.wrestlers.forEach(w => wrestlerIds.add(w.wrestler.toString()));
    });
    
    show.segments.forEach(segment => {
      if (segment.wrestlers) {
        segment.wrestlers.forEach(id => wrestlerIds.add(id.toString()));
      }
    });
    
    if (wrestlerIds.size > 0) {
      const wrestlers = await Wrestler.find({ _id: { $in: Array.from(wrestlerIds) } });
      talentCost = wrestlers.reduce((sum, wrestler) => sum + wrestler.salary, 0);
    }
    
    // Calculate profit
    const totalRevenue = ticketRevenue + merchandiseRevenue;
    const totalCosts = venueRentalCost + productionCost + talentCost;
    const profit = totalRevenue - totalCosts;
    
    return {
      attendance,
      ticketRevenue,
      merchandiseRevenue,
      venueRentalCost,
      productionCost,
      talentCost,
      profit
    };
  } catch (err) {
    console.error('Error calculating financials:', err);
    return {
      attendance: attendance || 0,
      ticketRevenue: 0,
      merchandiseRevenue: 0,
      venueRentalCost: venue ? venue.rentalCost : 0,
      productionCost: 0,
      talentCost: 0,
      profit: 0
    };
  }
};

// @route   POST /api/shows
// @desc    Create a new show
// @access  Private
router.post('/', isAuthenticated, isCompanyOwner, async (req, res) => {
  try {
    const {
      company,
      name,
      date,
      venue: venueId,
      isRecurring,
      showType,
      ticketPrice,
      status
    } = req.body;
    
    // Validate required fields
    if (!company || !name || !date || !venueId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if venue exists and is available
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    if (!venue.isAvailable) {
      return res.status(400).json({ message: 'Venue is not available for booking' });
    }
    
    // Create show
    const show = new Show({
      company,
      name,
      date: new Date(date),
      venue: venueId,
      isRecurring: isRecurring === 'true' || isRecurring === true,
      showType: showType || 'Weekly TV',
      ticketPrice: parseFloat(ticketPrice) || 20,
      status: status || 'Draft',
      matches: [],
      segments: []
    });
    
    await show.save();
    
    res.status(201).json(show);
  } catch (err) {
    console.error('Error creating show:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shows
// @desc    Get all shows
// @access  Public
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Filter by company
    if (req.query.company) {
      query.company = req.query.company;
    }
    
    // Filter by date range
    if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
      query.date = { ...query.date, $lte: new Date(req.query.endDate) };
    }
    
    // Filter by show type
    if (req.query.showType) {
      query.showType = req.query.showType;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Visibility filter (default to only visible shows)
    if (req.query.includeHidden !== 'true') {
      query.isVisible = true;
    }
    
    const shows = await Show.find(query)
      .populate('company', 'name logo')
      .populate('venue', 'name location capacity')
      .sort({ date: 1 });
    
    res.json(shows);
  } catch (err) {
    console.error('Error fetching shows:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shows/:id
// @desc    Get show by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'name logo popularity money')
      .populate('venue', 'name location capacity rentalCost prestige')
      .populate('matches.wrestlers.wrestler', 'name image popularity attributes style')
      .populate('segments.wrestlers', 'name image popularity attributes style');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    res.json(show);
  } catch (err) {
    console.error('Error fetching show:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shows/:id
// @desc    Update show
// @access  Private
router.put('/:id', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized to update this show
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this show' });
    }
    
    const {
      name,
      date,
      venue: venueId,
      isRecurring,
      showType,
      ticketPrice,
      status,
      isVisible
    } = req.body;
    
    // Update fields
    if (name) show.name = name;
    if (date) show.date = new Date(date);
    
    // If venue is changing, check if new venue is available
    if (venueId && venueId !== show.venue.toString()) {
      const venue = await Venue.findById(venueId);
      if (!venue) {
        return res.status(404).json({ message: 'Venue not found' });
      }
      
      if (!venue.isAvailable) {
        return res.status(400).json({ message: 'Venue is not available for booking' });
      }
      
      show.venue = venueId;
    }
    
    if (isRecurring !== undefined) {
      show.isRecurring = isRecurring === 'true' || isRecurring === true;
    }
    
    if (showType) show.showType = showType;
    if (ticketPrice) show.ticketPrice = parseFloat(ticketPrice);
    if (status) show.status = status;
    
    if (isVisible !== undefined) {
      show.isVisible = isVisible === 'true' || isVisible === true;
    }
    
    await show.save();
    
    res.json(show);
  } catch (err) {
    console.error('Error updating show:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/shows/:id
// @desc    Delete show
// @access  Private
router.delete('/:id', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized to delete this show
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this show' });
    }
    
    await show.remove();
    
    res.json({ message: 'Show deleted successfully' });
  } catch (err) {
    console.error('Error deleting show:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shows/:id/match
// @desc    Add a match to a show
// @access  Private
router.post('/:id/match', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this show' });
    }
    
    const {
      wrestlers,
      matchType,
      championship,
      isChampionshipMatch,
      stipulation,
      duration,
      description,
      bookedOutcome,
      plannedQuality,
      position
    } = req.body;
    
    // Validate required fields
    if (!wrestlers || !Array.isArray(wrestlers) || wrestlers.length === 0) {
      return res.status(400).json({ message: 'At least one wrestler is required' });
    }
    
    // Format wrestlers array with required structure
    const formattedWrestlers = wrestlers.map(wrestler => ({
      wrestler: wrestler.id,
      isWinner: wrestler.isWinner || false,
      team: wrestler.team || 1
    }));
    
    // Create match object
    const match = {
      wrestlers: formattedWrestlers,
      matchType: matchType || 'Singles',
      position: parseInt(position) || show.matches.length + 1
    };
    
    // Add optional fields
    if (championship) match.championship = championship;
    if (isChampionshipMatch !== undefined) {
      match.isChampionshipMatch = isChampionshipMatch === 'true' || isChampionshipMatch === true;
    }
    if (stipulation) match.stipulation = stipulation;
    if (duration) match.duration = parseInt(duration);
    if (description) match.description = description;
    if (bookedOutcome) match.bookedOutcome = bookedOutcome;
    if (plannedQuality) match.plannedQuality = parseFloat(plannedQuality);
    
    // Add match to show
    show.matches.push(match);
    
    // Sort matches by position
    show.matches.sort((a, b) => a.position - b.position);
    
    await show.save();
    
    res.status(201).json(match);
  } catch (err) {
    console.error('Error adding match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shows/:id/match/:matchId
// @desc    Update a match
// @access  Private
router.put('/:id/match/:matchId', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this show' });
    }
    
    // Find match in the show
    const matchIndex = show.matches.findIndex(m => m._id.toString() === req.params.matchId);
    
    if (matchIndex === -1) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    const {
      wrestlers,
      matchType,
      championship,
      isChampionshipMatch,
      stipulation,
      duration,
      description,
      bookedOutcome,
      plannedQuality,
      position
    } = req.body;
    
    // Update wrestlers if provided
    if (wrestlers && Array.isArray(wrestlers)) {
      // Format wrestlers array with required structure
      show.matches[matchIndex].wrestlers = wrestlers.map(wrestler => ({
        wrestler: wrestler.id,
        isWinner: wrestler.isWinner || false,
        team: wrestler.team || 1
      }));
    }
    
    // Update other fields if provided
    if (matchType) show.matches[matchIndex].matchType = matchType;
    if (championship) show.matches[matchIndex].championship = championship;
    if (isChampionshipMatch !== undefined) {
      show.matches[matchIndex].isChampionshipMatch = isChampionshipMatch === 'true' || isChampionshipMatch === true;
    }
    if (stipulation !== undefined) show.matches[matchIndex].stipulation = stipulation;
    if (duration) show.matches[matchIndex].duration = parseInt(duration);
    if (description !== undefined) show.matches[matchIndex].description = description;
    if (bookedOutcome) show.matches[matchIndex].bookedOutcome = bookedOutcome;
    if (plannedQuality) show.matches[matchIndex].plannedQuality = parseFloat(plannedQuality);
    if (position) show.matches[matchIndex].position = parseInt(position);
    
    // Sort matches by position after update
    show.matches.sort((a, b) => a.position - b.position);
    
    await show.save();
    
    res.json(show.matches[matchIndex]);
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/shows/:id/match/:matchId
// @desc    Delete a match
// @access  Private
router.delete('/:id/match/:matchId', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this show' });
    }
    
    // Find and remove match
    const matchIndex = show.matches.findIndex(m => m._id.toString() === req.params.matchId);
    
    if (matchIndex === -1) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    show.matches.splice(matchIndex, 1);
    
    // Update positions for remaining matches
    show.matches.forEach((match, index) => {
      match.position = index + 1;
    });
    
    await show.save();
    
    res.json({ message: 'Match deleted successfully' });
  } catch (err) {
    console.error('Error deleting match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/shows/:id/segment
// @desc    Add a segment to a show
// @access  Private
router.post('/:id/segment', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this show' });
    }
    
    const {
      segmentType,
      wrestlers,
      description,
      duration,
      plannedQuality,
      position
    } = req.body;
    
    // Validate required fields
    if (!segmentType || !description) {
      return res.status(400).json({ message: 'Segment type and description are required' });
    }
    
    // Create segment object
    const segment = {
      segmentType,
      description,
      position: parseInt(position) || show.segments.length + 1
    };
    
    // Add optional fields
    if (wrestlers && Array.isArray(wrestlers)) {
      segment.wrestlers = wrestlers;
    }
    if (duration) segment.duration = parseInt(duration);
    if (plannedQuality) segment.plannedQuality = parseFloat(plannedQuality);
    
    // Add segment to show
    show.segments.push(segment);
    
    // Sort segments by position
    show.segments.sort((a, b) => a.position - b.position);
    
    await show.save();
    
    res.status(201).json(segment);
  } catch (err) {
    console.error('Error adding segment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shows/:id/segment/:segmentId
// @desc    Update a segment
// @access  Private
router.put('/:id/segment/:segmentId', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this show' });
    }
    
    // Find segment in the show
    const segmentIndex = show.segments.findIndex(s => s._id.toString() === req.params.segmentId);
    
    if (segmentIndex === -1) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    const {
      segmentType,
      wrestlers,
      description,
      duration,
      plannedQuality,
      position
    } = req.body;
    
    // Update fields if provided
    if (segmentType) show.segments[segmentIndex].segmentType = segmentType;
    if (wrestlers) show.segments[segmentIndex].wrestlers = wrestlers;
    if (description) show.segments[segmentIndex].description = description;
    if (duration) show.segments[segmentIndex].duration = parseInt(duration);
    if (plannedQuality) show.segments[segmentIndex].plannedQuality = parseFloat(plannedQuality);
    if (position) show.segments[segmentIndex].position = parseInt(position);
    
    // Sort segments by position after update
    show.segments.sort((a, b) => a.position - b.position);
    
    await show.save();
    
    res.json(show.segments[segmentIndex]);
  } catch (err) {
    console.error('Error updating segment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/shows/:id/segment/:segmentId
// @desc    Delete a segment
// @access  Private
router.delete('/:id/segment/:segmentId', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this show' });
    }
    
    // Find and remove segment
    const segmentIndex = show.segments.findIndex(s => s._id.toString() === req.params.segmentId);
    
    if (segmentIndex === -1) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    show.segments.splice(segmentIndex, 1);
    
    // Update positions for remaining segments
    show.segments.forEach((segment, index) => {
      segment.position = index + 1;
    });
    
    await show.save();
    
    res.json({ message: 'Segment deleted successfully' });
  } catch (err) {
    console.error('Error deleting segment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shows/:id/start
// @desc    Start a show (calculate attendance, etc.)
// @access  Private
router.put('/:id/start', isAuthenticated, isShowEditable, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner name popularity money')
      .populate('venue');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to start this show' });
    }
    
    // Only Draft and Scheduled shows can be started
    if (!['Draft', 'Scheduled'].includes(show.status)) {
      return res.status(400).json({ message: `Cannot start a show with status: ${show.status}` });
    }
    
    // Calculate attendance
    const attendance = await calculateAttendance(show, show.venue);
    
    // Update show status and attendance
    show.status = 'In Progress';
    show.attendance = attendance;
    
    await show.save();
    
    res.json(show);
  } catch (err) {
    console.error('Error starting show:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shows/:id/complete
// @desc    Complete a show (calculate ratings, financials, etc.)
// @access  Private
router.put('/:id/complete', isAuthenticated, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('company', 'owner name popularity money')
      .populate('venue');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is authorized
    if (show.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this show' });
    }
    
    // Only In Progress shows can be completed
    if (show.status !== 'In Progress') {
      return res.status(400).json({ message: `Cannot complete a show with status: ${show.status}` });
    }
    
    // Calculate match and segment qualities
    for (let i = 0; i < show.matches.length; i++) {
      show.matches[i].actualQuality = await calculateMatchQuality(show.matches[i]);
      
      // Calculate popularity impact
      const qualityImpact = (show.matches[i].actualQuality - 3) * 2;
      show.matches[i].popularityImpact = qualityImpact;
    }
    
    for (let i = 0; i < show.segments.length; i++) {
      show.segments[i].actualQuality = await calculateSegmentQuality(show.segments[i]);
      
      // Calculate popularity impact
      const qualityImpact = (show.segments[i].actualQuality - 3) * 1.5;
      show.segments[i].popularityImpact = qualityImpact;
    }
    
    // Calculate overall show rating (weighted by match position)
    let totalQuality = 0;
    let totalWeight = 0;
    
    // Matches count more than segments
    for (const match of show.matches) {
      const weight = match.position; // Higher positions (main events) count more
      totalQuality += match.actualQuality * weight;
      totalWeight += weight;
    }
    
    for (const segment of show.segments) {
      const weight = segment.position * 0.5; // Segments count less than matches
      totalQuality += segment.actualQuality * weight;
      totalWeight += weight;
    }
    
    show.overallRating = totalWeight > 0 ? parseFloat((totalQuality / totalWeight).toFixed(1)) : 3;
    
    // Calculate critic rating (slightly different from overall rating)
    const randomCriticFactor = (Math.random() - 0.5) * 0.6;
    show.criticRating = Math.max(1, Math.min(5, show.overallRating + randomCriticFactor));
    
    // Calculate audience satisfaction (1-100 scale)
    show.audienceSatisfaction = Math.round(show.overallRating * 20);
    
    // Calculate financial results
    const financials = await calculateFinancials(show, show.venue, show.attendance);
    
    show.ticketRevenue = financials.ticketRevenue;
    show.merchandiseRevenue = financials.merchandiseRevenue;
    show.venueRentalCost = financials.venueRentalCost;
    show.productionCost = financials.productionCost;
    show.talentCost = financials.talentCost;
    show.profit = financials.profit;
    
    // Update company finances
    const company = await Company.findById(show.company._id);
    company.money += show.profit;
    
    // Update company popularity based on show quality
    const popChange = Math.round((show.overallRating - 3) * 2);
    company.popularity = Math.max(1, Math.min(100, company.popularity + popChange));
    
    // Update show status
    show.status = 'Completed';
    
    // Save changes
    await Promise.all([show.save(), company.save()]);
    
    res.json(show);
  } catch (err) {
    console.error('Error completing show:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shows/company/:companyId
// @desc    Get shows for a company
// @access  Public
router.get('/company/:companyId', async (req, res) => {
  try {
    let query = { company: req.params.companyId };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by show type
    if (req.query.showType) {
      query.showType = req.query.showType;
    }
    
    // Filter by date range
    if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
      query.date = { ...query.date, $lte: new Date(req.query.endDate) };
    }
    
    // Filter by recurring
    if (req.query.isRecurring) {
      query.isRecurring = req.query.isRecurring === 'true';
    }
    
    // Visibility filter (default to only visible shows)
    if (req.query.includeHidden !== 'true') {
      query.isVisible = true;
    }
    
    const shows = await Show.find(query)
      .populate('venue', 'name location')
      .sort({ date: req.query.sort === 'desc' ? -1 : 1 });
    
    res.json(shows);
  } catch (err) {
    console.error('Error fetching company shows:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
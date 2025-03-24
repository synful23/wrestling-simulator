// Authentication middleware

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized - please log in' });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden - admin access required' });
};

// Middleware to check if user can manage a wrestler
// Only company owners can manage their wrestlers, and admins can manage any wrestler
const canManageWrestler = async (req, res, next) => {
  try {
    // First check if the user is an admin - admins can manage any wrestler
    if (req.user.isAdmin) {
      return next();
    }
    
    // Get wrestler
    const Wrestler = require('../models/Wrestler');
    const wrestler = await Wrestler.findById(req.params.id)
      .populate('contract.company', 'owner');
    
    if (!wrestler) {
      return res.status(404).json({ message: 'Wrestler not found' });
    }
    
    // If wrestler has no contract or company, only admins can manage them (already checked above)
    if (!wrestler.contract || !wrestler.contract.company) {
      return res.status(403).json({ 
        message: 'Only administrators can manage free agents' 
      });
    }
    
    // Check if user is the company owner
    if (wrestler.contract.company.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized to manage this wrestler' 
      });
    }
    
    next();
  } catch (err) {
    console.error('Error in canManageWrestler middleware:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  canManageWrestler
};
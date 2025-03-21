// middleware/auth.js
// Authentication and authorization middleware

// Check if user is authenticated middleware
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  };
  
  // Check if user is an admin
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    return next();
  };
  
  // Check if user owns wrestler or is admin
  const canManageWrestler = async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // If admin, allow access
    if (req.user.isAdmin) {
      return next();
    }
    
    // Get wrestler ID from params or body
    const wrestlerId = req.params.id || req.body.wrestlerId;
    
    // Check if user has purchased this wrestler
    const userHasWrestler = req.user.purchasedWrestlers && 
                           req.user.purchasedWrestlers.some(id => id.toString() === wrestlerId);
    
    if (!userHasWrestler) {
      return res.status(403).json({ message: 'You do not have permission to manage this wrestler' });
    }
    
    return next();
  };
  
  module.exports = {
    isAuthenticated,
    isAdmin,
    canManageWrestler
  };
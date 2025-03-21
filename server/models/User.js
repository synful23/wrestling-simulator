// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    discordId: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    avatar: {
      type: String
    },
    email: {
      type: String
    },
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
      }
    ],
    lastLogin: {
      type: Date,
      default: Date.now
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    purchasedWrestlers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wrestler'
      }
    ],
    money: {
      type: Number,
      default: 500000 // Starting money - $500,000
    },
    achievements: [{
      type: {
        type: String,
        enum: ['company_created', 'wrestler_signed', 'show_completed', 'championship_created']
      },
      date: {
        type: Date,
        default: Date.now
      },
      description: String,
      reward: Number
    }],
    lastPayout: {
      type: Date,
      default: Date.now
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Add a method to check if user can create a company
UserSchema.methods.canCreateCompany = function(cost = 200000) {
  return this.money >= cost;
};

// Add a method to add achievements and reward money
UserSchema.methods.addAchievement = async function(type, description, reward) {
  this.achievements.push({
    type,
    description,
    reward
  });
  
  // Add the reward money
  this.money += reward;
  
  // Add experience
  this.experience += reward / 1000; // 1 XP per $1000 reward
  
  // Check for level up
  this.checkLevelUp();
  
  await this.save();
  return this;
};

// Add a method to check for level up
UserSchema.methods.checkLevelUp = function() {
  // Require more XP for each level
  const xpRequired = this.level * 100;
  
  if (this.experience >= xpRequired) {
    this.level += 1;
    this.experience -= xpRequired;
    
    // Bonus money for level up
    this.money += this.level * 10000;
    
    // Recursive check in case multiple level ups
    this.checkLevelUp();
  }
};

// Method to pay daily/weekly stipend
UserSchema.methods.processTimedPayout = async function() {
  const now = new Date();
  const lastPayout = new Date(this.lastPayout);
  
  // Check if it's been at least 24 hours since last payout
  const hoursSinceLastPayout = (now - lastPayout) / (1000 * 60 * 60);
  
  if (hoursSinceLastPayout >= 24) {
    // Calculate days since last payout (capped at 7 days to prevent huge payouts after absence)
    const daysSinceLastPayout = Math.min(Math.floor(hoursSinceLastPayout / 24), 7);
    
    // Base amount per day
    const dailyAmount = 10000;
    
    // Bonus based on level
    const levelBonus = this.level * 1000;
    
    // Total payout
    const totalPayout = (dailyAmount + levelBonus) * daysSinceLastPayout;
    
    this.money += totalPayout;
    this.lastPayout = now;
    
    await this.save();
    
    return {
      payout: totalPayout,
      days: daysSinceLastPayout
    };
  }
  
  return null; // No payout processed
};


module.exports = mongoose.model('User', UserSchema);
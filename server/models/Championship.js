// models/Championship.js
const mongoose = require('mongoose');

const TitleReignSchema = new mongoose.Schema({
  holder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wrestler',
    required: true
  },
  wonFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wrestler'
  },
  wonAt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  defenseCount: {
    type: Number,
    default: 0
  },
  defenses: [{
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wrestler'
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show'
    },
    date: {
      type: Date
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    }
  }]
});

const ChampionshipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String
    },
    prestige: {
      type: Number,
      min: 1,
      max: 100,
      default: 50
    },
    weight: {
      type: String,
      enum: ['Heavyweight', 'Middleweight', 'Cruiserweight', 'Tag Team', 'Women\'s', 'Other'],
      default: 'Heavyweight'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    currentHolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wrestler'
    },
    titleHistory: [TitleReignSchema],
    defendedAt: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show'
    }],
    lastDefended: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Method to add a new champion
ChampionshipSchema.methods.setChampion = async function(wrestlerId, wonFromId, showId) {
  // End previous reign if exists
  if (this.currentHolder) {
    const currentReign = this.titleHistory.find(
      reign => reign.holder.toString() === this.currentHolder.toString() && !reign.endDate
    );
    
    if (currentReign) {
      currentReign.endDate = new Date();
    }
  }
  
  // Add new reign
  const newReign = {
    holder: wrestlerId,
    wonFrom: wonFromId || null,
    wonAt: showId || null,
    startDate: new Date(),
    defenseCount: 0,
    defenses: []
  };
  
  this.titleHistory.push(newReign);
  this.currentHolder = wrestlerId;
  
  await this.save();
  return this;
};

// Method to add a successful title defense
ChampionshipSchema.methods.addDefense = async function(againstId, showId, quality) {
  // Find the current reign
  const currentReign = this.titleHistory.find(
    reign => reign.holder.toString() === this.currentHolder.toString() && !reign.endDate
  );
  
  if (currentReign) {
    currentReign.defenseCount += 1;
    currentReign.defenses.push({
      against: againstId,
      show: showId,
      date: new Date(),
      quality: quality || 3
    });
    
    // Update championship last defended date
    this.lastDefended = new Date();
    
    // Add the show to defended at list
    if (showId && !this.defendedAt.includes(showId)) {
      this.defendedAt.push(showId);
    }
    
    // Increase prestige based on match quality
    if (quality) {
      const prestigeBonus = (quality - 3) * 2; // Quality above 3 increases prestige
      this.prestige = Math.min(100, this.prestige + prestigeBonus);
    }
    
    await this.save();
  }
  
  return this;
};

// Virtual for reign length of current champion
ChampionshipSchema.virtual('currentReignDays').get(function() {
  if (!this.currentHolder) return 0;
  
  const currentReign = this.titleHistory.find(
    reign => reign.holder.toString() === this.currentHolder.toString() && !reign.endDate
  );
  
  if (!currentReign) return 0;
  
  const startDate = new Date(currentReign.startDate);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total days as champion for a wrestler
ChampionshipSchema.methods.totalDaysAsChampion = function(wrestlerId) {
  if (!wrestlerId) return 0;
  
  let totalDays = 0;
  
  this.titleHistory.forEach(reign => {
    if (reign.holder.toString() === wrestlerId.toString()) {
      const startDate = new Date(reign.startDate);
      const endDate = reign.endDate ? new Date(reign.endDate) : new Date();
      const diffTime = Math.abs(endDate - startDate);
      totalDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  });
  
  return totalDays;
};

module.exports = mongoose.model('Championship', ChampionshipSchema);
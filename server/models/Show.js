// models/Show.js
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  wrestlers: [{
    wrestler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wrestler',
      required: true
    },
    isWinner: {
      type: Boolean,
      default: false
    },
    team: {
      type: Number, // 1 or 2 for team matches
      default: 1
    }
  }],
  matchType: {
    type: String,
    enum: ['Singles', 'Tag Team', 'Triple Threat', 'Fatal 4-Way', 'Battle Royal', 'Other'],
    required: true,
    default: 'Singles'
  },
  championship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Championship'
  },
  isChampionshipMatch: {
    type: Boolean,
    default: false
  },
  titleChanged: {
    type: Boolean,
    default: false
  },
  stipulation: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    min: 1,
    default: 15
  },
  description: {
    type: String,
    trim: true
  },
  bookedOutcome: {
    type: String,
    enum: ['Clean', 'Dirty', 'DQ', 'Count-Out', 'No Contest', 'Time Limit Draw', 'Double DQ'],
    default: 'Clean'
  },
  plannedQuality: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  actualQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  popularityImpact: {
    type: Number,
    default: 0
  },
  position: {
    type: Number, // Card position (1 = opener, higher number = main event)
    required: true
  }
});

const SegmentSchema = new mongoose.Schema({
  segmentType: {
    type: String,
    enum: ['Promo', 'Interview', 'Angle', 'Video Package', 'Special Appearance', 'Other'],
    required: true
  },
  wrestlers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wrestler'
  }],
  description: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    min: 1,
    default: 5
  },
  plannedQuality: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  actualQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  popularityImpact: {
    type: Number,
    default: 0
  },
  position: {
    type: Number,
    required: true
  }
});

const ShowSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    showType: {
      type: String,
      enum: ['Weekly TV', 'Special Event', 'Pay-Per-View', 'House Show', 'Other'],
      default: 'Weekly TV'
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Draft'
    },
    ticketPrice: {
      type: Number,
      min: 0,
      default: 20
    },
    matches: [MatchSchema],
    segments: [SegmentSchema],
    // Financial results
    attendance: {
      type: Number,
      default: 0
    },
    ticketRevenue: {
      type: Number,
      default: 0
    },
    merchandiseRevenue: {
      type: Number,
      default: 0
    },
    venueRentalCost: {
      type: Number,
      default: 0
    },
    productionCost: {
      type: Number,
      default: 0
    },
    talentCost: {
      type: Number,
      default: 0
    },
    otherCosts: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    // Show quality and ratings
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    audienceSatisfaction: {
      type: Number,
      min: 1,
      max: 100
    },
    criticRating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: {
      type: String,
      trim: true
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Show', ShowSchema);
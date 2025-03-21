// models/Wrestler.js
const mongoose = require('mongoose');

const WrestlerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true
    },
    style: {
      type: String,
      enum: ['Technical', 'High-Flyer', 'Powerhouse', 'Brawler', 'Showman', 'All-Rounder'],
      required: true
    },
    attributes: {
      strength: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
      },
      agility: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
      },
      charisma: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
      },
      technical: {
        type: Number,
        min: 1,
        max: 100,
        default: 50
      }
    },
    popularity: {
      type: Number,
      min: 1,
      max: 100,
      default: 50
    },
    salary: {
      type: Number,
      default: 50000
    },
    contract: {
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
      },
      startDate: {
        type: Date,
        default: Date.now
      },
      length: {
        type: Number,
        default: 12 // months
      },
      exclusive: {
        type: Boolean,
        default: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isInjured: {
      type: Boolean,
      default: false
    },
    hometown: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 18,
      max: 65
    },
    experience: {
      type: Number,
      default: 0 // years
    },
    bio: {
      type: String,
      maxlength: 500
    },
    signatureMoves: [String],
    finisher: String
  },
  {
    timestamps: true
  }
);

WrestlerSchema.index({ 'contract.company': 1 });

// Virtual for overall rating
WrestlerSchema.virtual('overallRating').get(function() {
  const { strength, agility, charisma, technical } = this.attributes;
  return Math.round((strength + agility + charisma + technical) / 4);
});

module.exports = mongoose.model('Wrestler', WrestlerSchema);
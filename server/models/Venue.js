// models/Venue.js
const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 50
    },
    rentalCost: {
      type: Number,
      required: true,
      min: 0
    },
    prestige: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 50
    },
    image: {
      type: String
    },
    description: {
      type: String,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    // Optional fields for company-owned venues
    maintenanceCost: {
      type: Number,
      default: 0
    },
    profitShare: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Venue', VenueSchema);
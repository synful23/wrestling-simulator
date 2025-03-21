// models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String
    },
    location: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    popularity: {
      type: Number,
      default: 0
    },
    money: {
      type: Number,
      default: 100000
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', CompanySchema);
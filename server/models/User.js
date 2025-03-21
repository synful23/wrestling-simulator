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
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
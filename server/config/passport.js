// config/passport.js
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');
const mongoose = require('mongoose');
const { isServerMember, notifyNewAccount } = require('../utils/discordWebhook');

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Only set up Discord strategy if credentials are provided
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          callbackURL: process.env.DISCORD_CALLBACK_URL,
          scope: ['identify', 'email', 'guilds.members.read'] // Added guilds scope to check server membership
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // First, check if user is a member of our Discord server
            const isMember = await isServerMember(profile.id, accessToken);
            
            if (!isMember) {
              // User is not a member of our server, deny access
              return done(null, false, { 
                message: 'You must be a member of our Discord server to access this site.' 
              });
            }
            
            // Check if user exists
            let user = await User.findOne({ discordId: profile.id });

            if (user) {
              // Update user information
              user.username = profile.username;
              user.avatar = profile.avatar 
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` 
                : null;
              user.email = profile.email;
              user.lastLogin = Date.now();
              await user.save();
            } else {
              // Create new user
              user = await User.create({
                discordId: profile.id,
                username: profile.username,
                avatar: profile.avatar 
                  ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` 
                  : null,
                email: profile.email
              });
              
              // Notify about new account
              await notifyNewAccount(user);
            }

            done(null, user);
          } catch (err) {
            console.error('Error in Discord auth strategy:', err);
            done(err, null);
          }
        }
      )
    );
    console.log('Discord authentication strategy configured');
  } else {
    console.log('Discord credentials not found. Using development authentication.');
    
    // Create a development user in the database
    (async () => {
      try {
        // Check if development user already exists
        let devUser = await User.findOne({ discordId: 'dev123456789' });
        
        if (!devUser) {
          console.log('Creating development user...');
          // Create development user if it doesn't exist
          devUser = await User.create({
            discordId: 'dev123456789',
            username: 'DevelopmentUser',
            avatar: null,
            email: 'dev@example.com'
          });
          console.log('Development user created with ID:', devUser.id);
        } else {
          console.log('Development user already exists with ID:', devUser.id);
        }
      } catch (err) {
        console.error('Error creating development user:', err);
      }
    })();
    
    // Add a dummy strategy for development
    passport.use('discord', {
      name: 'discord',
      authenticate: function(req, options) {
        User.findOne({ discordId: 'dev123456789' })
          .then(user => {
            if (user) {
              this.success(user);
            } else {
              this.fail('Development user not found in database');
            }
          })
          .catch(err => {
            console.error('Error in development auth:', err);
            this.error(err);
          });
      }
    });
  }
};
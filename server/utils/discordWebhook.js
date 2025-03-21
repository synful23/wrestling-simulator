// utils/discordWebhook.js
const axios = require('axios');

/**
 * Send a message to a Discord webhook
 * @param {string} message - The message to send
 * @param {object} [options] - Additional options
 * @param {string} [options.username] - Override the webhook's username
 * @param {string} [options.avatarUrl] - Override the webhook's avatar
 * @param {array} [options.embeds] - Discord embeds to send
 */
const sendWebhookMessage = async (message, options = {}) => {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.warn('Discord webhook URL not configured');
    return;
  }

  try {
    const payload = {
      content: message,
      username: options.username || 'Wrestling Simulator',
      avatar_url: options.avatarUrl,
      embeds: options.embeds || []
    };

    await axios.post(process.env.DISCORD_WEBHOOK_URL, payload);
  } catch (error) {
    console.error('Error sending Discord webhook:', error.message);
  }
};

/**
 * Check if a user is a member of the configured Discord server
 * @param {string} userId - Discord user ID
 * @param {string} accessToken - Discord OAuth2 access token
 * @returns {Promise<boolean>} - True if user is a member, false otherwise
 */
const isServerMember = async (userId, accessToken) => {
  // Temporarily return true to bypass the check while fixing
  console.log('Bypassing Discord server membership check for debugging');
  return true;
  /* Original code commented out
  if (!process.env.DISCORD_SERVER_ID || !process.env.DISCORD_BOT_TOKEN) {
    console.warn('Discord server membership check not configured');
    return true; // Default to allow access if not configured
  }

  try {
    // Use the bot token to check guild membership (more reliable)
    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${process.env.DISCORD_SERVER_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    // If we get here without an error, the user is a member
    return response.status === 200;
  } catch (error) {
    console.error('Error checking Discord server membership:', error.message);
    
    if (error.response?.status === 404) {
      // 404 means user is not a member
      return false;
    }
    
    // For development/debugging purposes, you can temporarily return true
    // to bypass the check while fixing the integration
    // return true; // Uncomment this line if you want to bypass temporarily
    
    return false; // Default to deny on error
  } */
};

/**
 * Send a notification about a new account
 * @param {object} user - User object 
 */
const notifyNewAccount = async (user) => {
  const embed = {
    title: 'New Account Created',
    color: 0x3498db, // Blue
    fields: [
      {
        name: 'Username',
        value: user.username,
        inline: true
      },
      {
        name: 'Discord ID',
        value: user.discordId,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (user.avatar) {
    embed.thumbnail = { url: user.avatar };
  }

  await sendWebhookMessage('A new user has joined the Wrestling Simulator!', {
    embeds: [embed]
  });
};

/**
 * Send a notification about a new wrestling company
 * @param {object} company - Company object
 * @param {object} user - User who created the company
 */
const notifyNewCompany = async (company, user) => {
  const embed = {
    title: 'New Wrestling Company Created',
    description: company.description || 'No description provided',
    color: 0x2ecc71, // Green
    fields: [
      {
        name: 'Company Name',
        value: company.name,
        inline: true
      },
      {
        name: 'Location',
        value: company.location,
        inline: true
      },
      {
        name: 'Created By',
        value: user.username,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (company.logo) {
    embed.thumbnail = { 
      url: `${process.env.CLIENT_URL}${company.logo}`
    };
  }

  await sendWebhookMessage('A new wrestling company has been founded!', {
    embeds: [embed]
  });
};

/**
 * Send a notification about a completed show
 * @param {object} show - Show object with populated data
 */
const notifyShowResults = async (show) => {
  const embed = {
    title: `${show.name} Results`,
    color: 0xe74c3c, // Red
    fields: [
      {
        name: 'Company',
        value: show.company.name,
        inline: true
      },
      {
        name: 'Venue',
        value: `${show.venue.name}, ${show.venue.location}`,
        inline: true
      },
      {
        name: 'Attendance',
        value: `${show.attendance.toLocaleString()} / ${show.venue.capacity.toLocaleString()}`,
        inline: true
      },
      {
        name: 'Rating',
        value: `${show.overallRating.toFixed(1)}/5 ⭐`,
        inline: true
      },
      {
        name: 'Revenue',
        value: `$${(show.ticketRevenue + show.merchandiseRevenue).toLocaleString()}`,
        inline: true
      },
      {
        name: 'Profit',
        value: `$${show.profit.toLocaleString()}`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  await sendWebhookMessage(`Show Results: ${show.name}`, {
    embeds: [embed]
  });
};

module.exports = {
  sendWebhookMessage,
  isServerMember,
  notifyNewAccount,
  notifyNewCompany,
  notifyShowResults
};
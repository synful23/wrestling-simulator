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
    return false;
  }

  try {
    const payload = {
      content: message,
      username: options.username || 'Wrestling Simulator',
      avatar_url: options.avatarUrl,
      embeds: options.embeds || []
    };

    await axios.post(process.env.DISCORD_WEBHOOK_URL, payload);
    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error.message);
    return false;
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
    title: 'New Promoter Joined!',
    color: 0x3498db, // Blue
    fields: [
      {
        name: 'Promoter',
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

  await sendWebhookMessage(`${user.username} has joined the Wrestling Simulator!`, {
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
    title: 'New Wrestling Promotion Established!',
    description: company.description || 'A new challenger enters the wrestling world!',
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
        name: 'Founded By',
        value: user.username,
        inline: true
      },
      {
        name: 'Starting Capital',
        value: `$${company.money.toLocaleString()}`,
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

  await sendWebhookMessage(`${user.username} has founded a new wrestling promotion: **${company.name}**!`, {
    embeds: [embed]
  });
};

/**
 * Send a notification about a wrestler being signed
 * @param {object} wrestler - Wrestler object
 * @param {object} company - Company that signed the wrestler
 * @param {object} user - User who signed the wrestler
 */
const notifyWrestlerSigned = async (wrestler, company, user) => {
  const contractType = wrestler.contract.exclusive ? 'exclusive' : 'non-exclusive';
  const contractLength = wrestler.contract.length || 12;
  
  const embed = {
    title: `${wrestler.name} Signs With ${company.name}!`,
    color: 0x9b59b6, // Purple
    fields: [
      {
        name: 'Wrestler',
        value: wrestler.name,
        inline: true
      },
      {
        name: 'Style',
        value: wrestler.style,
        inline: true
      },
      {
        name: 'Promotion',
        value: company.name,
        inline: true
      },
      {
        name: 'Contract',
        value: `${contractLength}-month ${contractType}`,
        inline: true
      },
      {
        name: 'Salary',
        value: `$${wrestler.salary.toLocaleString()}/week`,
        inline: true
      },
      {
        name: 'Signed By',
        value: user.username,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (wrestler.image) {
    embed.thumbnail = { 
      url: `${process.env.CLIENT_URL}${wrestler.image}`
    };
  }

  await sendWebhookMessage(
    `💰 **BREAKING NEWS:** ${company.name} has signed ${wrestler.name} to a ${contractLength}-month ${contractType} contract!`, 
    { embeds: [embed] }
  );
};

/**
 * Send a notification about a completed show with results
 * @param {object} show - Show object with populated data
 * @param {object} user - User who ran the show
 */
const notifyShowResults = async (show, user) => {
  // Get main event match (highest position)
  const mainEvent = show.matches.reduce((highest, match) => 
    match.position > highest.position ? match : highest, 
    { position: 0 }
  );
  
  // Format main event text
  let mainEventText = 'No matches';
  if (mainEvent.wrestlers && mainEvent.wrestlers.length > 0) {
    const participants = mainEvent.wrestlers.map(w => w.wrestler.name).join(' vs. ');
    const winner = mainEvent.wrestlers.find(w => w.isWinner)?.wrestler.name || 'No Winner';
    mainEventText = `${participants} → Winner: ${winner}`;
  }
  
  // Determine show success based on rating
  let successText = '⭐⭐⭐ Average';
  let successColor = 0xf1c40f; // Yellow
  
  if (show.overallRating >= 4.5) {
    successText = '⭐⭐⭐⭐⭐ Spectacular!';
    successColor = 0xe74c3c; // Red (hot)
  } else if (show.overallRating >= 4) {
    successText = '⭐⭐⭐⭐ Great Show!';
    successColor = 0xe67e22; // Orange
  } else if (show.overallRating >= 3.5) {
    successText = '⭐⭐⭐½ Good Show';
    successColor = 0x3498db; // Blue
  } else if (show.overallRating < 2.5) {
    successText = '⭐⭐ Poor Show';
    successColor = 0x95a5a6; // Gray
  }
  
  // Calculate attendance percentage
  const attendancePercentage = ((show.attendance / show.venue.capacity) * 100).toFixed(1);
  
  const embed = {
    title: `${show.name} Results`,
    description: `Presented by ${show.company.name} at ${show.venue.name}`,
    color: successColor,
    fields: [
      {
        name: 'Main Event',
        value: mainEventText,
        inline: false
      },
      {
        name: 'Rating',
        value: `${show.overallRating.toFixed(1)}/5 ${successText}`,
        inline: true
      },
      {
        name: 'Attendance',
        value: `${show.attendance.toLocaleString()} (${attendancePercentage}%)`,
        inline: true
      },
      {
        name: 'Revenue',
        value: `$${(show.ticketRevenue + show.merchandiseRevenue).toLocaleString()}`,
        inline: true
      },
      {
        name: 'Expenses',
        value: `$${(show.venueRentalCost + show.productionCost + show.talentCost).toLocaleString()}`,
        inline: true
      },
      {
        name: 'Profit',
        value: `$${show.profit.toLocaleString()}`,
        inline: true
      },
      {
        name: 'Promoter',
        value: user.username,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (show.company.logo) {
    embed.thumbnail = { 
      url: `${process.env.CLIENT_URL}${show.company.logo}`
    };
  }

  await sendWebhookMessage(`📺 **SHOW RESULTS:** ${show.company.name} presents ${show.name} - ${successText}`, {
    embeds: [embed]
  });
};

/**
 * Send a notification about upcoming shows
 * @param {Array} shows - Array of upcoming show objects
 */
const notifyUpcomingShows = async (shows) => {
  if (!shows || shows.length === 0) return false;
  
  // Sort shows by date
  shows.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Create fields for each show (up to 10)
  const fields = shows.slice(0, 10).map(show => {
    const showDate = new Date(show.date);
    return {
      name: `${show.name} by ${show.company.name}`,
      value: `📆 ${showDate.toLocaleDateString()} at ${show.venue.name}\n🏟️ Tickets: $${show.ticketPrice}`,
      inline: true
    };
  });
  
  const embed = {
    title: '📣 Upcoming Wrestling Shows',
    description: 'Check out these upcoming wrestling events!',
    color: 0x1abc9c, // Teal
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Wrestling Simulator - Upcoming Shows'
    }
  };

  await sendWebhookMessage('📆 **UPCOMING SHOWS:** Check out these upcoming wrestling events!', {
    embeds: [embed]
  });
  
  return true;
};

/**
 * Send a notification about a championship creation or title change
 * @param {object} championship - Championship object
 * @param {object} holder - Wrestler who holds the title
 * @param {object} company - Company that owns the championship
 * @param {boolean} isNewTitle - Whether this is a new title or title change
 */
const notifyChampionshipUpdate = async (championship, holder, company, isNewTitle = false) => {
  const embed = {
    title: isNewTitle 
      ? `New Championship Created: ${championship.name}`
      : `New Champion: ${holder.name}`,
    color: 0xf1c40f, // Gold
    fields: [
      {
        name: 'Championship',
        value: championship.name,
        inline: true
      },
      {
        name: 'Champion',
        value: holder.name,
        inline: true
      },
      {
        name: 'Promotion',
        value: company.name,
        inline: true
      },
      {
        name: 'Prestige',
        value: `${championship.prestige}/100`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (championship.image) {
    embed.thumbnail = { 
      url: `${process.env.CLIENT_URL}${championship.image}`
    };
  } else if (holder.image) {
    embed.thumbnail = { 
      url: `${process.env.CLIENT_URL}${holder.image}`
    };
  }

  const message = isNewTitle
    ? `🏆 **NEW CHAMPIONSHIP:** ${company.name} has created the ${championship.name}!`
    : `🏆 **NEW CHAMPION:** ${holder.name} is the new ${championship.name} champion!`;

  await sendWebhookMessage(message, {
    embeds: [embed]
  });
};

/**
 * Send a notification about a major achievement or milestone
 * @param {object} user - User who achieved the milestone
 * @param {string} title - Title of the achievement
 * @param {string} description - Description of the achievement
 * @param {number} level - Level or tier of the achievement
 */
const notifyMilestone = async (user, title, description, level = 1) => {
  // Colors get more impressive with higher levels
  const colors = [0x3498db, 0x2ecc71, 0xf1c40f, 0xe74c3c, 0x9b59b6];
  const color = colors[Math.min(level - 1, colors.length - 1)];
  
  // Emoji prefix based on level
  const emojis = ['🎯', '🏅', '🏆', '👑', '🌟'];
  const emoji = emojis[Math.min(level - 1, emojis.length - 1)];
  
  const embed = {
    title: `${emoji} ${title}`,
    description,
    color,
    fields: [
      {
        name: 'Achieved By',
        value: user.username,
        inline: true
      },
      {
        name: 'Achievement Level',
        value: `Level ${level}`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (user.avatar) {
    embed.thumbnail = { url: user.avatar };
  }

  await sendWebhookMessage(`${emoji} **ACHIEVEMENT UNLOCKED:** ${user.username} has ${title}!`, {
    embeds: [embed]
  });
};

// Export all the notification functions
module.exports = {
  sendWebhookMessage,
  isServerMember,
  notifyNewAccount,
  notifyNewCompany,
  notifyWrestlerSigned,
  notifyShowResults,
  notifyUpcomingShows,
  notifyChampionshipUpdate,
  notifyMilestone
};
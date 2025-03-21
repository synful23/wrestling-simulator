// utils/discordUtils.js
const axios = require('axios');

/**
 * Check if a user is a member of a specified Discord server
 * @param {string} accessToken - Discord OAuth access token
 * @param {string} serverId - Discord server ID to check membership for
 * @returns {Promise<boolean>} - True if user is a member, false otherwise
 */
const isServerMember = async (accessToken, serverId) => {
  try {
    // Get user's guilds using Discord API
    const response = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Check if the specified server ID is in the user's guild list
    return response.data.some(guild => guild.id === serverId);
  } catch (error) {
    console.error('Error checking server membership:', error);
    return false;
  }
};

/**
 * Get Discord user's data from access token
 * @param {string} accessToken - Discord OAuth access token
 * @returns {Promise<Object|null>} - User data or null if error
 */
const getUserData = async (accessToken) => {
  try {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Discord user data:', error);
    return null;
  }
};

/**
 * Get a list of members in a Discord server (requires bot token)
 * @param {string} botToken - Discord bot token
 * @param {string} serverId - Discord server ID
 * @returns {Promise<Array|null>} - List of members or null if error
 */
const getServerMembers = async (botToken, serverId) => {
  try {
    const response = await axios.get(`https://discord.com/api/guilds/${serverId}/members`, {
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching server members:', error);
    return null;
  }
};

/**
 * Send a Discord webhook notification
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} message - Message payload
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const sendWebhookNotification = async (webhookUrl, message) => {
  try {
    await axios.post(webhookUrl, message);
    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
};

module.exports = {
  isServerMember,
  getUserData,
  getServerMembers,
  sendWebhookNotification
};
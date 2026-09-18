const axios = require('axios');

async function joinServer(token, inviteCode) {
  try {
    const response = await axios.post(
      `https://discord.com/api/v10/invites/${inviteCode}`,
      {},
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    return { success: true, status: response.status };
  } catch (error) {
    const status = error.response?.status || 0;
    const message = error.response?.data?.message || error.message;
    return { success: false, status, message };
  }
}

module.exports = { joinServer };

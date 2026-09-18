const fetch = require('node-fetch');

const JOIN_DELAY = parseInt(process.env.JOIN_DELAY_MS || '800', 10);
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_JOINS || '5', 10);

/**
 * Join a single token to a guild via invite code
 * Uses Discord user API (selfbot style) - for fiction / educational use only
 */
async function joinWithToken(token, inviteCode) {
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    // Resolve invite first
    const inviteRes = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true&with_expiration=true`, {
      method: 'GET',
      headers
    });

    if (!inviteRes.ok) {
      const err = await inviteRes.text();
      return { success: false, error: `Invite resolve failed: ${inviteRes.status} ${err.slice(0, 80)}` };
    }

    const inviteData = await inviteRes.json();
    const guildId = inviteData.guild?.id;

    // Accept the invite
    const joinRes = await fetch(`https://discord.com/api/v9/invites/${inviteCode}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    if (joinRes.ok || joinRes.status === 204) {
      return { success: true, guildId, status: joinRes.status };
    }

    const body = await joinRes.text();
    return { success: false, error: `Join failed: ${joinRes.status} ${body.slice(0, 120)}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mass join with concurrency control and delay
 * Returns detailed report
 */
async function massJoin(tokens, inviteCode, onProgress = null) {
  const results = {
    total: tokens.length,
    success: 0,
    failed: 0,
    errors: []
  };

  let index = 0;
  const queue = [];

  async function worker() {
    while (index < tokens.length) {
      const i = index++;
      const token = tokens[i];
      const result = await joinWithToken(token, inviteCode);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        if (results.errors.length < 20) {
          results.errors.push({ index: i, error: result.error });
        }
      }

      if (onProgress) {
        onProgress({
          done: results.success + results.failed,
          total: results.total,
          success: results.success,
          failed: results.failed
        });
      }

      // Rate limit friendly delay
      await new Promise(r => setTimeout(r, JOIN_DELAY));
    }
  }

  // Launch limited concurrent workers
  const workers = Array.from({ length: Math.min(MAX_CONCURRENT, tokens.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Validate a single token (simple /users/@me)
 */
async function validateToken(token) {
  try {
    const res = await fetch('https://discord.com/api/v9/users/@me', {
      headers: {
        'Authorization': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!res.ok) return { valid: false, status: res.status };
    const data = await res.json();
    return {
      valid: true,
      id: data.id,
      username: data.username,
      discriminator: data.discriminator,
      globalName: data.global_name
    };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

module.exports = {
  joinWithToken,
  massJoin,
  validateToken
};
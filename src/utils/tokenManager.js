const fs = require('fs');
const path = require('path');

const dataDir = process.env.DATA_DIR || './data';
const tokensFile = path.join(dataDir, 'tokens.txt');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class TokenManager {
  constructor() {
    this.tokens = this.load();
  }

  load() {
    try {
      if (fs.existsSync(tokensFile)) {
        const data = fs.readFileSync(tokensFile, 'utf-8');
        return data.split('\n').filter(token => token.trim().length > 0);
      }
    } catch (error) {
      console.error('[Emorce] Error loading tokens:', error);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(tokensFile, this.tokens.join('\n'), 'utf-8');
    } catch (error) {
      console.error('[Emorce] Error saving tokens:', error);
    }
  }

  add(tokens) {
    const newTokens = tokens.filter(t => t.trim().length > 0);
    this.tokens.push(...newTokens);
    this.save();
    return newTokens.length;
  }

  getAll() {
    return this.tokens;
  }

  getCount() {
    return this.tokens.length;
  }

  getPreview(count = 5) {
    return this.tokens.slice(0, count).map(t => {
      const visible = t.substring(0, 8);
      const hidden = '*'.repeat(Math.max(0, t.length - 8));
      return visible + hidden;
    });
  }

  clear() {
    this.tokens = [];
    this.save();
  }

  export() {
    return Buffer.from(this.tokens.join('\n'), 'utf-8');
  }
}

module.exports = TokenManager;

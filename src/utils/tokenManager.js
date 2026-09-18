const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.txt');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, '', 'utf8');
  }
}

function loadTokens() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
    return raw
      .split(/\r?\n/)
      .map(t => t.trim())
      .filter(t => t.length > 20 && !t.startsWith('#'));
  } catch (e) {
    return [];
  }
}

function saveTokens(tokens) {
  ensureDataDir();
  const unique = [...new Set(tokens.map(t => t.trim()).filter(Boolean))];
  fs.writeFileSync(TOKENS_FILE, unique.join('\n') + '\n', 'utf8');
  return unique.length;
}

function addTokens(newTokens) {
  const current = loadTokens();
  const combined = [...current, ...newTokens];
  return saveTokens(combined);
}

function removeTokens(toRemove) {
  const current = loadTokens();
  const set = new Set(toRemove.map(t => t.trim()));
  const filtered = current.filter(t => !set.has(t));
  return saveTokens(filtered);
}

function clearTokens() {
  ensureDataDir();
  fs.writeFileSync(TOKENS_FILE, '', 'utf8');
  return 0;
}

function getTokenCount() {
  return loadTokens().length;
}

function getTokensPreview(limit = 5) {
  const tokens = loadTokens();
  return {
    total: tokens.length,
    preview: tokens.slice(0, limit).map(t => t.slice(0, 12) + '...' + t.slice(-6))
  };
}

module.exports = {
  loadTokens,
  saveTokens,
  addTokens,
  removeTokens,
  clearTokens,
  getTokenCount,
  getTokensPreview,
  TOKENS_FILE,
  DATA_DIR
};
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tracky_ai',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 600,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  aiRateLimitMax: Number(process.env.AI_RATE_LIMIT_MAX) || 30,
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  aiMaxMessages: Number(process.env.AI_MAX_MESSAGES) || 20,
};

// Resolve the configured AI provider without ever exposing the key to clients.
const explicitProvider = String(process.env.AI_PROVIDER || '').toLowerCase().trim();
env.geminiApiKey =
  process.env.GEMINI_API_KEY ||
  (explicitProvider === 'gemini' ? process.env.AI_API_KEY || '' : '');
env.openAiApiKey =
  process.env.OPENAI_API_KEY ||
  (explicitProvider === 'openai' ? process.env.AI_API_KEY || '' : '');
env.aiProvider = explicitProvider
  ? explicitProvider
  : env.geminiApiKey
    ? 'gemini'
    : env.openAiApiKey
      ? 'openai'
      : 'none';
env.aiApiKey =
  env.aiProvider === 'gemini' ? env.geminiApiKey : env.aiProvider === 'openai' ? env.openAiApiKey : '';
env.aiModel =
  process.env.AI_MODEL ||
  (env.aiProvider === 'gemini' ? 'gemini-2.0-flash' : env.aiProvider === 'openai' ? 'gpt-4o-mini' : '');
env.aiBaseUrl =
  process.env.AI_BASE_URL ||
  (env.aiProvider === 'gemini'
    ? 'https://generativelanguage.googleapis.com/v1beta'
    : 'https://api.openai.com/v1');

if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

module.exports = env;

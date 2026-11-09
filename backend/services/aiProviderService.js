const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const DEFAULT_MODELS = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
};

function getProviderConfig() {
  if (env.aiProvider === 'gemini' && env.geminiApiKey) {
    return {
      provider: 'gemini',
      apiKey: env.geminiApiKey,
      model: env.aiModel || DEFAULT_MODELS.gemini,
      baseUrl: env.aiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta',
    };
  }
  if (env.aiProvider === 'openai' && env.openAiApiKey) {
    return {
      provider: 'openai',
      apiKey: env.openAiApiKey,
      model: env.aiModel || DEFAULT_MODELS.openai,
      baseUrl: env.aiBaseUrl || 'https://api.openai.com/v1',
    };
  }
  return null;
}

function isConfigured() {
  return Boolean(getProviderConfig());
}

function getStatus() {
  const config = getProviderConfig();
  const provider = config?.provider || env.aiProvider || 'none';
  let reason = null;
  if (!config) {
    reason = provider === 'none' ? 'not_configured' : 'missing_api_key';
  }
  return {
    configured: Boolean(config),
    provider,
    model: config?.model || env.aiModel || null,
    reason,
    features: {
      chat: Boolean(config),
      planner: Boolean(config),
      reportNarrative: Boolean(config),
    },
  };
}

function notConfiguredError() {
  return new ApiError(
    503,
    'The AI coach is not configured on this server. Add GEMINI_API_KEY or OPENAI_API_KEY to the backend environment to enable AI chat, planning, and narrative reports.',
    { code: 'AI_NOT_CONFIGURED' }
  );
}

function ensureConfigured() {
  if (!isConfigured()) throw notConfiguredError();
}

function normaliseMessages(messages = []) {
  return messages
    .filter((message) => message && typeof message.content === 'string' && message.content.trim())
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content.trim().slice(0, 12000),
    }));
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapProviderError(status, provider) {
  if (status === 401 || status === 403) {
    return new ApiError(503, 'The AI provider rejected the configured credentials.', {
      code: 'AI_AUTH_FAILED',
    });
  }
  if (status === 429) {
    return new ApiError(429, 'The AI provider is rate limiting requests. Please try again shortly.', {
      code: 'AI_RATE_LIMITED',
    });
  }
  if (status === 400 || status === 404) {
    return new ApiError(502, `The AI provider rejected the request (${provider}).`, {
      code: 'AI_BAD_REQUEST',
    });
  }
  return new ApiError(502, `The AI provider returned an error (${status}).`, {
    code: 'AI_PROVIDER_ERROR',
  });
}

async function callOpenAI(config, messages, { system, temperature, maxTokens, json }) {
  const body = {
    model: config.model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...normaliseMessages(messages),
    ],
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: 'json_object' };

  const response = await fetchWithTimeout(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    console.error(`AI provider error (openai ${response.status}): ${raw.slice(0, 300)}`);
    throw mapProviderError(response.status, 'openai');
  }

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('');
  }
  return '';
}

async function callGemini(config, messages, { system, temperature, maxTokens, json }) {
  const body = {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: normaliseMessages(messages).map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const url = `${config.baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(
    config.model
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    console.error(`AI provider error (gemini ${response.status}): ${raw.slice(0, 300)}`);
    throw mapProviderError(response.status, 'gemini');
  }

  const data = await response.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => part?.text || '').join('');
}

async function complete({ system = '', messages = [], temperature = 0.4, maxTokens = 1600, json = false } = {}) {
  const config = getProviderConfig();
  if (!config) throw notConfiguredError();

  let text;
  try {
    text =
      config.provider === 'gemini'
        ? await callGemini(config, messages, { system, temperature, maxTokens, json })
        : await callOpenAI(config, messages, { system, temperature, maxTokens, json });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError(504, 'The AI provider took too long to respond. Please try again.', {
        code: 'AI_TIMEOUT',
      });
    }
    console.error('AI provider network error:', error.message);
    throw new ApiError(503, 'The AI provider is currently unreachable. Please try again later.', {
      code: 'AI_UNREACHABLE',
    });
  }

  const cleaned = String(text || '').trim();
  if (!cleaned) {
    throw new ApiError(502, 'The AI provider returned an empty response. Please try again.', {
      code: 'AI_EMPTY_RESPONSE',
    });
  }

  return {
    text: cleaned,
    meta: { provider: config.provider, model: config.model },
  };
}

function extractJson(text) {
  const cleaned = String(text || '')
    .replace(/^\uFEFF/, '')
    .trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : cleaned;

  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const firstBracket = candidate.indexOf('[');
  const lastBracket = candidate.lastIndexOf(']');

  let slice = candidate;
  if (firstBrace !== -1 && lastBrace > firstBrace && (firstBracket === -1 || firstBrace <= firstBracket)) {
    slice = candidate.slice(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket > firstBracket) {
    slice = candidate.slice(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(slice);
  } catch {
    throw new ApiError(502, 'The AI provider returned an invalid structured response.', {
      code: 'AI_INVALID_RESPONSE',
    });
  }
}

async function generateText(options) {
  return complete({ ...options, json: false });
}

async function generateJson(options) {
  const result = await complete({ ...options, json: true });
  return { data: extractJson(result.text), meta: result.meta };
}

module.exports = {
  isConfigured,
  ensureConfigured,
  getStatus,
  generateText,
  generateJson,
  extractJson,
  notConfiguredError,
};

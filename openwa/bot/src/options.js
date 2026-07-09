'use strict';

const fs = require('node:fs');
const path = require('node:path');

const OPTIONS_PATH = process.env.OPTIONS_PATH || '/data/options.json';
const OPENWA_DATA_DIR = process.env.OPENWA_DATA_DIR || '/data/openwa';
const BOT_DATA_DIR = process.env.BOT_DATA_DIR || '/data/bot';

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function loadOptions() {
  const raw = readJson(OPTIONS_PATH, {});
  const whatsapp = normalizeWhatsapp(raw.whatsapp || {}, raw);
  const assist = normalizeAssist(raw.assist || {});
  return {
    api_master_key: raw.api_master_key || '',
    openwa_api_key: raw.openwa_api_key || '',
    session_id: raw.session_id || readSessionId(),
    log_level: raw.log_level || 'info',
    engine_type: raw.engine_type || 'baileys',
    whatsapp,
    assist,
    allowed_senders: whatsapp.allowed_senders,
  };
}

function normalizeWhatsapp(value, raw = {}) {
  return {
    allowed_senders: collectAllowedSenders(value, raw).map(normalizeWhatsAppId).filter(Boolean),
  };
}

function collectAllowedSenders(value, raw = {}) {
  const candidates = [
    value?.allowed_senders,
    raw?.allowed_senders,
    raw?.whatsapp_allowed_senders,
    raw?.['whatsapp.allowed_senders'],
  ];
  collectNamedValues(raw, 'allowed_senders', candidates, new Set());
  return [...new Set(candidates.flatMap(valueToList).filter(Boolean))];
}

function collectNamedValues(value, key, output, seen) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (Object.prototype.hasOwnProperty.call(value, key)) output.push(value[key]);
  for (const child of Object.values(value)) collectNamedValues(child, key, output, seen);
}

function valueToList(value) {
  if (Array.isArray(value)) return value.flatMap(valueToList);
  if (typeof value === 'string') return value.split(/[\n,]+/).map(item => item.trim());
  if (value && typeof value === 'object') return Object.values(value).flatMap(valueToList);
  return [];
}

function normalizeAssist(value) {
  const audio = value.audio || {};
  const safety = value.safety || {};
  return {
    enabled: value.enabled !== false,
    language: stringOption(value.language, 'es'),
    agent_id: stringOption(value.agent_id, ''),
    pipeline_id: stringOption(value.pipeline_id, ''),
    device_id: stringOption(value.device_id, ''),
    conversation_ttl_hours: numberOption(value.conversation_ttl_hours, 24),
    audio: {
      enabled: audio.enabled !== false,
      response_mode: stringOption(audio.response_mode, 'voice_input_or_requested'),
      include_text_with_audio: audio.include_text_with_audio !== false,
      max_audio_seconds: numberOption(audio.max_audio_seconds, 120),
    },
    safety: {
      confirm_before_patterns: arrayOption(safety.confirm_before_patterns, [
        'desbloquea',
        'cerradura',
        'alarma',
        'garaje',
        'abre garaje',
        'abre puerta',
        'v2c',
        'saj',
        'bateria',
        'cargador',
        'climatizacion',
      ]),
    },
  };
}


function normalizeWhatsAppId(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.includes('@')) {
    const [local, domain] = lower.split('@');
    if (domain === 'c.us' || domain === 's.whatsapp.net') {
      const digits = local.replace(/[^\d]/g, '');
      return digits ? `${digits}@c.us` : '';
    }
    if (domain === 'g.us') {
      const group = local.replace(/[^0-9-]/g, '');
      return group ? `${group}@g.us` : '';
    }
    return lower;
  }
  const digits = text.replace(/[^\d]/g, '');
  return digits ? `${digits}@c.us` : '';
}

function arrayOption(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

function stringOption(value, fallback) {
  return typeof value === 'string' ? value.trim() : fallback;
}

function numberOption(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readSessionId() {
  try {
    return fs.readFileSync(path.join(BOT_DATA_DIR, 'session-id'), 'utf8').trim();
  } catch {
    return '';
  }
}

function saveSessionId(sessionId) {
  if (!sessionId) return;
  fs.mkdirSync(BOT_DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(BOT_DATA_DIR, 'session-id'), `${sessionId}\n`);
}

function readOpenWaApiKey(options = loadOptions()) {
  if (options.openwa_api_key) return options.openwa_api_key;
  if (options.api_master_key) return options.api_master_key;
  try {
    return fs.readFileSync(path.join(OPENWA_DATA_DIR, '.api-key'), 'utf8').trim();
  } catch {
    return '';
  }
}

function helperAuthKey(options = loadOptions()) {
  return options.api_master_key || readOpenWaApiKey(options);
}

module.exports = {
  OPTIONS_PATH,
  OPENWA_DATA_DIR,
  BOT_DATA_DIR,
  loadOptions,
  normalizeAssist,
  normalizeWhatsapp,
  normalizeWhatsAppId,
  readOpenWaApiKey,
  helperAuthKey,
  saveSessionId,
};

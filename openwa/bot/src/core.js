'use strict';

const crypto = require('node:crypto');
const { normalizeWhatsAppId } = require('./options');

const MESSAGE_EVENTS = new Set([
  '',
  'message',
  'message.received',
  'message_create',
  'messages.upsert',
  'onmessage',
]);

function senderFromMessage(message) {
  const sender = message?.author || message?.participant || message?.sender?.id || message?.sender || message?.from || message?.chatId || '';
  return normalizeWhatsAppId(sender);
}

function isAllowedSender(message, allowedSenders) {
  const allowed = new Set((allowedSenders || []).map(normalizeWhatsAppId).filter(Boolean));
  return allowed.size > 0 && allowed.has(senderFromMessage(message));
}

function openWaMessagesFromPayload(payload, defaultSessionId = '') {
  const event = String(payload?.event || payload?.type || payload?.eventType || '').trim().toLowerCase();
  if (!MESSAGE_EVENTS.has(event)) return [];

  const rawData = payload?.data ?? payload?.message ?? payload;
  const rawMessages = collectRawMessages(rawData);
  const sessionId = String(
    payload?.sessionId ||
    payload?.session_id ||
    payload?.session?.id ||
    payload?.session?.sessionId ||
    rawData?.sessionId ||
    rawData?.session_id ||
    defaultSessionId ||
    ''
  );

  return rawMessages
    .map(raw => normalizeIncomingMessage(raw))
    .filter(Boolean)
    .map(message => ({ message, sessionId }));
}

function collectRawMessages(rawData) {
  if (!rawData) return [];
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData.messages)) return rawData.messages;
  if (Array.isArray(rawData.data)) return rawData.data;
  if (rawData.message && typeof rawData.message === 'object' && !rawData.message.conversation && !rawData.message.extendedTextMessage) {
    return [rawData.message];
  }
  return [rawData];
}

function normalizeIncomingMessage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const key = raw.key || {};
  const message = raw.message || {};
  const fromMe = Boolean(raw.fromMe || key.fromMe);
  const isStatusBroadcast = Boolean(raw.isStatusBroadcast || raw.broadcast || key.remoteJid === 'status@broadcast');
  const author = raw.author || raw.participant || key.participant || raw.sender?.id || raw.sender || '';
  const chatCandidate = raw.chatId || raw.from || raw.to || raw.remoteJid || key.remoteJid || raw.id?.remote || '';
  const senderCandidate = author || raw.from || raw.chatId || key.remoteJid || '';
  const body = extractMessageText(raw);
  const media = normalizeMedia(raw);
  return {
    ...raw,
    from: normalizeWhatsAppId(senderCandidate),
    chatId: normalizeWhatsAppId(chatCandidate || senderCandidate),
    author: normalizeWhatsAppId(author),
    body,
    type: normalizeMessageType(raw, media),
    media,
    fromMe,
    isStatusBroadcast,
  };
}

function extractMessageText(raw) {
  const message = raw?.message || {};
  const candidates = [
    raw?.body,
    raw?.text,
    raw?.caption,
    raw?.content,
    raw?.messageText,
    message?.conversation,
    message?.extendedTextMessage?.text,
    message?.imageMessage?.caption,
    message?.videoMessage?.caption,
    message?.documentMessage?.caption,
    raw?.message?.body,
    raw?.message?.text,
  ];
  const found = candidates.find(value => typeof value === 'string' && value.trim());
  return found ? found.trim() : '';
}

function normalizeMedia(raw) {
  if (raw?.media?.data || raw?.media?.base64) return raw.media;
  const message = raw?.message || {};
  const audio = message.audioMessage || {};
  const image = message.imageMessage || {};
  const video = message.videoMessage || {};
  const document = message.documentMessage || {};
  const mimetype = raw?.mimetype || raw?.mimeType || audio.mimetype || image.mimetype || video.mimetype || document.mimetype || '';
  const data = raw?.data || raw?.base64 || raw?.mediaData || '';
  if (!mimetype && !data) return raw?.media;
  return { mimetype, data };
}

function normalizeMessageType(raw, media) {
  const explicit = String(raw?.type || raw?.messageType || '').toLowerCase();
  if (explicit) return explicit;
  const message = raw?.message || {};
  if (message.audioMessage) return 'audio';
  if (message.imageMessage) return 'image';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'document';
  if (/^audio\//i.test(media?.mimetype || '')) return 'audio';
  return 'text';
}

function verifyOpenWaSignature({ rawBody, signature, secret }) {
  if (!signature || !secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const candidates = [digest, `sha256=${digest}`];
  return candidates.some(candidate => safeEqual(candidate, String(signature)));
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function menuText() {
  return [
    'OpenWA Assist activo.',
    'Escribe o manda una nota de voz para hablar con Home Assistant Assist.',
    'Configura IA, STT, TTS y permisos en Home Assistant Voice Assist.',
  ].join('\n');
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isConfirm(text) {
  return normalizeText(text).trim() === 'si';
}

function isAudioRequest(text) {
  const value = normalizeText(text);
  return /\b(audio|voz|nota de voz|respondeme por audio|respuesta por audio|mandamelo por audio|enviamelo por audio)\b/.test(value);
}

function isNegativeAudioRequest(text) {
  const value = normalizeText(text);
  return /\b(sin audio|solo texto|no.*audio)\b/.test(value);
}

module.exports = {
  senderFromMessage,
  isAllowedSender,
  openWaMessagesFromPayload,
  normalizeIncomingMessage,
  extractMessageText,
  verifyOpenWaSignature,
  menuText,
  normalizeText,
  isConfirm,
  isAudioRequest,
  isNegativeAudioRequest,
};
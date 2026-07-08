'use strict';

const crypto = require('node:crypto');
const { normalizeWhatsAppId } = require('./options');

function senderFromMessage(message) {
  return normalizeWhatsAppId(message.from || message.chatId || message.sender || '');
}

function isAllowedSender(message, allowedSenders) {
  const allowed = new Set((allowedSenders || []).map(normalizeWhatsAppId));
  return allowed.size > 0 && allowed.has(senderFromMessage(message));
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
  verifyOpenWaSignature,
  menuText,
  normalizeText,
  isConfirm,
  isAudioRequest,
  isNegativeAudioRequest,
};


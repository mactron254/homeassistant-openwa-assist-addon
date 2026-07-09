'use strict';

const fs = require('node:fs');
const { probeDuration } = require('./audio');

const OPENWA_BASE_URL = process.env.OPENWA_BASE_URL || 'http://127.0.0.1:2785';
const AUDIO_MIMETYPE = 'audio/ogg; codecs=opus';

class OpenWaClient {
  constructor(apiKey, deps = {}) {
    this.apiKey = apiKey;
    this.fetch = deps.fetch || fetch;
    this.probeDuration = deps.probeDuration || probeDuration;
  }

  async request(method, requestPath, body) {
    if (!this.apiKey) throw new Error('OpenWA API key no disponible');
    const response = await this.fetch(`${OPENWA_BASE_URL}${requestPath}`, {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) throw new Error(`OpenWA ${response.status}: ${text}`);
    return payload;
  }

  createSession(name = 'homeassistant') {
    return this.request('POST', '/api/sessions', { name });
  }

  getSession(sessionId) {
    return this.request('GET', `/api/sessions/${encodeURIComponent(sessionId)}`);
  }

  listSessions() {
    return this.request('GET', '/api/sessions');
  }

  startSession(sessionId) {
    return this.request('POST', `/api/sessions/${encodeURIComponent(sessionId)}/start`);
  }

  getQr(sessionId) {
    return this.request('GET', `/api/sessions/${encodeURIComponent(sessionId)}/qr`);
  }

  sendText(sessionId, chatId, text) {
    return this.request('POST', `/api/sessions/${encodeURIComponent(sessionId)}/messages/send-text`, { chatId, text });
  }

  async sendAudio(sessionId, chatId, audio) {
    await this.probeDuration(audio.filePath);
    return this.request('POST', `/api/sessions/${encodeURIComponent(sessionId)}/messages/send-audio`, {
      chatId,
      base64: fs.readFileSync(audio.filePath).toString('base64'),
      mimetype: audio.mimetype || AUDIO_MIMETYPE,
      filename: audio.filename || 'openwa-assist.ogg',
      ptt: audio.ptt !== false,
    });
  }

  listWebhooks(sessionId) {
    return this.request('GET', `/api/sessions/${encodeURIComponent(sessionId)}/webhooks`);
  }

  createWebhook(sessionId, webhook) {
    return this.request('POST', `/api/sessions/${encodeURIComponent(sessionId)}/webhooks`, webhook);
  }

  updateWebhook(sessionId, webhookId, webhook) {
    return this.request('PUT', `/api/sessions/${encodeURIComponent(sessionId)}/webhooks/${encodeURIComponent(webhookId)}`, webhook);
  }
}

module.exports = { OpenWaClient, AUDIO_MIMETYPE };

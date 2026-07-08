'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const WebSocket = require('ws');
const { convertToVoiceNote, cleanupFiles } = require('./audio');
const { BOT_DATA_DIR } = require('./options');
const { AUDIO_MIMETYPE } = require('./openwa-client');

const HA_BASE_URL = process.env.HA_BASE_URL || 'http://supervisor/core/api';
const HA_WS_URL = process.env.HA_WS_URL || 'ws://supervisor/core/api/websocket';
const HA_ORIGIN = process.env.HA_ORIGIN || 'http://supervisor/core';
const HA_TOKEN = process.env.SUPERVISOR_TOKEN || '';

class AssistClient {
  constructor(options, deps = {}) {
    this.options = options;
    this.fetch = deps.fetch || fetch;
    this.WebSocket = deps.WebSocket || WebSocket;
    this.token = deps.token ?? HA_TOKEN;
    this.runner = deps.runner;
  }

  enabled() {
    return this.options.assist?.enabled !== false;
  }

  async processConversation(text, conversationId) {
    const body = {
      text,
      language: this.options.assist.language || 'es',
    };
    if (this.options.assist.agent_id) body.agent_id = this.options.assist.agent_id;
    if (conversationId) body.conversation_id = conversationId;
    if (this.options.assist.device_id) body.device_id = this.options.assist.device_id;
    const payload = await this.haRequest('/conversation/process', body);
    return normalizeConversationResult(payload);
  }

  async transcribePcm(pcmPath) {
    const result = await this.runPipeline({
      start_stage: 'stt',
      end_stage: 'stt',
      input: { sample_rate: 16000, no_vad: true },
      pcmPath,
    });
    if (!result.stt_text) throw new Error('Home Assistant no reconocio texto en el audio');
    return result.stt_text;
  }

  async runTextToSpeech(text, conversationId) {
    const input = { text };
    const result = await this.runPipeline({
      start_stage: 'intent',
      end_stage: 'tts',
      input,
      conversation_id: conversationId,
    });
    return normalizePipelineResult(result);
  }

  async downloadTtsAsVoiceNote(ttsOutput) {
    if (!ttsOutput?.url) return null;
    const tmpDir = path.join(BOT_DATA_DIR, 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const input = path.join(tmpDir, `${id}-ha-tts`);
    const output = path.join(tmpDir, `${id}.ogg`);
    try {
      const audio = await this.download(ttsOutput.url);
      fs.writeFileSync(input, Buffer.from(await audio.arrayBuffer()));
      const duration = await convertToVoiceNote(input, output, this.runner);
      return { filePath: output, filename: `${id}.ogg`, mimetype: AUDIO_MIMETYPE, duration, cleanup: () => cleanupFiles(input, output) };
    } catch (error) {
      cleanupFiles(input, output);
      throw error;
    }
  }

  async haRequest(endpoint, body) {
    if (!this.token) throw new Error('SUPERVISOR_TOKEN no disponible');
    const response = await this.fetch(`${HA_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) throw new Error(`HA ${response.status}: ${text}`);
    return payload;
  }

  async download(url) {
    if (!this.token) throw new Error('SUPERVISOR_TOKEN no disponible');
    const target = absoluteHaUrl(url);
    const response = await this.fetch(target, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error(`HA audio ${response.status}`);
    return response;
  }

  async runPipeline({ start_stage, end_stage, input, conversation_id: conversationId, pcmPath }) {
    if (!this.token) throw new Error('SUPERVISOR_TOKEN no disponible');
    const ws = new this.WebSocket(HA_WS_URL);
    const state = {
      authenticated: false,
      commandAccepted: false,
      handlerId: null,
      stt_text: '',
      response_text: '',
      conversation_id: conversationId || '',
      tts_output: null,
      error: null,
      ended: false,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        safeClose(ws);
        reject(new Error('Timeout ejecutando Assist pipeline'));
      }, 90_000);

      const finish = (error) => {
        clearTimeout(timer);
        safeClose(ws);
        if (error) reject(error);
        else resolve(state);
      };

      ws.on('open', () => {});
      ws.on('error', error => finish(error));
      ws.on('message', async raw => {
        try {
          const messages = parseWsMessages(raw);
          for (const message of messages) {
            await this.handleWsMessage({ ws, message, state, start_stage, end_stage, input, conversationId, pcmPath, finish });
          }
        } catch (error) {
          finish(error);
        }
      });
      ws.on('close', () => {
        if (!state.ended && !state.error) {
          clearTimeout(timer);
          reject(new Error('WebSocket HA cerrado antes de terminar'));
        }
      });
    });
  }

  async handleWsMessage({ ws, message, state, start_stage: startStage, end_stage: endStage, input, conversationId, pcmPath, finish }) {
    if (message.type === 'auth_required') {
      ws.send(JSON.stringify({ type: 'auth', access_token: this.token }));
      return;
    }
    if (message.type === 'auth_invalid') throw new Error(`HA auth invalid: ${message.message || 'invalid'}`);
    if (message.type === 'auth_ok' && !state.authenticated) {
      state.authenticated = true;
      const command = {
        id: 1,
        type: 'assist_pipeline/run',
        start_stage: startStage,
        end_stage: endStage,
        input,
        timeout: 90,
      };
      if (this.options.assist.pipeline_id) command.pipeline = this.options.assist.pipeline_id;
      if (conversationId) command.conversation_id = conversationId;
      if (this.options.assist.device_id) command.device_id = this.options.assist.device_id;
      ws.send(JSON.stringify(command));
      return;
    }
    if (message.type === 'result' && message.id === 1) {
      if (!message.success) throw new Error(message.error?.message || 'Assist pipeline error');
      state.commandAccepted = true;
      return;
    }
    if (message.type !== 'event' || message.id !== 1) return;
    const event = message.event || {};
    if (event.type === 'run-start') {
      state.conversation_id = event.data?.conversation_id || state.conversation_id;
      state.handlerId = event.data?.runner_data?.stt_binary_handler_id || null;
      if (pcmPath) await sendPcm(ws, state.handlerId, pcmPath);
      return;
    }
    if (event.type === 'stt-end') {
      state.stt_text = event.data?.stt_output?.text || state.stt_text;
      return;
    }
    if (event.type === 'intent-end') {
      const normalized = normalizeConversationResult(event.data?.intent_output || {});
      state.response_text = normalized.text || state.response_text;
      state.conversation_id = normalized.conversation_id || state.conversation_id;
      return;
    }
    if (event.type === 'tts-end') {
      state.tts_output = event.data?.tts_output || null;
      return;
    }
    if (event.type === 'error') {
      state.error = event.data?.message || 'Error en Assist pipeline';
      finish(new Error(state.error));
      return;
    }
    if (event.type === 'run-end') {
      state.ended = true;
      finish();
    }
  }
}

function normalizePipelineResult(result) {
  return {
    text: result.response_text || '',
    conversation_id: result.conversation_id || '',
    tts_output: result.tts_output || null,
  };
}

function normalizeConversationResult(payload) {
  const response = payload?.response || payload || {};
  return {
    text: response?.speech?.plain?.speech || response?.speech?.ssml?.speech || '',
    conversation_id: payload?.conversation_id || '',
    raw: payload,
  };
}

function parseWsMessages(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
  const payload = JSON.parse(text);
  return Array.isArray(payload) ? payload : [payload];
}

async function sendPcm(ws, handlerId, pcmPath) {
  if (!handlerId) throw new Error('HA no devolvio stt_binary_handler_id');
  const data = fs.readFileSync(pcmPath);
  const chunkSize = 32 * 1024;
  for (let offset = 0; offset < data.length; offset += chunkSize) {
    const chunk = data.subarray(offset, offset + chunkSize);
    ws.send(Buffer.concat([Buffer.from([handlerId]), chunk]));
  }
  ws.send(Buffer.from([handlerId]));
}

function absoluteHaUrl(value) {
  const url = String(value || '');
  if (/^https?:\/\//i.test(url)) return url;
  return `${HA_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

function safeClose(ws) {
  try {
    ws.close();
  } catch {
    // ignore close errors
  }
}

module.exports = {
  AssistClient,
  normalizeConversationResult,
  parseWsMessages,
  absoluteHaUrl,
};


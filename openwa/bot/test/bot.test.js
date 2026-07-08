'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { AssistBot, matchesCriticalPattern } = require('../src/bot');
const { ConversationStore } = require('../src/store');

test('critical patterns ask SI before forwarding exact text to Assist', async () => {
  const calls = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assist-store-'));
  const bot = new AssistBot({
    options: options(),
    openwa: {},
    assist: {
      enabled: () => true,
      processConversation: async text => {
        calls.push(text);
        return { text: 'ok', conversation_id: 'conv1' };
      },
    },
    store: new ConversationStore(options(), path.join(tmp, 'store.json')),
  });

  const prompt = await bot.handleMessage(message('abre garaje'));
  assert.match(prompt.text, /Responde SI/);
  assert.deepEqual(calls, []);

  const result = await bot.handleMessage(message('SI'));
  assert.equal(result.text, 'ok');
  assert.deepEqual(calls, ['abre garaje']);
});

test('authorized webhook sends Assist text response to WhatsApp', async () => {
  const sent = [];
  const bot = new AssistBot({
    options: options(),
    openwa: { sendText: async (sessionId, chatId, text) => sent.push({ sessionId, chatId, text }) },
    assist: {
      enabled: () => true,
      processConversation: async () => ({ text: 'Casa bien', conversation_id: 'conv1' }),
    },
    store: memoryStore(),
  });

  await bot.handleOpenWaPayload(payload('como esta la casa'));

  assert.deepEqual(sent, [{ sessionId: 'home', chatId: '34600111222@c.us', text: 'Casa bien' }]);
});

test('unauthorized sender is ignored', async () => {
  const bot = new AssistBot({
    options: options(),
    openwa: { sendText: async () => { throw new Error('should not send'); } },
    assist: { enabled: () => true },
    store: memoryStore(),
  });

  await bot.handleOpenWaPayload({ ...payload('hola'), data: { ...payload('hola').data, from: '34600999888@c.us' } });
});

test('audio response sends text and WhatsApp voice note', async () => {
  const sent = [];
  const audio = { filePath: 'reply.ogg', mimetype: 'audio/ogg; codecs=opus', filename: 'reply.ogg', cleanup: () => sent.push({ type: 'cleanup' }) };
  const bot = new AssistBot({
    options: options({ audio: { response_mode: 'requested', include_text_with_audio: true } }),
    openwa: {
      sendText: async (_sessionId, _chatId, text) => sent.push({ type: 'text', text }),
      sendAudio: async (_sessionId, _chatId, value) => sent.push({ type: 'audio', value }),
    },
    assist: {
      enabled: () => true,
      runTextToSpeech: async () => ({ text: 'Audio listo', conversation_id: 'conv1', tts_output: { url: '/tts' } }),
      downloadTtsAsVoiceNote: async () => audio,
    },
    store: memoryStore(),
  });

  await bot.handleOpenWaPayload(payload('respondeme por audio'));

  assert.equal(sent[0].type, 'text');
  assert.equal(sent[1].type, 'audio');
  assert.equal(sent[1].value.ptt, true);
  assert.equal(sent[2].type, 'cleanup');
});

test('matches critical patterns accent-insensitively', () => {
  assert.equal(matchesCriticalPattern('Ábre garaje', ['abre garaje']), true);
});

function payload(body) {
  return {
    event: 'message.received',
    sessionId: 'home',
    data: {
      id: 'm1',
      from: '34600111222@c.us',
      chatId: '34600111222@c.us',
      body,
      type: 'text',
    },
  };
}

function message(body) {
  return { from: '34600111222@c.us', chatId: '34600111222@c.us', body, type: 'text' };
}

function memoryStore() {
  const data = {};
  return {
    get: sender => data[sender] || null,
    setConversation: (sender, conversationId) => { data[sender] = { ...(data[sender] || {}), conversation_id: conversationId }; },
    setPending: (sender, pending) => { data[sender] = { ...(data[sender] || {}), pending }; },
    consumePending: sender => {
      const pending = data[sender]?.pending || null;
      if (data[sender]) delete data[sender].pending;
      return pending;
    },
  };
}

function options(overrides = {}) {
  return {
    session_id: 'home',
    allowed_senders: ['34600111222@c.us'],
    assist: {
      enabled: true,
      language: 'es',
      agent_id: '',
      pipeline_id: '',
      device_id: '',
      conversation_ttl_hours: 24,
      audio: {
        enabled: true,
        response_mode: 'voice_input_or_requested',
        include_text_with_audio: true,
        max_audio_seconds: 120,
        ...(overrides.audio || {}),
      },
      safety: {
        confirm_before_patterns: ['abre garaje', 'alarma'],
      },
    },
  };
}


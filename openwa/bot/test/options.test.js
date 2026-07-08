'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeAssist, normalizeWhatsapp } = require('../src/options');

test('normalizes clean Assist config', () => {
  const assist = normalizeAssist({
    language: 'es',
    agent_id: 'conversation.google_generative_ai',
    pipeline_id: 'pipeline-whatsapp',
    device_id: 'device-1',
    audio: { response_mode: 'always', max_audio_seconds: 60 },
  });

  assert.equal(assist.enabled, true);
  assert.equal(assist.language, 'es');
  assert.equal(assist.agent_id, 'conversation.google_generative_ai');
  assert.equal(assist.pipeline_id, 'pipeline-whatsapp');
  assert.equal(assist.device_id, 'device-1');
  assert.equal(assist.audio.response_mode, 'always');
  assert.equal(assist.audio.max_audio_seconds, 60);
});

test('normalizes WhatsApp senders and recipients', () => {
  const whatsapp = normalizeWhatsapp({
    allowed_senders: ['+34 600 111 222', '34600222333@c.us'],
    recipients: { primary: '+34 600 111 222' },
  });

  assert.deepEqual(whatsapp.allowed_senders, ['34600111222@c.us', '34600222333@c.us']);
  assert.deepEqual(whatsapp.recipients, [{ name: 'primary', chat_id: '34600111222@c.us' }]);
});


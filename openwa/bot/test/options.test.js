'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeAssist, normalizeWhatsapp, normalizeWhatsAppId, readOpenWaApiKey } = require('../src/options');

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

test('default safety patterns include energy critical controls', () => {
  const assist = normalizeAssist({});

  assert.ok(assist.safety.confirm_before_patterns.includes('v2c'));
  assert.ok(assist.safety.confirm_before_patterns.includes('saj'));
  assert.ok(assist.safety.confirm_before_patterns.includes('bateria'));
  assert.ok(assist.safety.confirm_before_patterns.includes('cargador'));
  assert.ok(assist.safety.confirm_before_patterns.includes('garaje'));
});

test('normalizes WhatsApp senders', () => {
  const whatsapp = normalizeWhatsapp({
    allowed_senders: ['+34 600 111 222', '34600222333@c.us'],
  });

  assert.deepEqual(whatsapp.allowed_senders, ['34600111222@c.us', '34600222333@c.us']);
});

test('normalizes Baileys sender ids to OpenWA c.us ids', () => {
  assert.equal(normalizeWhatsAppId('34600111222@s.whatsapp.net'), '34600111222@c.us');
  assert.equal(normalizeWhatsAppId('120363111222333444@g.us'), '120363111222333444@g.us');
});

test('uses api_master_key as OpenWA key when dedicated key is empty', () => {
  assert.equal(readOpenWaApiKey({ api_master_key: 'helper-key', openwa_api_key: '' }), 'helper-key');
  assert.equal(readOpenWaApiKey({ api_master_key: 'helper-key', openwa_api_key: 'openwa-key' }), 'openwa-key');
});

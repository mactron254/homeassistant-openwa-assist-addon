'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { OpenWaClient } = require('../src/openwa-client');

test('sendAudio posts OpenWA voice note payload', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'openwa-audio-'));
  const filePath = path.join(tmp, 'reply.ogg');
  fs.writeFileSync(filePath, 'audio');
  let payload;
  const client = new OpenWaClient('key', {
    probeDuration: async () => 1,
    fetch: async (_url, init) => {
      payload = JSON.parse(init.body);
      return { ok: true, status: 200, text: async () => '{"messageId":"m1"}' };
    },
  });

  const result = await client.sendAudio('home', '346@c.us', { filePath, filename: 'reply.ogg' });

  assert.equal(result.messageId, 'm1');
  assert.equal(payload.chatId, '346@c.us');
  assert.equal(payload.mimetype, 'audio/ogg; codecs=opus');
  assert.equal(payload.ptt, true);
  assert.equal(payload.base64, Buffer.from('audio').toString('base64'));
});


test('updateWebhook puts webhook payload', async () => {
  let called;
  const client = new OpenWaClient('key', {
    fetch: async (url, init) => {
      called = { url, init };
      return { ok: true, status: 200, text: async () => '{"ok":true}' };
    },
  });

  await client.updateWebhook('home', 'webhook-1', { url: 'http://127.0.0.1:2786/webhook/openwa', secret: 'secret' });

  assert.equal(called.init.method, 'PUT');
  assert.match(called.url, /\/api\/sessions\/home\/webhooks\/webhook-1$/);
  assert.deepEqual(JSON.parse(called.init.body), { url: 'http://127.0.0.1:2786/webhook/openwa', secret: 'secret' });
});

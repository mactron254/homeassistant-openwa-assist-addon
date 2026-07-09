'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { isAllowedSender, senderFromMessage, verifyOpenWaSignature, isAudioRequest, openWaMessagesFromPayload } = require('../src/core');

test('allows only configured senders', () => {
  assert.equal(isAllowedSender({ from: '34600111222@c.us' }, ['34600111222@c.us']), true);
  assert.equal(isAllowedSender({ from: '34600111222@c.us' }, ['34600999888@c.us']), false);
  assert.equal(isAllowedSender({ from: '34600111222@c.us' }, []), false);
});

test('verifies OpenWA signature', () => {
  const rawBody = Buffer.from('{"ok":true}');
  const secret = 'secret';
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  assert.equal(verifyOpenWaSignature({ rawBody, signature: digest, secret }), true);
  assert.equal(verifyOpenWaSignature({ rawBody, signature: `sha256=${digest}`, secret }), true);
  assert.equal(verifyOpenWaSignature({ rawBody, signature: 'bad', secret }), false);
});

test('detects explicit audio request', () => {
  assert.equal(isAudioRequest('respóndeme por audio'), true);
});


test('extracts nested Baileys messages from OpenWA payload', () => {
  const items = openWaMessagesFromPayload({
    event: 'messages.upsert',
    sessionId: 'home',
    data: {
      messages: [
        {
          key: { remoteJid: '34600111222@s.whatsapp.net', fromMe: false },
          message: { conversation: 'hola casa' },
        },
      ],
    },
  }, 'fallback');

  assert.equal(items.length, 1);
  assert.equal(items[0].sessionId, 'home');
  assert.equal(items[0].message.from, '34600111222@c.us');
  assert.equal(items[0].message.chatId, '34600111222@c.us');
  assert.equal(items[0].message.body, 'hola casa');
  assert.equal(senderFromMessage(items[0].message), '34600111222@c.us');
});

test('allows Baileys sender when configured as phone number', () => {
  assert.equal(isAllowedSender({ from: '34600111222@s.whatsapp.net' }, ['+34 600 111 222']), true);
});

test('allows Baileys LID sender when configured explicitly', () => {
  assert.equal(isAllowedSender({ from: '112446656221286@lid' }, ['112446656221286@lid']), true);
});


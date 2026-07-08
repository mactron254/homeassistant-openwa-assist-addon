'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { isAllowedSender, verifyOpenWaSignature, isAudioRequest } = require('../src/core');

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


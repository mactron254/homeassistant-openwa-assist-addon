'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { filteredResponseHeaders, filteredRequestHeaders } = require('../src/openwa-dashboard-proxy');

test('dashboard proxy strips browser-breaking security headers', () => {
  const headers = filteredResponseHeaders({
    'content-security-policy': "default-src 'self';upgrade-insecure-requests",
    'strict-transport-security': 'max-age=31536000',
    'x-frame-options': 'SAMEORIGIN',
    'content-type': 'text/html',
  });

  assert.equal(headers['content-security-policy'], undefined);
  assert.equal(headers['strict-transport-security'], undefined);
  assert.equal(headers['x-frame-options'], undefined);
  assert.equal(headers['content-type'], 'text/html');
});

test('dashboard proxy rewrites host and removes hop by hop request headers', () => {
  const headers = filteredRequestHeaders({
    host: '192.168.50.120:2785',
    connection: 'keep-alive',
    accept: 'text/html',
  });

  assert.equal(headers.host, '127.0.0.1:2787');
  assert.equal(headers.connection, undefined);
  assert.equal(headers.accept, 'text/html');
});

#!/usr/bin/env node
'use strict';

const http = require('node:http');

const LISTEN_PORT = Number(process.env.OPENWA_PROXY_PORT || 2785);
const TARGET_HOST = process.env.OPENWA_TARGET_HOST || '127.0.0.1';
const TARGET_PORT = Number(process.env.OPENWA_TARGET_PORT || 2787);
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);
const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
]);

function filteredRequestHeaders(headers) {
  const next = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) next[key] = value;
  }
  next.host = `${TARGET_HOST}:${TARGET_PORT}`;
  return next;
}

function filteredResponseHeaders(headers) {
  const next = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    if (STRIPPED_RESPONSE_HEADERS.has(lower)) continue;
    next[key] = value;
  }
  return next;
}

const server = http.createServer((req, res) => {
  const upstream = http.request({
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    method: req.method,
    path: req.url,
    headers: filteredRequestHeaders(req.headers),
  }, upstreamRes => {
    res.writeHead(upstreamRes.statusCode || 502, filteredResponseHeaders(upstreamRes.headers));
    upstreamRes.pipe(res);
  });

  upstream.on('error', error => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'openwa_proxy_error', message: error.message }));
  });

  req.pipe(upstream);
});

server.on('upgrade', (req, socket, head) => {
  const upstream = http.request({
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    method: req.method,
    path: req.url,
    headers: {
      ...filteredRequestHeaders(req.headers),
      connection: 'upgrade',
      upgrade: req.headers.upgrade || 'websocket',
    },
  });

  upstream.on('upgrade', (upstreamRes, upstreamSocket, upstreamHead) => {
    socket.write(
      `HTTP/${upstreamRes.httpVersion} ${upstreamRes.statusCode} ${upstreamRes.statusMessage}\r\n` +
      Object.entries(filteredResponseHeaders(upstreamRes.headers))
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\r\n') +
      '\r\n\r\n',
    );
    if (upstreamHead.length) socket.write(upstreamHead);
    if (head.length) upstreamSocket.write(head);
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });

  upstream.on('error', () => socket.destroy());
  upstream.end();
});

if (require.main === module) {
  server.listen(LISTEN_PORT, '0.0.0.0', () => {
    console.log(`[OpenWA Assist] Dashboard proxy listening on ${LISTEN_PORT}, target ${TARGET_HOST}:${TARGET_PORT}`);
  });
}

module.exports = { filteredRequestHeaders, filteredResponseHeaders, server };

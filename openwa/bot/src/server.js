#!/usr/bin/env node
'use strict';

const http = require('node:http');
const { loadOptions, readOpenWaApiKey, helperAuthKey, saveSessionId } = require('./options');
const { verifyOpenWaSignature } = require('./core');
const { OpenWaClient } = require('./openwa-client');
const { AssistClient } = require('./assist-client');
const { AssistBot } = require('./bot');

const PORT = Number(process.env.BOT_PORT || 2786);
const WEBHOOK_URL = process.env.OPENWA_BOT_WEBHOOK_URL || 'http://127.0.0.1:2786/webhook/openwa';

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function html(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function createRuntime() {
  const options = loadOptions();
  const openwa = new OpenWaClient(readOpenWaApiKey(options));
  const assist = new AssistClient(options);
  const bot = new AssistBot({ options, openwa, assist });
  return { options, openwa, assist, bot };
}

async function ensureOpenWaSetup() {
  const { options, openwa } = await createRuntime();
  if (!openwa.apiKey) {
    console.log('[OpenWA Assist] OpenWA API key not available yet; setup skipped.');
    return;
  }
  let sessionId = options.session_id;
  if (!sessionId) {
    const sessions = await openwa.listSessions().catch(() => []);
    const existing = Array.isArray(sessions) ? sessions.find(session => session.name === 'homeassistant') || sessions[0] : null;
    const created = existing || (await openwa.createSession('homeassistant'));
    sessionId = created.id || created.sessionId || created.name;
    saveSessionId(sessionId);
  }
  if (!sessionId) return;
  try {
    const session = await openwa.getSession(sessionId);
    if (session.status !== 'ready') await openwa.startSession(sessionId);
  } catch {
    await openwa.startSession(sessionId);
  }
  const webhooks = await openwa.listWebhooks(sessionId).catch(() => []);
  const exists = Array.isArray(webhooks) && webhooks.some(webhook => webhook.url === WEBHOOK_URL);
  if (!exists) {
    await openwa.createWebhook(sessionId, {
      url: WEBHOOK_URL,
      events: ['message.received'],
      secret: helperAuthKey(options),
      retryCount: 3,
    });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const runtime = await createRuntime();

    if (req.method === 'GET' && url.pathname === '/') {
      html(res, 200, '<h1>OpenWA Assist</h1><p>Bot activo. Usa OpenWA dashboard en el puerto 2785.</p>');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, {
        helper: 'ok',
        assist_enabled: runtime.options.assist.enabled,
        language: runtime.options.assist.language,
        pipeline_id: runtime.options.assist.pipeline_id,
        device_id: runtime.options.assist.device_id,
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/qr') {
      if (!authorized(req, runtime.options)) return json(res, 401, { error: 'unauthorized' });
      json(res, 200, await runtime.openwa.getQr(runtime.options.session_id));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/webhook/openwa') {
      const raw = await readBody(req);
      const secret = helperAuthKey(runtime.options);
      if (!verifyOpenWaSignature({ rawBody: raw, signature: req.headers['x-openwa-signature'], secret })) {
        return json(res, 401, { error: 'invalid_signature' });
      }
      await runtime.bot.handleOpenWaPayload(JSON.parse(raw.toString('utf8')));
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && (url.pathname === '/send' || url.pathname.startsWith('/send/'))) {
      if (!authorized(req, runtime.options)) return json(res, 401, { error: 'unauthorized' });
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      const alias = url.pathname.startsWith('/send/') ? url.pathname.slice('/send/'.length) : '';
      const recipient = alias
        ? runtime.options.recipients.find(item => item.name === alias)?.chat_id
        : body.chat_id || body.chatId;
      if (!recipient) return json(res, 400, { error: 'missing_chat_id' });
      json(res, 200, await runtime.openwa.sendText(runtime.options.session_id, recipient, body.message || body.text || ''));
      return;
    }

    json(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error('[OpenWA Assist]', error);
    json(res, 500, { error: 'internal_error', message: error.message });
  }
});

function authorized(req, options) {
  return req.headers['x-api-key'] === helperAuthKey(options);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[OpenWA Assist] Listening on ${PORT}`);
  ensureOpenWaSetup().catch(error => console.error('[OpenWA Assist] setup failed:', error));
});


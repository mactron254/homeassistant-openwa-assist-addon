'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { AssistClient, absoluteHaUrl } = require('../src/assist-client');

test('processConversation calls HA Conversation API with language agent conversation and device', async () => {
  const calls = [];
  const assist = new AssistClient(options(), {
    token: 'token',
    fetch: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
      return response({ conversation_id: 'conv1', response: { speech: { plain: { speech: 'Hola' } } } });
    },
  });

  const result = await assist.processConversation('como esta la casa', 'old');

  assert.equal(result.text, 'Hola');
  assert.equal(result.conversation_id, 'conv1');
  assert.equal(calls[0].body.language, 'es');
  assert.equal(calls[0].body.agent_id, 'conversation.google');
  assert.equal(calls[0].body.conversation_id, 'old');
  assert.equal(calls[0].body.device_id, 'device-1');
  assert.equal(calls[0].headers.Authorization, 'Bearer token');
});

test('runTextToSpeech uses Assist pipeline with pipeline and device context', async () => {
  const sent = [];
  const assist = new AssistClient(options(), { token: 'token', WebSocket: fakeWs(sent) });

  const result = await assist.runTextToSpeech('hola', 'conv1');

  const command = sent.find(item => item.type === 'json' && item.value.type === 'assist_pipeline/run').value;
  assert.equal(command.start_stage, 'intent');
  assert.equal(command.end_stage, 'tts');
  assert.equal(command.pipeline, 'pipeline-1');
  assert.equal(command.conversation_id, 'conv1');
  assert.equal(command.device_id, 'device-1');
  assert.equal(result.text, 'Respuesta Assist');
  assert.equal(result.conversation_id, 'conv2');
  assert.equal(result.tts_output.url, '/api/tts_proxy/test');
});

test('transcribePcm sends PCM binary frames with HA handler id', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assist-pcm-'));
  const pcm = path.join(tmp, 'sample.pcm');
  fs.writeFileSync(pcm, Buffer.alloc(64000, 1));
  const sent = [];
  const assist = new AssistClient(options(), { token: 'token', WebSocket: fakeWs(sent) });

  const text = await assist.transcribePcm(pcm);

  const command = sent.find(item => item.type === 'json' && item.value.type === 'assist_pipeline/run').value;
  const binary = sent.filter(item => item.type === 'binary');
  assert.equal(command.start_stage, 'stt');
  assert.equal(command.end_stage, 'stt');
  assert.equal(command.input.sample_rate, 16000);
  assert.equal(command.input.no_vad, true);
  assert.equal(binary[0].value[0], 7);
  assert.equal(binary.at(-1).value.length, 1);
  assert.equal(text, 'texto transcrito');
});

test('absolute HA URL supports relative TTS urls', () => {
  assert.equal(absoluteHaUrl('/api/tts_proxy/test').endsWith('/api/tts_proxy/test'), true);
  assert.equal(absoluteHaUrl('https://ha.local/audio'), 'https://ha.local/audio');
});

function fakeWs(sent) {
  return class FakeWs extends EventEmitter {
    constructor() {
      super();
      setImmediate(() => this.emit('open'));
      setImmediate(() => this.emit('message', JSON.stringify({ type: 'auth_required' })));
    }

    send(value) {
      if (Buffer.isBuffer(value)) {
        sent.push({ type: 'binary', value });
        if (value.length === 1) {
          this.emit('message', JSON.stringify({ id: 1, type: 'event', event: { type: 'stt-end', data: { stt_output: { text: 'texto transcrito' } } } }));
          this.emit('message', JSON.stringify({ id: 1, type: 'event', event: { type: 'run-end' } }));
        }
        return;
      }
      const parsed = JSON.parse(value);
      sent.push({ type: 'json', value: parsed });
      if (parsed.type === 'auth') {
        this.emit('message', JSON.stringify({ type: 'auth_ok' }));
        return;
      }
      if (parsed.type === 'assist_pipeline/run') {
        this.emit('message', JSON.stringify({ id: 1, type: 'result', success: true }));
        this.emit('message', JSON.stringify({ id: 1, type: 'event', event: { type: 'run-start', data: { conversation_id: 'conv2', runner_data: { stt_binary_handler_id: 7 } } } }));
        if (parsed.start_stage === 'intent') {
          this.emit('message', JSON.stringify({ id: 1, type: 'event', event: { type: 'intent-end', data: { intent_output: { conversation_id: 'conv2', response: { speech: { plain: { speech: 'Respuesta Assist' } } } } } } }));
          this.emit('message', JSON.stringify({ id: 1, type: 'event', event: { type: 'tts-end', data: { tts_output: { url: '/api/tts_proxy/test', mime_type: 'audio/wav' } } } }));
          this.emit('message', JSON.stringify({ id: 1, type: 'event', event: { type: 'run-end' } }));
        }
      }
    }

    close() {}
  };
}

function response(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    text: async () => JSON.stringify(payload),
  };
}

function options() {
  return {
    assist: {
      enabled: true,
      language: 'es',
      agent_id: 'conversation.google',
      pipeline_id: 'pipeline-1',
      device_id: 'device-1',
      audio: { enabled: true, include_text_with_audio: true },
    },
  };
}


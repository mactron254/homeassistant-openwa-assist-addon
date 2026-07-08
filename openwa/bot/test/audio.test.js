'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { preparePcmFromMedia, convertToVoiceNote } = require('../src/audio');

test('converts WhatsApp media to PCM 16k mono', async () => {
  const calls = [];
  const result = await preparePcmFromMedia({ mimetype: 'audio/ogg', data: Buffer.from('ogg').toString('base64') }, fakeRunner(calls));

  assert.equal(result.duration, 1.5);
  assert.equal(fs.existsSync(result.pcm), true);
  assert.deepEqual(calls.find(call => call.command === 'ffmpeg').args.slice(-7), ['-ar', '16000', '-ac', '1', '-f', 's16le', result.pcm]);
});

test('converts HA TTS output to WhatsApp OGG Opus', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assist-audio-'));
  const input = path.join(tmp, 'in.wav');
  const output = path.join(tmp, 'out.ogg');
  fs.writeFileSync(input, 'wav');
  const calls = [];

  const duration = await convertToVoiceNote(input, output, fakeRunner(calls));

  assert.equal(duration, 1.5);
  assert.equal(fs.existsSync(output), true);
  assert.ok(calls.find(call => call.command === 'ffmpeg').args.includes('libopus'));
});

function fakeRunner(calls) {
  return async (command, args) => {
    calls.push({ command, args });
    if (command === 'ffprobe') return { stdout: '1.5\n' };
    if (command === 'ffmpeg') {
      fs.writeFileSync(args.at(-1), 'audio');
      return { stdout: '' };
    }
    throw new Error(command);
  };
}



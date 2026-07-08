'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { BOT_DATA_DIR } = require('./options');

const execFileAsync = promisify(execFile);

function extensionForMime(mimetype) {
  if (/ogg/i.test(mimetype)) return 'ogg';
  if (/mpeg|mp3/i.test(mimetype)) return 'mp3';
  if (/mp4|m4a/i.test(mimetype)) return 'm4a';
  if (/wav/i.test(mimetype)) return 'wav';
  if (/webm/i.test(mimetype)) return 'webm';
  return 'bin';
}

async function preparePcmFromMedia(media, runner = execFileAsync) {
  if (!media?.data) throw new Error('Audio sin datos');
  const tmpDir = path.join(BOT_DATA_DIR, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const input = path.join(tmpDir, `${id}.${extensionForMime(media.mimetype || '')}`);
  const pcm = path.join(tmpDir, `${id}.pcm`);
  fs.writeFileSync(input, Buffer.from(media.data, 'base64'));
  const duration = await probeDuration(input, runner);
  await runner('ffmpeg', ['-y', '-i', input, '-ar', '16000', '-ac', '1', '-f', 's16le', pcm]);
  return { input, pcm, duration };
}

async function convertToVoiceNote(inputPath, outputPath, runner = execFileAsync) {
  await runner('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-map',
    '0:a:0',
    '-c:a',
    'libopus',
    '-b:a',
    '32k',
    '-ar',
    '48000',
    '-ac',
    '1',
    '-f',
    'ogg',
    outputPath,
  ]);
  return probeDuration(outputPath, runner);
}

async function probeDuration(filePath, runner = execFileAsync) {
  const { stdout } = await runner('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);
  const duration = Number(String(stdout || '').trim());
  return Number.isFinite(duration) ? duration : 0;
}

function cleanupFiles(...files) {
  for (const file of files) {
    if (file) fs.rmSync(file, { force: true });
  }
}

module.exports = {
  preparePcmFromMedia,
  convertToVoiceNote,
  probeDuration,
  cleanupFiles,
};


# Handoff

## Current Objective

Clean Home Assistant add-on that bridges WhatsApp/OpenWA to Home Assistant Assist.

## Architecture

- OpenWA dashboard/API stays upstream on port `2785`.
- Helper bot runs on port `2786`.
- WhatsApp inbound uses signed OpenWA webhook `POST /webhook/openwa`.
- Text is sent to Home Assistant `/api/conversation/process`.
- Voice is transcribed by Home Assistant `assist_pipeline/run` before any intent/control step.
- If a voice/text reply should include audio, the helper runs Assist intent-to-TTS, downloads the TTS result, converts it to OGG/Opus, and sends a WhatsApp voice note.
- Home Assistant Voice Assist remains the only source of IA, STT, TTS, entities, scripts, and permissions.

## Important Files

- `openwa/config.yaml`: add-on config and options.
- `openwa/run.sh`: OpenWA + helper startup.
- `openwa/bot/src/server.js`: helper HTTP API.
- `openwa/bot/src/bot.js`: message flow and safety confirmation.
- `openwa/bot/src/assist-client.js`: Home Assistant REST/WebSocket Assist calls.
- `openwa/bot/src/audio.js`: audio conversion for STT and WhatsApp voice notes.

## Verification

Use pnpm 11+:

```bash
corepack pnpm test
```


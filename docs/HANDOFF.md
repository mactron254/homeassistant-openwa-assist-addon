# Handoff

## Current Objective

Clean Home Assistant add-on that bridges WhatsApp/OpenWA to Home Assistant Assist.

## Architecture

- OpenWA dashboard/API stays upstream on port `2785`.
- Helper bot runs on port `2786` in the background.
- Add-on Web UI points to the native OpenWA dashboard for QR/session management.
- WhatsApp inbound uses signed OpenWA webhook `POST /webhook/openwa`.
- Text is sent to Home Assistant `/api/conversation/process`.
- Voice is transcribed by Home Assistant `assist_pipeline/run` before any intent/control step.
- If a voice/text reply should include audio, the helper runs Assist intent-to-TTS, downloads the TTS result, converts it to OGG/Opus, and sends a WhatsApp voice note.
- Home Assistant Voice Assist remains the only source of IA, STT, TTS, entities, scripts, shopping list behavior, and permissions.
- Main Gemini house agent controls Home Assistant with Google Search disabled.
- Optional internet search uses a second Gemini search-only agent through `script.assist_buscar_en_google`.
- Shopping list stays native in Home Assistant. Do not add custom shopping-list scripts.

## Important Files

- `docs/MANUAL_USO.md`: complete user manual for installing, configuring, testing, and troubleshooting.
- `openwa/config.yaml`: add-on config and options.
- `openwa/run.sh`: OpenWA + helper startup.
- `openwa/bot/src/server.js`: helper HTTP API.
- `openwa/bot/src/bot.js`: message flow and safety confirmation.
- `openwa/bot/src/assist-client.js`: Home Assistant REST/WebSocket Assist calls.
- `openwa/bot/src/audio.js`: audio conversion for STT and WhatsApp voice notes.
- `docs/ASSIST_ES_SETUP.md`: Home Assistant setup guide for Gemini, HA STT/TTS, exposed entities, aliases, and WhatsApp pipeline behavior.
- `docs/ASSIST_ENTITY_PLAN.md`: entity exposure plan, prompt, aliases, do-not-expose list, and test phrases.
- `docs/ASSIST_SEARCH_TTS_SHOPPING.md`: optional Gemini Search script, TTS notes, and native shopping-list notes.
- `docs/packages/assist_search_tts_shopping.yaml`: package-ready YAML for optional `script.assist_buscar_en_google`.

## Verification

Use pnpm 11+:

```bash
corepack pnpm test
```

Manual HA checks:

- Add-on Web UI opens the native OpenWA dashboard.
- QR links from OpenWA dashboard and session reaches ready.
- `/health` shows helper OK and Assist enabled.
- Authorized WhatsApp sender: `hola` gets an Assist response.
- Unauthorized sender is ignored.
- `como va la casa` uses Home Assistant Assist.
- `abre garaje` asks for `SI`; `SI` forwards the exact pending text.
- Voice note in Spanish transcribes through the selected HA STT provider.
- `respondeme por audio` returns text plus WhatsApp voice note when TTS is configured.
- Optional: `busca una receta de arroz con verduras` uses `script.assist_buscar_en_google`.
- Shopping list commands use native Home Assistant `todo.shopping_list` if exposed and working.

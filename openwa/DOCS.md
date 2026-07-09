# OpenWA Assist Bridge Documentation

## Ports

| Port | Purpose |
|---:|---|
| `2785` | OpenWA native API and dashboard. |
| `2786` | Helper API, webhook receiver, QR proxy, Assist test, send helper. |

## Options

`api_master_key` protects helper endpoints and is also used as the OpenWA API key when `openwa_api_key` is empty.

`whatsapp.allowed_senders` lists allowed WhatsApp JIDs or phone numbers. This whitelist is required because OpenWA receives messages from any linked chat, but only trusted senders should reach Home Assistant Assist.

`assist.agent_id` selects a Home Assistant conversation agent. Empty uses Home Assistant default.

`assist.pipeline_id` selects a Voice Assist pipeline. Empty uses the preferred pipeline.

`assist.device_id` is optional and is sent to Home Assistant so future Voice Assist device/area context can apply to WhatsApp.

`assist.audio.response_mode=voice_input_or_requested` sends audio replies when the user sent audio or explicitly asked for audio.

## OpenWA Dashboard

The add-on Web UI opens the native OpenWA dashboard on `http://[HOST]:2785/`.

Use that dashboard for QR/session management. The helper runs in the background and registers the OpenWA webhook automatically after OpenWA is ready.

## Critical Confirmation

`assist.safety.confirm_before_patterns` are matched before text is forwarded to Assist. If matched, the bot asks for `SI` and then forwards the exact pending text.

Voice input is transcribed first and then checked against the same patterns before any Assist intent is executed.

## No Local AI

All AI providers, STT, TTS, entity exposure, scripts, shopping list behavior, and permissions are configured in Home Assistant.

Recommended stack:

- Brain: Gemini house agent in Home Assistant, Control Home Assistant ON, Search OFF.
- STT/TTS: Home Assistant pipeline providers, only needed for audio.
- Web search: optional `script.assist_buscar_en_google` using a second search-only Gemini agent.
- Shopping list: native Home Assistant list if exposed and working.

See repository guide `docs/ASSIST_ES_SETUP.md`.

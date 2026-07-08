# OpenWA Assist Bridge Documentation

## Ports

| Port | Purpose |
|---:|---|
| `2785` | OpenWA native API and dashboard. |
| `2786` | Helper API, webhook receiver, QR proxy, send helper. |

## Options

`whatsapp.allowed_senders` lists allowed WhatsApp JIDs or phone numbers.

`assist.agent_id` selects a Home Assistant conversation agent. Empty uses Home Assistant default.

`assist.pipeline_id` selects a Voice Assist pipeline. Empty uses the preferred pipeline.

`assist.device_id` is optional and is sent to Home Assistant so future Voice Assist device/area context can apply to WhatsApp.

`assist.audio.response_mode=voice_input_or_requested` sends audio replies when the user sent audio or explicitly asked for audio.

## Critical Confirmation

`assist.safety.confirm_before_patterns` are matched before text is forwarded to Assist. If matched, the bot asks for `SI` and then forwards the exact pending text.

Voice input is transcribed first and then checked against the same patterns before any Assist intent is executed.

## No Local AI

All AI providers, STT, TTS, entity exposure, scripts, and permissions are configured in Home Assistant.


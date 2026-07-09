# OpenWA Assist Bridge

OpenWA WhatsApp gateway bridged to Home Assistant Assist.

## Services

- OpenWA API and dashboard: `2785`
- Helper API: `2786`

## Home Assistant Setup

Recommended Voice Assist setup:

- Spanish pipeline (`es`).
- House conversation agent: Gemini with Control Home Assistant ON and Search OFF.
- STT/TTS providers selected in Home Assistant only if WhatsApp audio is needed.
- Exposed Home Assistant entities/scripts for Assist.
- Native Home Assistant shopping list if exposed and working.
- Optional `script.assist_buscar_en_google` for internet-only questions.

The add-on inherits that setup. It does not configure IA providers itself.

Setup guide: `docs/ASSIST_ES_SETUP.md` in the add-on repository.

## Device Context

Set `assist.device_id` only if WhatsApp should behave like a specific Assist device or area. Leave it empty for general WhatsApp control.

## WhatsApp Link

Set `api_master_key` and `whatsapp.allowed_senders` in add-on options. Open the add-on Web UI, use the native OpenWA dashboard QR, then link it from WhatsApp under linked devices.

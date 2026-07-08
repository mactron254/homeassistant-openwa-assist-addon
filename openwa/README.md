# OpenWA Assist Bridge

OpenWA WhatsApp gateway bridged to Home Assistant Assist.

## Services

- OpenWA API and dashboard: `2785`
- Helper API: `2786`

## Home Assistant Setup

Configure Voice Assist in Home Assistant:

- Spanish pipeline.
- Conversation agent.
- STT engine.
- TTS engine.
- Exposed entities/scripts for Assist.

The add-on inherits that setup. It does not configure IA providers itself.

## Device Context

Set `assist.device_id` only if WhatsApp should behave like a specific Assist device or area. Leave it empty for general WhatsApp control.


# Spec - OpenWA Assist Bridge

## Goal

Make WhatsApp another Home Assistant Assist client without local AI logic in the add-on.

## Decisions

- No local Groq, Gemini, OpenRouter, `knowledge.csv`, or `commands.json`.
- Home Assistant Voice Assist owns AI/STT/TTS/control permissions.
- The add-on never creates or edits Assist pipelines.
- `assist.pipeline_id` selects a pipeline; empty means Home Assistant preferred pipeline.
- `assist.device_id` is optional future context for area-aware Assist behavior.
- Voice notes are transcribed first, then processed as text, so local critical-pattern confirmation can stop dangerous commands before HA intent execution.

## Acceptance

- Text WhatsApp -> HA Assist -> WhatsApp text.
- Voice WhatsApp -> HA STT -> HA Assist -> WhatsApp text/audio.
- Entity control works only when exposed in Home Assistant Assist.
- Changing the HA Assist pipeline changes WhatsApp behavior without add-on changes.


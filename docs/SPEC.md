# Spec - OpenWA Assist Bridge

## Goal

Make WhatsApp another Home Assistant Assist client without local AI logic in the add-on.

## Decisions

- No local Groq, Gemini, OpenRouter, STT/TTS provider, `knowledge.csv`, or `commands.json` in the add-on.
- Home Assistant Voice Assist owns AI/STT/TTS/control permissions, entity exposure, and shopping-list behavior.
- Recommended HA stack is Gemini house conversation agent with Control Home Assistant ON and Search OFF, Spanish Assist pipeline, and HA-selected STT/TTS providers only for audio.
- The add-on never creates or edits Assist pipelines.
- `assist.pipeline_id` selects a pipeline; empty means Home Assistant preferred pipeline.
- `assist.device_id` is optional future context for area-aware Assist behavior.
- Voice notes are transcribed first, then processed as text, so local critical-pattern confirmation can stop dangerous commands before HA intent execution.

## Acceptance

- Text WhatsApp -> HA Assist -> WhatsApp text.
- Voice WhatsApp -> HA STT -> HA Assist -> WhatsApp text/audio.
- With recommended pipeline, WhatsApp voice uses HA STT and Gemini through Home Assistant, not through local add-on code.
- Entity control works only when exposed in Home Assistant Assist.
- Changing the HA Assist pipeline changes WhatsApp behavior without add-on changes.

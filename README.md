# OpenWA Assist Add-on

Home Assistant add-on repository for OpenWA plus a WhatsApp bridge to Home Assistant Assist.

## Overview

- OpenWA API and dashboard on port `2785`.
- Bot helper API on port `2786`.
- Home Assistant Assist is the only AI, STT, TTS, and home-control brain.
- The add-on does not store Groq, Gemini, OpenRouter, OpenAI, or Google API keys.
- WhatsApp text is sent to Home Assistant Conversation API.
- WhatsApp voice notes are transcribed through Home Assistant Assist pipeline, then answered through the same Assist agent.
- Optional `assist.device_id` lets WhatsApp inherit a future Voice Assist device/area context.
- OpenWA dashboard stays upstream and unchanged.

## Install

1. Add this repository to Home Assistant Add-on Store.
2. Install **OpenWA Assist Bridge**.
3. Configure `whatsapp.allowed_senders`.
4. Configure Home Assistant Voice Assist with a Spanish pipeline, STT, TTS, and conversation agent.
5. Expose the entities and scripts you want Assist to control.
6. Start the add-on and link WhatsApp from the OpenWA dashboard.

## Helper API

Protected endpoints require `X-API-Key`.

- `GET /`
- `GET /health`
- `GET /qr`
- `POST /webhook/openwa`
- `POST /send`
- `POST /send/{alias}`

## Security

Home Assistant controls permissions through exposed Assist entities/scripts. The add-on also blocks configured WhatsApp senders and asks for `SI` before forwarding locally configured critical text patterns.


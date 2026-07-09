# OpenWA Assist Add-on

Home Assistant add-on repository for OpenWA plus a WhatsApp bridge to Home Assistant Assist.

## Overview

- OpenWA API and dashboard on port `2785` through a transparent header-cleaning proxy.
- Bot helper API on port `2786`.
- Home Assistant Assist is the only AI, STT, TTS, and home-control brain.
- The add-on does not store Groq, Gemini, OpenRouter, OpenAI, or Google API keys.
- WhatsApp text is sent to Home Assistant Conversation API.
- WhatsApp voice notes are transcribed through Home Assistant Assist pipeline, then answered through the same Assist agent.
- Optional `assist.device_id` lets WhatsApp inherit a future Voice Assist device/area context.
- OpenWA dashboard stays upstream and unchanged; only CSP/HSTS/frame headers are stripped at the add-on proxy.

## Install

1. Add this repository to Home Assistant Add-on Store.
2. Install **OpenWA Assist Bridge**.
3. Configure `api_master_key` and `whatsapp.allowed_senders`.
4. Configure Home Assistant Assist: Gemini house agent with Control Home Assistant ON, Search OFF, Spanish pipeline `es`, and STT/TTS in Home Assistant only if you want audio.
5. Expose the entities and scripts you want Assist to control.
6. Start the add-on and open the add-on Web UI.
7. Link WhatsApp from the native OpenWA dashboard QR.

Manual completo: [docs/MANUAL_USO.md](docs/MANUAL_USO.md).

Full HA setup: [docs/ASSIST_ES_SETUP.md](docs/ASSIST_ES_SETUP.md).

CSV-derived entity plan: [docs/ASSIST_ENTITY_PLAN.md](docs/ASSIST_ENTITY_PLAN.md).

## Helper API

Protected endpoints require `X-API-Key`.

- `GET /`
- `GET /health`
- `GET /qr`
- `POST /webhook/openwa`
- `POST /assist/test`
- `POST /assist/send`
- `POST /send`

## Security

Home Assistant controls permissions through exposed Assist entities/scripts. The add-on also blocks configured WhatsApp senders and asks for `SI` before forwarding locally configured critical text patterns.

AI provider keys stay in Home Assistant integrations. This add-on does not store Gemini, Groq, OpenAI, OpenRouter, or Google keys.

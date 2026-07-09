# Changelog

## 0.1.10

- Show configured Assist agent_id in helper health output for Gemini/default-agent debugging.

## 0.1.9

- Update existing OpenWA webhook on startup so signature secret stays in sync.
- Fix HTTP 401 webhook delivery after option/API-key changes.

## 0.1.8

- Run the helper as root so it can read Home Assistant /data/options.json reliably.
- Keep OpenWA data directories owned by openwa as before.

## 0.1.7

- Add top-level allowed_senders option as a Home Assistant UI compatibility path.
- Keep whatsapp.allowed_senders supported for existing configs.

## 0.1.6

- Make allowed_senders parsing tolerant of Home Assistant option storage variants.
- Accept nested, flat, string, array, and object-list forms for allowed_senders.

## 0.1.5

- Log normalized allowed_senders at helper startup and on blocked messages.
- Expose loaded allowed_senders through helper health for setup debugging.

## 0.1.4

- Expose OpenWA through the header-cleaning dashboard proxy on port 2785.
- Keep OpenWA internal on port 2787 and allow local helper webhook registration.
- Log ignored WhatsApp senders, including Baileys @lid identifiers, so allowed_senders can be corrected.

## 0.1.3

- Restored add-on Web UI to the native OpenWA dashboard on port `2785`.
- Removed the helper UI routes and files.
- Removed recipient config from the default add-on options; direct replies use the incoming chat and manual sends require `chat_id`.
## 0.1.2

- Use `api_master_key` as the OpenWA API key fallback when `openwa_api_key` is empty.
- Added generic `garaje` to default critical confirmation patterns.
- Aligned docs with Assist-owned Gemini/STT/TTS/shopping-list flow and helper debug endpoints.

## 0.1.1

- Documented recommended Home Assistant Assist stack: Gemini brain, GroqCloud Whisper STT, HA TTS.
- Added setup guide for exposed entities, Spanish aliases, and energy/V2C/SAJ prompts.
- Expanded default critical confirmation patterns for V2C, SAJ, battery, charger, and climate commands.

## 0.1.0

- Initial clean Assist-only add-on.
- Added OpenWA gateway startup.
- Added WhatsApp text to Home Assistant Conversation API.
- Added WhatsApp audio through Home Assistant Assist pipeline.
- Added optional Assist `device_id` context.
- Added local critical-pattern confirmation before forwarding to Assist.

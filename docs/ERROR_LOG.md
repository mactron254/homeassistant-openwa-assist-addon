# Error Log

## 2026-06-24 - OpenWA image tag not found

- Symptom: Home Assistant build failed resolving `ghcr.io/rmyndharis/openwa:v0.7.2`.
- Cause: The documented tag was not published in GHCR.
- Resolution: Default image changed to `ghcr.io/rmyndharis/openwa:latest` until a real tag/digest is selected. Production should pin a published tag or digest.

## 2026-06-24 - Blank OpenWA dashboard assets

- Symptom: Dashboard HTML loaded, JS/CSS assets failed with `ERR_SSL_PROTOCOL_ERROR` from mixed HTTP/HTTPS origin.
- Cause: Browser/session origin mismatch, not custom UI failure.
- Resolution: Keep OpenWA dashboard upstream and use correct HTTP URL or trusted reverse proxy.

## 2026-07-05 - `apply_patch` blocked by Windows ACL helper

- Symptom: `apply_patch` could not read files under `C:\Users\marco\Documents\BOT WP\...`.
- Cause: Sandbox helper ACL failure on workspace path.
- Resolution: Used controlled PowerShell file rewrites, then verified with `git diff` and tests.

## 2026-07-05 - UI architecture council

- Decision: Do not modify OpenWA dashboard and do not add custom UI in v0.6.0.
- Reason: Upstream update risk and security surface are too high. Helper endpoints must stay authenticated.
- Future: A companion UI can be added behind Home Assistant ingress after the bot core is stable.

## 2026-07-08 - Rebuild as Assist-only bridge

- Symptom: Local Groq/Gemini/OpenRouter agent design duplicated Home Assistant Assist responsibilities and made config too complex.
- Cause: The add-on tried to be both WhatsApp transport and home AI brain.
- Resolution: Start clean repo homeassistant-openwa-assist-addon. Home Assistant Voice Assist owns IA/STT/TTS/permissions. Add-on only bridges OpenWA WhatsApp to official HA Assist APIs.


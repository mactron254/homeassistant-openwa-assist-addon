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

## 2026-07-08 - Avoid duplicate Groq STT add-on

- Symptom: Planned Wyoming Groq STT add-on duplicated existing community work.
- Cause: Existing HACS integration `fabio-garavini/ha-openai-whisper-stt-api` already provides GroqCloud Whisper as a Home Assistant STT entity.
- Resolution: Do not create a new STT add-on now. Use HACS OpenAI Whisper Cloud with GroqCloud `whisper-large-v3-turbo`, then keep WhatsApp bridge pointed at the HA Assist pipeline.

## 2026-07-08 - HA token found in export helper

- Symptom: `extraer_entidades.py` stored a long-lived Home Assistant token in plain text.
- Cause: Quick export script embedded the token directly.
- Resolution: Script now reads `HA_TOKEN` from environment. Revoke the exposed token in Home Assistant and create a new one if needed.

## 2026-07-09 - Gemini Search cannot share HA control agent

- Symptom: Wanted internet questions, recipes, and current info while the main Gemini agent controls Home Assistant.
- Cause: Home Assistant documents that Google Search cannot be enabled together with `Control Home Assistant` in the same Gemini agent.
- Resolution: Documented a second Gemini search-only agent plus `script.assist_buscar_en_google`. Main agent keeps Search disabled and calls the script only for internet questions.

## 2026-07-09 - Shopping list read/write through Assist

- Symptom: Shopping list needed add, remove, bought, read, clear, and sort via natural Spanish.
- Cause: `shopping_list` actions mutate items, while reading pending items needs `todo.get_items` with `response_variable`.
- Resolution: Documented exposed scripts for each shopping-list action and a read script returning pending items to Gemini/Assist.
## 2026-07-09 - Gemini rejects empty todo_list enum

- Symptom: Google Generative AI returned `GenerateContentRequest.tools[0].function_declarations[12].parameters.properties[todo_list].enum[1]: cannot be empty`.
- Cause: A To-do/Shopping List tool exposed to Gemini produced an empty enum value before any script ran.
- Resolution: Do not expose `todo.shopping_list` directly to Gemini. Keep `shopping_list:` enabled and expose only package scripts; scripts call `todo.shopping_list` internally. If error persists, remove blank aliases/names from all `todo.*` entities and isolate by disabling list scripts temporarily.

## 2026-07-09 - Shopping List YAML deprecated

- Symptom: Home Assistant reports that `shopping_list:` YAML config will stop working in 2026.11.0.
- Cause: Shopping List has been imported to the UI and YAML setup is deprecated.
- Resolution: Removed `shopping_list:` from package docs. Keep Shopping List configured through UI; package contains scripts only.
## 2026-07-09 - Gemini todo_list error persists after restart

- Symptom: Search query `que paso ayer en Gava` still fails with `todo_list.enum[1]: cannot be empty` after restart.
- Cause: The Gemini request is still being built with a broken To-do tool from Home Assistant before Search runs.
- Resolution: Use the second search-only Gemini agent directly for internet tests. Then isolate by disabling Shopping List exposure/scripts/integration until the broken To-do tool disappears.
## 2026-07-09 - Removed custom shopping-list scripts

- Symptom: Custom `script.lista_compra_*` duplicated Home Assistant native Shopping List tooling and could trigger Gemini `todo_list.enum` failures.
- Cause: Native `todo.shopping_list` works in Marco's Home Assistant after UI import.
- Resolution: Package now keeps only `script.assist_buscar_en_google`. Shopping list stays native through Home Assistant UI.

## 2026-07-09 - Helper UI auth issue, superseded

- Symptom: A helper UI needed explicit `X-API-Key` handling in the browser.
- Cause: Home Assistant add-on Web UI does not inject helper API headers.
- Resolution: Superseded. The helper UI was removed and the add-on Web UI now opens the native OpenWA dashboard.
## 2026-07-09 - Helper missed OpenWA key fallback

- Symptom: With only `api_master_key` configured, the helper could fail OpenWA session/webhook setup because it did not have an OpenWA API key.
- Cause: `run.sh` starts OpenWA with `API_MASTER_KEY=api_master_key`, but helper code only read `openwa_api_key` or `/data/openwa/.api-key`.
- Resolution: `readOpenWaApiKey` now falls back to `api_master_key`; regression test added.
## 2026-07-09 - Removed helper UI scope

- Symptom: The add-on had a small helper UI even though OpenWA already provides the dashboard needed for QR and session management.
- Cause: Extra UI duplicated OpenWA basics and made the add-on feel less minimal.
- Resolution: Restored the Home Assistant Web UI target to OpenWA on port `2785`, removed helper UI routes/files, and kept the helper API in the background.

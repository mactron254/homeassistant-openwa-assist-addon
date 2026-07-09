# Assist ES Setup - Gemini + HA STT/TTS + WhatsApp

This add-on does not configure AI providers. Home Assistant Assist owns AI, STT,
TTS, entity exposure, scripts, permissions, and conversation behavior.

## Target Pipeline

- Conversation agent: official Home Assistant Google Gemini integration.
- Pipeline language: `es`.
- STT: any Home Assistant STT provider selected in the pipeline; needed only for WhatsApp audio.
- TTS: any Home Assistant TTS provider selected in the pipeline; needed only for audio replies.
- Tested STT option: HACS `OpenAI Whisper Cloud` with GroqCloud `whisper-large-v3-turbo`.
- WhatsApp: OpenWA Assist Bridge uses the same Assist pipeline through Home Assistant APIs.

## Google Gemini Brain

1. In AI Studio, create an API key for the free project.
2. In Home Assistant, add the official `Google Gemini` integration.
3. Enable `Control Home Assistant` for the main Gemini conversation agent.
4. Keep `Google Search tool` disabled on the main agent. Home Assistant cannot use Google Search together with Assist control/tool calling in the same agent.
5. Prefer model `gemini-3.1-flash-lite` if Home Assistant lists it.
6. If not listed, use Home Assistant recommended settings or `gemini-2.5-flash-lite`.
7. Use a second Gemini agent for internet search. That second agent must have `Control Home Assistant` disabled and `Google Search tool` enabled.

Marco free-tier reference from AI Studio:

- `gemini-3.1-flash-lite`: `15 RPM`, `250K TPM`, `500 RPD`.

Do not hard-code these as permanent truth. Check AI Studio before debugging rate limits.

Recommended Gemini instructions:

```text
Eres el asistente de la casa de Marco. Responde siempre en espanol de Espana, breve y claro.
Usa solo datos reales de Home Assistant. Si falta una entidad o dato, dilo y no inventes.
Para energia, revisa solar, consumo, bateria, red, cargador, V2C y SAJ si estan expuestos.
Antes de acciones sensibles como cerraduras, alarma, garaje, bateria, cargador, V2C, SAJ o climatizacion extrema, pide confirmacion.
Cuando ejecutes una accion, confirma que has hecho y donde.
Para preguntas de internet, actualidad, recetas, precios, noticias o datos no presentes en Home Assistant, usa la herramienta "Assist: Search Google". No uses internet para estados de la casa.
Para lista de la compra, usa la entidad nativa de Home Assistant si esta expuesta y funciona. No uses scripts propios de lista compra.
```

Recommended manual settings:

- Temperature: `0.2`.
- Top P: `0.8`.
- Top K: `40`.
- Max output tokens: `800`-`1000`.
- Safety: keep the default `Block some` settings unless they block normal house use.

## STT In Home Assistant

The add-on does not run STT locally. It sends PCM audio to the selected Home Assistant Assist pipeline. One tested STT option is this HACS integration:

```text
https://github.com/fabio-garavini/ha-openai-whisper-stt-api
```

Configure:

- Provider: `GroqCloud`.
- Model: `whisper-large-v3-turbo`.
- Temperature: `0`.
- Prompt:

```text
Marco, Home Assistant, V2C, EVCC, SAJ, AS1, cargador, placas, bateria, autoconsumo, solar
```

Groq free-tier reference for Whisper:

- `20 RPM`
- `2K RPD`
- `7.2K audio seconds/hour`
- `28.8K audio seconds/day`

If Home Assistant passes a regional language that fails, such as `es-ES`, first try pipeline language `es`. Only fork/patch the HACS integration if that is not enough.

## TTS In Home Assistant

The add-on does not run TTS locally. It asks Home Assistant Assist for TTS output when audio reply is requested. Microsoft TTS is one natural option:

- Azure Speech Free F0.
- Voice: `es-ES-ElviraNeural`.
- Male alternative: `es-ES-AlvaroNeural`.
- Free reference: `0.5M` neural characters/month.

Example:

```yaml
tts:
  - platform: microsoft
    api_key: !secret azure_speech_key
    region: westeurope
    language: es-ES
    type: ElviraNeural
    rate: 0
    volume: 0
    pitch: default
```

The `region` must match the Azure Speech resource. If Azure/billing is not wanted,
use HACS `hasscc/hass-edge-tts` with `es-ES-ElviraNeural`. Piper remains a Home Assistant local fallback, but usually sounds less natural.

## Gemini Search Agent

Create a second Google Gemini conversation agent:

- `Control Home Assistant`: disabled.
- `Recommended settings`: disabled if needed to expose `Google Search tool`.
- `Google Search tool`: enabled.
- Max output tokens: higher than the main agent, for example `2000`.

Optional: expose `script.assist_buscar_en_google` to Assist. The script should call
`conversation.process` against the second Gemini agent and return
`result.response.speech.plain.speech`. Full YAML is in `docs/ASSIST_SEARCH_TTS_SHOPPING.md`.

Use this only for internet/current information. House state must keep using exposed
Home Assistant entities.

## Shopping List

Use Home Assistant native `Shopping list` from the UI. If `todo.shopping_list` works with Gemini in your installation, keep it native and do not add custom shopping-list scripts. This avoids duplicate tools and previous `todo_list.enum` errors.

Do not add `shopping_list:` to YAML because Home Assistant deprecates that in 2026.11.

## Entity Exposure

Expose the minimum set. More exposed entities means slower matching, larger LLM context, and more accidental control surface.

Priority expose list:

- Energy sensors: solar power, house consumption, grid import/export, battery power, battery SOC.
- Charger/V2C/SAJ entities needed for read and safe control.
- Lights/switches actually controlled by voice.
- Climate/cover/lock/alarm only when needed.
- Native `todo.shopping_list` only if it works in your HA instance; do not add custom list scripts.
- Optional `script.assist_buscar_en_google` for web-only questions.

Add Spanish aliases:

- `placas`, `planta solar`, `solar`
- `bateria`, `bateria SAJ`, `SAJ`
- `cargador`, `V2C`, `wallbox`
- `autoconsumo`, `modo solar`
- `lista de la compra`, `compra`, `supermercado`
- `buscar en internet`, `Google`, `recetas`, `noticias`

Use scripts only for complex or dangerous macros. Give each exposed script a clear LLM description, including when it should be used and whether it is dangerous.

## WhatsApp Add-on Options

- Leave `assist.agent_id` empty if Gemini is the default Assist agent.
- Set `assist.agent_id` only when WhatsApp must use a specific agent entity.
- Leave `assist.pipeline_id` empty to use the preferred HA pipeline.
- Set `assist.pipeline_id` when WhatsApp needs a dedicated Spanish pipeline.
- Leave `assist.device_id` empty for general WhatsApp context.
- Set `assist.device_id` later if WhatsApp should inherit a satellite area.

Keep local add-on critical patterns for an extra transport guard. Home Assistant still remains final permission owner.

## Acceptance Tests

- HA text: `como va la energia hoy` returns real exposed energy states.
- HA voice: `pon V2C en solar` transcribes V2C correctly.
- WhatsApp text reaches Gemini through Assist.
- WhatsApp audio reaches the selected Home Assistant STT provider, then Gemini, then WhatsApp reply.
- WhatsApp text `busca una receta de arroz con verduras` uses the exposed search script, not house entities.
- HA/WhatsApp text `anade leche a la lista de la compra` uses native `todo.shopping_list` if exposed and working.
- Sensitive command asks confirmation before execution.
- Removing an exposed entity makes Gemini unable to read/control it.
- Future Voice Assist satellite using same pipeline behaves like WhatsApp.

## References

- https://www.home-assistant.io/integrations/google_generative_ai_conversation/
- https://www.home-assistant.io/voice_control/best_practices/
- https://www.home-assistant.io/voice_control/voice_remote_expose_devices/
- https://www.home-assistant.io/voice_control/aliases/
- https://www.home-assistant.io/integrations/tts/
- https://www.home-assistant.io/integrations/microsoft/
- https://azure.microsoft.com/en-us/pricing/details/speech/
- https://github.com/hasscc/hass-edge-tts
- https://www.home-assistant.io/integrations/shopping_list/
- https://www.home-assistant.io/actions/todo.get_items/
- https://github.com/fabio-garavini/ha-openai-whisper-stt-api
- https://console.groq.com/docs/speech-to-text
- https://console.groq.com/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/rate-limits
# Assist ES - TTS Natural, Gemini Search, Lista Compra

Este documento configura Home Assistant Assist para que WhatsApp herede la misma
voz, busqueda y lista de la compra. El add-on no guarda claves de IA ni ejecuta
IA local.

## Package Listo

Paquete listo para copiar a Home Assistant:

```text
/config/packages/assist_search_tts_shopping.yaml
```

Archivo del repo:

```text
docs/packages/assist_search_tts_shopping.yaml
```

Asegura que `configuration.yaml` tenga packages activados:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

El paquete incluye solo el script de busqueda. No incluye `shopping_list:` ni scripts de lista compra porque Home Assistant lo gestiona desde UI. Cambia
`conversation.google_generative_ai_2` por el entity id real del agente Gemini de
busqueda. TTS Microsoft/Edge/Piper queda fuera del paquete porque normalmente se
configura desde UI o con secrets propios del proveedor.
## TTS Natural Gratis

Opcion principal: Microsoft TTS oficial de Home Assistant.

- Crea un recurso Azure Speech en plan Free F0.
- Usa la region del recurso Azure en `configuration.yaml`.
- Voz recomendada: `es-ES-ElviraNeural`.
- Alternativa masculina: `es-ES-AlvaroNeural`.
- Límite de referencia F0: `0.5M` caracteres neural/mes gratis.

Ejemplo:

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

Si Azure no encaja, usa HACS `hasscc/hass-edge-tts`. Es no oficial, pero no
necesita API key y usa voces Microsoft Edge como `es-ES-ElviraNeural`.

Piper queda como fallback local. Es gratis y privado, pero normalmente suena mas
robotico que Microsoft neural.

## Gemini Con Busqueda Internet

No mezclar busqueda con agente principal de casa. Home Assistant indica que
`Google Search tool` no puede convivir con `Control Home Assistant`.

Config final:

- Agente principal: Gemini con `Control Home Assistant` activado y Search
  desactivado.
- Agente busqueda: segunda instancia Gemini con `Control Home Assistant`
  desactivado y `Google Search tool` activado.
- Script expuesto: `script.assist_buscar_en_google`.

Instrucciones del agente de busqueda:

```text
Responde siempre en espanol de Espana, breve y claro.
Usa Google Search para informacion actual, recetas, precios, noticias y datos de internet.
No controles Home Assistant ni hables como si tuvieras acceso a la casa.
Cuando uses fuentes, resume y menciona de donde sale la respuesta.
```

Script recomendado. Cambia `conversation.google_generative_ai_2` por el entity
id real del segundo agente Gemini:

```yaml
assist_buscar_en_google:
  alias: "Assist: Search Google"
  description: >-
    Busca en Google con un segundo agente Gemini sin control de Home Assistant.
    Usalo solo para internet, actualidad, recetas, precios, noticias o datos no
    presentes en la casa.
  fields:
    query:
      name: Query
      description: Pregunta exacta para buscar en internet.
      required: true
      selector:
        text: null
  sequence:
    - action: conversation.process
      data:
        agent_id: conversation.google_generative_ai_2
        text: "{{ query }}"
      response_variable: result
    - variables:
        result:
          response: "{{ result.response.speech.plain.speech }}"
    - stop: ""
      response_variable: result
  mode: single
```

Expose este script a Assist. No expongas el segundo agente como controlador de
casa.

## Lista Compra

Usa la entidad nativa `todo.shopping_list` de Home Assistant desde la UI si funciona en tu instalacion. No mantenemos scripts propios de lista compra porque duplican herramientas y pueden provocar errores `todo_list.enum` en Gemini.

No pongas `shopping_list:` en YAML. Home Assistant ya lo importa desde UI y YAML queda deprecated desde 2026.11.

## Gemini Live

El flujo Gemini Live visto en la comunidad es prometedor para Home Assistant Voice PE
por latencia y conversacion mas natural, pero queda fuera de v1: requiere add-on/proxy
extra, firmware o configuracion experimental, y no es oficial. Mantener pipeline Assist
normal para produccion y revisar Live mas adelante.

## Prompt Extra Agente Principal

Anade esto al final de las instrucciones del Gemini principal:

```text
Para preguntas de internet, actualidad, recetas, precios, noticias o datos no presentes en Home Assistant, usa la herramienta "Assist: Search Google". No uses internet para estados de la casa.
Para lista de la compra, usa la entidad nativa de Home Assistant si esta expuesta y funciona. No uses scripts propios de lista compra.
```

## Pruebas

- `respóndeme por audio` usa Microsoft/Edge/Piper desde pipeline Assist.
- `busca una receta de arroz con verduras` usa `script.assist_buscar_en_google`.
- `como va la energia hoy` no busca internet y usa entidades HA.
- `anade leche a la lista de la compra` usa la entidad nativa `todo.shopping_list` si esta expuesta y funciona.

## Troubleshooting: todo_list enum empty

Si Gemini devuelve `todo_list.enum[1]: cannot be empty`, la peticion falla antes de que Gemini conteste. Causa: Home Assistant esta enviando una herramienta To-do/Shopping List con un nombre o alias vacio.

Fix recomendado:

1. Usa Shopping List nativa desde UI.
2. No uses scripts propios `script.lista_compra_*`.
3. No pongas `shopping_list:` en YAML.
4. En entidades, abre cada `todo.*` y elimina aliases vacios.
5. Pon nombre claro a `todo.shopping_list`: `Lista de la compra`.
6. Si persiste, desactiva temporalmente la exposicion de `todo.*` y prueba Gemini.

Workaround para busquedas: prueba la misma frase desde el segundo agente Gemini de busqueda directamente, no desde el agente principal de casa.

## Fuentes

- https://www.home-assistant.io/integrations/google_generative_ai_conversation/
- https://ai.google.dev/gemini-api/docs/google-search
- https://www.home-assistant.io/integrations/tts/
- https://www.home-assistant.io/integrations/microsoft/
- https://azure.microsoft.com/en-us/pricing/details/speech/
- https://github.com/hasscc/hass-edge-tts
- https://www.home-assistant.io/integrations/shopping_list/
- https://www.home-assistant.io/actions/todo.get_items/
- https://community.home-assistant.io/t/experimental-gemini-live-streaming-voice-flow-for-home-assistant-voice-pe/1008665

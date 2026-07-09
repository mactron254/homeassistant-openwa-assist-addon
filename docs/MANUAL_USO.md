# Manual de uso - OpenWA Assist Bridge

## 1. Que hace este add-on

OpenWA Assist Bridge convierte WhatsApp en un cliente de Home Assistant Assist.

Flujo real:

```text
WhatsApp -> OpenWA -> helper del add-on -> Home Assistant Assist -> OpenWA -> WhatsApp
```

El add-on no tiene IA propia. Home Assistant mantiene:

- Gemini o el agente conversacional que elijas.
- Permisos de Assist.
- Entidades expuestas.
- STT para audio.
- TTS para respuestas por voz.
- Lista de la compra nativa.
- Scripts opcionales como busqueda en Google.

OpenWA mantiene:

- Sesion WhatsApp.
- QR de vinculacion.
- Recepcion de mensajes.
- Envio de texto y audio.

El helper del add-on mantiene:

- Webhook de OpenWA.
- Filtro de remitentes autorizados.
- Confirmacion local para comandos criticos.
- Llamadas a Home Assistant Assist.

## 2. Puertos y pantallas

| Puerto | Uso |
|---:|---|
| `2785` | Dashboard/API nativa OpenWA. |
| `2786` | Helper API interno del bridge. |

La Web UI del add-on abre OpenWA nativo en:

```text
http://[HOST]:2785/
```

No hay panel movil propio. QR y sesion se gestionan desde OpenWA.

## 3. Requisitos previos

Antes de arrancar el add-on:

1. Home Assistant Assist responde bien desde Home Assistant.
2. El agente de casa esta configurado.
3. Las entidades que quieres controlar estan expuestas a Assist.
4. Si quieres audio entrante, el pipeline tiene STT.
5. Si quieres audio saliente, el pipeline tiene TTS.
6. Tienes tu numero WhatsApp permitido en formato `34XXXXXXXXX` o `34XXXXXXXXX@c.us`.

Configuracion recomendada del agente casa:

- Gemini con `Control Home Assistant` activado.
- Google Search desactivado en el agente principal.
- Idioma/pipeline `es`.
- Respuestas breves en espanol.
- Entidades expuestas solo las necesarias.

## 4. Instalacion en Home Assistant

1. Abre Home Assistant.
2. Ve a **Ajustes -> Complementos -> Tienda de complementos**.
3. Abre menu de repositorios.
4. Anade este repositorio:

```text
https://github.com/mactron254/homeassistant-openwa-assist-addon
```

5. Instala **OpenWA Assist Bridge**.
6. Entra en la pestana **Configuracion** del add-on.
7. Rellena opciones minimas.
8. Guarda.
9. Arranca el add-on.
10. Abre la Web UI del add-on.
11. Vincula WhatsApp desde el QR de OpenWA.

## 5. Configuracion minima del add-on

Ejemplo base:

```yaml
api_master_key: "CAMBIA_ESTA_CLAVE_LARGA"
openwa_api_key: ""
session_id: ""
log_level: "info"
engine_type: "baileys"

whatsapp:
  allowed_senders:
    - "34XXXXXXXXX"

assist:
  enabled: true
  language: "es"
  agent_id: ""
  pipeline_id: ""
  device_id: ""
  conversation_ttl_hours: 24
  audio:
    enabled: true
    response_mode: "voice_input_or_requested"
    include_text_with_audio: true
    max_audio_seconds: 120
  safety:
    confirm_before_patterns:
      - "desbloquea"
      - "cerradura"
      - "alarma"
      - "garaje"
      - "abre garaje"
      - "abre puerta"
      - "v2c"
      - "saj"
      - "bateria"
      - "cargador"
      - "climatizacion"
```

Notas:

- `api_master_key`: clave larga propia. Protege helper y, si `openwa_api_key` esta vacio, tambien se usa para OpenWA.
- `openwa_api_key`: dejalo vacio salvo que quieras separar clave OpenWA y clave helper.
- `session_id`: dejalo vacio. El helper crea/guarda sesion si puede.
- `allowed_senders`: obligatorio para seguridad. OpenWA recibe chats; helper decide quien puede hablar con Assist.
- No hace falta `recipients.primary`. Las respuestas normales vuelven al chat entrante.

## 6. Vincular WhatsApp

1. Arranca el add-on.
2. Abre **Web UI** del add-on.
3. Veras el dashboard nativo OpenWA.
4. Busca la sesion creada o arranca la sesion si aparece parada.
5. Escanea el QR desde WhatsApp:

```text
WhatsApp -> Dispositivos vinculados -> Vincular dispositivo
```

6. Espera a que la sesion quede `ready` o equivalente.
7. Desde el numero autorizado, envia `hola` al WhatsApp vinculado.

## 7. Como funciona cada mensaje

Texto normal:

```text
WhatsApp texto -> OpenWA webhook -> helper -> /api/conversation/process -> respuesta texto
```

Audio:

```text
WhatsApp audio -> OpenWA media -> ffmpeg PCM 16k mono -> assist_pipeline/run STT -> Assist -> respuesta
```

Respuesta por audio:

```text
Assist TTS -> descarga audio HA -> ffmpeg OGG/Opus -> OpenWA send-audio -> nota de voz WhatsApp
```

El modo por defecto `voice_input_or_requested` manda audio cuando:

- El usuario mando nota de voz.
- El usuario pidio audio, por ejemplo `respondeme por audio`.

## 8. Confirmaciones de seguridad

Antes de enviar a Assist, el helper busca patrones criticos.

Ejemplo:

```text
Usuario: abre garaje
Bot: Accion critica detectada: "abre garaje". Responde SI para confirmar.
Usuario: SI
Bot: envia "abre garaje" a Home Assistant Assist
```

Esto no sustituye permisos de Home Assistant. Es una segunda barrera local para WhatsApp.

Patrones criticos recomendados:

- garaje
- alarma
- cerradura
- desbloquea
- V2C
- SAJ
- bateria
- cargador
- climatizacion

## 9. Pruebas recomendadas

### Prueba helper

Endpoint:

```text
GET http://HOST:2786/health
```

Debe devolver `helper: ok` y `assist_enabled: true`.

### Prueba Assist sin WhatsApp

```bash
curl -X POST http://HOST:2786/assist/test \
  -H "X-API-Key: CAMBIA_ESTA_CLAVE_LARGA" \
  -H "Content-Type: application/json" \
  -d '{"text":"como va la casa"}'
```

### Prueba enviar WhatsApp manual

```bash
curl -X POST http://HOST:2786/assist/send \
  -H "X-API-Key: CAMBIA_ESTA_CLAVE_LARGA" \
  -H "Content-Type: application/json" \
  -d '{"text":"hola","chat_id":"34XXXXXXXXX"}'
```

### Pruebas desde WhatsApp

- `hola`
- `como va la casa`
- `enciende una luz expuesta`
- `abre garaje` -> debe pedir `SI`
- `SI` -> ejecuta la orden pendiente
- Nota de voz en espanol
- `respondeme por audio`

### Prueba remitente no autorizado

Envia un mensaje desde otro numero. Debe ignorarse.

## 10. Audio: STT y TTS

El add-on no configura STT/TTS. Solo usa el pipeline de Home Assistant.

Para audio entrante necesitas STT en el pipeline.

Para audio saliente necesitas TTS en el pipeline.

Opciones tipicas:

- STT: proveedor configurado en Home Assistant Assist.
- TTS: Microsoft, Edge TTS, Piper u otro proveedor soportado por Home Assistant.

Si texto funciona pero audio no:

1. Prueba el pipeline desde Home Assistant.
2. Revisa que STT este configurado.
3. Revisa logs del add-on.
4. Revisa que `ffmpeg` pueda convertir el audio.

## 11. Busqueda en internet opcional

No actives Google Search en el agente principal de casa si ese agente controla Home Assistant.

Arquitectura recomendada:

- Agente principal: Gemini con Control Home Assistant ON y Search OFF.
- Segundo agente: Gemini con Control Home Assistant OFF y Search ON.
- Script expuesto a Assist: `script.assist_buscar_en_google`.

El paquete opcional esta en:

```text
docs/packages/assist_search_tts_shopping.yaml
```

## 12. Lista de la compra

Usa la lista nativa de Home Assistant si funciona en tu instalacion.

No anadas scripts propios de lista de la compra salvo que sea estrictamente necesario.

No pongas `shopping_list:` en YAML si Home Assistant ya la importa desde UI.

## 13. Troubleshooting

### Web UI no carga

- Comprueba que el add-on esta arrancado.
- Comprueba puerto `2785`.
- Revisa logs del add-on.

### QR no aparece

- En OpenWA, arranca/reinicia la sesion.
- Comprueba `engine_type: baileys`.
- Borra sesion solo si entiendes que tendras que vincular de nuevo.

### Helper dice OpenWA API key no disponible

- Rellena `api_master_key`.
- Deja `openwa_api_key` vacio salvo que quieras clave separada.
- Reinicia el add-on.

### Mensajes WhatsApp no responden

- Comprueba que el numero esta en `whatsapp.allowed_senders`.
- Usa formato `34XXXXXXXXX` o `34XXXXXXXXX@c.us`.
- Comprueba que la sesion OpenWA esta ready.
- Revisa que el webhook se haya registrado.
- Revisa logs del add-on.

### Assist no responde

- Prueba Assist desde Home Assistant primero.
- Comprueba `assist.enabled: true`.
- Si usas agente concreto, revisa `assist.agent_id`.
- Si usas pipeline concreto, revisa `assist.pipeline_id`.

### Comando sensible no ejecuta

- Si pide confirmacion, responde exactamente `SI`.
- Si no quieres confirmacion para un texto, quita o ajusta el patron en `assist.safety.confirm_before_patterns`.

### Audio no responde por voz

- Revisa `assist.audio.enabled`.
- Revisa `assist.audio.response_mode`.
- Revisa TTS en Home Assistant.
- Prueba `respondeme por audio`.

## 14. Mantenimiento del proyecto

Comandos de desarrollo:

```bash
cd openwa/bot
corepack pnpm test
```

Validar YAML del add-on:

```bash
python -c "import yaml, pathlib; yaml.safe_load(pathlib.Path('openwa/config.yaml').read_text()); print('yaml ok')"
```

Archivos importantes:

- `openwa/config.yaml`: opciones del add-on.
- `openwa/run.sh`: arranque OpenWA + helper.
- `openwa/bot/src/server.js`: API helper y webhook.
- `openwa/bot/src/bot.js`: flujo de mensajes y confirmaciones.
- `openwa/bot/src/assist-client.js`: llamadas a Home Assistant Assist.
- `openwa/bot/src/audio.js`: conversion de audio.
- `docs/ERROR_LOG.md`: errores conocidos y resoluciones.
- `docs/HANDOFF.md`: contexto para continuar en otro chat.
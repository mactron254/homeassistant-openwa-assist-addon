# Assist Entity Plan - Marco Home

Source CSV: `mis_entidades (3).csv`

Summary:

- Total entities: 1124.
- `unavailable`/`unknown`: 315. Do not expose these until fixed.
- Main areas found: `Garaje`, `Garage`, `PDC`, `Can Picafort`, `Cocina`, `Terraza cocina`, `Salón`, `Pasillo`, bedrooms.
- Main goal: natural Spanish questions about energy, SAJ battery, V2C charger, car, climate, and selected scripts.

## Gemini Instructions

Paste this in Google Gemini conversation agent instructions:

```text
Eres el asistente de la casa de Marco. Responde siempre en español de España, breve y claro.
Usa solo datos reales de Home Assistant. Si falta una entidad o dato, dilo y no inventes.

Contexto de la casa:
- "placas", "solar" y "planta solar" significan producción fotovoltaica.
- "batería", "SAJ" y "batería solar" significan el inversor/batería SAJ AS1 del garaje.
- "cargador", "V2C", "Trydan", "wallbox" y "cargador del coche" significan el cargador V2C del garaje.
- "coche" normalmente significa VW Passat.

Para energía actual, revisa producción solar, consumo casa, importación/exportación de red, SOC de batería SAJ, carga/descarga de batería y estado del cargador V2C.
Para energía de hoy, revisa energía solar diaria, consumo casa diario, energía importada/exportada y forecast Solcast si está expuesto.
Para V2C, distingue entre pausar/reanudar carga, intensidad de carga, estado conectado/cargando/listo y energía/potencia de carga.
Para SAJ, distingue autoconsumo, backup/reserva, modo de usuario, SOC, potencia solar, potencia casa y red.

Antes de acciones sensibles como puerta parking, cerraduras, alarma, batería SAJ, V2C/cargador, climatización extrema, red/AdGuard/router, riego o cámara, pide confirmación clara.
Cuando ejecutes una acción, confirma qué has hecho y dónde.
Si una entidad está unavailable/unknown, dilo y no la uses para concluir.
```

Recommended model settings:

- Model: `gemini-3.1-flash-lite`.
- Temperature: `0.2` or `0.3`.
- Top P: `0.8`.
- Top K: `40`.
- Max output tokens: `800`-`1000`.
- Home Assistant control: enabled.
- Google Search tool: disabled in this main control agent.
- Internet search: expose `script.assist_buscar_en_google`, backed by a second Gemini agent with Home Assistant control disabled and Google Search enabled.

## Expose First - Read Sensors

Energy / SAJ / solar:

- `sensor.saj_as1_inverter_potencia_solar_total` - alias: solar ahora, placas ahora, producción solar.
- `sensor.saj_as1_inverter_potencia_casa` - alias: consumo casa, consumo actual.
- `sensor.saj_as1_inverter_importar_de_la_red` - alias: importación red, comprando luz.
- `sensor.saj_as1_inverter_exportar_a_la_red` - alias: exportación red, vertido.
- `sensor.saj_as1_inverter_nivel_de_bateria_soc` - alias: batería SAJ, SOC batería, porcentaje batería.
- `sensor.saj_as1_inverter_carga_de_bateria` - alias: cargando batería.
- `sensor.saj_as1_inverter_descarga_de_bateria` - alias: descargando batería.
- `sensor.saj_as1_inverter_modo_de_funcionamiento` - alias: modo SAJ, modo batería.
- `sensor.saj_as1_inverter_energia_solar_total` - alias: solar total.
- `sensor.saj_as1_inverter_energia_consumida_casa` - alias: consumo casa total.
- `sensor.saj_as1_inverter_energia_importada_de_red` - alias: importada red.
- `sensor.saj_as1_inverter_energia_exportada_a_red` - alias: exportada red.
- `sensor.garaje_saj_as1_inverter_consumo_casa_diario` - alias: consumo hoy.
- `sensor.garaje_saj_as1_inverter_energia_exportada_diaria` - alias: exportado hoy.
- `sensor.garaje_saj_as1_inverter_energia_importada_diaria` - alias: importado hoy.
- `sensor.garaje_saj_as1_inverter_energia_cargada_bateria_diaria` - alias: batería cargada hoy.
- `sensor.garaje_saj_as1_inverter_energia_bateria_descargada_diaria` - alias: batería descargada hoy.
- `binary_sensor.saj_as1_is_connected` - alias: SAJ conectado, inversor conectado.

Solar forecast:

- `sensor.solcast_pv_forecast_pronostico_hoy` - alias: forecast solar hoy, previsión solar hoy.
- `sensor.solcast_pv_forecast_pronostico_manana` - alias: forecast solar mañana.
- `sensor.solcast_pv_forecast_poder_ahora` - alias: previsión solar ahora.
- `sensor.solcast_pv_forecast_poder_en_1_hora` - alias: previsión solar en una hora.
- `sensor.solcast_pv_forecast_pronostico_maximo_hoy` - alias: pico solar hoy.
- `sensor.solcast_pv_forecast_hora_pico_hoy` - alias: hora pico solar hoy.

V2C / charger:

- `binary_sensor.garaje_v2c_cargador_conectado` - alias: coche conectado, cargador conectado.
- `binary_sensor.garaje_v2c_cargador_cargando` - alias: coche cargando, V2C cargando.
- `binary_sensor.garaje_v2c_cargador_listo` - alias: V2C listo, cargador listo.
- `sensor.garaje_v2c_cargador_potencia_de_carga` - alias: potencia carga coche.
- `sensor.garaje_v2c_cargador_energia_de_carga` - alias: energía carga coche.
- `sensor.garaje_v2c_cargador_tiempo_de_carga` - alias: tiempo de carga.
- `sensor.garaje_v2c_cargador_energia_de_la_casa` - alias: energía casa V2C.
- `sensor.garaje_v2c_cargador_energia_fotovoltaica` - alias: energía solar V2C.
- `sensor.evse_192_168_50_150_energia_de_la_bateria` - alias: energía batería V2C.
- `sensor.v2c_trydan_sun_power` - alias: potencia solar Trydan.
- `sensor.v2c_trydan_grid_power` - alias: potencia red Trydan.
- `sensor.v2c_trydan_battery_power` - alias: potencia batería Trydan.
- `sensor.wibeee_d7b11f_l3_active_power` - alias: medidor cargador coche, potencia cargador coche.
- `sensor.cargador_coche_kwh` - alias: kWh cargador coche.

VW Passat:

- `sensor.garage_vw_passat_nivel_de_combustible` - alias: gasolina coche, combustible Passat.
- `sensor.garage_vw_passat_nivel_de_bateria` - alias: batería coche, batería Passat.
- `sensor.garage_vw_passat_autonomia_total` - alias: autonomía coche.
- `sensor.garage_vw_passat_autonomia_electrica` - alias: autonomía eléctrica.
- `sensor.garage_vw_passat_estado_del_coche` - alias: estado coche.
- `sensor.garage_vw_passat_estado_de_conexion` - alias: conexión coche.
- `binary_sensor.garage_vw_passat_puertas_bloqueadas` - alias: puertas coche bloqueadas.
- `binary_sensor.garage_vw_passat_puertas_abiertas` - alias: puertas coche abiertas.
- `binary_sensor.garage_vw_passat_ventanas_abiertas` - alias: ventanas coche abiertas.
- `binary_sensor.garage_vw_passat_todas_las_aberturas_aseguradas` - alias: coche cerrado, coche asegurado.

## Expose Carefully - Control

These can change house state. Expose only if you want WhatsApp/Assist control.

V2C charger, critical:

- `number.garaje_v2c_cargador_intensidad` - alias: amperios cargador, intensidad V2C.
- `switch.garaje_v2c_cargador_pausar_sesion` - alias: pausar carga, reanudar carga.
- `switch.garaje_v2c_cargador_modulacion_de_intensidad_dinamica` - alias: modulación dinámica V2C.
- `switch.garaje_v2c_cargador_pausar_la_modulacion_de_control_dinamico` - alias: pausar modulación V2C.

SAJ battery, critical:

- `select.saj_as1_user_mode` - alias: modo SAJ, modo batería, autoconsumo, backup.
- `script.saj_modo_normal` - alias: modo normal SAJ, autoconsumo SAJ.
- `script.modo_bateria_back_up` - alias: modo backup batería, reserva batería.
- `number.saj_as1_first_charge_power_pct` - expose only if you really need charge power control.
- `number.saj_as1_first_discharge_power_pct` - expose only if you really need discharge power control.

Climate, critical if changing large temperatures:

- `climate.hab_ana_fran` - alias: aire Ana y Fran.
- `climate.hab_marc` - alias: aire Marc.
- `climate.hab_cla` - alias: aire Claudia.

Optional scripts:

- Conga room scripts: expose if voice cleaning is useful. Low risk.
- `script.accionar_puerta_parking`: do not expose until door entity works and confirmation is tested.
- `script.jarvis_buscar_en_google`: keep out of the main house-control agent. Prefer `script.assist_buscar_en_google`, which routes to a second Gemini search-only agent.

## Do Not Expose Now

- `update.*`, `button.*`, `conversation.*`, `stt.*`, `tts.*`, `ai_task.*`.
- Entities with `unavailable` or `unknown` state.
- Router/AdGuard controls unless you really want voice control over internet/security.
- Camera controls marked unavailable.
- `cover.puerta_parking_inteligente` while state is `unavailable`.
- V2C min/max/tensión numbers unless needed; they are configuration limits, not daily commands.
- Woltio sensors while unavailable.
- Raw WIBEEE technical sensors except the few power/energy sensors above.

## Suggested Friendly Names

Rename in Home Assistant where possible:

- `sensor.saj_as1_inverter_potencia_solar_total` -> `Solar ahora`.
- `sensor.saj_as1_inverter_potencia_casa` -> `Consumo casa ahora`.
- `sensor.saj_as1_inverter_importar_de_la_red` -> `Importación red ahora`.
- `sensor.saj_as1_inverter_exportar_a_la_red` -> `Exportación red ahora`.
- `sensor.saj_as1_inverter_nivel_de_bateria_soc` -> `Batería SAJ porcentaje`.
- `select.saj_as1_user_mode` -> `Modo batería SAJ`.
- `number.garaje_v2c_cargador_intensidad` -> `Intensidad cargador V2C`.
- `switch.garaje_v2c_cargador_pausar_sesion` -> `Pausar carga V2C`.


## Marco Priority Exposure

This is the narrow set Marco wants first. Expose these before any broad house rollout.

### Charger / V2C

Expose for read:

- `binary_sensor.garaje_v2c_cargador_conectado` - coche conectado.
- `binary_sensor.garaje_v2c_cargador_cargando` - coche cargando.
- `binary_sensor.garaje_v2c_cargador_listo` - cargador listo.
- `sensor.garaje_v2c_cargador_potencia_de_carga` - potencia de carga actual.
- `sensor.garaje_v2c_cargador_energia_de_carga` - energia cargada.
- `sensor.garaje_v2c_cargador_tiempo_de_carga` - tiempo de carga.
- `sensor.v2c_trydan_grid_power` - red vista por Trydan.
- `sensor.v2c_trydan_sun_power` - solar vista por Trydan.
- `sensor.v2c_trydan_battery_power` - bateria vista por Trydan.

Expose for control, critical:

- `number.garaje_v2c_cargador_intensidad` - cambiar amperios/intensidad.
- `switch.garaje_v2c_cargador_pausar_sesion` - pausar/reanudar carga.
- `switch.garaje_v2c_cargador_modulacion_de_intensidad_dinamica` - activar/desactivar modulacion dinamica.

Aliases: `cargador`, `V2C`, `Trydan`, `wallbox`, `cargador del coche`, `carga del coche`.

### Solar Generation

Expose current generation:

- `sensor.saj_as1_inverter_potencia_solar_total` - generacion solar actual.
- `sensor.saj_as1_inverter_potencia_casa` - consumo casa actual.
- `sensor.saj_as1_inverter_importar_de_la_red` - importando de red.
- `sensor.saj_as1_inverter_exportar_a_la_red` - exportando a red.

Expose daily generation:

- `sensor.garaje_saj_as1_inverter_consumo_casa_diario` - consumo casa diario.
- `sensor.garaje_saj_as1_inverter_energia_exportada_diaria` - exportacion diaria.
- `sensor.garaje_saj_as1_inverter_energia_importada_diaria` - importacion diaria.
- `sensor.garaje_saj_as1_inverter_energia_cargada_bateria_diaria` - bateria cargada hoy.
- `sensor.garaje_saj_as1_inverter_energia_bateria_descargada_diaria` - bateria descargada hoy.

Better if available/renamed in HA: create or expose one explicit daily solar sensor if `sensor.saj_as1_inverter_energia_solar_total` is lifetime total, not daily.

Aliases: `placas`, `solar`, `planta solar`, `fotovoltaica`, `generacion`, `produccion solar`.

### Tomorrow Solar Forecast

Expose:

- `sensor.solcast_pv_forecast_pronostico_manana` - generacion prevista mañana.
- `sensor.solcast_pv_forecast_pronostico_maximo_manana` - pico previsto mañana.
- `sensor.solcast_pv_forecast_hora_pico_manana` - hora pico mañana.

Aliases: `generacion manana`, `prevision solar manana`, `forecast solar`, `Solcast`.

### Castelldefels Weather

Expose:

- `weather.aemet` - clima general Castelldefels.
- `sensor.aemet_temperature` - temperatura actual.
- `sensor.aemet_temperature_feeling` - sensacion termica.
- `sensor.aemet_humidity` - humedad.
- `sensor.aemet_rain_probability` - probabilidad lluvia.
- `sensor.aemet_wind_speed` - viento.
- `sensor.aemet_condition` - estado cielo.
- `sensor.aemet_daily_forecast_temperature` - maxima prevista.
- `sensor.aemet_daily_forecast_temperature_low` - minima prevista.
- `sensor.aemet_daily_forecast_precipitation_probability` - lluvia prevista.

Optional beach-specific entities:

- `sensor.platja_de_castelldefels_air_temperature`.
- `sensor.platja_de_castelldefels_water_temperature`.
- `sensor.platja_de_castelldefels_uv_index`.
- `sensor.platja_de_castelldefels_wave_height`.
- `sensor.platja_de_castelldefels_sky_condition`.

Aliases: `clima Castelldefels`, `tiempo Castelldefels`, `AEMET`, `playa Castelldefels`.

### Parking Door

Preferred expose, critical:

- `cover.puerta_parking_inteligente` - abrir/cerrar puerta parking.

Current CSV state: `unavailable`. Do not rely on it until fixed. If it stays unavailable, Assist cannot safely know door state or perform reliable open/close.

Temporary fallback, critical and less safe:

- `script.accionar_puerta_parking` - pulse/toggle parking door.

Only expose fallback script if you accept that it toggles/pulses rather than true open/close. Use confirmation every time.

Aliases: `puerta parking`, `puerta garaje`, `parking`, `garaje`.

### SAJ Battery Mode

Expose current mode/read:

- `sensor.saj_as1_inverter_modo_de_funcionamiento` - modo actual tecnico.
- `select.saj_as1_user_mode` - modo usuario actual/control.
- `sensor.saj_as1_inverter_nivel_de_bateria_soc` - porcentaje bateria.
- `binary_sensor.saj_as1_is_connected` - SAJ conectado.

Expose control, critical:

- `select.saj_as1_user_mode` - cambiar modo bateria/SAJ.
- `script.saj_modo_normal` - poner SAJ en modo normal/autoconsumo.
- `script.modo_bateria_back_up` - poner bateria en backup/reserva.

Aliases: `bateria`, `SAJ`, `SAJ AS1`, `modo bateria`, `autoconsumo`, `backup`, `reserva`.

### Priority Test Phrases

- `Como esta el cargador?`
- `Esta cargando el coche?`
- `Pon el cargador a 10 amperios.`
- `Pausa la carga del coche.`
- `Cuanto estan generando las placas ahora?`
- `Cuanta energia solar hemos generado hoy?`
- `Que generacion solar habra manana?`
- `Que clima hace en Castelldefels?`
- `Va a llover en Castelldefels?`
- `Abre la puerta del parking.`
- `Cierra la puerta del parking.`
- `En que modo esta la bateria SAJ?`
- `Pon la bateria en autoconsumo.`
- `Pon la bateria en backup.`

## Individual House Consumption

Expose these so Assist can answer `dime consumos de la casa`, `que esta consumiendo ahora`, `reporte de consumos`, or `consumos por aparato`.

### Whole-house baseline

- `sensor.saj_as1_inverter_potencia_casa` - consumo total casa actual.
- `sensor.garaje_saj_as1_inverter_consumo_casa_diario` - consumo total casa hoy.
- `sensor.saj_as1_inverter_energia_consumida_casa` - consumo casa acumulado/total.

### Appliance current power

- `sensor.consumo_campana` - campana cocina actual.
- `sensor.lavaplatos_current_power` - lavaplatos actual.
- `sensor.medidor_nevera_potencia` - nevera actual.
- `sensor.wibeee_d7b11f_l1_active_power` - horno y placa actual.
- `sensor.wibeee_d7b11f_l2_active_power` - lavaplatos por medidor WIBEEE.
- `sensor.wibeee_d7b11f_l3_active_power` - cargador coche por medidor WIBEEE.

### Appliance energy / period counters

- `sensor.medidor_horno_y_placa_kwh` - horno y placa kWh.
- `sensor.medidor_nevera_en_kwh` - nevera kWh.
- `sensor.medidor_lavaplatos_en_kwh` - lavaplatos kWh.
- `sensor.campana_monitor_kwh` - campana kWh.
- `sensor.hab_ana_fran_consumo_de_energia` - aire/habitacion Ana y Fran consumo hoy.
- `sensor.hab_marc_consumo_de_energia` - aire/habitacion Marc consumo hoy.
- `sensor.hab_cla_consumo_de_energia` - aire/habitacion Claudia consumo hoy.
- `sensor.all_standby_energy` - standby total energia, if value is valid.

Aliases:

- `consumo casa`, `consumos`, `consumos individuales`, `por aparato`, `que gasta mas`, `nevera`, `lavaplatos`, `horno`, `placa`, `campana`, `standby`, `aire habitaciones`.

Do not expose unavailable/unknown counters. If both direct appliance sensor and WIBEEE phase sensor exist for the same appliance, prefer the one with clear friendly name and stable units.

## Solar Plant Report

When user asks `reporte planta solar`, `reporte solar`, `como va la planta`, or `como va la energia`, Gemini should summarize in this order:

1. Current solar generation: `sensor.saj_as1_inverter_potencia_solar_total`.
2. Current house consumption: `sensor.saj_as1_inverter_potencia_casa`.
3. Grid balance: `sensor.saj_as1_inverter_importar_de_la_red` and `sensor.saj_as1_inverter_exportar_a_la_red`.
4. Battery: `sensor.saj_as1_inverter_nivel_de_bateria_soc`, `sensor.saj_as1_inverter_carga_de_bateria`, `sensor.saj_as1_inverter_descarga_de_bateria`, `sensor.saj_as1_inverter_modo_de_funcionamiento`.
5. Daily energy: `sensor.garaje_saj_as1_inverter_consumo_casa_diario`, `sensor.garaje_saj_as1_inverter_energia_importada_diaria`, `sensor.garaje_saj_as1_inverter_energia_exportada_diaria`, `sensor.garaje_saj_as1_inverter_energia_cargada_bateria_diaria`, `sensor.garaje_saj_as1_inverter_energia_bateria_descargada_diaria`.
6. V2C charger effect: `binary_sensor.garaje_v2c_cargador_cargando`, `sensor.garaje_v2c_cargador_potencia_de_carga`, `sensor.garaje_v2c_cargador_energia_de_carga`.
7. Tomorrow forecast: `sensor.solcast_pv_forecast_pronostico_manana`, `sensor.solcast_pv_forecast_pronostico_maximo_manana`, `sensor.solcast_pv_forecast_hora_pico_manana`.

Recommended answer shape:

```text
Reporte solar:
- Ahora: placas X W, casa Y W, red importando/exportando Z W.
- Bateria: SOC X %, modo Y, carga/descarga Z W.
- Hoy: consumo X kWh, importado Y kWh, exportado Z kWh, bateria cargada/descargada A/B kWh.
- Cargador: conectado/cargando, potencia X W, energia Y kWh.
- Manana: Solcast espera X kWh, pico Y W a las HH:MM.
```

If one value is missing or unavailable, skip it and say `dato no disponible` only for important missing values.
## Web Search And Shopping List

Expose these only after the second Gemini search agent and Shopping List integration are configured.

### Web Search

- `script.assist_buscar_en_google` - alias: buscar en internet, buscar en Google, recetas, noticias, precios.

Use this for questions unrelated to real-time house state: recipes, current events, prices, public facts, product information, and other internet knowledge. Do not use it for energy, weather entities, V2C, SAJ, charger, parking door, lights, or local house state.

### Shopping List

Use native `todo.shopping_list` from Home Assistant UI if it works. Do not expose custom shopping-list scripts.

Test phrases:

- `Anade leche a la lista de la compra.`
- `He comprado pan.`
- `Lee la lista de la compra.`

## Test Phrases

- `Cómo va la energía hoy?`
- `Cuánto están generando las placas ahora?`
- `Estoy importando o exportando de la red?`
- `Cómo está la batería SAJ?`
- `Está el coche cargando?`
- `Pon el cargador V2C a 10 amperios.`
- `Pausa la carga del coche.`
- `Pon SAJ en autoconsumo.`
- `Qué previsión solar hay para mañana?`
- `Está el Passat cerrado?`

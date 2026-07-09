import json
import os
import urllib.request

URL = os.environ.get("HA_TEMPLATE_URL", "http://homeassistant:8123/api/template")
TOKEN = os.environ.get("HA_TOKEN", "")

if not TOKEN:
    raise SystemExit("Missing HA_TOKEN environment variable")

plantilla = """Tipo;Nombre;Entidad;Ubicacion;Planta;Estado
{% for s in states -%}
  {% set area = area_name(s.entity_id) %}
  {% set floor = floor_name(s.entity_id) %}
{{ s.domain }};"{{ s.name }}";{{ s.entity_id }};"{{ area if area else 'No asignada' }}";"{{ floor if floor else 'No asignada' }}";"{{ s.state }}"
{% endfor %}"""

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}
payload = json.dumps({"template": plantilla}).encode("utf-8")
req = urllib.request.Request(URL, data=payload, headers=headers, method="POST")

print("Conectando con Home Assistant y exportando entidades...")

try:
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status == 200:
            resultado = response.read().decode("utf-8")
            with open("mis_entidades.csv", "w", encoding="utf-8") as f:
                f.write(resultado)
            print("OK: archivo 'mis_entidades.csv' generado.")
        else:
            print(f"Error API Home Assistant. Estado: {response.status}")
except Exception as exc:
    print(f"Error al conectar u obtener datos: {exc}")
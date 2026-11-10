# Nexora

Diagnóstico automático de PC: mide CPU, memoria, disco, temperatura y procesos, y una IA explica en lenguaje sencillo **por qué el equipo va lento** y qué hacer.

- **Análisis básico** (~20 s) y **avanzado** (~1 min: todos los procesos, su ubicación y el hardware), con progreso paso a paso.
- Clasificación de procesos sin ocultarlos: componentes de Windows verificados por su carpeta y alerta ante ubicaciones sospechosas.
- **Informes** guardados en Supabase, exportables a PDF (traducidos con IA) y con **chat con la IA** por informe.

## Arquitectura

| Carpeta | Contenido |
|---|---|
| `collector/` | Telemetría (psutil), temperatura, hardware y clasificación de procesos |
| `diagnosis/` | Motor de reglas, diagnóstico con IA (Groq) y asistente de informes |
| `api/` | Flask: blueprints, escaneos en segundo plano, errores centralizados y servidor estático |
| `security/` | Validación y saneamiento de entradas |
| `frontend/` | React + TypeScript + Tailwind |
| `supabase/migrations/` | Tablas `diagnostic_reports` y `report_messages` con RLS |

## Desarrollo

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python server.py                      # API en http://127.0.0.1:5000
cd frontend && npm ci && npm run dev  # interfaz en http://localhost:5173
```

Configuración: copia `.env.example` como `.env` (clave `GROQ_API_KEY`) y `frontend/.env.example` como `frontend/.env.local` (Supabase). Ejecuta las migraciones de `supabase/migrations/` en el SQL Editor de Supabase.

Pruebas: `python -m unittest discover tests` · `cd frontend && npm run lint && npx tsc -b`

## Ejecutable de escritorio

Con el entorno virtual activo y Node.js instalado:

```bash
pip install -r requirements-build.txt && python build.py
```

Genera `dist/Nexora.exe`: un único archivo con la API y la interfaz. Copia tu `.env` junto al ejecutable y ábrelo con doble clic; se abrirá el navegador en `http://127.0.0.1:5000` (o el siguiente puerto libre).

- La configuración de Supabase de `frontend/.env.local` se incluye al compilar (la clave *anon* es pública); la clave de Groq **no** se incluye.
- Añade `http://127.0.0.1:5000` a las *Redirect URLs* de Supabase para que funcionen los enlaces de confirmación y recuperación.

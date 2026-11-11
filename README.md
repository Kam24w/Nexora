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
python -m venv .venv
.venv\Scripts\activate                # Windows (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
python server.py                      # API en http://127.0.0.1:5000
cd frontend && npm ci && npm run dev  # interfaz en http://localhost:5173
```

Configuración: copia `.env.example` como `.env` (clave `GROQ_API_KEY`) y `frontend/.env.example` como `frontend/.env.local` (Supabase). Ejecuta las migraciones de `supabase/migrations/` en el SQL Editor de Supabase.

Pruebas: `python -m unittest discover tests` · `cd frontend && npm run lint && npx tsc -b`

## Ejecutable de escritorio

Funciona en **Windows, Linux y macOS**, pero cada ejecutable debe compilarse en su propio sistema (PyInstaller no compila de forma cruzada).

**Automático (recomendado):** el workflow [`.github/workflows/build.yml`](.github/workflows/build.yml) compila, prueba y empaqueta en GitHub para Windows x64, Linux x64, macOS Apple Silicon y macOS Intel. Los archivos aparecen en *Actions → ejecución → Artifacts*; al subir una etiqueta (`git tag v1.0.0 && git push origin v1.0.0`) se publican además como *Release*. Para incluir Supabase, define los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del repositorio.

**Manual**, en el sistema de destino, con el entorno virtual activo y Node.js 20+ instalado:

```bash
pip install -r requirements-build.txt && python build.py
```

Genera `dist/Nexora.exe` (Windows) o `dist/Nexora` (Linux/macOS): un único archivo con la API y la interfaz. Copia tu `.env` junto al ejecutable (también vale con el nombre visible `nexora.env`, más cómodo en macOS y Linux, que ocultan los archivos que empiezan por punto) y ábrelo; se abrirá el navegador en `http://127.0.0.1:5000` (o el siguiente puerto libre).

| Sistema | Cómo abrirlo |
|---|---|
| Windows | Doble clic en `Nexora.exe`. SmartScreen puede avisar al no estar firmado: *Más información → Ejecutar de todas formas*. |
| Linux | Desde una terminal: `./Nexora`. Requiere glibc 2.35+ (Ubuntu 22.04, Debian 12, Fedora 36 o posteriores). La temperatura se lee de los sensores del kernel (`lm-sensors`); las GPU, con `lspci` (`pciutils`). |
| macOS | Doble clic (se abre en Terminal). La primera vez Gatekeeper lo bloquea por no estar firmado: *Ajustes del Sistema → Privacidad y seguridad → Abrir igualmente* (en macOS 14 o anterior también vale clic derecho → *Abrir*), o en Terminal `xattr -d com.apple.quarantine Nexora`. Usa el puerto **5001**, porque el 5000 lo ocupa el Receptor AirPlay. macOS no expone la temperatura sin permisos de administrador: se muestra como no disponible. |

- La configuración de Supabase de `frontend/.env.local` se incluye al compilar (la clave *anon* es pública); la clave de Groq **no** se incluye.
- Añade `http://127.0.0.1:5000` y `http://127.0.0.1:5001` a las *Redirect URLs* de Supabase para que funcionen los enlaces de confirmación y recuperación.
- La clasificación de procesos *sistema/sospechoso* es específica de Windows; en Linux y macOS todos los procesos se muestran como aplicaciones.

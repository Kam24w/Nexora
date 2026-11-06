# Nexora · Frontend

Panel de diagnóstico IA para escritorio (React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase).

## Puesta en marcha

```bash
cp .env.example .env.local   # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:5173
```

El análisis en vivo necesita el servicio local: `python server.py` (en la raíz del repo).
Sin Supabase configurado, en desarrollo puedes entrar con "Continuar sin cuenta".

## Arquitectura (`src/`)

| Capa | Carpeta | Responsabilidad |
| --- | --- | --- |
| Dominio | `types/` | Tipos puros: diagnóstico, auth, preferencias, claves i18n. |
| Infraestructura | `services/` | Supabase (`authService`), API de diagnóstico, reglas de salud, adaptador de mensajes del backend, `localStorage`. |
| Aplicación | `context/` | Estado global: tema, idioma, sesión y diagnóstico. Cada contexto expone un hook (`useTheme`, `useI18n`, `useAuth`, `useDiagnosis`). |
| Presentación | `components/` | `layout/` (shell 3 columnas, sidebar), `dashboard/` (telemetría), `diagnosis/` ("¿Por qué está lento?"), `auth/`, `ui/`. |
| Traducciones | `i18n/` | `es.json` (idioma fuente) y `en.json`. |

Reglas:

- Los componentes no importan Supabase ni `fetch`: pasan por `context/` → `services/`.
- No hay textos en los componentes: todo usa `t('clave')`. Las claves están tipadas a partir de `es.json`,
  así que una clave inexistente o una traducción incompleta en `en.json` es un error de compilación.
- Los colores son tokens semánticos (`bg-surface`, `text-ink`, `text-crit`…) definidos en `index.css`;
  el modo oscuro solo cambia las variables bajo la clase `.dark`.

## Añadir un idioma

1. Crea `src/i18n/<código>.json` con las mismas claves que `es.json`.
2. Añade el código a `LANGUAGES` en `src/types/preferences.ts` y al objeto `dictionaries` en `src/i18n/index.ts`.

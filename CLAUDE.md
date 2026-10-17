# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # Install dependencies (Node >= 20.19.0)
npm run dev            # Start Vite dev server
npm run build          # Production build to dist/
npm run preview        # Preview production build locally
npm run lint           # ESLint (flat config, Vue 3)
npm run format         # Prettier write for src/
npm test               # Vitest unit tests
```

Unit tests live next to the code (`src/**/*.spec.js`) and cover pure helpers such as `formatAmount`, `sanitizeAmount`, `formatDate`, and `countDays`.

## Architecture

**Stack:** Vue 3 (Composition API) + Pinia + Vue Router 4 + Element Plus + ECharts + Less

**Backend:** Supabase (auth, PostgreSQL) + 智谱 AI GLM-4.7-Flash (SSE streaming)

### Pattern: Store → Composable → View

Every data domain follows a three-layer pattern:

1. **Pinia store** (`src/stores/`) — owns state, calls API layer, exposes actions
2. **Composable** (`src/composables/`) — thin reactive wrapper (`storeToRefs` + pass-through actions), so views never import stores directly
3. **View** (`src/views/`) — consumes composables only

The same pattern is used for `auth`, `bills` (+ categories), `statistics`, `ai`, and `theme`.

### Auth flow

- `src/api/supabase.js` creates a singleton Supabase client with `autoRefreshToken: true` and `persistSession: true`.
- `src/stores/auth.js` calls `initAuth()` on app start — it restores the session from Supabase's local persistence, then registers an `onAuthStateChange` listener for live sync.
- `src/router/index.js` has a global `beforeEach` guard: unauthenticated users are redirected to `/login?redirect=...`; logged-in users hitting `/login` or `/register` are sent to `/dashboard`.
- `AuthView.vue` handles both login and register forms (shared route component).

### Theme system

CSS custom properties are defined in `src/assets/styles/variables.less` under `:root` (light) and `[data-theme='dark']` (dark). Vite's Less config auto-injects `@import "@/assets/styles/variables.less";` into every component's `<style lang="less">`. The `useThemeStore` toggles `data-theme` on `<html>` and persists the choice to `localStorage`.

### Route structure

| Path | View | Auth |
|---|---|---|
| `/` | redirect → `/dashboard` | — |
| `/login`, `/register` | `AuthView.vue` | guest only |
| `/dashboard` | `DashboardView.vue` | required |
| `/bills` | `BillsView.vue` | required |
| `/statistics` | `StatisticsView.vue` | required |
| `/ai-analysis` | `AIAnalysisView.vue` | required |
| `/profile` | `ProfileView.vue` | required |
| `*` | `NotFoundView.vue` | — |

All authenticated routes are children of `AppLayout.vue` (sidebar + navbar shell).

### AI streaming

`src/api/ai.js` posts to `/.netlify/functions/ai` with the Supabase access token. `netlify/functions/ai.js` validates that token against Supabase, injects the server-only `ZHIPU_API_KEY`, and streams 智谱 AI's SSE response straight through. The client reads the response body as a `ReadableStream` reader, parses SSE `data:` lines and calls `onChunk` callbacks. The `useAIStore` manages message history and streaming state, appending chunks into `streamingContent` (rendered in real-time by the view), then moving the completed message into `messages[]` on `onDone`.

Local dev does not need `netlify dev`: a small Vite plugin (`netlifyFunctionsDev` in `vite.config.js`) mounts `/.netlify/functions/*` and invokes the handler in-process, so local and production share the same server-side path.

### Element Plus auto-import

`unplugin-auto-import` and `unplugin-vue-components` with `ElementPlusResolver` are configured in `vite.config.js` — Element Plus components and APIs (like `ElMessage`, `ElLoading`) are auto-imported, no manual registration needed.

### Path alias

`@` maps to `src/` (configured in both `vite.config.js` and `jsconfig.json`).

### Environment variables

Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ZHIPU_API_KEY`. `ZHIPU_API_KEY` is server-only (no `VITE_` prefix) and must never be referenced from `src/`, otherwise Vite inlines it into the public bundle. Defined in `.env` (gitignored), with a template in `.env.example`.

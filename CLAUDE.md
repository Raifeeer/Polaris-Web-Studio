# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this is

**Polaris Web Studio** — a bilingual (ES/EN) marketing site + client-portal web app for a web
development agency. Public marketing pages (landing, services, portfolio, blog, quote wizard)
plus an authenticated client/admin dashboard (`/dashboard`) backed by a custom Express API and a
flat-file JSON "database". Originated from Google AI Studio scaffolding (see `README.md`), now
deployed to Vercel.

The default repo-level workflow preference is documented below in "Instrucciones de trabajo". That
said, if the session's own harness/system instructions explicitly assign a different working
branch or push policy for that session, the harness instructions take precedence for that
session — don't silently override an explicit harness-assigned branch just because this file says
to use `main`.

## Instrucciones de trabajo

### Rama de trabajo

- Siempre trabaja directamente en la rama `main`.
- No crees ramas nuevas a menos que se indique explícitamente.
- Haz commit directo a `main` con todos los cambios.

### Commits

- Usa mensajes de commit descriptivos en español.
- Un solo commit por tarea completada.

## Tech stack

- **React 19** + **TypeScript** (`tsconfig.json`: `noEmit: true`, path alias `@/*` → repo root)
- **Vite 6** (`vite.config.ts`) with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Tailwind CSS v4** — CSS-first config, no `tailwind.config.js`. Theme tokens (colors, fonts,
  radii) are defined in `src/index.css` inside an `@theme` block plus plain `:root` custom
  properties. Light/dark theme is a CSS-variable swap, not Tailwind's `dark:` variant.
- **react-router-dom v7** (`BrowserRouter`)
- **framer-motion** — used everywhere there's conditional UI, tabs, modals, or carousels
  (`AnimatePresence` + `motion.div` is the standard pattern)
- **lucide-react** for icons
- **Express 4** (`server.ts`) as a real long-running backend (not just Vercel functions), plus a
  parallel `api/` folder of Vercel serverless functions for two specific endpoints
- **Firebase** (`firebase` SDK) — used for Auth, and Firestore is provisioned but locked down
  (`firestore.rules` denies almost everything except a newsletter-subscribers collection)
- **Google Gemini** (`@google/genai`) for AI features, with a Grok fallback
- No test framework is installed and none is configured — **there is currently zero automated
  test coverage**. Don't assume Jest/Vitest/Playwright exist; if asked to add tests, you're
  starting from scratch.

## NPM scripts (`package.json`)

| Script | What it does |
|---|---|
| `npm run dev` | `tsx server.ts` — runs the Express server directly; it creates a Vite dev server in middleware mode internally. This is the actual local dev entrypoint (not `vite dev`). |
| `npm run build` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs ... --outfile=dist/server.cjs` — builds the client bundle with Vite, then bundles the Express server separately into `dist/server.cjs`. |
| `npm run start` | `node dist/server.cjs` — runs the production-bundled server. |
| `npm run preview` | `vite preview` — Vite's own static preview; not the real prod path, mainly useful for quickly sanity-checking a built client bundle without the Express layer. |
| `npm run lint` | `tsc --noEmit` — **this is a TypeScript type-check, not ESLint.** ESLint is installed but `eslint.config.js` only configures `@firebase/eslint-plugin-security-rules` (it lints `firestore.rules`, not app code). When asked to "lint", running `npm run lint` is correct and sufficient — don't go looking for a separate eslint script that doesn't exist. |
| `npm run clean` | `rm -rf dist server.js` |

There's also a dev server port detail worth knowing: previous sessions have run the dev server on
`localhost:3000`. `DISABLE_HMR` env var (see `vite.config.ts`) can disable Vite's file watching —
the comment there says this exists "to prevent flickering during agent edits", i.e. it's intended
for AI-agent-driven dev loops.

## Routing (`src/App.tsx`)

All pages are lazy-loaded (`lazy(() => import(...))`) under a single `<Suspense>`. Route → file map:

| Route | File |
|---|---|
| `/` | `src/pages/LandingPage.tsx` |
| `/servicios` | `src/pages/Services.tsx` |
| `/proceso` | `src/pages/Process.tsx` |
| `/portafolio` | `src/pages/Portfolio.tsx` |
| `/portafolio/:slug` | `src/pages/ProjectDetail.tsx` |
| `/nosotros` | `src/pages/About.tsx` |
| `/blog` | `src/pages/Blog.tsx` |
| `/blog/:slug` | `src/pages/BlogPostDetail.tsx` |
| `/cotizar` | `src/pages/WizardQuote.tsx` |
| `/gracias` | `src/pages/Gracias.tsx` |
| `/login` | `src/pages/Login.tsx` |
| `/dashboard` | `src/pages/ClientDashboard.tsx` |
| `/privacidad`, `/terminos`, `/cookies` | `src/pages/LegalPage.tsx` (shared, different `title` prop) |

`QuoteBot` (floating AI chat widget) is mounted globally except on `/cotizar` and `/servicios`,
and deferred until 4.5s after mount to keep initial bundle/exec cost down. Provider nesting is
`AuthProvider > LanguageProvider > Router`.

## Directory structure

```
src/
├── components/   shared UI: Navbar, Footer, Logo, ThemeToggle, WhatsAppButton, RippleButton,
│                 NewsletterForm, QuoteBot, plus landing-page sections (Hero3D, WhyPolaris,
│                 Testimonials, FinalCTA, ContactSection, MockupFrame, ScrollProgressBar)
├── constants/    projects.ts — static portfolio project data
├── context/      AuthContext.tsx, LanguageContext.tsx (the only two contexts in the app)
├── data/         blogData.ts — static blog post data
├── hooks/        useTheme.ts (the only hook currently)
├── lib/          firebase.ts (client SDK init), utils.ts (cn() helper etc.)
└── pages/        one file per route (see table above)
```

No `src/types/` or `src/utils/` directories — type defs live alongside usage or in `lib/`.

**File organization convention**: pages are large, mostly self-contained files rather than being
decomposed into many small components. `WizardQuote.tsx` (~3600 lines), `ClientDashboard.tsx`
(~3400 lines), `LandingPage.tsx` (~1900 lines), `Services.tsx` (~1600 lines), `Portfolio.tsx`
(~1200 lines) all contain their own local sub-components defined inline. Only pull something out
into `src/components/` if it's reused across multiple pages or is a layout/chrome element
(Navbar, Footer) — don't preemptively split a page-specific section into its own file just
because it's long.

Root-level one-off scripts (`add_willchange.mjs`, `auto_updater.cjs`, `fix_open_graph.cjs`,
`length_fixer.cjs`, `pad_open_graph.cjs`, `replaceContents*.cjs`, `string_fix.cjs`,
`update_script.cjs`, `updates.json`) are ad hoc maintenance/migration utilities, **not** part of
the build pipeline and not wired into any npm script. Don't assume they run automatically or that
they need to be kept in sync with anything.

## Internationalization — the `<T>` pattern

This is the most important convention to get right. `src/context/LanguageContext.tsx` exports:

```tsx
export function T({ children, en }: { children: React.ReactNode; en: React.ReactNode }) {
  const { language } = useLanguage();
  return language === "es" ? children : en;
}
```

Usage convention, used pervasively across every page and component:

```tsx
<T en="English text">Texto en español</T>
```

**Spanish is always the JSX `children` (the default/fallback content); English is always the
named `en` prop.** This is backwards from what you might expect at a glance — don't swap them.

For contexts that need a plain string instead of JSX (e.g. `alt`, `title` attributes), use the
sibling API from the same context: `const { translate } = useLanguage(); translate(esText, enText)`.

Language state: read from `localStorage["language"]` first, then `navigator.language`, persisted
back to `localStorage` and synced to `document.documentElement.lang`.

## Theming

- Dark mode is the default/absence of a class; light mode is the `.light` class on `<html>`,
  toggled by `src/hooks/useTheme.ts` (persists to `localStorage["polaris-theme"]`, falls back to
  `prefers-color-scheme`, defaults to dark overall).
- All colors flow through CSS custom properties in `src/index.css`: `--color-surface-base/elevated/highlight`,
  `--color-primary-base/hover/muted`, `--color-text-primary/secondary/tertiary`,
  `--color-border-subtle/strong`, `--color-accent-blue/purple`, plus an RGB companion variable
  pattern (e.g. `--color-grok-rgb`) for use inside `rgba(...)` where a hex var won't work.
  `:root` holds the dark values, `.light` overrides them.
- A "Nexus Luxury" sub-palette also exists (`--color-luxury-gold`, `-gold-hover`, `-emerald-800`,
  `-emerald-950`, `-bronze`) for specific premium-styled sections.
- A "liquid glass" utility system (`.glass-panel`, `.glass-panel-indigo`, `.glass-input`,
  `.glass-badge`, `.glass-menu-mobile`) provides `backdrop-filter`-based translucent surfaces, each
  with its own `.light` override.
- When introducing a new color, follow the existing `--color-{category}-{variant}` naming and add
  both a dark (`:root`) and light (`.light`) value — don't hardcode a hex value directly in a
  component's Tailwind class.

## Backend & data — read this before touching anything under `/dashboard`

This is **not** a pure Firebase app. It's a hybrid:

- **Firebase** is used only for Auth (and a locked-down Firestore newsletter collection). Client
  SDK init lives in `src/lib/firebase.ts`, configured via `firebase-applet-config.json`.
- **The real portal data store is a flat JSON file**: `portalDb.json` at the repo root, read/written
  by `server-db.ts` (interfaces: `DbUser`, `DbProject`, `DbProjectPhase`, `DbTask`, `DbInvoice`,
  `DbMeeting`, `DbDeploy`). This holds users, projects, tasks, invoices, meetings, and deploy
  records for the client portal — including a link to each project's live `vercelProjectId`/`vercelUrl`.
- **`server.ts`** is the Express app exposing the actual portal REST API: `/api/auth/*`,
  `/api/portal/dashboard`, `/api/portal/clients*`, `/api/portal/projects/:id*`,
  `/api/portal/invoices*`, `/api/portal/tasks*`, `/api/portal/meetings`,
  `/api/portal/deploys/:projectId`, AI helper routes under `/api/ai/*`, and a GitHub deploy
  webhook at `/api/webhooks/github` (authenticated via its own `GITHUB_WEBHOOK_SECRET`, not the
  JWT middleware). Most admin-mutating routes are gated by `authenticateToken` + `requireAdmin`.
- **`AuthContext.tsx`** has a deliberate dual-auth fallback chain for `login()`: try Firebase Auth
  first; on failure fall back to the custom `/api/auth/login` against `portalDb.json`; if that
  local login succeeds, opportunistically provision the same user in Firebase Auth for next time.
  This is a migration-in-progress pattern — don't "simplify" it without understanding why both
  paths exist.
- **AI calls are Gemini-first with a Grok fallback** (`askAI` in `server.ts`: try `askGemini`,
  catch and fall back to `askGrok`), gated by `GEMINI_API_KEY`/`GROK_API_KEY`.
- `api/` (repo root, separate from `src/`) contains Vercel serverless function handlers
  (`check-domain.ts`, `generate-addon-descriptions.ts`, `index.ts`) — an alternate/parallel entry
  path for Vercel deployment, per `vercel.json`'s rewrites. The Express server in `server.ts` is
  the source of truth for the rest of the portal API when running on a Node host.
- `ClientDashboard.tsx` is the single largest file in the app (~3400 lines): tabs for
  `overview | tasks | invoices | meetings | updates | admin-clients | admin-config` (admin-only
  tabs are role-gated), all talking to the `/api/portal/*` Express endpoints via the bearer token
  from `AuthContext`.

## Conventions

- **Comments**: mixed Spanish/English. Spanish is used for domain-specific "why" explanations
  (matches the repo's existing style — e.g. `// La barra fija de precios (mobile) se oculta al
  llegar al footer...`); English tends to show up for more generic/structural comments. Either is
  acceptable; match whichever is already used in the surrounding code. Keep comments to the
  "why", not the "what" — the codebase doesn't use comment blocks to narrate obvious JSX.
- **No backwards-compatibility shims**: this app has no external consumers of its internals: don't
  add deprecated re-exports, `_unused` variable renames, or "// removed" comments when deleting
  code — just delete it.
- **Animations**: `framer-motion`'s `AnimatePresence` + `motion.div` is the standard for anything
  conditionally shown/hidden (tabs, modals, carousels, mobile menus). When hiding an element that
  has children which visually overflow its box (e.g. a badge with a negative `top` offset), prefer
  `opacity`-based hide over `translate-*-full`, since transform-based hides only account for the
  element's own border-box and can leave overflowing children partially visible.
- **CSS variables over hardcoded colors**: always reference the `--color-*` tokens from
  `src/index.css` rather than literal hex/Tailwind palette colors, so both themes stay correct.

## Deployment

- Deploys to **Vercel** (`vercel.json` rewrites `/api/*` to the serverless functions in `api/`,
  and falls back everything else to `index.html` for the SPA). `@vercel/node` is a dev dependency
  to support typed Vercel function handlers.
- No CI is configured (`.github/workflows` does not exist) — there are no automated checks gating
  merges beyond whatever you run locally (`npm run lint`, `npm run build`).
- Given there's no test suite and no CI, **always run `npm run lint` and `npm run build` before
  considering a change done**, and visually verify UI changes with a real browser/Playwright
  screenshot when the change is visual — these are the only safety nets that exist.

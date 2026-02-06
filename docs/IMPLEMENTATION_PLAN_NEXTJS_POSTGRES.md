# Implementation Plan: Next.js + Tailwind + shadcn/ui + PostgreSQL

This document outlines the migration from the current stack (Vite/React + Express + SQLite) to **Next.js**, **Tailwind CSS**, **shadcn/ui**, and **PostgreSQL**.

---

## 0. UI must not change (constraint)

**The user-facing interface must remain visually and behaviorally identical.** No layout changes, no new component styles, no different fonts or colors.

### What to preserve exactly

| Area | Current implementation | Action |
|------|-------------------------|--------|
| **Theme** | CSS variables in `client/src/index.css` (`:root` and `.dark`) — bg-primary, text-primary, accent-primary, fonts, borders, shadows, message/code/thinking colors | **Copy verbatim** into Next.js `app/globals.css` (or equivalent). Do not replace with shadcn’s default theme. |
| **Fonts** | Inter (sans), Merriweather (serif), JetBrains Mono (code) via Google Fonts | Keep same imports and `--font-sans`, `--font-serif`, `--font-mono`. |
| **Prose** | `.prose-aifa`, `.message-ai .prose-aifa`, `.message-user .prose-aifa`, headings, lists, blockquote, tables, KaTeX, inline code | **Copy all** `.prose-aifa` and related rules into the new app. |
| **Components** | `.sidebar-int`, `.input-box`, `.btn-ghost`, `.aifa-code-block`, `.aifa-code-header`, `.scrollbar-thin` | **Copy verbatim**; keep same class names. |
| **Theme toggle** | Custom day/night toggle in `theme-toggle.css` (gradient track, thumb, stars, clouds, moon craters, sun rays) | **Copy** `theme-toggle.css` and use the same markup/classes so it looks identical. |
| **Layout** | Sidebar (280px, collapse/expand, mobile overlay), header (logo “AIFA”, sidebar button, theme toggle), chat area | Same structure and dimensions; same breakpoint (e.g. 768px) for mobile. |
| **Behavior** | Sidebar open/close, theme persistence (localStorage), message list, streaming, thinking block, attachments, model switcher, settings modal | Preserve all behavior; only the underlying framework (Next.js) and optional use of shadcn primitives change. |

### How to use shadcn without changing the UI

- **Option A (safest):** Use shadcn only for behavior/accessibility (e.g. Dialog, Select) and **override all styles** with the existing AIFA CSS variables and classes so the result looks exactly like the current app.
- **Option B:** Prefer **porting existing components as-is** (same JSX structure and class names). Add shadcn only where it clearly improves maintainability (e.g. Dialog for settings) and then apply `className` overrides so the rendered output matches the current design.
- **Do not:** Apply shadcn’s default theme or component styles without overriding; do not change typography, spacing, or colors to match shadcn’s defaults.

### Verification

- Before considering the migration done, compare the new app side-by-side with the current one (same viewport, light and dark mode): layout, sidebar, header, message bubbles, code blocks, input area, theme toggle, and modals must be indistinguishable.

---

## 1. Target Stack Summary

| Layer        | Current                 | Target                          |
|-------------|--------------------------|----------------------------------|
| Frontend    | React 19 + Vite 7        | **Next.js 15** (App Router)      |
| Styling     | Tailwind 4               | **Tailwind 4** (or 3.x per shadcn) |
| Components  | Custom + Lucide          | **Same UI**; shadcn only where overridden to match |
| API         | Express (separate server)| **Next.js Route Handlers**       |
| Database    | SQLite (Prisma)          | **PostgreSQL** (Prisma)          |
| AI / Files  | Ollama, multer, etc.     | Same (Ollama, Next.js API)       |

---

## 2. Architecture Decisions

### 2.1 Monorepo vs single app
- **Recommendation:** Single **Next.js app** at project root (or in a new `app/` directory). Remove or archive `client/` and migrate `server/` logic into Next.js.
- **Alternative:** Keep `server/` as a separate Node API and only replace `client/` with Next.js; then you maintain two deployments and CORS. Not recommended unless you need a standalone API for other clients.

### 2.2 Where the API lives
- **Recommendation:** Next.js **Route Handlers** (App Router) under `app/api/`. Streaming works with `ReadableStream` and `Response` in Route Handlers.
- **Benefits:** One codebase, one deploy, no CORS for same-origin requests, server and client in one place.

### 2.3 Database
- **PostgreSQL:** Hosted (e.g. Neon, Supabase, Render PostgreSQL, or self-hosted). Prisma stays; only the datasource and connection string change.
- **Migrations:** New Prisma migration for PostgreSQL (no driver adapter needed; use default `@prisma/client`).

### 2.4 shadcn/ui and Tailwind
- shadcn/ui typically uses **Tailwind 3.x** and **PostCSS**. Tailwind 4 can work but may need care with shadcn’s config.
- **Recommendation:** Use **Tailwind 3.x** with shadcn’s default setup for least friction, or follow shadcn’s Tailwind 4 notes if you want to keep v4.

---

## 3. Phase-by-Phase Implementation

### Phase 1: Project and tooling setup

| Step | Action |
|------|--------|
| 1.1 | Create Next.js app: `npx create-next-app@latest` (App Router, Tailwind, ESLint, `src/` optional). Do this in a new directory (e.g. `./next-app`) or replace root after backup. |
| 1.2 | Install **shadcn/ui** only if needed for specific primitives (Dialog, Select, etc.): `npx shadcn@latest init`. **Do not** replace existing AIFA theme with shadcn defaults; we will override all styles to match current UI. |
| 1.3 | **Port existing UI theme:** Copy `client/src/index.css` (all `:root`/`.dark` variables, `@layer base/utilities/components`, `.prose-aifa`, `.sidebar-int`, `.input-box`, `.aifa-code-block`, etc.) and `client/src/theme-toggle.css` into Next.js `app/globals.css` (or split into a theme file). Keep same Google Fonts (Inter, Merriweather, JetBrains Mono). Ensure Tailwind is set so these classes and variables work. |
| 1.4 | Add **Prisma** in the Next.js app: `npx prisma init`. Point `schema.prisma` to **PostgreSQL** (`postgresql` provider, `DATABASE_URL`). Remove SQLite and driver adapters. |
| 1.5 | Copy and adapt Prisma **schema** from `server/prisma/schema.prisma` (Conversation, Message, Attachment). Run `prisma migrate dev` to create initial PostgreSQL migration. |
| 1.6 | Create **env** files: `.env.local` with `DATABASE_URL`, `OLLAMA_BASE_URL`, etc. (no `VITE_`; use `NEXT_PUBLIC_` only for client-exposed vars). |

**Deliverable:** Next.js app runs, Prisma connects to PostgreSQL. **Existing AIFA theme and CSS are in place; UI looks unchanged.**

---

### Phase 2: Database and API core

| Step | Action |
|------|--------|
| 2.1 | Add **Prisma Client** singleton for Next.js (e.g. `lib/prisma.js` or `src/lib/db.ts`) to avoid multiple instances in dev. |
| 2.2 | Implement **conversation** CRUD in Route Handlers: `app/api/conversations/route.ts` (GET list, POST create), `app/api/conversations/[id]/route.ts` (GET, PUT, DELETE). Use existing logic from `server/src/controllers/conversationController.js` and `server/src/database/db.js` (or replace with Prisma calls). |
| 2.3 | Implement **messages** (and optional “delete message”): e.g. `app/api/conversations/[id]/messages/route.ts` or include messages in conversation GET. |
| 2.4 | Implement **models** (Ollama): `app/api/models/route.ts` (GET) and `app/api/models/status/route.ts` if needed. Call existing Ollama service logic (move from `server/src/services/ollamaService.js` to e.g. `lib/ollama.ts`). |
| 2.5 | Implement **health**: `app/api/health/route.ts` returning `{ status: 'ok', timestamp }`. |

**Deliverable:** Conversations and models API work against PostgreSQL and Ollama from Next.js.

---

### Phase 3: Chat streaming and uploads

| Step | Action |
|------|--------|
| 3.1 | **Chat stream:** Create `app/api/chat/stream/route.ts`. Use Next.js `Response` with `ReadableStream` (or streaming helper). Keep same event contract (e.g. `start`, `thinking_start`, `thinking_chunk`, `thinking_end`, `content_chunk`, `done`, `error`). |
| 3.2 | Move **Ollama streaming** logic from `server/src/services/ollamaService.js` and `server/src/controllers/chatController.js` into a server utility (e.g. `lib/ollama.ts`). Call it from the Route Handler; push parsed SSE/NDJSON events into the Response stream. |
| 3.3 | **Stop generation:** `app/api/chat/stop/route.ts` — maintain in-memory (or server-side) map of `AbortController`s keyed by stream/session ID; POST with same ID aborts that stream. |
| 3.4 | **File upload:** Use Next.js Route Handler with `FormData` (no multer). `app/api/upload/route.ts`: accept `file`, validate type/size, save to disk (e.g. `uploads/` or cloud storage later). Return `{ path, filename, ... }`. Store path in DB when saving message attachments. |
| 3.5 | **Document processing:** Move `server/src/services/documentProcessor.js` to e.g. `lib/documentProcessor.ts` (PDF, OCR, text). Use from chat flow when building the prompt for messages with attachments. |
| 3.6 | **Code execution** (if keeping): `app/api/execute/route.ts` — port from `server/src/controllers/codeExecutionController.js` and `codeExecutionService.js`. |

**Deliverable:** Chat (with thinking + content streaming), uploads, and document extraction work via Next.js API.

---

### Phase 4: Frontend – layout and theme (UI unchanged)

| Step | Action |
|------|--------|
| 4.1 | **Layout:** Implement root layout (`app/layout.tsx`) with theme provider. Use **same** approach as current app: `document.documentElement.className = theme` (or next-themes) and **existing** CSS variables from ported `index.css`. Wrap with theme + chat providers. |
| 4.2 | **Theme:** **No visual change.** Already done in Phase 1 (AIFA variables in globals.css). Light/dark toggle must use the **current** custom component and `theme-toggle.css` (same markup and classes). |
| 4.3 | **Sidebar + main area:** Replicate **current** structure: fixed/relative sidebar (280px), same breakpoint (e.g. 768px), same overlay on mobile, same `.sidebar-int` and list styling. Use custom divs or shadcn only with full style overrides so it looks identical. |
| 4.4 | **Header:** Same layout: left sidebar toggle, center “AIFA” logo when sidebar closed, right theme toggle. Same classes and spacing; no visual change. |

**Deliverable:** Layout and theme are **visually identical** to the current app.

---

### Phase 5: Frontend – chat UI and components (UI unchanged)

| Step | Action |
|------|--------|
| 5.1 | **Chat context:** Port `ChatContext` (conversations, currentConversationId, messages, sendMessage, createNewChat, deleteConversation, model, settings, streaming state). Use **client** context. Replace API calls with `fetch('/api/...')` or `lib/api.ts`. |
| 5.2 | **Streaming hook:** Port `useStreamResponse` to call `/api/chat/stream` and consume the same event types. Keep same behavior (thinking block, content chunk, done). |
| 5.3 | **Conversation list (sidebar):** Same list UI: **existing** `.sidebar-int` and active state. “New chat” and delete behavior unchanged. Use current structure; only use shadcn primitives if styled to look identical. |
| 5.4 | **Message list:** Same message bubbles (user vs AI), same spacing and **message-user** / **message-ai** and **prose-aifa** classes. Thinking block: same **bg-thinking** and layout. No visual change. |
| 5.5 | **Message content:** Keep **react-markdown**, **remark-gfm**, **rehype-katex**, **remark-math**, and **Monaco** code blocks. Keep **same** `.prose-aifa` and `.aifa-code-block` / `.aifa-code-header` styling. Do not replace with different typography or code block design. |
| 5.6 | **Input area:** Same **.input-box** styling, same attachment preview look. Port existing `InputArea` structure and classes; only use shadcn if overridden to match. |
| 5.7 | **Model switcher & settings:** Same layout and behavior as current **ModelSwitcher** and **SettingsModal**. If using shadcn Dialog/Select/Slider, apply AIFA variables and classes so the result looks identical. |
| 5.8 | **Theme toggle:** Use the **current** custom theme toggle component and **theme-toggle.css** (same gradient, thumb, stars/clouds/moon). No replacement with a generic switch unless it looks the same. |

**Deliverable:** Full chat flow in Next.js with **identical** look and behavior to the current app.

---

### Phase 6: Static assets and file serving

| Step | Action |
|------|--------|
| 6.1 | **Uploaded files:** Serve from Next.js (e.g. `app/uploads/[...path]/route.ts` that reads from `uploads/` and returns file) or use `next.config.js` rewrite to a folder (if supported), or keep files under `public/` with a unique path strategy. Prefer Route Handler for access control if needed. |
| 6.2 | **Images in chat:** Ensure attachment URLs point to `/api/uploads/...` or `/uploads/...` and render in message content or preview. |

**Deliverable:** Uploaded files and images are accessible in the app.

---

### Phase 7: Cleanup, env, and deployment

| Step | Action |
|------|--------|
| 7.1 | **Environment:** Document all env vars (e.g. `DATABASE_URL`, `OLLAMA_BASE_URL`, optional `NEXT_PUBLIC_*`). Remove `VITE_*` and Express-specific vars from client. |
| 7.2 | **Remove or archive:** Old `client/` and `server/` (or move to `_archive/`). Update root `package.json` to build/start the Next.js app. |
| 7.3 | **Deployment:** Configure for **Vercel** (recommended for Next.js) or **Node** (e.g. `next start` on Render). Set `DATABASE_URL` (PostgreSQL) and `OLLAMA_BASE_URL` in the platform. For file uploads, consider persistent volume or switch to S3/R2 if serverless. |
| 7.4 | **README:** Update with new stack, env example, and “Getting Started” (Next.js + PostgreSQL + Ollama). |

**Deliverable:** Single deployable Next.js app, README and env docs updated.

---

## 4. File and folder mapping (high level)

| Current (client)              | Next.js (target)                    |
|------------------------------|-------------------------------------|
| `src/App.jsx`                | `app/page.tsx` + `app/layout.tsx`   |
| `src/main.jsx`               | `app/layout.tsx` (root)             |
| `src/components/*`           | `components/*` (and under `app/`)   |
| `src/context/*`              | `context/*` or `app/*` providers    |
| `src/hooks/*`                | `hooks/*`                           |
| `src/services/api.js`         | `lib/api.ts` or inline `fetch('/api/...')` |
| `index.css` + `theme-toggle.css` | `app/globals.css` (port **all** AIFA theme; UI unchanged) |

| Current (server)             | Next.js (target)                    |
|------------------------------|-------------------------------------|
| `app.js` (Express)           | Removed; use Route Handlers         |
| `src/routes/*`               | `app/api/*/route.ts`                |
| `src/controllers/*`          | Logic in Route Handlers + `lib/*`   |
| `src/services/*`            | `lib/*` (ollama, documentProcessor) |
| `src/database/db.js`         | Prisma Client only (`lib/prisma.ts`)|
| `prisma/schema.prisma`       | `prisma/schema.prisma` (PostgreSQL) |
| `uploads/`                   | `uploads/` (or cloud storage)       |

---

## 5. Prisma schema change (PostgreSQL)

In the new Prisma schema (in the Next.js app):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Remove `previewFeatures = ["driverAdapters"]` and SQLite-specific config. Keep the same `Conversation`, `Message`, and `Attachment` models; optionally add indexes (e.g. on `conversationId`, `messageId`) for performance.

---

## 6. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Streaming differences in Next.js | Use standard `ReadableStream` in Route Handler; keep event schema identical so the existing client hook (or a small adapter) still works. |
| File uploads on serverless | Vercel has ephemeral filesystem; use `/tmp` for temp processing and consider moving to S3/R2/Neon storage for persistence, or deploy to a Node server (e.g. Render) with a persistent volume. |
| shadcn + Tailwind 4 | Prefer Tailwind 3.x with shadcn init; if you must use v4, follow shadcn + Tailwind 4 compatibility notes. |
| Large dependencies (Monaco, Tesseract) | Keep Monaco for code blocks; for OCR, consider server-only route or edge-safe alternative if you hit bundle size limits. |
| **UI drift** (migration changes look) | Port CSS and class names verbatim; use shadcn only with full overrides; verify side-by-side with current app before sign-off. |

---

## 7. Suggested order of work

1. **Phase 1** – Next.js + shadcn + Prisma + PostgreSQL (no API yet).
2. **Phase 2** – Conversations and models API; verify with curl or a simple page.
3. **Phase 3** – Chat stream, upload, document processing (and execute if needed).
4. **Phase 4 & 5** – Frontend layout and chat UI in parallel or right after Phase 3.
5. **Phase 6** – File serving.
6. **Phase 7** – Env, cleanup, deploy, README.

---

## 8. Checklist summary

- [ ] Next.js app created with App Router and Tailwind
- [ ] Existing AIFA theme and CSS ported (UI unchanged); shadcn only where overridden to match
- [ ] Prisma switched to PostgreSQL; migrations run
- [ ] Conversation and model API in Route Handlers
- [ ] Chat stream and stop API in Route Handlers
- [ ] Upload and document processing in Route Handlers
- [ ] Layout, sidebar, theme toggle — same look as current app
- [ ] Chat context and streaming hook ported
- [ ] Message list, input, attachments, model/settings UI
- [ ] Uploaded files served correctly
- [ ] Old client/server removed or archived; README and env updated
- [ ] Deployed (Vercel or Node) with PostgreSQL and Ollama configured

This plan gives you a clear path to the new stack while **keeping the UI exactly as it is** and preserving current behavior (chat, streaming, attachments, documents, code execution) in a single Next.js + PostgreSQL codebase.

# UI Roadmap – AIM Intelligence

## Fixes completed (this pass)

| Area | Fix |
|------|-----|
| **Copy / grammar** | Footer: "Worlds" → "World's best inference model from AIM Research Labs" |
| **Settings** | Settings modal was never openable. Added Settings (gear) icon in chat header; clicking opens the modal. |
| **Settings modal** | Close on **Escape**; added `role="dialog"`, `aria-modal="true"`, `aria-labelledby="settings-title"` for screen readers. |
| **Alerts** | Error banner: `role="alert"`; Retry button: `aria-label="Retry"`. GPU banner: `role="status"`. |
| **Mobile actions** | Message copy/edit and sidebar rename/delete were hover-only. On mobile they are always visible (`opacity-100` on small screens, hover-reveal from `sm` up). Copy/Edit buttons have `aria-label`. |

---

## Short-term enhancements

### Accessibility
- [ ] **Focus trap in Settings modal** – Keep focus inside modal while open; return focus to trigger on close.
- [ ] **Skip link** – "Skip to main content" for keyboard users.
- [ ] **Reduced motion** – Respect `prefers-reduced-motion` for animations (theme toggle, scroll, badges).
- [ ] **Range inputs** – Ensure Temperature / Top-P / Max tokens sliders have visible focus and labels for assistive tech.

### Mobile
- [ ] **Scroll-to-bottom position** – Tweak `bottom` (e.g. `bottom-32` on very small viewports) so the FAB never overlaps the input on short screens.
- [ ] **Safe area** – Use `env(safe-area-inset-bottom)` for the fixed input bar on notched devices.
- [ ] **Swipe to close sidebar** – Optional: swipe from left edge to open, swipe overlay to close on mobile.

### Chat & messages
- [ ] **Message edit/delete** – Wire `onEdit` and `onDelete` in `MessageItem` to ChatContext/API (update message, delete message) instead of no-ops.
- [ ] **Toast notifications** – Show brief “Copied” / “Message updated” / error toasts instead of or in addition to inline “Copied!”.
- [ ] **Loading skeletons** – Skeleton placeholders for conversation list and message list while loading.

### Consistency
- [ ] **Settings theme selection** – Use `var(--accent-primary)` for selected Light/Dark instead of hard-coded `blue-500` to match the rest of the app.
- [ ] **AIM vs AIFA** – Decide one product name and use it in sidebar, header, and message labels (currently mixed).

---

## Medium-term enhancements

### UX
- [ ] **Keyboard shortcuts** – e.g. `Ctrl/Cmd + Enter` to send, `Escape` to stop generation; optional shortcut help (e.g. `?`).
- [ ] **Empty state** – Illustration or subtle animation on the “Experience Aim Intelligence” screen when there are no messages.
- [ ] **Conversation list** – Skeleton or loading state; optimistic updates when creating/deleting.
- [ ] **Model switcher in header** – Option to show current model (and open switcher) in the chat header on desktop, in addition to sidebar.

### Visual & polish
- [ ] **Input focus ring** – Clear, consistent focus style on input and all buttons (e.g. `focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`).
- [ ] **Code block** – Optional “Expand/collapse” for very long code.
- [ ] **Tables** – Horizontal scroll with shadow or fade on overflow to hint scrollability.

### Performance & resilience
- [ ] **Optimistic send** – Show user message immediately; roll back and show error if send fails.
- [ ] **Stream error recovery** – Retry or “Resume” when stream fails mid-response.
- [ ] **Offline / reconnect** – Simple offline banner and reconnect when back online.

---

## Longer-term / exploration

- [ ] **PWA** – Install prompt, offline shell, optional background sync for drafts.
- [ ] **Themes** – Extra theme (e.g. high contrast, sepia) stored in settings.
- [ ] **Layout preferences** – Optional compact/comfortable density; sidebar width.
- [ ] **Search** – Search within conversation or across conversations.
- [ ] **Export** – Export thread as Markdown or PDF.
- [ ] **Voice output (TTS)** – Optional read-aloud for assistant messages (browser or backend TTS).

---

## How to use this roadmap

- **Short-term**: Pick 1–2 items per sprint (e.g. focus trap + message edit/delete).
- **Medium-term**: Plan per quarter; align with backend (e.g. message update/delete API) before wiring UI.
- **Longer-term**: Revisit when core UX and performance are solid.

Priorities should favor: **accessibility**, **mobile usability**, and **reliability** (errors, loading, offline) before extra features.

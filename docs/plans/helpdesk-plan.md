# Appzeto Helpdesk — Implementation Plan

## File Structure

### New Files (Backend)
- `server/package.json`
- `server/src/index.js` — Express app entry
- `server/src/db.js` — MongoDB connection
- `server/src/models/Agent.js` — Agent schema
- `server/src/models/Ticket.js` — Ticket schema
- `server/src/utils/sla.js` — SLA computation helpers
- `server/src/utils/assignment.js` — Load-balancing logic
- `server/src/routes/tickets.js` — All ticket routes
- `server/src/seed.js` — Seed agents + mapped tickets

### New Files (Frontend)
- `client/package.json`
- `client/vite.config.js`
- `client/tailwind.config.js`
- `client/index.html`
- `client/src/main.jsx`
- `client/src/App.jsx` — React Router setup
- `client/src/api.js` — Axios instance + all API calls
- `client/src/hooks/useTickets.js` — Polling hook
- `client/src/components/StatsBar.jsx`
- `client/src/components/TicketCard.jsx`
- `client/src/components/Toast.jsx`
- `client/src/components/ConflictModal.jsx`
- `client/src/pages/ListPage.jsx`
- `client/src/pages/CreatePage.jsx`
- `client/src/pages/DetailPage.jsx`

### Root
- `package.json` — concurrently dev script
- `README.md`

### Dependencies
**Backend:** express, mongoose, cors, dotenv, express-validator
**Frontend:** react, react-dom, react-router-dom, axios, date-fns, tailwindcss
**Root:** concurrently

---

## Task 1: Root package.json + project scaffold

**File:** `package.json`, `server/package.json`, `client/` (Vite scaffold)

**What:** Set up monorepo root with concurrently, backend package, frontend via Vite.

---

## Task 2: MongoDB connection + Agent model

**File:** `server/src/db.js`, `server/src/models/Agent.js`

**What:** Connect mongoose; define Agent schema with name, maxLoad, activeTickets.

---

## Task 3: Ticket model

**File:** `server/src/models/Ticket.js`

**What:** Full Ticket schema with all fields, pre-save version increment hook placeholder.

---

## Task 4: SLA utility

**File:** `server/src/utils/sla.js`

**What:** Compute slaDeadline and slaState from ticket, handle one-time priority bump logic.

---

## Task 5: Assignment utility

**File:** `server/src/utils/assignment.js`

**What:** Find best agent by load%, assign ticket, handle Queued state, reassign oldest queued on free.

---

## Task 6: Ticket routes — POST /api/tickets

**File:** `server/src/routes/tickets.js`

**What:** Create ticket with validation, auto-assign, set slaDeadline, history entry.

---

## Task 7: Ticket routes — GET /api/tickets + GET /api/tickets/stats

**File:** `server/src/routes/tickets.js`

**What:** List with filters/sort/pagination; stats aggregation pipeline.

---

## Task 8: Ticket routes — PATCH /api/tickets/:id (status + optimistic lock)

**File:** `server/src/routes/tickets.js`

**What:** Status machine validation, version check (409), history entry, trigger reassignment on Resolved/Closed.

---

## Task 9: Ticket routes — POST /api/tickets/:id/comments

**File:** `server/src/routes/tickets.js`

**What:** Add comment, reject on Closed, min 3 chars.

---

## Task 10: Express entry + seed

**File:** `server/src/index.js`, `server/src/seed.js`

**What:** Wire up app, seed 3 agents + 38 mapped tickets on startup if DB empty.

---

## Task 11: Frontend — api.js + App.jsx routing

**File:** `client/src/api.js`, `client/src/App.jsx`

**What:** Axios instance pointing to localhost:3001, all API functions, React Router routes.

---

## Task 12: StatsBar + TicketCard components

**File:** `client/src/components/StatsBar.jsx`, `client/src/components/TicketCard.jsx`

**What:** Stats display; card with category badge, priority color, SLA indicator, relative time.

---

## Task 13: useTickets polling hook

**File:** `client/src/hooks/useTickets.js`

**What:** 5-second poll without resetting scroll/page/dropdowns; compute diff for toast.

---

## Task 14: ListPage

**File:** `client/src/pages/ListPage.jsx`

**What:** Filters, debounced search, sort dropdown, paginated cards, update toast.

---

## Task 15: CreatePage

**File:** `client/src/pages/CreatePage.jsx`

**What:** Form with client-side validation mirroring backend rules, redirect on success.

---

## Task 16: Toast + ConflictModal components

**File:** `client/src/components/Toast.jsx`, `client/src/components/ConflictModal.jsx`

**What:** Toast notification; 409 modal with side-by-side diff + Take theirs / Retry mine buttons.

---

## Task 17: DetailPage

**File:** `client/src/pages/DetailPage.jsx`

**What:** Full ticket info, SLA countdown (color shifts), history timeline, comment box, status dropdown (legal only), optimistic update + rollback on error/409.

---

## Task 18: README

**File:** `README.md`

**What:** Prerequisites, env setup, `npm run dev` instructions.

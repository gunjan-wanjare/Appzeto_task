# Appzeto Helpdesk

A full-stack support-ticket system built with the MERN stack.

## Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

Start MongoDB (if not running as a service):
```bash
mongod
```

## Setup & Run

```bash
# 1. Install all dependencies
npm run install:all

# 2. Seed the database (agents + 38 mapped tickets)
npm run seed

# 3. Start both frontend and backend
npm run dev
```

- **Backend** → http://localhost:3001
- **Frontend** → http://localhost:5173

## Demo: Two Browser Windows

Open http://localhost:5173 in two side-by-side windows.

**Auto-assignment test:** Create tickets until all agents are full — next ticket becomes Queued. Resolve one → oldest Queued ticket auto-assigns (visible in its history).

**Conflict test:** Both windows open the same ticket. Window A changes status. Window B changes status without refreshing — B sees the conflict modal with side-by-side comparison. Use "Take theirs" or "Retry mine on top".

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tickets | List with filters, sort, pagination |
| POST | /api/tickets | Create ticket |
| GET | /api/tickets/stats | Counts by status & priority |
| GET | /api/tickets/:id | Get single ticket |
| PATCH | /api/tickets/:id | Update status (optimistic lock) |
| POST | /api/tickets/:id/comments | Add comment |

## Architecture

```
Appzeto/
├── server/          # Express + MongoDB
│   └── src/
│       ├── models/  # Ticket, Agent schemas
│       ├── routes/  # tickets.js
│       ├── utils/   # sla.js, assignment.js
│       └── seed.js
└── client/          # React + Vite + Tailwind
    └── src/
        ├── pages/   # ListPage, CreatePage, DetailPage
        ├── components/
        └── hooks/   # useTickets (polling)
```

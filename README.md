# PawMate

A website that connects busy pet owners with trusted pet walkers and caregivers, paid or volunteer.

```
pawmate/
  frontend/     React + Vite website
  backend/      Node.js + Express + MongoDB API
  package.json  Shortcut commands that run both together
```

## Quick start

You need **Node.js 20.19 or newer** and a **MongoDB** database: either
[MongoDB installed on your computer](https://www.mongodb.com/docs/manual/installation/)
or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

Open a terminal **inside the `pawmate` folder** (the one that contains `frontend` and `backend`), then:

```bash
# 1. Install everything (root, frontend and backend)
npm run install:all

# 2. Create the backend settings file
#    Windows (PowerShell):  copy backend\.env.example backend\.env
#    Mac / Linux:           cp backend/.env.example backend/.env
#
#    Open backend/.env and set:
#      MONGODB_URI  ->  mongodb://127.0.0.1:27017/pawmate   (or your Atlas connection string)
#      JWT_SECRET   ->  a long random string. Generate one with:
#        node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Put the sample data in the database (walkers, reviews, demo accounts)
npm run seed

# 4. Start the backend (port 5000) and the frontend (port 5173) together
npm run dev
```

Open **http://localhost:5173**.

Demo accounts (password `Pawmate@123`): `owner@pawmate.com` and `walker@pawmate.com`.
The login page has one-click demo buttons while you develop.

### Commands (run from the `pawmate` folder)

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts backend and frontend together |
| `npm run dev:frontend` | Frontend only |
| `npm run dev:backend` | Backend only (restarts when you save) |
| `npm run seed` | Adds sample data to an empty database |
| `npm run seed:reset` | Wipes PawMate data and adds the sample data again |
| `npm run build` | Builds the frontend for production into `frontend/dist` |
| `npm run start` | Starts the backend the way production does |
| `npm run test:backend` | Backend tests (see below) |

No backend or database yet? You can run the website alone with offline demo data:
in `frontend/` run `VITE_USE_MOCK=true npm run dev` (Mac/Linux) or, in PowerShell,
`$env:VITE_USE_MOCK="true"; npm run dev`.

## What is inside

```
frontend/
  index.html, vite.config.js, package.json, .env.example
  public/
  src/
    main.jsx, App.jsx        Entry point and all routes
    pages/                   One file per page
    components/              Reusable pieces: ui, layout, walker, booking,
                             calendar, chat, dashboard, pets, illustrations
    services/
      api.js                 Chooses real API or offline mock
      httpApi.js             Real API client (talks to the backend)
      http.js                fetch wrapper: login token, error messages
      mockApi.js             Offline demo mode
    context/                 Login session, notifications
    hooks/  utils/  data/  styles/

backend/
  package.json, .env.example
  uploads/                   ID documents (private, never served publicly)
  src/
    index.js                 Starts the server
    app.js                   Security, CORS, rate limits, routes
    config.js                Reads environment variables
    db.js                    MongoDB connection and indexes
    models/                  User, Walker, Pet, Booking, Review, Conversation, ContactMessage
    routes/                  auth, users, walkers, pets, bookings, reviews,
                             conversations, contact, admin
    middleware/              auth (JWT), validate (zod), error handling
    utils/                   pricing, dates, serializers, helpers
    seed/seed.js             Sample data
  tests/api.test.js          24 integration tests
```

## How the two halves talk

- Pages call `api.something()` (`frontend/src/services/api.js`), which uses the real client unless
  `VITE_USE_MOCK=true`.
- While developing, Vite forwards `/api/...` to `http://localhost:5000`, so you need no CORS setup.
- After login the backend returns a token. The frontend saves it and sends it with each request.
- The backend never trusts the browser for anything important: prices are recalculated, a pet must
  belong to the person booking, only the walker can accept or complete a booking, and a walker cannot
  see an owner's phone, address or emergency contact until they accept.

## API overview

All routes start with `/api`. Errors look like `{ "error": { "message": "..." } }`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Account | `PATCH /users/me`, `POST /users/me/roles` |
| Walkers | `GET /walkers` (filters), `GET /walkers/:id`, `GET /walkers/:id/reviews`, `GET /walkers/:id/booked-slots`, `GET /walkers/me`, `POST /walkers`, `PATCH /walkers/:id`, `POST /walkers/:id/verification` (file upload) |
| Pets | `GET /pets`, `POST /pets`, `PUT /pets/:id`, `DELETE /pets/:id` |
| Bookings | `GET /bookings?as=owner\|walker`, `GET /bookings/:id`, `POST /bookings`, `PATCH /bookings/:id/status` |
| Reviews | `POST /reviews` |
| Chat | `GET /conversations`, `POST /conversations`, `GET /conversations/:id`, `POST /conversations/:id/messages` |
| Support | `POST /contact`, `GET /health` |
| Admin | `PATCH /admin/walkers/:id/verification` (needs `ADMIN_TOKEN`) |

Booking status flow: `Pending` to `Accepted` to `Completed`, and `Cancelled` from Pending or Accepted.

## Backend tests

The tests create, change and delete data, so point them at an empty database you don't mind losing:

```bash
# Mac / Linux
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/pawmate_test npm run test:backend
# Windows PowerShell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/pawmate_test"; npm run test:backend
```

## Deploying

**Option A: one service (simplest).** Build the frontend, then let the backend serve it.

```bash
npm run build          # creates frontend/dist
# environment variables for the backend (in backend/.env or your host's settings):
#   NODE_ENV=production
#   MONGODB_URI=<your Atlas connection string>
#   JWT_SECRET=<48+ random characters>
#   SERVE_CLIENT=true
npm run start
```

**Option B: two services.** Host the frontend on Netlify or Vercel and the backend on Render or Railway.
Build the frontend with `VITE_API_URL=https://your-backend.example.com/api`, and set
`CLIENT_ORIGIN=https://your-frontend.example.com` on the backend. Configure the frontend host to serve
`index.html` for every path (Netlify: a `_redirects` file containing `/* /index.html 200`).

## Before you launch

- [ ] `NODE_ENV=production` and a strong `JWT_SECRET` (the backend refuses to start without one)
- [ ] MongoDB Atlas with a dedicated database user, an IP allow-list and backups
- [ ] Replace the placeholder support number and email in `frontend/src/data/constants.js`
- [ ] **Payments are simulated.** Add a payment gateway (Razorpay, Stripe) in the backend. Never handle raw card numbers yourself.
- [ ] **ID documents are stored on the backend's disk** (`backend/uploads/ids`, never served publicly). For production use encrypted private storage such as S3, and delete documents after review.
- [ ] Build a real admin review for IDs (a minimal token-protected route exists)
- [ ] The login token is kept in `localStorage`, which is simple but readable by any script on the page. For higher security, move it to an `httpOnly` cookie.
- [ ] Add email or SMS for password reset, phone verification and booking notifications (not built yet)
- [ ] Chat checks for new messages every few seconds. Move to WebSockets (Socket.IO) if you need instant messages.
- [ ] Add pagination to walker search once you have hundreds of walkers
- [ ] The sample walkers, reviews and testimonials are made-up demo data. Remove them before launch.

## Troubleshooting

- **`ENOENT ... package.json` when running npm:** your terminal is in the wrong folder. Run the commands from the
  `pawmate` folder that contains `frontend` and `backend`.
- **`MongooseServerSelectionError` / cannot connect:** MongoDB isn't running, or `MONGODB_URI` in `backend/.env` is wrong.
  With Atlas, also add your IP address under Network Access.
- **Page shows "Cannot reach the PawMate server":** the backend isn't running. Use `npm run dev` from the `pawmate` folder.
- **Too many attempts (429) while testing logins:** you hit the login rate limit. Wait a few minutes, or raise
  `AUTH_RATE_LIMIT_MAX` in `backend/.env`.

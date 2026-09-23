# PawMate API

Express + MongoDB (Mongoose) REST API for PawMate. See the main `README.md` one folder up
for setup, the endpoint overview and deployment.

```bash
cp .env.example .env     # then edit MONGODB_URI and JWT_SECRET
npm install
npm run seed             # sample data (add -- --reset to wipe first)
npm run dev              # http://localhost:5000/api/health
npm test                 # needs TEST_MONGODB_URI pointing at a throw-away database
```

## Design notes

- **Validation:** every request body, query and id is checked with zod before it reaches the database.
  Unknown fields are dropped, so a browser cannot set things like `role`, `status` or `total` by sending extra data.
- **Authorization:** each route checks who is asking. Owners can only touch their own pets and bookings,
  only a booking's walker can accept or complete it, and chats are visible only to their two participants.
- **Prices** are always calculated on the server from the walker's hourly rate.
- **Double booking:** the slot is checked in code, and a partial unique index on
  `(walkerId, date, slot)` for Pending/Accepted bookings stops two simultaneous requests from both winning.
- **Status changes** use a conditional update, so two people can't apply conflicting changes at once.
- **Passwords** are hashed with bcrypt (cost 12). Login errors are generic and take similar time
  whether or not the email exists.
- **Uploads:** ID documents accept only JPG, PNG, WebP or PDF up to 5 MB, are stored under random names
  and are never served publicly.
- **Rate limiting:** 600 requests per 15 minutes per IP overall, 30 login/signup attempts,
  10 contact messages per hour. Change with `RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_MAX`.
- **Security headers** via helmet, and CORS limited to `CLIENT_ORIGIN`.
- **Chat demo replies:** with `DEMO_REPLIES=true` (default outside production), the sample walkers
  send a canned reply so you can see the chat working. Real users are never auto-replied to.

## Marking a walker as verified

New walkers upload an ID and stay "in review". Set `ADMIN_TOKEN` in `.env`, then:

```bash
curl -X PATCH http://localhost:5000/api/admin/walkers/<walkerId>/verification \
  -H "x-admin-token: <your ADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"id":"verified"}'
```

You can also edit the walker's `verification.id` field directly in MongoDB Compass.

# Admin Dashboard + QR Code Setup

This guide covers setting up the **kitchen/admin dashboard** and **generating QR codes** for your tables. Complete [GETTING_STARTED.md](./GETTING_STARTED.md) first — the customer ordering app and Supabase project must already be working.

---

## 1. Add the new env vars

### `server/.env` — add one line:
```
ADMIN_PIN=1234
```
Change `1234` to a PIN that only your staff know.

### `client/.env` — add two lines:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Get both from **Supabase dashboard → Project Settings → API**. The anon key is safe to put here — Row Level Security blocks writes; all writes still go through the Flask backend.

---

## 2. Install the new client dependency

```bash
cd client
npm install
```

This picks up `@supabase/supabase-js` which the admin dashboard uses for Realtime.

---

## 3. Restart the Flask server

```bash
cd server
source venv/bin/activate
python app.py
```

The new `/api/admin/*` routes are now available.

---

## 4. Open the admin dashboard

```
http://localhost:5173/admin
```

Enter your PIN → you land on the kanban board.

### What the dashboard does

**Kanban columns** — three columns (New / Preparing / Done) with live counts. Every order for today appears here, sorted newest-first.

**Realtime** — when a customer places an order, a green flash and a double-beep alert the kitchen. No refresh needed. The status dot in the top bar shows whether the Realtime connection is live.

**Status actions** — each order card has one button:
- New → "Start preparing" → moves to Preparing
- Preparing → "Mark served ✓" → moves to Done

**Stats bar** — total orders placed today, total revenue, and active order count update live as orders come in and are advanced.

**Multi-device** — open the dashboard on as many screens as you like (kitchen monitor, manager tablet, etc.). Status changes from one device appear on all others instantly via Realtime.

---

## 5. Generate printed QR codes

```bash
cd qr-generator
pip install -r requirements.txt

# Replace with your actual deployed URL (or use localhost for testing)
python generate_qr.py --base-url https://yourapp.com/order --tables 10
```

This creates `qr-codes/table_01.png` through `qr-codes/table_10.png`.

Each PNG is a square QR code with "Table N · Scan to order" printed below it — ready to print, laminate, and place on tables.

For local testing, use `http://localhost:5173/order` as the base URL — customers on the same Wi-Fi network can scan and order from their phones.

---

## Deploying to production

Suggested stack (all have generous free tiers):

| Component | Service | Notes |
|---|---|---|
| React frontend | Vercel or Netlify | `npm run build`, then point at the `dist/` folder |
| Flask backend | Render or Railway | Set all env vars in the dashboard |
| Database + Realtime | Supabase | Already there |

Once deployed, re-generate QR codes with your live URL and reprint the table codes.

---

## Troubleshooting

**"Wrong PIN" on login** — Make sure `ADMIN_PIN` is set in `server/.env` and the Flask server was restarted after adding it.

**Status dot shows "Offline"** — Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in `client/.env` and the Realtime feature is enabled on your Supabase project (Database → Replication → `orders` table should be toggled on — the schema.sql already did this, but worth double-checking).

**New orders don't appear** — Make sure the Supabase `orders` table has Realtime enabled. In Supabase dashboard: Database → Replication, check that `orders` is in the publication.

**QR codes scan to the wrong URL** — The `--base-url` must end without a trailing slash and must include the `/order` path prefix, e.g. `https://myapp.com/order`.

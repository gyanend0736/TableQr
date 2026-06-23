# Getting Started — Customer Ordering App

This is the first slice of TableQR: a customer can open a table-specific link,
browse the menu, build a cart, and place an order that's saved to your database.
The admin/kitchen dashboard, QR code generator, and payments aren't built yet —
see the **Roadmap** in the main README for what's next.

**Stack for this slice:** React (Vite) frontend → Flask API → Supabase (Postgres).

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. Wait for the project to finish provisioning.
3. Open the **SQL Editor** (left sidebar) → **New query**.
4. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   This creates the `tables`, `menu_items`, `orders`, and `order_items` tables,
   turns on Realtime for `orders`, and seeds 5 tables + a starter menu so you
   have something to order right away.
5. Go to **Project Settings → API**. You'll need two values from this page in step 2:
   - **Project URL**
   - **service_role key** (under "Project API keys" — click reveal). This key is
     secret and only ever goes in the *server's* `.env`, never the client's.

---

## 2. Run the backend (Flask)

```bash
cd server
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now edit .env and paste in your Supabase URL + service_role key

python app.py
```

The API starts at `http://localhost:5000`. Sanity check it's alive:

```bash
curl http://localhost:5000/api/health
# {"status": "ok"}
```

---

## 3. Run the frontend (React)

In a second terminal:

```bash
cd client
npm install

cp .env.example .env
# default already points at http://localhost:5000/api — only change this
# if your Flask server is running somewhere else

npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

---

## 4. Try it out

You don't have physical QR codes yet, so there are two ways in:

- Visit `http://localhost:5173/order/1` directly (table 1 was seeded by the SQL script — tables 1 through 5 all exist), **or**
- Visit `http://localhost:5173/`, and use the "enter a table number" fallback on the landing page.

From there: browse the seeded menu, tap **Add** on a few items, tap the cart bar
at the bottom, adjust quantities or add notes, and tap **Place order**. You'll
land on a receipt screen, and the order will be sitting in your Supabase
`orders` / `order_items` tables — check the **Table Editor** in Supabase to see it land.

---

## What's actually in this slice

```
client/src/
├── api.js                 # talks to the Flask API
├── context/CartContext.jsx# in-memory cart (per browser tab)
├── pages/
│   ├── Landing.jsx         # entry point when no QR was scanned yet
│   ├── Menu.jsx             # browse + add to cart
│   ├── Cart.jsx              # review, edit quantities/notes, place order
│   └── Receipt.jsx            # confirmation ticket after ordering
└── components/              # MenuItemCard, CategoryNav, CartBar, QuantityStepper, StatusBadge

server/
├── app.py                  # Flask app + CORS + blueprints
├── db.py                    # Supabase client (service role key)
└── routes/
    ├── menu.py               # GET /api/menu, GET /api/tables/:number
    └── orders.py               # POST /api/orders, GET /api/orders/:id

supabase/schema.sql        # tables, RLS, Realtime, seed data
```

Prices are always re-read from the database when an order is placed — the
Flask backend never trusts a price sent from the browser.

---

## Next steps

Once this is working end to end, the natural next pieces (in order) are:

1. **Admin/kitchen dashboard** — subscribes to Supabase Realtime on `orders`
   so new orders appear instantly, with buttons to move status
   received → preparing → served.
2. **QR code generator** — a small script that outputs one QR image per table
   number, pointing at `https://yourapp.com/order/<table_number>`.
3. **Deploy** — frontend to Vercel/Netlify, Flask to a host like Render or
   Railway, database already lives on Supabase.

Just say the word and we'll build the next piece.

# TableQR — Smart Restaurant Ordering System

A QR-code based digital ordering system that lets restaurant customers scan a code at their table, browse the menu, and place orders directly — with live order updates reaching kitchen/admin staff in real time, and instant digital receipts for both customer and restaurant.

> Built to eliminate manual order-taking, reduce errors, and modernize the dine-in experience for restaurants — no app download required for customers.

---

## ✨ Features

- 📱 **Contactless Ordering** — Customers scan a table-specific QR code and order directly from their phone browser, no app install needed.
- 🍽️ **Digital Menu** — Categorized menu with item details, pricing, and live availability.
- ⚡ **Real-Time Order Sync** — Orders are pushed instantly to the kitchen/admin dashboard the moment they're placed, using live database subscriptions.
- 🪑 **Table Identification** — Every order is automatically tagged with the originating table number, so staff know exactly where to deliver.
- 🧾 **Automatic Receipts** — A digital receipt is generated and made available to both the customer and the restaurant admin immediately after order confirmation.
- 🖥️ **Admin/Kitchen Dashboard** — Live view of incoming orders, status tracking (received → preparing → served), and order history.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Flask / Node.js |
| Database | PostgreSQL (via Supabase) |
| Real-Time Sync | Supabase Realtime |
| Hosting | Vercel / Netlify (frontend), Supabase (backend + DB) |
| QR Generation | qrcode (Python) / qrcode.react (JS) |

---

## 🔄 How It Works

1. **Scan** — Customer scans the QR code placed on their table.
2. **Browse** — The digital menu opens instantly in their phone's browser.
3. **Order** — Customer adds items to cart and places the order.
4. **Sync** — The order is written to the database and pushed live to the admin/kitchen dashboard with the table number attached.
5. **Fulfill** — Staff view the order, update its status, and prepare/serve it.
6. **Receipt** — A digital receipt is generated automatically and shared with both the customer and the admin panel.

```
[Customer Phone] --scan--> [QR Code] --opens--> [Menu UI]
       |                                            |
       v                                            v
  [Place Order] -----------------------------> [Database]
                                                     |
                                      (real-time push)
                                                     |
                                                     v
                                          [Kitchen / Admin Dashboard]
                                                     |
                                                     v
                                          [Receipt: Customer + Admin]
```

---

## 📁 Project Structure

```
tableqr/
├── client/                 # React frontend (customer menu + admin dashboard)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Menu.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Receipt.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/
│   │   └── supabaseClient.js
├── server/                  # Backend logic (if using Flask/Node for custom APIs)
│   ├── routes/
│   ├── models/
│   └── app.py / index.js
├── qr-generator/            # Script to generate per-table QR codes
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+ (if using Flask backend)
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/tableqr.git
cd tableqr
```

### 2. Set up the database
- Create a new Supabase project
- Create tables: `menu_items`, `orders`, `tables`
- Enable Realtime on the `orders` table

### 3. Configure environment variables
Create a `.env` file in `client/`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install dependencies and run
```bash
cd client
npm install
npm run dev
```

### 5. Generate table QR codes
```bash
cd qr-generator
python generate_qr.py --tables 10 --base-url https://yourapp.com/order
```

---

## 🗺️ Roadmap

- [ ] UPI / online payment integration
- [ ] Multi-restaurant / multi-location support
- [ ] Order analytics dashboard for admin
- [ ] SMS/WhatsApp receipt delivery
- [ ] Inventory and stock tracking

---

## 👤 Author

**Gyanendra Singh**
Final-year B.Tech CS Student | Full-Stack & AI/ML Developer
📧 singhgyanendra715@gmail.com · [GitHub](https://github.com) · [LinkedIn](https://linkedin.com)

---

## 📄 License

This project is open for demonstration and educational purposes. Contact the author for commercial deployment or licensing.

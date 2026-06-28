from datetime import date
from functools import wraps
import os

from flask import Blueprint, jsonify, request, abort
from db import supabase

admin_bp = Blueprint("admin", __name__)


# ─── Auth middleware ───────────────────────────────────────────────────────────

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        pin = request.headers.get("X-Admin-Pin")
        expected = os.environ.get("ADMIN_PIN")
        if not expected:
            abort(500, description="ADMIN_PIN not set in server/.env")
        if pin != expected:
            abort(401, description="Unauthorized")
        return f(*args, **kwargs)
    return decorated


# ─── Login ────────────────────────────────────────────────────────────────────

@admin_bp.post("/admin/login")
def admin_login():
    """
    Checks the submitted PIN against ADMIN_PIN in server/.env.
    Returns {"ok": true} so the client can store the PIN in sessionStorage.
    The PIN is then sent as X-Admin-Pin on all subsequent admin requests.
    """
    body = request.get_json(silent=True) or {}
    pin = body.get("pin")
    expected = os.environ.get("ADMIN_PIN")
    if not expected:
        abort(500, description="ADMIN_PIN not configured in server/.env")
    if pin != expected:
        abort(401, description="Wrong PIN")
    return jsonify({"ok": True})


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _format_order(row):
    tables_node = row.get("tables")
    table_number = tables_node.get("table_number") if isinstance(tables_node, dict) else None
    return {
        "id": row["id"],
        "table_number": table_number,
        "status": row["status"],
        "total_amount": float(row["total_amount"]),
        "created_at": row["created_at"],
        "items": [
            {
                "item_name": item["item_name"],
                "quantity": item["quantity"],
                "price_at_order": float(item["price_at_order"]),
                "notes": item.get("notes"),
            }
            for item in (row.get("order_items") or [])
        ],
    }


_ORDER_SELECT = (
    "id, status, total_amount, created_at, "
    "tables(table_number), "
    "order_items(item_name, quantity, price_at_order, notes)"
)


# ─── Orders ───────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/orders")
@require_admin
def list_orders():
    """
    Returns today's orders by default (newest first, items embedded).
    Pass ?all=1 to include all historical orders (last 200).
    """
    show_all = request.args.get("all") == "1"
    query = (
        supabase.table("orders")
        .select(_ORDER_SELECT)
        .order("created_at", desc=True)
        .limit(200)
    )
    if not show_all:
        today = date.today().isoformat()
        query = query.gte("created_at", f"{today}T00:00:00")

    result = query.execute()
    return jsonify([_format_order(row) for row in result.data])


@admin_bp.get("/admin/orders/<order_id>")
@require_admin
def get_order(order_id):
    """Fetch a single order with all items — used when Realtime fires for a new order."""
    result = (
        supabase.table("orders")
        .select(_ORDER_SELECT)
        .eq("id", order_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        abort(404, description="Order not found")
    return jsonify(_format_order(result.data[0]))


@admin_bp.patch("/admin/orders/<order_id>/status")
@require_admin
def update_status(order_id):
    body = request.get_json(silent=True) or {}
    new_status = body.get("status")
    if new_status not in ("received", "preparing", "served"):
        abort(400, description="status must be 'received', 'preparing', or 'served'")

    result = (
        supabase.table("orders")
        .update({"status": new_status})
        .eq("id", order_id)
        .execute()
    )
    if not result.data:
        abort(404, description="Order not found")
    return jsonify({"id": order_id, "status": new_status})


# ─── Stats ────────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/stats")
@require_admin
def today_stats():
    """Counts and total revenue for today, broken down by status."""
    today = date.today().isoformat()
    result = (
        supabase.table("orders")
        .select("status, total_amount")
        .gte("created_at", f"{today}T00:00:00")
        .execute()
    )
    orders = result.data
    total_revenue = sum(float(o["total_amount"]) for o in orders)
    by_status = {}
    for o in orders:
        by_status[o["status"]] = by_status.get(o["status"], 0) + 1

    return jsonify({
        "total_orders": len(orders),
        "total_revenue": round(total_revenue, 2),
        "by_status": by_status,
    })

    # ─── Menu management ──────────────────────────────────────────────────────────

@admin_bp.get("/admin/menu")
@require_admin
def list_all_menu_items():
    """All items including unavailable ones — for the admin menu editor."""
    result = (
        supabase.table("menu_items")
        .select("id, name, description, price, category, image_url, is_available")
        .order("category")
        .order("name")
        .execute()
    )
    return jsonify(result.data)


@admin_bp.post("/admin/menu")
@require_admin
def create_menu_item():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    price = body.get("price")
    category = body.get("category", "").strip()

    if not name:
        abort(400, description="name is required")
    if price is None or not isinstance(price, (int, float)) or price < 0:
        abort(400, description="price must be a non-negative number")
    if not category:
        abort(400, description="category is required")

    result = (
        supabase.table("menu_items")
        .insert({
            "name": name,
            "description": body.get("description", "").strip() or None,
            "price": round(float(price), 2),
            "category": category,
            "image_url": body.get("image_url", "").strip() or None,
            "is_available": body.get("is_available", True),
        })
        .execute()
    )
    return jsonify(result.data[0]), 201


@admin_bp.patch("/admin/menu/<item_id>")
@require_admin
def update_menu_item(item_id):
    body = request.get_json(silent=True) or {}
    allowed = {"name", "description", "price", "category", "image_url", "is_available"}
    updates = {k: v for k, v in body.items() if k in allowed}

    if not updates:
        abort(400, description="No valid fields to update")
    if "price" in updates:
        updates["price"] = round(float(updates["price"]), 2)

    result = (
        supabase.table("menu_items")
        .update(updates)
        .eq("id", item_id)
        .execute()
    )
    if not result.data:
        abort(404, description="Menu item not found")
    return jsonify(result.data[0])


@admin_bp.patch("/admin/menu/<item_id>/availability")
@require_admin
def toggle_availability(item_id):
    body = request.get_json(silent=True) or {}
    is_available = body.get("is_available")
    if not isinstance(is_available, bool):
        abort(400, description="is_available must be true or false")

    result = (
        supabase.table("menu_items")
        .update({"is_available": is_available})
        .eq("id", item_id)
        .execute()
    )
    if not result.data:
        abort(404, description="Menu item not found")
    return jsonify(result.data[0])


@admin_bp.delete("/admin/menu/<item_id>")
@require_admin
def delete_menu_item(item_id):
    result = (
        supabase.table("menu_items")
        .delete()
        .eq("id", item_id)
        .execute()
    )
    if not result.data:
        abort(404, description="Menu item not found")
    return jsonify({"deleted": item_id})

# ─── Revenue history ──────────────────────────────────────────────────────────

@admin_bp.get("/admin/revenue")
@require_admin
def daily_revenue():
    """Returns daily revenue + order count for the last N days (default 10)."""
    from datetime import date, timedelta

    days = max(1, min(int(request.args.get("days", 10)), 90))
    today = date.today()
    since = (today - timedelta(days=days - 1)).isoformat()

    result = (
        supabase.table("orders")
        .select("total_amount, created_at")
        .gte("created_at", f"{since}T00:00:00")
        .execute()
    )

    # Aggregate by day in Python
    daily = {}
    for row in result.data:
        day = row["created_at"][:10]          # "2024-06-18"
        if day not in daily:
            daily[day] = {"revenue": 0.0, "orders": 0}
        daily[day]["revenue"] += float(row["total_amount"])
        daily[day]["orders"] += 1

    # Build full range — fill missing days with zeros
    output = []
    for i in range(days):
        d = today - timedelta(days=days - 1 - i)
        day_str = d.isoformat()
        output.append({
            "date": day_str,
            "label": f"{d.day} {d.strftime('%b')}",   # "18 Jun" — no leading zero, portable
            "revenue": round(daily.get(day_str, {}).get("revenue", 0.0), 2),
            "orders": daily.get(day_str, {}).get("orders", 0),
            "is_today": day_str == today.isoformat(),
        })

    return jsonify(output)
from flask import Blueprint, jsonify, request, abort

from db import supabase

orders_bp = Blueprint("orders", __name__)


def _get_table_or_404(table_number):
    result = (
        supabase.table("tables")
        .select("id, table_number")
        .eq("table_number", table_number)
        .limit(1)
        .execute()
    )
    if not result.data:
        abort(404, description=f"Table {table_number} was not found.")
    return result.data[0]


def _serialize_order(order_row, item_rows, table_number):
    return {
        "id": order_row["id"],
        "table_number": table_number,
        "status": order_row["status"],
        "total_amount": float(order_row["total_amount"]),
        "created_at": order_row["created_at"],
        "items": [
            {
                "item_name": item["item_name"],
                "quantity": item["quantity"],
                "price_at_order": float(item["price_at_order"]),
                "notes": item.get("notes"),
            }
            for item in item_rows
        ],
    }


@orders_bp.post("/orders")
def place_order():
    """
    Body shape:
    {
      "table_number": 3,
      "items": [
        {"menu_item_id": "uuid", "quantity": 2, "notes": "no onions"}
      ]
    }

    Prices are always re-read from the database here — the client never gets
    to say what something costs.
    """
    body = request.get_json(silent=True) or {}
    table_number = body.get("table_number")
    items = body.get("items")

    if not isinstance(table_number, int):
        abort(400, description="table_number (int) is required.")
    if not isinstance(items, list) or len(items) == 0:
        abort(400, description="items must be a non-empty list.")

    table = _get_table_or_404(table_number)

    # Fetch and validate every menu item referenced in the cart
    menu_item_ids = [item.get("menu_item_id") for item in items]
    if not all(menu_item_ids):
        abort(400, description="Every item needs a menu_item_id.")

    menu_rows = (
        supabase.table("menu_items")
        .select("id, name, price, is_available")
        .in_("id", menu_item_ids)
        .execute()
        .data
    )
    menu_by_id = {row["id"]: row for row in menu_rows}

    order_items_payload = []
    total_amount = 0.0

    for item in items:
        menu_item_id = item.get("menu_item_id")
        quantity = item.get("quantity")
        notes = item.get("notes")

        if not isinstance(quantity, int) or quantity < 1:
            abort(400, description="quantity must be a positive integer.")

        menu_item = menu_by_id.get(menu_item_id)
        if menu_item is None:
            abort(400, description=f"Menu item {menu_item_id} does not exist.")
        if not menu_item["is_available"]:
            abort(400, description=f"\"{menu_item['name']}\" is currently unavailable.")

        price = float(menu_item["price"])
        total_amount += price * quantity

        order_items_payload.append(
            {
                "menu_item_id": menu_item_id,
                "item_name": menu_item["name"],
                "price_at_order": price,
                "quantity": quantity,
                "notes": notes,
            }
        )

    order_row = (
        supabase.table("orders")
        .insert(
            {
                "table_id": table["id"],
                "status": "received",
                "total_amount": round(total_amount, 2),
            }
        )
        .execute()
        .data[0]
    )

    for payload in order_items_payload:
        payload["order_id"] = order_row["id"]

    inserted_items = (
        supabase.table("order_items").insert(order_items_payload).execute().data
    )

    return jsonify(_serialize_order(order_row, inserted_items, table_number)), 201


@orders_bp.get("/orders/<order_id>")
def get_order(order_id):
    """Used by the receipt page to show what was ordered and its status."""
    order_result = (
        supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
    )
    if not order_result.data:
        abort(404, description="Order not found.")
    order_row = order_result.data[0]

    table_result = (
        supabase.table("tables")
        .select("table_number")
        .eq("id", order_row["table_id"])
        .limit(1)
        .execute()
    )
    table_number = table_result.data[0]["table_number"] if table_result.data else None

    item_rows = (
        supabase.table("order_items")
        .select("item_name, quantity, price_at_order, notes")
        .eq("order_id", order_id)
        .execute()
        .data
    )

    return jsonify(_serialize_order(order_row, item_rows, table_number))

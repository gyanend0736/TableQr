from flask import Blueprint, jsonify, abort

from db import supabase

menu_bp = Blueprint("menu", __name__)


@menu_bp.get("/menu")
def get_menu():
    """Return every available menu item, ordered by category then name."""
    result = (
        supabase.table("menu_items")
        .select("id, name, description, price, category, image_url, is_available")
        .eq("is_available", True)
        .order("category")
        .order("name")
        .execute()
    )
    return jsonify(result.data)


@menu_bp.get("/tables/<int:table_number>")
def get_table(table_number):
    """Confirm a table number is real before the menu loads for it."""
    result = (
        supabase.table("tables")
        .select("id, table_number")
        .eq("table_number", table_number)
        .limit(1)
        .execute()
    )
    if not result.data:
        abort(404, description=f"Table {table_number} was not found.")
    return jsonify(result.data[0])

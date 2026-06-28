const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // no JSON body — fine for some error responses
  }

  if (!response.ok) {
    const message = body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

// ─── Customer API ─────────────────────────────────────────────────────────────

export function fetchTable(tableNumber) {
  return request(`/tables/${tableNumber}`);
}

export function fetchMenu() {
  return request("/menu");
}

export function placeOrder(tableNumber, items) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify({
      table_number: tableNumber,
      items: items.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    }),
  });
}

export function fetchOrder(orderId) {
  return request(`/orders/${orderId}`);
}

// ─── Admin API ────────────────────────────────────────────────────────────────

function adminHeaders() {
  const pin = sessionStorage.getItem("admin_pin");
  return {
    "Content-Type": "application/json",
    ...(pin ? { "X-Admin-Pin": pin } : {}),
  };
}

export function adminLogin(pin) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export function fetchAdminOrders(showAll = false) {
  const qs = showAll ? "?all=1" : "";
  return request(`/admin/orders${qs}`, { headers: adminHeaders() });
}

export function fetchAdminOrderById(orderId) {
  return request(`/admin/orders/${orderId}`, { headers: adminHeaders() });
}

export function updateOrderStatus(orderId, status) {
  return request(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
}

export function fetchTodayStats() {
  return request("/admin/stats", { headers: adminHeaders() });
}

// ─── Admin Menu API ───────────────────────────────────────────────────────────

export function fetchAdminMenu() {
  return request("/admin/menu", { headers: adminHeaders() });
}

export function createMenuItem(data) {
  return request("/admin/menu", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateMenuItem(id, data) {
  return request(`/admin/menu/${id}`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
}

export function toggleMenuItemAvailability(id, isAvailable) {
  return request(`/admin/menu/${id}/availability`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export function deleteMenuItem(id) {
  return request(`/admin/menu/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
}

export function fetchRevenue(days = 10) {
  return request(`/admin/revenue?days=${days}`, { headers: adminHeaders() });
}
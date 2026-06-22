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

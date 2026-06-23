import { useState } from "react";
import { updateOrderStatus } from "../api.js";

const STATUS_ACTIONS = {
  received: { label: "Start preparing", next: "preparing" },
  preparing: { label: "Mark served ✓", next: "served" },
  served: null,
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function OrderCard({ order, isNew, onStatusChange }) {
  const [busy, setBusy] = useState(false);
  const action = STATUS_ACTIONS[order.status];

  async function handleAdvance() {
    if (!action) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, action.next);
      onStatusChange(order.id, action.next);
    } catch (err) {
      alert(`Couldn't update order: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`order-card order-card--${order.status} ${isNew ? "order-card--new" : ""}`}>
      <div className="order-card-header">
        <span className="order-table-num">Table {order.table_number ?? "—"}</span>
        <span className="order-time">{timeAgo(order.created_at)}</span>
      </div>

      <ul className="order-items-list">
        {order.items.map((item, idx) => (
          <li key={idx} className="order-item">
            <span className="order-item-qty">{item.quantity}×</span>
            <span className="order-item-name">
              {item.item_name}
              {item.notes && <em className="order-item-note"> · {item.notes}</em>}
            </span>
          </li>
        ))}
      </ul>

      <div className="order-card-footer">
        <span className="order-total">₹{order.total_amount.toFixed(2)}</span>
        {action ? (
          <button
            type="button"
            className={`admin-btn order-action-btn order-action-btn--${order.status}`}
            onClick={handleAdvance}
            disabled={busy}
          >
            {busy ? "Saving…" : action.label}
          </button>
        ) : (
          <span className="order-done-tag">Done</span>
        )}
      </div>
    </div>
  );
}

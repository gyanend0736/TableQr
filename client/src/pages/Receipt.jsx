import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrder } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Receipt() {
  const { tableNumber, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    fetchOrder(orderId)
      .then((data) => {
        if (!cancelled) {
          setOrder(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (status === "loading") {
    return (
      <div className="state-screen">
        <p>Loading your receipt…</p>
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="state-screen">
        <h1 className="state-title">Couldn't find that order</h1>
        <Link to={`/order/${tableNumber}`} className="btn btn-stamp">
          Back to menu
        </Link>
      </div>
    );
  }

  const placedAt = new Date(order.created_at);

  return (
    <div className="page receipt-page">
      <div className="ticket">
        <div className="ticket-edge ticket-edge-top" aria-hidden="true" />

        <div className="ticket-body">
          <p className="ticket-eyebrow">Order placed</p>
          <h1 className="ticket-title">Thanks!</h1>

          <div className="ticket-meta">
            <span>Table {order.table_number}</span>
            <span>
              {placedAt.toLocaleDateString()} ·{" "}
              {placedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <StatusBadge status={order.status} />

          <div className="tear-line" aria-hidden="true" />

          <div className="ticket-items">
            {order.items.map((item, idx) => (
              <div key={idx} className="ticket-item">
                <span className="ticket-item-qty">{item.quantity}×</span>
                <span className="ticket-item-name">
                  {item.item_name}
                  {item.notes && <em className="ticket-item-note"> — {item.notes}</em>}
                </span>
                <span className="ticket-item-price">
                  ₹{(item.price_at_order * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="tear-line" aria-hidden="true" />

          <div className="ticket-total-row">
            <span>Total</span>
            <span>₹{order.total_amount.toFixed(2)}</span>
          </div>

          <p className="ticket-order-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="ticket-edge ticket-edge-bottom" aria-hidden="true" />
      </div>

      <Link to={`/order/${tableNumber}`} className="btn btn-stamp btn-block">
        Order more
      </Link>
    </div>
  );
}

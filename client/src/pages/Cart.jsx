import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import QuantityStepper from "../components/QuantityStepper.jsx";
import { placeOrder } from "../api.js";

export default function Cart() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { items, updateQuantity, updateNotes, removeItem, totalAmount, clearCart } =
    useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  async function handlePlaceOrder() {
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder(parseInt(tableNumber, 10), items);
      clearCart();
      navigate(`/order/${tableNumber}/receipt/${order.id}`);
    } catch (err) {
      setError(err.message || "Something went wrong placing your order.");
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="state-screen">
        <h1 className="state-title">Your cart is empty</h1>
        <p>Add a few things from the menu to get started.</p>
        <Link to={`/order/${tableNumber}`} className="btn btn-stamp">
          Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="page page-with-bar">
      <header className="menu-header">
        <span className="table-badge">Table {tableNumber}</span>
        <h1 className="menu-title">Your order</h1>
      </header>

      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id} className="cart-row">
            <div className="cart-row-main">
              <h3 className="item-name">{item.name}</h3>
              <span className="item-price">
                ₹{item.price.toFixed(2)} × {item.quantity} = ₹
                {(item.price * item.quantity).toFixed(2)}
              </span>
              <input
                type="text"
                placeholder="Add a note (e.g. no onions)"
                className="cart-note-input"
                value={item.notes}
                onChange={(e) => updateNotes(item.id, e.target.value)}
              />
            </div>
            <div className="cart-row-action">
              <QuantityStepper
                quantity={item.quantity}
                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
              />
              <button
                type="button"
                className="cart-remove"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="tear-line" aria-hidden="true" />

      <div className="cart-total-row">
        <span>Total</span>
        <span className="cart-total-amount">₹{totalAmount.toFixed(2)}</span>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="cart-actions">
        <Link to={`/order/${tableNumber}`} className="btn btn-ghost">
          Add more items
        </Link>
        <button
          type="button"
          className="btn btn-stamp btn-block"
          onClick={handlePlaceOrder}
          disabled={placing}
        >
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </div>
  );
}

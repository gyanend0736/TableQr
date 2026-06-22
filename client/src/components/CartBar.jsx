import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CartBar() {
  const { totalCount, totalAmount } = useCart();
  const { tableNumber } = useParams();
  const navigate = useNavigate();

  if (totalCount === 0) return null;

  return (
    <button
      type="button"
      className="cart-bar"
      onClick={() => navigate(`/order/${tableNumber}/cart`)}
    >
      <span className="cart-bar-count">
        {totalCount} {totalCount === 1 ? "item" : "items"}
      </span>
      <span className="cart-bar-total">₹{totalAmount.toFixed(2)}</span>
      <span className="cart-bar-cta">View cart →</span>
    </button>
  );
}

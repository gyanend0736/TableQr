import { useCart } from "../context/CartContext.jsx";
import QuantityStepper from "./QuantityStepper.jsx";

export default function MenuItemCard({ item }) {
  const { addItem, updateQuantity, getQuantity } = useCart();
  const quantity = getQuantity(item.id);

  return (
    <div className="item-card">
      <div className="item-card-main">
        <h3 className="item-name">{item.name}</h3>
        {item.description && <p className="item-description">{item.description}</p>}
        <span className="item-price">₹{item.price.toFixed(2)}</span>
      </div>

      <div className="item-card-action">
        {quantity === 0 ? (
          <button type="button" className="btn btn-add" onClick={() => addItem(item)}>
            Add
          </button>
        ) : (
          <QuantityStepper
            quantity={quantity}
            onIncrease={() => updateQuantity(item.id, quantity + 1)}
            onDecrease={() => updateQuantity(item.id, quantity - 1)}
          />
        )}
      </div>
    </div>
  );
}

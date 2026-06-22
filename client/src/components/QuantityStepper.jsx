export default function QuantityStepper({ quantity, onIncrease, onDecrease, size = "md" }) {
  return (
    <div className={`stepper stepper-${size}`}>
      <button
        type="button"
        className="stepper-btn"
        onClick={onDecrease}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="stepper-value">{quantity}</span>
      <button
        type="button"
        className="stepper-btn"
        onClick={onIncrease}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [tableNumber, setTableNumber] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const num = parseInt(tableNumber, 10);
    if (num > 0) {
      navigate(`/order/${num}`);
    }
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <div className="landing-stub">No. —</div>
        <h1 className="landing-title">TableQR</h1>
        <p className="landing-copy">
          Scan the code on your table to pull up the menu and order straight from your
          phone.
        </p>

        <div className="tear-line" aria-hidden="true" />

        <form className="landing-form" onSubmit={handleSubmit}>
          <label htmlFor="table-number" className="landing-label">
            Testing without a printed code? Enter a table number
          </label>
          <div className="landing-row">
            <input
              id="table-number"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="e.g. 4"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="landing-input"
            />
            <button type="submit" className="btn btn-stamp" disabled={!tableNumber}>
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

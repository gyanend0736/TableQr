function fmt(val) {
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${Math.round(val)}`;
}

export default function RevenueChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="rev-chart">
      <div className="rev-bars">
        {data.map((d) => (
          <div key={d.date} className="rev-col" title={`${d.label}: ₹${d.revenue.toFixed(2)} · ${d.orders} orders`}>
            <div className="rev-bar-area">
              {d.revenue > 0 && (
                <span className="rev-bar-amount">{fmt(d.revenue)}</span>
              )}
              <div
                className={`rev-bar${d.is_today ? " rev-bar--today" : ""}${d.revenue === 0 ? " rev-bar--zero" : ""}`}
                style={{
                  height: d.revenue === 0
                    ? "3px"
                    : `${Math.max((d.revenue / max) * 100, 6)}%`,
                }}
              />
            </div>
            <div className={`rev-label${d.is_today ? " rev-label--today" : ""}`}>
              {d.label}
              {d.orders > 0 && <span className="rev-orders">{d.orders}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
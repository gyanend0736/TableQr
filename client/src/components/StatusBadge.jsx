const STATUS_LABELS = {
  received: "Received",
  preparing: "Preparing",
  served: "Served",
};

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

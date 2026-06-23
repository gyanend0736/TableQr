import OrderCard from "./OrderCard.jsx";

const COLUMN_CONFIG = {
  received: { label: "New", dotClass: "dot--new" },
  preparing: { label: "Preparing", dotClass: "dot--preparing" },
  served: { label: "Done", dotClass: "dot--served" },
};

export default function KanbanColumn({ status, orders, newOrderIds, onStatusChange }) {
  const config = COLUMN_CONFIG[status];

  return (
    <div className={`kanban-col kanban-col--${status}`}>
      <div className="kanban-col-header">
        <span className={`kanban-dot ${config.dotClass}`} aria-hidden="true" />
        <h2 className="kanban-col-title">{config.label}</h2>
        <span className="kanban-col-count">{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <p className="kanban-empty">
          {status === "served" ? "Nothing served yet today." : "All clear — nothing here."}
        </p>
      ) : (
        <div className="kanban-cards">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={newOrderIds.has(order.id)}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

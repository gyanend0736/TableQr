import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

import KanbanColumn from "../components/KanbanColumn.jsx";
import { fetchAdminOrders, fetchAdminOrderById, fetchTodayStats, fetchRevenue } from "../api.js";
import RevenueChart from "../components/RevenueChart.jsx";

const STATUSES = ["received", "preparing", "served"];

// ─── Web Audio notification — no external files needed ─────────────────────

function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1100, 0.15], [880, 0.3]].forEach(([freq, when]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.25, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.18);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + 0.2);
    });
  } catch {
    /* silently ignore if Audio API isn't available */
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting"); // connecting | live | error
  const [revenue, setRevenue] = useState([]);
const [chartOpen, setChartOpen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // IDs of orders that just arrived via Realtime, used for the flash animation
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const newOrderTimers = useRef(new Map()); // orderId → setTimeout handle

  // ─── Auth guard ──────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionStorage.getItem("admin_pin")) {
      navigate("/admin");
    }
  }, [navigate]);

  function handleSignOut() {
    sessionStorage.removeItem("admin_pin");
    navigate("/admin");
  }

  // ─── Initial data load ───────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [orderData, statsData, revenueData] = await Promise.all([
        fetchAdminOrders(),
        fetchTodayStats(),
        fetchRevenue(10),
      ]);
      setOrders(orderData);
      setStats(statsData);
      setRevenue(revenueData);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message || "Failed to load orders.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Add new order with flash animation ─────────────────────────

  const markNew = useCallback((id) => {
    setNewOrderIds((prev) => new Set([...prev, id]));
    // clear the "new" flag after 4 seconds
    const handle = setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      newOrderTimers.current.delete(id);
    }, 4000);
    newOrderTimers.current.set(id, handle);
  }, []);

  // ─── Realtime subscription ───────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-watch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          // Wait briefly so the server finishes inserting order_items before we read
          await new Promise((r) => setTimeout(r, 600));
          try {
            const fullOrder = await fetchAdminOrderById(payload.new.id);
            setOrders((prev) => {
              // avoid duplicates if initial load already caught it
              if (prev.some((o) => o.id === fullOrder.id)) return prev;
              return [fullOrder, ...prev];
            });
            setStats((prev) =>
              prev
                ? {
                    ...prev,
                    total_orders: prev.total_orders + 1,
                    total_revenue: prev.total_revenue + fullOrder.total_amount,
                    by_status: {
                      ...prev.by_status,
                      received: (prev.by_status.received || 0) + 1,
                    },
                  }
                : prev
            );
            markNew(fullOrder.id);
            playNewOrderSound();
          } catch {
            // Worst case, a manual refresh brings the order in
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const { id, status } = payload.new;
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, status } : o))
          );
        }
      )
      .subscribe((channelStatus) => {
        setRealtimeStatus(
          channelStatus === "SUBSCRIBED" ? "live" : channelStatus === "CLOSED" ? "error" : "connecting"
        );
      });

    return () => {
      supabase.removeChannel(channel);
      // clear all pending flash timers on unmount
      newOrderTimers.current.forEach(clearTimeout);
    };
  }, [markNew]);

  // ─── Status update from OrderCard ────────────────────────────────

  const handleStatusChange = useCallback((orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setStats((prev) => {
      if (!prev) return prev;
      const oldOrder = orders.find((o) => o.id === orderId);
      if (!oldOrder) return prev;
      const oldStatus = oldOrder.status;
      const byStatus = { ...prev.by_status };
      byStatus[oldStatus] = Math.max((byStatus[oldStatus] || 1) - 1, 0);
      byStatus[newStatus] = (byStatus[newStatus] || 0) + 1;
      return { ...prev, by_status: byStatus };
    });
  }, [orders]);

  // ─── Split orders by status ──────────────────────────────────────

  const byStatus = useMemo(() => {
    const map = { received: [], preparing: [], served: [] };
    for (const o of orders) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [orders]);

  // ─── Render ──────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="admin-shell admin-error-page">
        <h1>Couldn't load orders</h1>
        <p>{loadError}</p>
        <button className="admin-btn admin-btn-primary" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* ── Top bar ─────────────────────────────────── */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="admin-wordmark">TableQR</span>
          <span
            className={`admin-live-badge admin-live-badge--${realtimeStatus}`}
            title={
              realtimeStatus === "live"
                ? "Realtime connected"
                : realtimeStatus === "connecting"
                ? "Connecting to Realtime…"
                : "Realtime disconnected — orders may be delayed"
            }
          >
            <span className="admin-live-dot" aria-hidden="true" />
            {realtimeStatus === "live" ? "Live" : realtimeStatus === "connecting" ? "Connecting" : "Offline"}
          </span>
        </div>

        <div className="admin-topbar-right">
          <Link to="/admin/menu" className="admin-btn admin-btn-ghost admin-btn-sm">
            Manage menu
          </Link>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadData}>
            Refresh
          </button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {/* ── Stats bar ───────────────────────────────── */}
      {stats && (
        <div className="admin-stats-bar">
          <div className="admin-stat">
            <span className="admin-stat-value">{stats.total_orders}</span>
            <span className="admin-stat-label">orders today</span>
          </div>
          <div className="admin-stat-divider" />
          <div className="admin-stat">
            <span className="admin-stat-value">₹{stats.total_revenue.toFixed(0)}</span>
            <span className="admin-stat-label">revenue today</span>
          </div>
          <div className="admin-stat-divider" />
          <div className="admin-stat">
            <span className="admin-stat-value">
              {(stats.by_status.received || 0) + (stats.by_status.preparing || 0)}
            </span>
            <span className="admin-stat-label">active now</span>
          </div>
        </div>
      )}

      {/* ── 10-day revenue chart ────────────────────── */}
      <div className="rev-section">
        <button
          className="rev-toggle"
          onClick={() => setChartOpen((o) => !o)}
          type="button"
        >
          <span>10-day revenue</span>
          <span className="rev-toggle-icon">{chartOpen ? "▲" : "▼"}</span>
        </button>
        {chartOpen && revenue.length > 0 && (
          <RevenueChart data={revenue} />
        )}
      </div>

      {/* ── Kanban board ────────────────────────────── */}
      <main className="admin-kanban">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            orders={byStatus[status]}
            newOrderIds={newOrderIds}
            onStatusChange={handleStatusChange}
          />
        ))}
      </main>
    </div>
  );
}

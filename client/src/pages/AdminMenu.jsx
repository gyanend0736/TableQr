import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchAdminMenu,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from "../api.js";
import MenuItemForm from "../components/MenuItemForm.jsx";

const BLANK = {
  name: "", description: "", price: "", category: "", image_url: "", is_available: true,
};

export default function AdminMenu() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState(null); // null | "add" | { editing: item }
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!sessionStorage.getItem("admin_pin")) navigate("/admin");
  }, [navigate]);

  const load = useCallback(async () => {
    try {
      setItems(await fetchAdminMenu());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(formData) {
    setSaving(true);
    try {
      const payload = { ...formData, price: parseFloat(formData.price) };
      if (formMode === "add") {
        const created = await createMenuItem(payload);
        setItems((prev) => [...prev, created]);
      } else {
        const updated = await updateMenuItem(formMode.editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      }
      setFormMode(null);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item) {
    const next = !item.is_available;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: next } : i)));
    try {
      await toggleMenuItemAvailability(item.id, next);
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: !next } : i)));
      alert(`Toggle failed: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  const grouped = items.reduce((map, item) => {
    if (!map[item.category]) map[item.category] = [];
    map[item.category].push(item);
    return map;
  }, {});

  if (loading) return <div className="admin-shell admin-error-page"><p>Loading…</p></div>;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="admin-wordmark">TableQR</span>
          <span className="admin-topbar-sep">›</span>
          <span className="admin-topbar-page">Menu</span>
        </div>
        <div className="admin-topbar-right">
          <Link to="/admin/dashboard" className="admin-btn admin-btn-ghost admin-btn-sm">← Dashboard</Link>
          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setFormMode("add"); }}>
            + Add item
          </button>
        </div>
      </header>

      <div className="admin-menu-page">
        {error && <p className="admin-error-msg">{error}</p>}

        {formMode && (
          <div className="amenu-form-wrap">
            <h2 className="amenu-form-title">
              {formMode === "add" ? "New item" : `Edit — ${formMode.editing.name}`}
            </h2>
            <MenuItemForm
              initial={formMode === "add" ? BLANK : formMode.editing}
              onSave={handleSave}
              onCancel={() => setFormMode(null)}
              saving={saving}
            />
          </div>
        )}

        {Object.keys(grouped).map((category) => (
          <section key={category} className="amenu-section">
            <h3 className="amenu-section-title">{category}</h3>
            <div className="amenu-table">
              {grouped[category].map((item) => (
                <div key={item.id} className={`amenu-row ${!item.is_available ? "amenu-row--unavail" : ""}`}>
                  <div className="amenu-row-main">
                    <span className="amenu-item-name">{item.name}</span>
                    {item.description && <span className="amenu-item-desc">{item.description}</span>}
                  </div>
                  <span className="amenu-item-price">₹{parseFloat(item.price).toFixed(2)}</span>
                  <button
                    type="button"
                    className={`avail-toggle ${item.is_available ? "avail-toggle--on" : "avail-toggle--off"}`}
                    onClick={() => handleToggle(item)}
                  >
                    {item.is_available ? "Available" : "Unavailable"}
                  </button>
                  <div className="amenu-row-actions">
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setFormMode({ editing: item })}>
                      Edit
                    </button>
                    {deleteConfirm === item.id ? (
                      <span className="amenu-delete-confirm">
                        <button className="admin-btn admin-btn-sm amenu-btn-danger" onClick={() => handleDelete(item.id)}>
                          Confirm
                        </button>
                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setDeleteConfirm(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button className="admin-btn admin-btn-ghost admin-btn-sm amenu-btn-delete" onClick={() => setDeleteConfirm(item.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {items.length === 0 && !formMode && (
          <p className="amenu-empty">No items yet. Click "Add item" to get started.</p>
        )}
      </div>
    </div>
  );
}
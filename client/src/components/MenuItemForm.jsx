import { useState } from "react";

export default function MenuItemForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.category.trim()) errs.category = "Required";
    if (form.price === "" || form.price === null) errs.price = "Required";
    else if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
      errs.price = "Must be a positive number";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  }

  return (
    <form className="mitem-form" onSubmit={handleSubmit}>
      <div className="mitem-fields">
        <div className="mitem-field">
          <label className="admin-label">Name *</label>
          <input className={`admin-input ${errors.name ? "admin-input--error" : ""}`}
            value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Paneer Tikka" />
          {errors.name && <span className="mitem-error">{errors.name}</span>}
        </div>

        <div className="mitem-field">
          <label className="admin-label">Category *</label>
          <input className={`admin-input ${errors.category ? "admin-input--error" : ""}`}
            value={form.category} onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Starters, Main Course" />
          {errors.category && <span className="mitem-error">{errors.category}</span>}
        </div>

        <div className="mitem-field mitem-field--sm">
          <label className="admin-label">Price (₹) *</label>
          <input type="number" min="0" step="0.01"
            className={`admin-input ${errors.price ? "admin-input--error" : ""}`}
            value={form.price} onChange={(e) => set("price", e.target.value)}
            placeholder="0.00" />
          {errors.price && <span className="mitem-error">{errors.price}</span>}
        </div>

        <div className="mitem-field mitem-field--full">
          <label className="admin-label">Description</label>
          <input className="admin-input" value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional — short description for customers" />
        </div>

        <div className="mitem-field mitem-field--check">
          <label className="mitem-check-label">
            <input type="checkbox" className="mitem-checkbox"
              checked={form.is_available}
              onChange={(e) => set("is_available", e.target.checked)} />
            Available to order
          </label>
        </div>
      </div>

      <div className="mitem-actions">
        <button type="button" className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn-primary mitem-save-btn" disabled={saving}>
          {saving ? "Saving…" : "Save item"}
        </button>
      </div>
    </form>
  );
}
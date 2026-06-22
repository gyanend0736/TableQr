import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTable, fetchMenu } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import CategoryNav from "../components/CategoryNav.jsx";
import MenuItemCard from "../components/MenuItemCard.jsx";
import CartBar from "../components/CartBar.jsx";

export default function Menu() {
  const { tableNumber: tableNumberParam } = useParams();
  const tableNumber = parseInt(tableNumberParam, 10);
  const navigate = useNavigate();
  const { setTableNumber } = useCart();

  const [status, setStatus] = useState("loading"); // loading | ready | not-found | error
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      setStatus("not-found");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        await fetchTable(tableNumber);
        const menuItems = await fetchMenu();
        if (cancelled) return;
        setItems(menuItems);
        setTableNumber(tableNumber);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus(err.message?.includes("not found") ? "not-found" : "error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tableNumber, setTableNumber]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return map;
  }, [items]);

  const categories = useMemo(() => ["All", ...grouped.keys()], [grouped]);
  const visibleCategories =
    activeCategory === "All" ? [...grouped.keys()] : [activeCategory];

  if (status === "loading") {
    return (
      <div className="state-screen">
        <p>Loading the menu…</p>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="state-screen">
        <h1 className="state-title">Table not found</h1>
        <p>Double-check the code you scanned, or ask staff for help.</p>
        <button type="button" className="btn btn-stamp" onClick={() => navigate("/")}>
          Start over
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="state-screen">
        <h1 className="state-title">Couldn't load the menu</h1>
        <p>Check your connection and try again.</p>
        <button type="button" className="btn btn-stamp" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page page-with-bar">
      <header className="menu-header">
        <span className="table-badge">Table {tableNumber}</span>
        <h1 className="menu-title">Menu</h1>
      </header>

      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className="menu-sections">
        {visibleCategories.map((category) => (
          <section key={category} className="menu-section">
            <h2 className="menu-section-title">{category}</h2>
            <div className="menu-section-items">
              {grouped.get(category).map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <CartBar />
    </div>
  );
}

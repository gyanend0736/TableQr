export default function CategoryNav({ categories, activeCategory, onSelect }) {
  return (
    <nav className="category-nav" aria-label="Menu categories">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-pill ${activeCategory === category ? "is-active" : ""}`}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </nav>
  );
}

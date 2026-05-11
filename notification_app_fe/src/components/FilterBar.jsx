import "./FilterBar.css";

const FILTERS = ["All", "Event", "Result", "Placement"];

function FilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-tabs">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            className={`filter-tab ${activeFilter === filter ? "active" : ""}`}
            onClick={() => onFilterChange(filter)}
          >
            <span className={`filter-dot ${filter.toLowerCase()}`}></span>
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;

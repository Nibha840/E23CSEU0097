import "./StatsPanel.css";

function StatsPanel({ stats }) {
  const cards = [
    { label: "Total", value: stats.total, icon: "📋", className: "stat-total" },
    { label: "Unread", value: stats.unread, icon: "🔔", className: "stat-unread" },
    { label: "Events", value: stats.events, icon: "🎉", className: "stat-event" },
    { label: "Results", value: stats.results, icon: "📊", className: "stat-result" },
    { label: "Placements", value: stats.placements, icon: "💼", className: "stat-placement" }
  ];

  return (
    <section className="stats-panel">
      {cards.map((card) => (
        <div key={card.label} className={`stat-card ${card.className}`}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-info">
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

export default StatsPanel;

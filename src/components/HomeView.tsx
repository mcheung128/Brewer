import type { Bean, Brew, BrewMethod } from "../types";

type HomeViewProps = {
  averageRating: string;
  beansById: Record<string, Bean>;
  bestMethod: { method: BrewMethod; avg: number; count: number } | null;
  brews: Brew[];
  brewCount: number;
  beanCount: number;
  formatDateTime: (value: string) => string;
  onLogBrew: () => void;
  onOpenHistory: () => void;
  onSelectBrew: (brewId: string) => void;
  topBean: { bean: Bean; avg: number } | null;
};

function HomeView({
  averageRating,
  beansById,
  bestMethod,
  brews,
  brewCount,
  beanCount,
  formatDateTime,
  onLogBrew,
  onOpenHistory,
  onSelectBrew,
  topBean,
}: HomeViewProps) {
  return (
    <div className="page-grid">
      <section className="hero-card">
        <p className="eyebrow">Coffee journal</p>
        <h1>Track your coffee journey</h1>
        <p className="hero-copy">Log beans, recipes, and taste.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onLogBrew}>
            Log New Brew
          </button>
          <button className="secondary-button" onClick={onOpenHistory}>
            View Brew History
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Brews logged</span>
          <strong>{brewCount}</strong>
        </article>
        <article className="stat-card">
          <span>Average rating</span>
          <strong>{averageRating}</strong>
        </article>
        <article className="stat-card">
          <span>Beans tracked</span>
          <strong>{beanCount}</strong>
        </article>
        <article className="stat-card">
          <span>Top method</span>
          <strong>{bestMethod?.method ?? "None yet"}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recent brews</p>
            <h2>Latest journal entries</h2>
          </div>
        </div>
        <div className="list">
          {brews.length === 0 ? (
            <div className="empty-state">
              <h3>No brews yet :(</h3>
            </div>
          ) : (
            brews.slice(0, 4).map((brew) => (
              <button
                key={brew.id}
                className="list-item"
                onClick={() => onSelectBrew(brew.id)}
              >
                <div>
                  <strong>{brew.name}</strong>
                  <span>
                    {brew.method} -{" "}
                    {beansById[brew.beanId]?.coffeeName ?? "Unknown beans"}
                  </span>
                </div>
                <div className="list-meta">
                  <span>{brew.rating}/10</span>
                  <span>{formatDateTime(brew.brewedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Quick highlights</p>
            <h2>What is brewing well</h2>
          </div>
        </div>
        <div className="highlights">
          <article className="highlight-card">
            <span>Best-rated bean</span>
            <strong>
              {topBean
                ? `${topBean.bean.roaster} ${topBean.bean.coffeeName}`
                : "Log a few brews first"}
            </strong>
          </article>
          <article className="highlight-card">
            <span>Best average method</span>
            <strong>
              {bestMethod
                ? `${bestMethod.method} (${bestMethod.avg.toFixed(1)})`
                : "No data yet"}
            </strong>
          </article>
        </div>
      </section>
    </div>
  );
}

export default HomeView;

import { BREW_METHODS, type AppState, type Bean, type BrewMethod } from "../types";

type InsightsViewProps = {
  beansById: Record<string, Bean>;
  bestMethod: { method: BrewMethod; avg: number; count: number } | null;
  daysOffRoast: (roastDate: string, brewedAt: string) => number | null;
  topBean: { bean: Bean; avg: number } | null;
  state: AppState;
};

function InsightsView({ beansById, bestMethod, daysOffRoast, topBean, state }: InsightsViewProps) {
  const ratioAverage =
    state.brews.length > 0
      ? (state.brews.reduce((sum, brew) => sum + brew.water / brew.dose, 0) / state.brews.length).toFixed(1)
      : "0.0";

  const avgDaysOff =
    state.brews.length > 0
      ? (
          state.brews.reduce((sum, brew) => {
            const bean = beansById[brew.beanId];
            return sum + (daysOffRoast(bean?.roastDate ?? "", brew.brewedAt) ?? 0);
          }, 0) / state.brews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <article className="stat-card">
          <span>Best-rated beans</span>
          <strong>{topBean ? topBean.bean.coffeeName : "No data yet"}</strong>
        </article>
        <article className="stat-card">
          <span>Best method</span>
          <strong>{bestMethod ? bestMethod.method : "No data yet"}</strong>
        </article>
        <article className="stat-card">
          <span>Average ratio</span>
          <strong>1:{ratioAverage}</strong>
        </article>
        <article className="stat-card">
          <span>Avg days off roast</span>
          <strong>{avgDaysOff}</strong>
        </article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">MVP insights</p>
            <h2>Early signals from your brews</h2>
          </div>
        </div>
        <div className="highlights">
          <article className="highlight-card">
            <span>Average rating by method</span>
            <strong>
              {BREW_METHODS.filter((method) => state.brews.some((brew) => brew.method === method))
                .map((method) => {
                  const matches = state.brews.filter((brew) => brew.method === method);
                  const avg = matches.reduce((sum, brew) => sum + brew.rating, 0) / matches.length;
                  return `${method} ${avg.toFixed(1)}`;
                })
                .join(" - ") || "Log more brews to compare methods."}
            </strong>
          </article>
          <article className="highlight-card">
            <span>Temperature trend</span>
            <strong>
              {state.brews.length
                ? `${(state.brews.reduce((sum, brew) => sum + brew.waterTemp, 0) / state.brews.length).toFixed(1)}C average brew temperature`
                : "No temperature data yet"}
            </strong>
          </article>
        </div>
      </section>
    </div>
  );
}

export default InsightsView;

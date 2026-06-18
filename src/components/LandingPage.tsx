type LandingPageProps = {
  isSignedIn: boolean;
  onOpenApp: () => void;
  onOpenLogin: () => void;
};

function LandingPage({
  isSignedIn,
  onOpenApp,
  onOpenLogin,
}: LandingPageProps) {
  return (
    <div className="marketing-shell">
      <header className="marketing-header">
        <div>
          <p className="eyebrow">Brewer</p>
          <h1>The coffee logbook for recipes, beans, and better cups.</h1>
          <p className="marketing-copy">
            Track every brew, compare methods over time, save templates that
            actually work, and build a coffee journal you will keep using.
          </p>
          <div className="marketing-actions">
            <button className="primary-button" onClick={onOpenLogin}>
              Get Started
            </button>
            <button className="secondary-button" onClick={onOpenApp}>
              {isSignedIn ? "Open Dashboard" : "Preview App"}
            </button>
          </div>
        </div>
        <section className="marketing-panel">
          <div className="marketing-stat">
            <span>Brew tracking</span>
            <strong>Recipes, timing, ratings, notes</strong>
          </div>
          <div className="marketing-stat">
            <span>Bean records</span>
            <strong>Origins, roast dates, grinder pairings</strong>
          </div>
          <div className="marketing-stat">
            <span>Reusable templates</span>
            <strong>Start faster with your proven brew setups</strong>
          </div>
        </section>
      </header>

      <section className="marketing-grid">
        <article className="marketing-card">
          <p className="eyebrow">Why it helps</p>
          <h2>Stop guessing why one cup was better than the last.</h2>
          <p>
            Keep brew variables and tasting notes in one place so changes in
            dose, grind, or method are actually comparable.
          </p>
        </article>
        <article className="marketing-card">
          <p className="eyebrow">For daily use</p>
          <h2>Built for repeat brewing, not one-off note taking.</h2>
          <p>
            Duplicate past brews, save new templates, and keep your best
            recipes close when you are making coffee half awake.
          </p>
        </article>
        <article className="marketing-card">
          <p className="eyebrow">Per user</p>
          <h2>Your beans and history stay with your account.</h2>
          <p>
            Sign in to keep a personal logbook across devices with server-side
            storage.
          </p>
        </article>
      </section>
    </div>
  );
}

export default LandingPage;

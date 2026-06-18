type LandingPageProps = {
  isSignedIn: boolean;
  onOpenApp: () => void;
  onOpenLogin: () => void;
};

function LandingPage({ isSignedIn, onOpenApp, onOpenLogin }: LandingPageProps) {
  return (
    <div className="marketing-shell">
      <div className="marketing-hover-aura" aria-hidden="true" />
      <header className="marketing-header">
        <div className="marketing-copy-block">
          <p className="eyebrow">Brewer</p>
          <h1>Brew more. Think less.</h1>
          <p className="marketing-copy">
            A coffee journal for brews, beans, recipes, and the cups worth
            repeating.
          </p>
          <div className="marketing-actions">
            <button className="primary-button" onClick={onOpenLogin}>
              Get Started
            </button>
            <button className="secondary-button" onClick={onOpenApp}>
              {isSignedIn ? "Open Dashboard" : "Go to Dashboard"}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default LandingPage;

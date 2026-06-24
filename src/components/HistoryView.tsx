import type { Bean, Brew, TasteAttribute } from "../types";

type HistoryViewProps = {
  beansById: Record<string, Bean>;
  calcRatio: (dose: number, water: number) => string;
  daysOffRoast: (roastDate: string, brewedAt: string) => number | null;
  onDeleteBrew: (brewId: string) => void;
  onEditBrew: (brew: Brew) => void;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  onDuplicateBrew: (brew: Brew) => void;
  onSelectBrew: (brewId: string) => void;
  selectedBrew: Brew | null;
  tasteFields: Array<{ key: TasteAttribute; label: string }>;
  brews: Brew[];
};

function HistoryView({
  beansById,
  calcRatio,
  daysOffRoast,
  onDeleteBrew,
  onEditBrew,
  formatDate,
  formatDateTime,
  onDuplicateBrew,
  onSelectBrew,
  selectedBrew,
  tasteFields,
  brews,
}: HistoryViewProps) {
  return (
    <div className="history-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Brew history</p>
            <h2>All logged brews</h2>
          </div>
        </div>
        <div className="list">
          {brews.length === 0 ? (
            <div className="empty-state">
              <h3>No caffeine in sight</h3>
            </div>
          ) : (
            brews.map((brew) => (
              <button
                key={brew.id}
                className={
                  brew.id === selectedBrew?.id
                    ? "list-item selected"
                    : "list-item"
                }
                onClick={() => onSelectBrew(brew.id)}
              >
                <div>
                  <strong>{brew.name}</strong>
                  <span>
                    {brew.method} -{" "}
                    {beansById[brew.beanId]?.roaster ?? "Unknown roaster"}
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

      <section className="panel detail-panel">
        {selectedBrew ? (
          <>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Brew detail</p>
                <h2>{selectedBrew.name}</h2>
              </div>
              <div className="inline-actions">
                <div className="action-row">
                  <button
                    className="secondary-button"
                    onClick={() => onEditBrew(selectedBrew)}
                  >
                    Edit Brew
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => onDuplicateBrew(selectedBrew)}
                  >
                    Duplicate Brew
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (
                        window.confirm(`Delete brew "${selectedBrew.name}"?`)
                      ) {
                        onDeleteBrew(selectedBrew.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
                <button
                  className="primary-button"
                  onClick={() => onDuplicateBrew(selectedBrew)}
                >
                  Adjust Next Brew
                </button>
              </div>
            </div>
            <div className="detail-grid">
              <article className="detail-card">
                <h3>Recipe card</h3>
                <p>{selectedBrew.method}</p>
                <p>
                  {selectedBrew.dose}g coffee - {selectedBrew.water}g water - 1:
                  {calcRatio(selectedBrew.dose, selectedBrew.water)}
                </p>
                <p>
                  {selectedBrew.waterTemp}C - {selectedBrew.grindSize}
                </p>
                {selectedBrew.grinderUsed ? <p>Grinder: {selectedBrew.grinderUsed}</p> : null}
                {selectedBrew.totalBrewTime ? (
                  <p>Total brew time: {selectedBrew.totalBrewTime}</p>
                ) : null}
                {selectedBrew.numberOfPours ? (
                  <p>Number of pours: {selectedBrew.numberOfPours}</p>
                ) : null}
                {selectedBrew.pourTiming ? (
                  <p>Pour timing: {selectedBrew.pourTiming}</p>
                ) : null}
                {selectedBrew.pourAmounts ? (
                  <p>Pour amounts: {selectedBrew.pourAmounts}</p>
                ) : null}
                {selectedBrew.filterType ? (
                  <p>Filter type: {selectedBrew.filterType}</p>
                ) : null}
              </article>
              <article className="detail-card">
                <h3>Taste scores</h3>
                <div className="mini-grid">
                  {tasteFields.map((field) => (
                    <div key={field.key}>
                      <span>{field.label}</span>
                      <strong>{selectedBrew.tasteScores[field.key] ?? "Not set"}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article className="detail-card">
                <h3>Bean context</h3>
                <p>
                  {beansById[selectedBrew.beanId]?.roaster}{" "}
                  {beansById[selectedBrew.beanId]?.coffeeName}
                </p>
                <p>
                  Roast date:{" "}
                  {formatDate(beansById[selectedBrew.beanId]?.roastDate ?? "")}
                </p>
                <p>
                  Days off roast:{" "}
                  {daysOffRoast(
                    beansById[selectedBrew.beanId]?.roastDate ?? "",
                    selectedBrew.brewedAt,
                  ) ?? "Unknown"}
                </p>
              </article>
              <article className="detail-card full-width">
                <h3>Journal notes</h3>
                <p>{selectedBrew.notes || "No notes added."}</p>
                <p>
                  Next time:{" "}
                  {selectedBrew.changeNextTime || "No adjustment note added."}
                </p>
              </article>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>It's a little empty in here.</h3>
          </div>
        )}
      </section>
    </div>
  );
}

export default HistoryView;

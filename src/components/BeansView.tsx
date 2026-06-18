import { useState } from "react";
import type { AppState, Bean, NewBeanDraft } from "../types";

type BeansViewProps = {
  calcRatio: (dose: number, water: number) => string;
  formatDate: (value: string) => string;
  onAddBeans: () => void;
  onDeleteBean: (beanId: string) => void;
  onUpdateBean: (beanId: string, updates: NewBeanDraft) => void;
  state: AppState;
};

function BeansView({
  calcRatio,
  formatDate,
  onAddBeans,
  onDeleteBean,
  onUpdateBean,
  state,
}: BeansViewProps) {
  const [editingBeanId, setEditingBeanId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NewBeanDraft | null>(null);

  const startEditing = (bean: Bean) => {
    const { id: _id, createdAt: _createdAt, ...draft } = bean;
    setEditingBeanId(bean.id);
    setEditDraft(draft);
  };

  const stopEditing = () => {
    setEditingBeanId(null);
    setEditDraft(null);
  };

  const updateEditDraft = <K extends keyof NewBeanDraft>(
    key: K,
    value: NewBeanDraft[K],
  ) => {
    setEditDraft((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Bean library</p>
            <h2>All coffees you have logged</h2>
          </div>
          <button className="primary-button" onClick={onAddBeans}>
            Add Beans
          </button>
        </div>
        <div className="cards">
          {state.beans.length === 0 ? (
            <div className="empty-state">
              <h3>No beans saved</h3>
            </div>
          ) : (
            state.beans.map((bean) => {
              const relatedBrews = state.brews.filter(
                (brew) => brew.beanId === bean.id,
              );
              const bestBrew = [...relatedBrews].sort(
                (a, b) => b.rating - a.rating,
              )[0];

              return (
                <article key={bean.id} className="bean-card">
                  <div className="bean-head">
                    <div>
                      <span>{bean.roaster}</span>
                      <h3>{bean.coffeeName}</h3>
                    </div>
                    <div className="bean-actions">
                      <strong>{relatedBrews.length} brews</strong>
                      <div className="action-row">
                        <button
                          className="secondary-button compact-button"
                          onClick={() => startEditing(bean)}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button compact-button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete ${bean.roaster} ${bean.coffeeName} and its linked brews?`,
                              )
                            ) {
                              onDeleteBean(bean.id);
                              stopEditing();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <p>
                    {bean.originCountry}{" "}
                    {bean.regionFarm ? `- ${bean.regionFarm}` : ""}
                  </p>
                  <dl>
                    <div>
                      <dt>Roast date</dt>
                      <dd>{formatDate(bean.roastDate)}</dd>
                    </div>
                    <div>
                      <dt>Best rating</dt>
                      <dd>{bestBrew ? `${bestBrew.rating}/10` : "None yet"}</dd>
                    </div>
                    <div>
                      <dt>Favorite recipe</dt>
                      <dd>
                        {bestBrew
                          ? `${bestBrew.method} - 1:${calcRatio(bestBrew.dose, bestBrew.water)}`
                          : "None yet"}
                      </dd>
                    </div>
                    <div>
                      <dt>Bag notes</dt>
                      <dd>{bean.bagNotes || "None added"}</dd>
                    </div>
                  </dl>
                  {editingBeanId === bean.id && editDraft ? (
                    <div className="subpanel bean-editor">
                      <div className="form-grid">
                        <label>
                          Roaster
                          <input
                            value={editDraft.roaster}
                            onChange={(event) =>
                              updateEditDraft("roaster", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Coffee name
                          <input
                            value={editDraft.coffeeName}
                            onChange={(event) =>
                              updateEditDraft("coffeeName", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Origin / country
                          <input
                            value={editDraft.originCountry}
                            onChange={(event) =>
                              updateEditDraft(
                                "originCountry",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label>
                          Region / farm
                          <input
                            value={editDraft.regionFarm}
                            onChange={(event) =>
                              updateEditDraft("regionFarm", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Variety
                          <input
                            value={editDraft.variety}
                            onChange={(event) =>
                              updateEditDraft("variety", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Process
                          <input
                            value={editDraft.process}
                            onChange={(event) =>
                              updateEditDraft("process", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Roast level
                          <input
                            value={editDraft.roastLevel}
                            onChange={(event) =>
                              updateEditDraft("roastLevel", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Roast date
                          <input
                            type="date"
                            value={editDraft.roastDate}
                            onChange={(event) =>
                              updateEditDraft("roastDate", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Bag size
                          <input
                            value={editDraft.bagSize}
                            onChange={(event) =>
                              updateEditDraft("bagSize", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Price
                          <input
                            value={editDraft.price}
                            onChange={(event) =>
                              updateEditDraft("price", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Grinder pairing
                          <input
                            value={editDraft.grinderPairing}
                            onChange={(event) =>
                              updateEditDraft(
                                "grinderPairing",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="full-span">
                          Bag notes
                          <textarea
                            rows={3}
                            value={editDraft.bagNotes}
                            onChange={(event) =>
                              updateEditDraft("bagNotes", event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="inline-actions">
                        <button
                          className="secondary-button"
                          onClick={stopEditing}
                        >
                          Cancel
                        </button>
                        <button
                          className="primary-button"
                          onClick={() => {
                            onUpdateBean(bean.id, editDraft);
                            stopEditing();
                          }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default BeansView;

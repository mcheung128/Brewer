import { useState, type Dispatch, type SetStateAction } from "react";
import {
  BREW_METHODS,
  type Bean,
  type BrewMethod,
  type NewBeanDraft,
  type NewBrewDraft,
  type RecipeTemplate,
  type TasteAttribute,
} from "../types";

type NewBrewViewProps = {
  applyTemplate: (templateId: string) => void;
  beanDraft: NewBeanDraft;
  beans: Bean[];
  beansById: Record<string, Bean>;
  brewSteps: readonly string[];
  calcRatio: (dose: number, water: number) => string;
  draft: NewBrewDraft;
  editingBrewId: string | null;
  formatDateTime: (value: string) => string;
  saveBean: () => void;
  saveBrew: () => void;
  saveTemplateFromDraft: () => void;
  setShowBeanForm: Dispatch<SetStateAction<boolean>>;
  setStep: Dispatch<SetStateAction<number>>;
  setTemplateDraft: Dispatch<
    SetStateAction<{ name: string; method: BrewMethod }>
  >;
  showBeanForm: boolean;
  showsFilterType: boolean;
  showsPourFields: boolean;
  step: number;
  tasteFields: Array<{ key: TasteAttribute; label: string }>;
  templateDraft: { name: string; method: BrewMethod };
  templates: RecipeTemplate[];
  updateBeanDraft: <K extends keyof NewBeanDraft>(
    key: K,
    value: NewBeanDraft[K],
  ) => void;
  updateDraft: <K extends keyof NewBrewDraft>(
    key: K,
    value: NewBrewDraft[K],
  ) => void;
  updateMethod: (method: BrewMethod) => void;
};

function NewBrewView({
  applyTemplate,
  beanDraft,
  beans,
  beansById,
  brewSteps,
  calcRatio,
  draft,
  editingBrewId,
  formatDateTime,
  saveBean,
  saveBrew,
  saveTemplateFromDraft,
  setShowBeanForm,
  setStep,
  setTemplateDraft,
  showBeanForm,
  showsFilterType,
  showsPourFields,
  step,
  tasteFields,
  templateDraft,
  templates,
  updateBeanDraft,
  updateDraft,
  updateMethod,
}: NewBrewViewProps) {
  const [showAdvancedRecipe, setShowAdvancedRecipe] = useState(false);
  const [showAdvancedTaste, setShowAdvancedTaste] = useState(false);

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{editingBrewId ? "Edit brew" : "Log a new brew"}</h2>
          </div>
        </div>
        <div className="progress-shell" aria-label="Brew progress">
          <div className="progress-meta">
            <span>
              Step {step} of {brewSteps.length}
            </span>
            <strong>{brewSteps[step - 1]}</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div
              className="progress-fill"
              style={{ width: `${(step / brewSteps.length) * 100}%` }}
            />
          </div>
          <div className="progress-labels">
            {brewSteps.map((label, index) => {
              const currentStep = index + 1;
              return (
                <button
                  key={label}
                  className={
                    currentStep === step
                      ? "progress-label active"
                      : "progress-label"
                  }
                  onClick={() => setStep(currentStep)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <div className="form-grid">
            <label>
              Brew name
              <input
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                placeholder="Enter brew name"
              />
            </label>
            <label>
              Date and time
              <input
                type="datetime-local"
                value={draft.brewedAt}
                onChange={(e) => updateDraft("brewedAt", e.target.value)}
              />
            </label>
            <label>
              Recipe template
              <select
                value={draft.templateId}
                onChange={(e) => {
                  updateDraft("templateId", e.target.value);
                  applyTemplate(e.target.value);
                }}
              >
                <option value="">Start from scratch</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Brew method
              <select
                value={draft.method}
                onChange={(e) => updateMethod(e.target.value as BrewMethod)}
              >
                {BREW_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <div className="form-grid">
              <label>
                Select beans
                <select
                  value={draft.beanId}
                  onChange={(e) => updateDraft("beanId", e.target.value)}
                >
                  <option value="">Choose saved beans</option>
                  {beans.map((bean) => (
                    <option key={bean.id} value={bean.id}>
                      {bean.roaster} - {bean.coffeeName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p>or</p>
            <div className="inline-actions">
              <button
                className="secondary-button"
                onClick={() => setShowBeanForm((current) => !current)}
              >
                {showBeanForm ? "Hide Bean Form" : "Add New Beans"}
              </button>
            </div>
            {showBeanForm && (
              <div className="subpanel">
                <div className="form-grid">
                  <label>
                    Roaster
                    <input
                      value={beanDraft.roaster}
                      onChange={(e) =>
                        updateBeanDraft("roaster", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Coffee name
                    <input
                      value={beanDraft.coffeeName}
                      onChange={(e) =>
                        updateBeanDraft("coffeeName", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Origin / country
                    <input
                      value={beanDraft.originCountry}
                      onChange={(e) =>
                        updateBeanDraft("originCountry", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Region / farm
                    <input
                      value={beanDraft.regionFarm}
                      onChange={(e) =>
                        updateBeanDraft("regionFarm", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Variety
                    <input
                      value={beanDraft.variety}
                      onChange={(e) =>
                        updateBeanDraft("variety", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Process
                    <input
                      value={beanDraft.process}
                      onChange={(e) =>
                        updateBeanDraft("process", e.target.value)
                      }
                      placeholder="Washed, natural, honey"
                    />
                  </label>
                  <label>
                    Roast level
                    <input
                      value={beanDraft.roastLevel}
                      onChange={(e) =>
                        updateBeanDraft("roastLevel", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Roast date
                    <input
                      type="date"
                      value={beanDraft.roastDate}
                      onChange={(e) =>
                        updateBeanDraft("roastDate", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Bag size
                    <input
                      value={beanDraft.bagSize}
                      onChange={(e) =>
                        updateBeanDraft("bagSize", e.target.value)
                      }
                      placeholder="250g"
                    />
                  </label>
                  <label>
                    Price
                    <input
                      value={beanDraft.price}
                      onChange={(e) => updateBeanDraft("price", e.target.value)}
                      placeholder="$22"
                    />
                  </label>
                  <label className="full-span">
                    Tasting notes from bag
                    <textarea
                      value={beanDraft.bagNotes}
                      onChange={(e) =>
                        updateBeanDraft("bagNotes", e.target.value)
                      }
                      rows={3}
                    />
                  </label>
                </div>
                <button className="primary-button" onClick={saveBean}>
                  Save Beans
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="stack">
            <div className="form-grid">
              <label>
                Coffee in (g)
                <input
                  type="number"
                  value={draft.dose || ""}
                  onChange={(e) => updateDraft("dose", Number(e.target.value))}
                  placeholder=""
                />
              </label>
              <label>
                Water out(g)
                <input
                  type="number"
                  value={draft.water || ""}
                  onChange={(e) => updateDraft("water", Number(e.target.value))}
                  placeholder=""
                />
              </label>
              <label>
                Brew ratio
                <input
                  value={`1:${calcRatio(draft.dose, draft.water)}`}
                  disabled
                />
              </label>
              <label>
                Grind size
                <input
                  value={draft.grindSize}
                  onChange={(e) => updateDraft("grindSize", e.target.value)}
                  placeholder=""
                />
              </label>
              <label>
                Grinder used
                <input
                  value={draft.grinderUsed ?? ""}
                  onChange={(e) =>
                    updateDraft("grinderUsed", e.target.value || null)
                  }
                  placeholder=""
                />
              </label>
              <label>
                Water temperature (C)
                <input
                  type="number"
                  value={draft.waterTemp || ""}
                  onChange={(e) =>
                    updateDraft("waterTemp", Number(e.target.value))
                  }
                  placeholder=""
                />
              </label>
              <label>
                Total brew time
                <input
                  value={draft.totalBrewTime ?? ""}
                  onChange={(e) =>
                    updateDraft("totalBrewTime", e.target.value || null)
                  }
                  placeholder=""
                />
              </label>
            </div>
            {(showsPourFields || showsFilterType) && (
              <details
                className="subpanel"
                open={showAdvancedRecipe}
                onToggle={(event) =>
                  setShowAdvancedRecipe(event.currentTarget.open)
                }
              >
                <summary className="details-summary">Advanced recipe details</summary>
                <div className="form-grid compact advanced-grid">
                  {showsPourFields && (
                    <label>
                      Number of pours
                      <input
                        type="number"
                        value={draft.numberOfPours ?? ""}
                        onChange={(e) =>
                          updateDraft(
                            "numberOfPours",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        placeholder="4"
                      />
                    </label>
                  )}
                  {showsPourFields && (
                    <label>
                      Pour timing
                      <input
                        value={draft.pourTiming ?? ""}
                        onChange={(e) =>
                          updateDraft("pourTiming", e.target.value || null)
                        }
                        placeholder="0:00, 0:45, 1:15..."
                      />
                    </label>
                  )}
                  {showsPourFields && (
                    <label className="full-span">
                      Pour amounts (g)
                      <input
                        value={draft.pourAmounts ?? ""}
                        onChange={(e) =>
                          updateDraft("pourAmounts", e.target.value || null)
                        }
                        placeholder="50, 70, 90, 90"
                      />
                    </label>
                  )}
                  {showsFilterType && (
                    <label>
                      Filter type
                      <input
                        value={draft.filterType ?? ""}
                        onChange={(e) =>
                          updateDraft("filterType", e.target.value || null)
                        }
                        placeholder=""
                      />
                    </label>
                  )}
                </div>
              </details>
            )}
            <div className="subpanel">
              <div className="split-line">
                <div>
                  <h3>Save this recipe as a template</h3>
                  <p>
                    Use your current brew settings as a starting point for
                    future brews.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={saveTemplateFromDraft}
                >
                  Save Template
                </button>
              </div>
              <div className="form-grid compact">
                <label>
                  Template name
                  <input
                    value={templateDraft.name}
                    onChange={(e) =>
                      setTemplateDraft((current) => ({
                        ...current,
                        name: e.target.value,
                      }))
                    }
                    placeholder="My daily V60"
                  />
                </label>
                <label>
                  Method
                  <select
                    value={templateDraft.method}
                    onChange={(e) =>
                      setTemplateDraft((current) => ({
                        ...current,
                        method: e.target.value as BrewMethod,
                      }))
                    }
                  >
                    {BREW_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="stack">
            <div className="form-grid">
              <label>
                Final rating
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={draft.rating}
                  onChange={(e) =>
                    updateDraft("rating", Number(e.target.value))
                  }
                />
                <span className="range-value">{draft.rating}/10</span>
              </label>
              <label className="full-span">
                Notes
                <textarea
                  value={draft.notes}
                  onChange={(e) => updateDraft("notes", e.target.value)}
                  rows={4}
                  placeholder="What you liked or disliked"
                />
              </label>
              <label className="full-span">
                What to change next time
                <textarea
                  value={draft.changeNextTime}
                  onChange={(e) =>
                    updateDraft("changeNextTime", e.target.value)
                  }
                  rows={3}
                  placeholder="Too bitter and dry -> grind coarser or lower temp next time."
                />
              </label>
            </div>
            <details
              className="subpanel"
              open={showAdvancedTaste}
              onToggle={(event) =>
                setShowAdvancedTaste(event.currentTarget.open)
              }
            >
              <summary className="details-summary">Advanced taste details</summary>
              <div className="taste-grid advanced-grid">
                {tasteFields.map((field) => (
                  <label key={field.key} className="slider-card">
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={draft.tasteScores[field.key] ?? ""}
                      onChange={(e) =>
                        updateDraft("tasteScores", {
                          ...draft.tasteScores,
                          [field.key]: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Optional"
                    />
                    <strong>{draft.tasteScores[field.key] ?? "Unset"}</strong>
                  </label>
                ))}
              </div>
            </details>
          </div>
        )}

        {step === 5 && (
          <div className="stack">
            <div className="summary-card">
              <h3>{draft.name || "Untitled brew"}</h3>
              <p>
                {draft.method} - Ratio 1:{calcRatio(draft.dose, draft.water)} -
                Rating {draft.rating}/10
              </p>
            </div>
            <div className="summary-grid">
              <article>
                <span>Beans</span>
                <strong>
                  {draft.beanId
                    ? `${beansById[draft.beanId]?.roaster} ${beansById[draft.beanId]?.coffeeName}`
                    : "Select beans"}
                </strong>
              </article>
              <article>
                <span>Brewed</span>
                <strong>{formatDateTime(draft.brewedAt)}</strong>
              </article>
              <article>
                <span>Recipe</span>
                <strong>
                  {draft.dose}g / {draft.water}g / {draft.waterTemp}C
                </strong>
              </article>
            </div>
          </div>
        )}

        <div className="wizard-actions">
          <button
            className="secondary-button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
          >
            Back
          </button>
          {step < 5 ? (
            <button
              className="primary-button"
              onClick={() => setStep((current) => Math.min(5, current + 1))}
            >
              Next
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={saveBrew}
              disabled={!draft.name || !draft.beanId}
            >
              {editingBrewId ? "Save Changes" : "Save Brew"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default NewBrewView;

import { useState } from "react";
import { BREW_METHODS, type RecipeTemplate } from "../types";

type TemplateDraft = Omit<RecipeTemplate, "id">;

type TemplatesViewProps = {
  calcRatio: (dose: number, water: number) => string;
  onCreateTemplate: (template: TemplateDraft) => void;
  onStartBrew: (templateId: string) => void;
  onUpdateTemplate: (templateId: string, updates: TemplateDraft) => void;
  templates: RecipeTemplate[];
};

const buildTemplateDraft = (): TemplateDraft => ({
  name: "",
  method: "V60",
  dose: 0,
  water: 0,
  grindSize: "",
  waterTemp: 0,
  numberOfPours: 0,
  pourTiming: "",
  totalBrewTime: "",
  filterType: "",
});

function TemplatesView({ calcRatio, onCreateTemplate, onStartBrew, onUpdateTemplate, templates }: TemplatesViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState<TemplateDraft>(buildTemplateDraft());
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TemplateDraft | null>(null);

  const updateCreateDraft = <K extends keyof TemplateDraft>(key: K, value: TemplateDraft[K]) => {
    setCreateDraft((current) => ({ ...current, [key]: value }));
  };

  const updateEditDraft = <K extends keyof TemplateDraft>(key: K, value: TemplateDraft[K]) => {
    setEditDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recipe templates</p>
            <h2>Reusable starting points</h2>
          </div>
          <button className="primary-button" onClick={() => setShowCreateForm((current) => !current)}>
            {showCreateForm ? "Hide Form" : "New Template"}
          </button>
        </div>
        {showCreateForm ? (
          <div className="subpanel">
            <div className="form-grid">
              <label>
                Template name
                <input value={createDraft.name} onChange={(event) => updateCreateDraft("name", event.target.value)} />
              </label>
              <label>
                Method
                <select value={createDraft.method} onChange={(event) => updateCreateDraft("method", event.target.value as TemplateDraft["method"])}>
                  {BREW_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dose (g)
                <input type="number" value={createDraft.dose || ""} onChange={(event) => updateCreateDraft("dose", Number(event.target.value))} />
              </label>
              <label>
                Water (g)
                <input type="number" value={createDraft.water || ""} onChange={(event) => updateCreateDraft("water", Number(event.target.value))} />
              </label>
              <label>
                Grind size
                <input value={createDraft.grindSize} onChange={(event) => updateCreateDraft("grindSize", event.target.value)} />
              </label>
              <label>
                Water temperature (C)
                <input
                  type="number"
                  value={createDraft.waterTemp || ""}
                  onChange={(event) => updateCreateDraft("waterTemp", Number(event.target.value))}
                />
              </label>
              <label>
                Number of pours
                <input
                  type="number"
                  value={createDraft.numberOfPours || ""}
                  onChange={(event) => updateCreateDraft("numberOfPours", Number(event.target.value))}
                />
              </label>
              <label>
                Total brew time
                <input value={createDraft.totalBrewTime} onChange={(event) => updateCreateDraft("totalBrewTime", event.target.value)} />
              </label>
              <label className="full-span">
                Pour timing
                <input value={createDraft.pourTiming} onChange={(event) => updateCreateDraft("pourTiming", event.target.value)} />
              </label>
              <label className="full-span">
                Filter type
                <input value={createDraft.filterType} onChange={(event) => updateCreateDraft("filterType", event.target.value)} />
              </label>
            </div>
            <div className="inline-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateDraft(buildTemplateDraft());
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  onCreateTemplate(createDraft);
                  setCreateDraft(buildTemplateDraft());
                  setShowCreateForm(false);
                }}
                disabled={!createDraft.name}
              >
                Save Template
              </button>
            </div>
          </div>
        ) : null}
        <div className="cards">
          {templates.map((template) => (
            <article key={template.id} className="template-card">
              <span>{template.method}</span>
              <h3>{template.name}</h3>
              <p>
                {template.dose}g / {template.water}g / 1:{calcRatio(template.dose, template.water)}
              </p>
              <p>
                {template.grindSize} - {template.waterTemp}C - {template.totalBrewTime}
              </p>
              <div className="inline-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingTemplateId(template.id);
                    const { id: _id, ...draft } = template;
                    setEditDraft(draft);
                  }}
                >
                  Edit
                </button>
                <button className="secondary-button" onClick={() => onStartBrew(template.id)}>
                  Start Brew
                </button>
              </div>
              {editingTemplateId === template.id && editDraft ? (
                <div className="subpanel template-editor">
                  <div className="form-grid">
                    <label>
                      Template name
                      <input value={editDraft.name} onChange={(event) => updateEditDraft("name", event.target.value)} />
                    </label>
                    <label>
                      Method
                      <select value={editDraft.method} onChange={(event) => updateEditDraft("method", event.target.value as TemplateDraft["method"])}>
                        {BREW_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Dose (g)
                      <input type="number" value={editDraft.dose || ""} onChange={(event) => updateEditDraft("dose", Number(event.target.value))} />
                    </label>
                    <label>
                      Water (g)
                      <input type="number" value={editDraft.water || ""} onChange={(event) => updateEditDraft("water", Number(event.target.value))} />
                    </label>
                    <label>
                      Grind size
                      <input value={editDraft.grindSize} onChange={(event) => updateEditDraft("grindSize", event.target.value)} />
                    </label>
                    <label>
                      Water temperature (C)
                      <input
                        type="number"
                        value={editDraft.waterTemp || ""}
                        onChange={(event) => updateEditDraft("waterTemp", Number(event.target.value))}
                      />
                    </label>
                    <label>
                      Number of pours
                      <input
                        type="number"
                        value={editDraft.numberOfPours || ""}
                        onChange={(event) => updateEditDraft("numberOfPours", Number(event.target.value))}
                      />
                    </label>
                    <label>
                      Total brew time
                      <input value={editDraft.totalBrewTime} onChange={(event) => updateEditDraft("totalBrewTime", event.target.value)} />
                    </label>
                    <label className="full-span">
                      Pour timing
                      <input value={editDraft.pourTiming} onChange={(event) => updateEditDraft("pourTiming", event.target.value)} />
                    </label>
                    <label className="full-span">
                      Filter type
                      <input value={editDraft.filterType} onChange={(event) => updateEditDraft("filterType", event.target.value)} />
                    </label>
                  </div>
                  <div className="inline-actions">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setEditDraft(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      onClick={() => {
                        onUpdateTemplate(template.id, editDraft);
                        setEditingTemplateId(null);
                        setEditDraft(null);
                      }}
                      disabled={!editDraft.name}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TemplatesView;

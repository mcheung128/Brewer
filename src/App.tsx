import { useEffect, useMemo, useState } from 'react'
import { createDefaultScores, createId, loadState, saveState } from './storage'
import {
  BREW_METHODS,
  type AppState,
  type Bean,
  type Brew,
  type BrewMethod,
  type RecipeTemplate,
  type TasteAttribute,
  type TasteScores,
} from './types'

type View = 'home' | 'new' | 'beans' | 'history' | 'templates' | 'insights'

type NewBrewDraft = {
  name: string
  method: BrewMethod
  brewedAt: string
  beanId: string
  templateId: string
  rating: number
  notes: string
  dose: number
  water: number
  grindSize: string
  grinderUsed: string
  waterTemp: number
  waterType: string
  filterType: string
  totalBrewTime: string
  bloomTime: number
  bloomWater: number
  numberOfPours: number
  pourTiming: string
  agitation: string
  drawdownTime: string
  flavorNotes: string
  changeNextTime: string
  tasteScores: TasteScores
}

type NewBeanDraft = Omit<Bean, 'id' | 'createdAt'>

const tasteFields: Array<{ key: TasteAttribute; label: string }> = [
  { key: 'acidity', label: 'Acidity' },
  { key: 'sweetness', label: 'Sweetness' },
  { key: 'bitterness', label: 'Bitterness' },
  { key: 'body', label: 'Body' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'aftertaste', label: 'Aftertaste' },
  { key: 'strength', label: 'Strength' },
  { key: 'balance', label: 'Overall balance' },
]

const tabLabels: Record<View, string> = {
  home: 'Home',
  new: 'Log Brew',
  beans: 'Beans',
  history: 'History',
  templates: 'Templates',
  insights: 'Insights',
}

const brewSteps = [
  'Brew basics',
  'Beans',
  'Recipe',
  'Taste',
  'Review',
] as const

const todayLocal = () => new Date().toISOString().slice(0, 16)

const buildDraft = (): NewBrewDraft => ({
  name: '',
  method: 'V60',
  brewedAt: todayLocal(),
  beanId: '',
  templateId: '',
  rating: 7,
  notes: '',
  dose: 18,
  water: 300,
  grindSize: 'Medium',
  grinderUsed: '',
  waterTemp: 94,
  waterType: 'Filtered',
  filterType: 'Paper',
  totalBrewTime: '2:50',
  bloomTime: 35,
  bloomWater: 45,
  numberOfPours: 4,
  pourTiming: '',
  agitation: '',
  drawdownTime: '0:45',
  flavorNotes: '',
  changeNextTime: '',
  tasteScores: createDefaultScores(),
})

const buildBeanDraft = (): NewBeanDraft => ({
  roaster: '',
  coffeeName: '',
  originCountry: '',
  regionFarm: '',
  variety: '',
  process: '',
  roastLevel: '',
  roastDate: '',
  bagNotes: '',
  price: '',
  bagSize: '',
  grinderPairing: '',
})

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString([], { dateStyle: 'medium' }) : 'Not set'

const calcRatio = (dose: number, water: number) => (dose > 0 ? (water / dose).toFixed(1) : '0.0')

const daysOffRoast = (roastDate: string, brewedAt: string) => {
  if (!roastDate || !brewedAt) return null
  const diff = new Date(brewedAt).getTime() - new Date(roastDate).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

const suggestionFor = (draft: NewBrewDraft) => {
  const { bitterness, acidity, sweetness, body } = draft.tasteScores
  if (bitterness >= 7) return 'Next time: grind slightly coarser or lower the water temperature by 1 to 2 C.'
  if (acidity >= 8 && sweetness <= 5) return 'Next time: grind a touch finer or add a little more contact time.'
  if (body <= 4) return 'Next time: increase dose slightly or add a gentle swirl to lift extraction.'
  if (sweetness >= 8 && body >= 7) return 'This looks close. Keep the recipe and only make one small change at a time.'
  return 'Next time: keep one variable steady and test grind size first.'
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<View>('home')
  const [selectedBrewId, setSelectedBrewId] = useState<string | null>(null)
  const [draft, setDraft] = useState<NewBrewDraft>(() => buildDraft())
  const [beanDraft, setBeanDraft] = useState<NewBeanDraft>(() => buildBeanDraft())
  const [step, setStep] = useState(1)
  const [showBeanForm, setShowBeanForm] = useState(false)
  const [templateDraft, setTemplateDraft] = useState({
    name: '',
    method: 'V60' as BrewMethod,
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  const beansById = useMemo(
    () => Object.fromEntries(state.beans.map((bean) => [bean.id, bean])),
    [state.beans],
  )

  const brewsSorted = useMemo(
    () => [...state.brews].sort((a, b) => +new Date(b.brewedAt) - +new Date(a.brewedAt)),
    [state.brews],
  )

  const selectedBrew = brewsSorted.find((brew) => brew.id === selectedBrewId) ?? brewsSorted[0] ?? null

  const averageRating = brewsSorted.length
    ? (brewsSorted.reduce((sum, brew) => sum + brew.rating, 0) / brewsSorted.length).toFixed(1)
    : '0.0'

  const topBean = useMemo(() => {
    const beanRatings = state.beans
      .map((bean) => {
        const beanBrews = state.brews.filter((brew) => brew.beanId === bean.id)
        if (beanBrews.length === 0) return null
        const avg = beanBrews.reduce((sum, brew) => sum + brew.rating, 0) / beanBrews.length
        return { bean, avg }
      })
      .filter((entry): entry is { bean: Bean; avg: number } => entry !== null)
      .sort((a, b) => b.avg - a.avg)[0]
    return beanRatings ?? null
  }, [state.beans, state.brews])

  const bestMethod = useMemo(() => {
    const grouped = BREW_METHODS.map((method) => {
      const matches = state.brews.filter((brew) => brew.method === method)
      const avg = matches.length
        ? matches.reduce((sum, brew) => sum + brew.rating, 0) / matches.length
        : 0
      return { method, avg, count: matches.length }
    }).filter((entry) => entry.count > 0)
    return grouped.sort((a, b) => b.avg - a.avg)[0] ?? null
  }, [state.brews])

  const resetDraft = () => {
    setDraft(buildDraft())
    setStep(1)
    setShowBeanForm(false)
    setBeanDraft(buildBeanDraft())
  }

  const updateDraft = <K extends keyof NewBrewDraft>(key: K, value: NewBrewDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updateBeanDraft = <K extends keyof NewBeanDraft>(key: K, value: NewBeanDraft[K]) => {
    setBeanDraft((current) => ({ ...current, [key]: value }))
  }

  const applyTemplate = (templateId: string) => {
    const template = state.templates.find((entry) => entry.id === templateId)
    if (!template) return
    setDraft((current) => ({
      ...current,
      templateId,
      method: template.method,
      dose: template.dose,
      water: template.water,
      grindSize: template.grindSize,
      waterTemp: template.waterTemp,
      bloomTime: template.bloomTime,
      bloomWater: template.bloomWater,
      numberOfPours: template.numberOfPours,
      pourTiming: template.pourTiming,
      totalBrewTime: template.totalBrewTime,
      agitation: template.agitation,
      filterType: template.filterType,
      waterType: template.waterType,
    }))
  }

  const saveBean = () => {
    if (!beanDraft.roaster || !beanDraft.coffeeName) return
    const bean: Bean = {
      id: createId(),
      createdAt: new Date().toISOString(),
      ...beanDraft,
    }
    setState((current) => ({ ...current, beans: [bean, ...current.beans] }))
    setDraft((current) => ({ ...current, beanId: bean.id }))
    setBeanDraft(buildBeanDraft())
    setShowBeanForm(false)
  }

  const saveBrew = () => {
    if (!draft.name || !draft.beanId) return
    const brew: Brew = {
      id: createId(),
      createdAt: new Date().toISOString(),
      name: draft.name,
      method: draft.method,
      brewedAt: draft.brewedAt,
      beanId: draft.beanId,
      templateId: draft.templateId || undefined,
      rating: draft.rating,
      notes: draft.notes,
      dose: draft.dose,
      water: draft.water,
      grindSize: draft.grindSize,
      grinderUsed: draft.grinderUsed,
      waterTemp: draft.waterTemp,
      waterType: draft.waterType,
      filterType: draft.filterType,
      totalBrewTime: draft.totalBrewTime,
      bloomTime: draft.bloomTime,
      bloomWater: draft.bloomWater,
      numberOfPours: draft.numberOfPours,
      pourTiming: draft.pourTiming,
      agitation: draft.agitation,
      drawdownTime: draft.drawdownTime,
      flavorNotes: draft.flavorNotes,
      changeNextTime: draft.changeNextTime || suggestionFor(draft),
      tasteScores: draft.tasteScores,
    }
    setState((current) => ({ ...current, brews: [brew, ...current.brews] }))
    setSelectedBrewId(brew.id)
    setView('history')
    resetDraft()
  }

  const duplicateBrew = (brew: Brew) => {
    setDraft({
      name: `${brew.name} Copy`,
      method: brew.method,
      brewedAt: todayLocal(),
      beanId: brew.beanId,
      templateId: brew.templateId ?? '',
      rating: brew.rating,
      notes: brew.notes,
      dose: brew.dose,
      water: brew.water,
      grindSize: brew.grindSize,
      grinderUsed: brew.grinderUsed,
      waterTemp: brew.waterTemp,
      waterType: brew.waterType,
      filterType: brew.filterType,
      totalBrewTime: brew.totalBrewTime,
      bloomTime: brew.bloomTime,
      bloomWater: brew.bloomWater,
      numberOfPours: brew.numberOfPours,
      pourTiming: brew.pourTiming,
      agitation: brew.agitation,
      drawdownTime: brew.drawdownTime,
      flavorNotes: brew.flavorNotes,
      changeNextTime: brew.changeNextTime,
      tasteScores: brew.tasteScores,
    })
    setStep(3)
    setView('new')
  }

  const saveTemplateFromDraft = () => {
    if (!templateDraft.name) return
    const template: RecipeTemplate = {
      id: createId(),
      name: templateDraft.name,
      method: draft.method || templateDraft.method,
      dose: draft.dose,
      water: draft.water,
      grindSize: draft.grindSize,
      waterTemp: draft.waterTemp,
      bloomTime: draft.bloomTime,
      bloomWater: draft.bloomWater,
      numberOfPours: draft.numberOfPours,
      pourTiming: draft.pourTiming,
      totalBrewTime: draft.totalBrewTime,
      agitation: draft.agitation,
      filterType: draft.filterType,
      waterType: draft.waterType,
    }
    setState((current) => ({ ...current, templates: [template, ...current.templates] }))
    setTemplateDraft({ name: '', method: draft.method })
    setDraft((current) => ({ ...current, templateId: template.id }))
  }

  const renderHome = () => (
    <div className="page-grid">
      <section className="hero-card">
        <p className="eyebrow">Coffee journal</p>
        <h1>Track every brew, not just the good ones.</h1>
        <p className="hero-copy">
          Log beans, recipes, and taste outcomes in one place so your next cup starts smarter.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setView('new')}>
            Log New Brew
          </button>
          <button className="secondary-button" onClick={() => setView('history')}>
            View Brew History
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Brews logged</span>
          <strong>{state.brews.length}</strong>
        </article>
        <article className="stat-card">
          <span>Average rating</span>
          <strong>{averageRating}</strong>
        </article>
        <article className="stat-card">
          <span>Beans tracked</span>
          <strong>{state.beans.length}</strong>
        </article>
        <article className="stat-card">
          <span>Top method</span>
          <strong>{bestMethod?.method ?? 'None yet'}</strong>
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
          {brewsSorted.length === 0 ? (
            <div className="empty-state">
              <h3>No brews yet</h3>
              <p>Start with one brew entry and the app will build out your history and insights.</p>
            </div>
          ) : (
            brewsSorted.slice(0, 4).map((brew) => (
              <button
                key={brew.id}
                className="list-item"
                onClick={() => {
                  setSelectedBrewId(brew.id)
                  setView('history')
                }}
              >
                <div>
                  <strong>{brew.name}</strong>
                  <span>
                    {brew.method} • {beansById[brew.beanId]?.coffeeName ?? 'Unknown beans'}
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
              {topBean ? `${topBean.bean.roaster} ${topBean.bean.coffeeName}` : 'Log a few brews first'}
            </strong>
          </article>
          <article className="highlight-card">
            <span>Best average method</span>
            <strong>{bestMethod ? `${bestMethod.method} (${bestMethod.avg.toFixed(1)})` : 'No data yet'}</strong>
          </article>
        </div>
      </section>
    </div>
  )

  const renderNewBrew = () => (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Guided flow</p>
            <h2>Log a new brew</h2>
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
              const currentStep = index + 1
              return (
                <button
                  key={label}
                  className={currentStep === step ? 'progress-label active' : 'progress-label'}
                  onClick={() => setStep(currentStep)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {step === 1 && (
          <div className="form-grid">
            <label>
              Brew name
              <input value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} placeholder="Morning Ethiopia V60" />
            </label>
            <label>
              Date and time
              <input type="datetime-local" value={draft.brewedAt} onChange={(e) => updateDraft('brewedAt', e.target.value)} />
            </label>
            <label>
              Recipe template
              <select
                value={draft.templateId}
                onChange={(e) => {
                  updateDraft('templateId', e.target.value)
                  applyTemplate(e.target.value)
                }}
              >
                <option value="">Start from scratch</option>
                {state.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Brew method
              <select value={draft.method} onChange={(e) => updateDraft('method', e.target.value as BrewMethod)}>
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
                <select value={draft.beanId} onChange={(e) => updateDraft('beanId', e.target.value)}>
                  <option value="">Choose saved beans</option>
                  {state.beans.map((bean) => (
                    <option key={bean.id} value={bean.id}>
                      {bean.roaster} - {bean.coffeeName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="inline-actions">
              <button className="secondary-button" onClick={() => setShowBeanForm((current) => !current)}>
                {showBeanForm ? 'Hide Bean Form' : 'Add New Beans'}
              </button>
            </div>
            {showBeanForm && (
              <div className="subpanel">
                <div className="form-grid">
                  <label>
                    Roaster
                    <input value={beanDraft.roaster} onChange={(e) => updateBeanDraft('roaster', e.target.value)} />
                  </label>
                  <label>
                    Coffee name
                    <input value={beanDraft.coffeeName} onChange={(e) => updateBeanDraft('coffeeName', e.target.value)} />
                  </label>
                  <label>
                    Origin / country
                    <input value={beanDraft.originCountry} onChange={(e) => updateBeanDraft('originCountry', e.target.value)} />
                  </label>
                  <label>
                    Region / farm
                    <input value={beanDraft.regionFarm} onChange={(e) => updateBeanDraft('regionFarm', e.target.value)} />
                  </label>
                  <label>
                    Variety
                    <input value={beanDraft.variety} onChange={(e) => updateBeanDraft('variety', e.target.value)} />
                  </label>
                  <label>
                    Process
                    <input value={beanDraft.process} onChange={(e) => updateBeanDraft('process', e.target.value)} placeholder="Washed, natural, honey" />
                  </label>
                  <label>
                    Roast level
                    <input value={beanDraft.roastLevel} onChange={(e) => updateBeanDraft('roastLevel', e.target.value)} />
                  </label>
                  <label>
                    Roast date
                    <input type="date" value={beanDraft.roastDate} onChange={(e) => updateBeanDraft('roastDate', e.target.value)} />
                  </label>
                  <label>
                    Bag size
                    <input value={beanDraft.bagSize} onChange={(e) => updateBeanDraft('bagSize', e.target.value)} placeholder="250g" />
                  </label>
                  <label>
                    Price
                    <input value={beanDraft.price} onChange={(e) => updateBeanDraft('price', e.target.value)} placeholder="$22" />
                  </label>
                  <label className="full-span">
                    Tasting notes from bag
                    <textarea value={beanDraft.bagNotes} onChange={(e) => updateBeanDraft('bagNotes', e.target.value)} rows={3} />
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
                Dose (g)
                <input type="number" value={draft.dose} onChange={(e) => updateDraft('dose', Number(e.target.value))} />
              </label>
              <label>
                Water (g)
                <input type="number" value={draft.water} onChange={(e) => updateDraft('water', Number(e.target.value))} />
              </label>
              <label>
                Brew ratio
                <input value={`1:${calcRatio(draft.dose, draft.water)}`} disabled />
              </label>
              <label>
                Grind size
                <input value={draft.grindSize} onChange={(e) => updateDraft('grindSize', e.target.value)} />
              </label>
              <label>
                Grinder used
                <input value={draft.grinderUsed} onChange={(e) => updateDraft('grinderUsed', e.target.value)} />
              </label>
              <label>
                Water temperature (C)
                <input type="number" value={draft.waterTemp} onChange={(e) => updateDraft('waterTemp', Number(e.target.value))} />
              </label>
              <label>
                Water type
                <input value={draft.waterType} onChange={(e) => updateDraft('waterType', e.target.value)} />
              </label>
              <label>
                Filter type
                <input value={draft.filterType} onChange={(e) => updateDraft('filterType', e.target.value)} />
              </label>
              <label>
                Total brew time
                <input value={draft.totalBrewTime} onChange={(e) => updateDraft('totalBrewTime', e.target.value)} placeholder="3:10" />
              </label>
              <label>
                Bloom time (s)
                <input type="number" value={draft.bloomTime} onChange={(e) => updateDraft('bloomTime', Number(e.target.value))} />
              </label>
              <label>
                Bloom water (g)
                <input type="number" value={draft.bloomWater} onChange={(e) => updateDraft('bloomWater', Number(e.target.value))} />
              </label>
              <label>
                Number of pours
                <input type="number" value={draft.numberOfPours} onChange={(e) => updateDraft('numberOfPours', Number(e.target.value))} />
              </label>
              <label>
                Pour timing
                <input value={draft.pourTiming} onChange={(e) => updateDraft('pourTiming', e.target.value)} placeholder="0:00, 0:45, 1:15..." />
              </label>
              <label>
                Agitation / stir / swirl
                <input value={draft.agitation} onChange={(e) => updateDraft('agitation', e.target.value)} />
              </label>
              <label>
                Drawdown time
                <input value={draft.drawdownTime} onChange={(e) => updateDraft('drawdownTime', e.target.value)} placeholder="0:50" />
              </label>
            </div>
            <div className="subpanel">
              <div className="split-line">
                <div>
                  <h3>Save this recipe as a template</h3>
                  <p>Use your current brew settings as a starting point for future brews.</p>
                </div>
                <button className="secondary-button" onClick={saveTemplateFromDraft}>
                  Save Template
                </button>
              </div>
              <div className="form-grid compact">
                <label>
                  Template name
                  <input
                    value={templateDraft.name}
                    onChange={(e) => setTemplateDraft((current) => ({ ...current, name: e.target.value }))}
                    placeholder="My daily V60"
                  />
                </label>
                <label>
                  Method
                  <select
                    value={templateDraft.method}
                    onChange={(e) => setTemplateDraft((current) => ({ ...current, method: e.target.value as BrewMethod }))}
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
                <input type="range" min="1" max="10" value={draft.rating} onChange={(e) => updateDraft('rating', Number(e.target.value))} />
                <span className="range-value">{draft.rating}/10</span>
              </label>
              <label className="full-span">
                Notes
                <textarea value={draft.notes} onChange={(e) => updateDraft('notes', e.target.value)} rows={4} placeholder="What you liked or disliked" />
              </label>
              <label className="full-span">
                Flavor notes you tasted
                <textarea value={draft.flavorNotes} onChange={(e) => updateDraft('flavorNotes', e.target.value)} rows={3} placeholder="Citrus, black tea, peach..." />
              </label>
              <label className="full-span">
                What to change next time
                <textarea value={draft.changeNextTime} onChange={(e) => updateDraft('changeNextTime', e.target.value)} rows={3} placeholder="Too bitter and dry -> grind coarser or lower temp next time." />
              </label>
            </div>
            <div className="taste-grid">
              {tasteFields.map((field) => (
                <label key={field.key} className="slider-card">
                  <span>{field.label}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={draft.tasteScores[field.key]}
                    onChange={(e) =>
                      updateDraft('tasteScores', {
                        ...draft.tasteScores,
                        [field.key]: Number(e.target.value),
                      })
                    }
                  />
                  <strong>{draft.tasteScores[field.key]}</strong>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="stack">
            <div className="summary-card">
              <h3>{draft.name || 'Untitled brew'}</h3>
              <p>
                {draft.method} • Ratio 1:{calcRatio(draft.dose, draft.water)} • Rating {draft.rating}/10
              </p>
              <p>{suggestionFor(draft)}</p>
            </div>
            <div className="summary-grid">
              <article>
                <span>Beans</span>
                <strong>
                  {draft.beanId
                    ? `${beansById[draft.beanId]?.roaster} ${beansById[draft.beanId]?.coffeeName}`
                    : 'Select beans'}
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
          <button className="secondary-button" onClick={() => setStep((current) => Math.max(1, current - 1))}>
            Back
          </button>
          {step < 5 ? (
            <button className="primary-button" onClick={() => setStep((current) => Math.min(5, current + 1))}>
              Next
            </button>
          ) : (
            <button className="primary-button" onClick={saveBrew} disabled={!draft.name || !draft.beanId}>
              Save Brew
            </button>
          )}
        </div>
      </section>
    </div>
  )

  const renderBeans = () => (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Bean library</p>
            <h2>All coffees you have logged</h2>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setView('new')
              setStep(2)
              setShowBeanForm(true)
            }}
          >
            Add Beans
          </button>
        </div>
        <div className="cards">
          {state.beans.length === 0 ? (
            <div className="empty-state">
              <h3>No beans saved</h3>
              <p>Add a bag during the brew flow and this library will start filling in.</p>
            </div>
          ) : (
            state.beans.map((bean) => {
              const relatedBrews = state.brews.filter((brew) => brew.beanId === bean.id)
              const bestBrew = [...relatedBrews].sort((a, b) => b.rating - a.rating)[0]
              return (
                <article key={bean.id} className="bean-card">
                  <div className="bean-head">
                    <div>
                      <span>{bean.roaster}</span>
                      <h3>{bean.coffeeName}</h3>
                    </div>
                    <strong>{relatedBrews.length} brews</strong>
                  </div>
                  <p>
                    {bean.originCountry} {bean.regionFarm ? `• ${bean.regionFarm}` : ''}
                  </p>
                  <dl>
                    <div>
                      <dt>Roast date</dt>
                      <dd>{formatDate(bean.roastDate)}</dd>
                    </div>
                    <div>
                      <dt>Best rating</dt>
                      <dd>{bestBrew ? `${bestBrew.rating}/10` : 'None yet'}</dd>
                    </div>
                    <div>
                      <dt>Favorite recipe</dt>
                      <dd>
                        {bestBrew ? `${bestBrew.method} • 1:${calcRatio(bestBrew.dose, bestBrew.water)}` : 'None yet'}
                      </dd>
                    </div>
                    <div>
                      <dt>Bag notes</dt>
                      <dd>{bean.bagNotes || 'None added'}</dd>
                    </div>
                  </dl>
                </article>
              )
            })
          )}
        </div>
      </section>
    </div>
  )

  const renderHistory = () => (
    <div className="history-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Brew history</p>
            <h2>All logged brews</h2>
          </div>
        </div>
        <div className="list">
          {brewsSorted.length === 0 ? (
            <div className="empty-state">
              <h3>No brew history yet</h3>
              <p>Once you save a brew, it will show up here with duplicate and detail actions.</p>
            </div>
          ) : (
            brewsSorted.map((brew) => (
              <button
                key={brew.id}
                className={brew.id === selectedBrew?.id ? 'list-item selected' : 'list-item'}
                onClick={() => setSelectedBrewId(brew.id)}
              >
                <div>
                  <strong>{brew.name}</strong>
                  <span>
                    {brew.method} • {beansById[brew.beanId]?.roaster ?? 'Unknown roaster'}
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
                <button className="secondary-button" onClick={() => duplicateBrew(selectedBrew)}>
                  Duplicate Brew
                </button>
                <button className="primary-button" onClick={() => duplicateBrew(selectedBrew)}>
                  Adjust Next Brew
                </button>
              </div>
            </div>
            <div className="detail-grid">
              <article className="detail-card">
                <h3>Recipe card</h3>
                <p>{selectedBrew.method}</p>
                <p>
                  {selectedBrew.dose}g coffee • {selectedBrew.water}g water • 1:
                  {calcRatio(selectedBrew.dose, selectedBrew.water)}
                </p>
                <p>
                  {selectedBrew.waterTemp}C • {selectedBrew.totalBrewTime} total • {selectedBrew.grindSize}
                </p>
              </article>
              <article className="detail-card">
                <h3>Taste scores</h3>
                <div className="mini-grid">
                  {tasteFields.map((field) => (
                    <div key={field.key}>
                      <span>{field.label}</span>
                      <strong>{selectedBrew.tasteScores[field.key]}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article className="detail-card">
                <h3>Bean context</h3>
                <p>
                  {beansById[selectedBrew.beanId]?.roaster} {beansById[selectedBrew.beanId]?.coffeeName}
                </p>
                <p>Roast date: {formatDate(beansById[selectedBrew.beanId]?.roastDate ?? '')}</p>
                <p>
                  Days off roast:{' '}
                  {daysOffRoast(
                    beansById[selectedBrew.beanId]?.roastDate ?? '',
                    selectedBrew.brewedAt,
                  ) ?? 'Unknown'}
                </p>
              </article>
              <article className="detail-card full-width">
                <h3>Journal notes</h3>
                <p>{selectedBrew.notes || 'No notes added.'}</p>
                <p>Tasted: {selectedBrew.flavorNotes || 'No flavor notes added.'}</p>
                <p>Next time: {selectedBrew.changeNextTime || 'No adjustment note added.'}</p>
              </article>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>Select a brew</h3>
            <p>Your detailed recipe and tasting notes will appear here.</p>
          </div>
        )}
      </section>
    </div>
  )

  const renderTemplates = () => (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recipe templates</p>
            <h2>Reusable starting points</h2>
          </div>
        </div>
        <div className="cards">
          {state.templates.map((template) => (
            <article key={template.id} className="template-card">
              <span>{template.method}</span>
              <h3>{template.name}</h3>
              <p>
                {template.dose}g / {template.water}g / 1:{calcRatio(template.dose, template.water)}
              </p>
              <p>{template.grindSize} • {template.waterTemp}C • {template.totalBrewTime}</p>
              <button
                className="secondary-button"
                onClick={() => {
                  applyTemplate(template.id)
                  setView('new')
                  setStep(1)
                }}
              >
                Start Brew
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )

  const renderInsights = () => {
    const ratioAverage =
      state.brews.length > 0
        ? (
            state.brews.reduce((sum, brew) => sum + brew.water / brew.dose, 0) / state.brews.length
          ).toFixed(1)
        : '0.0'

    const avgDaysOff =
      state.brews.length > 0
        ? (
            state.brews.reduce((sum, brew) => {
              const bean = beansById[brew.beanId]
              return sum + (daysOffRoast(bean?.roastDate ?? '', brew.brewedAt) ?? 0)
            }, 0) / state.brews.length
          ).toFixed(1)
        : '0.0'

    return (
      <div className="page-grid">
        <section className="stats-grid">
          <article className="stat-card">
            <span>Best-rated beans</span>
            <strong>{topBean ? topBean.bean.coffeeName : 'No data yet'}</strong>
          </article>
          <article className="stat-card">
            <span>Best method</span>
            <strong>{bestMethod ? bestMethod.method : 'No data yet'}</strong>
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
                    const matches = state.brews.filter((brew) => brew.method === method)
                    const avg =
                      matches.reduce((sum, brew) => sum + brew.rating, 0) / matches.length
                    return `${method} ${avg.toFixed(1)}`
                  })
                  .join(' • ') || 'Log more brews to compare methods.'}
              </strong>
            </article>
            <article className="highlight-card">
              <span>Temperature trend</span>
              <strong>
                {state.brews.length
                  ? `${(
                      state.brews.reduce((sum, brew) => sum + brew.waterTemp, 0) / state.brews.length
                    ).toFixed(1)}C average brew temperature`
                  : 'No temperature data yet'}
              </strong>
            </article>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">Brewer</p>
          <h2>The coffee logbook</h2>
        </div>
        <nav>
          {Object.entries(tabLabels).map(([key, label]) => (
            <button
              key={key}
              className={view === key ? 'nav-link active' : 'nav-link'}
              onClick={() => setView(key as View)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span>Next brew idea</span>
          <strong>{draft.changeNextTime || suggestionFor(draft)}</strong>
        </div>
      </aside>

      <main className="content">
        {view === 'home' && renderHome()}
        {view === 'new' && renderNewBrew()}
        {view === 'beans' && renderBeans()}
        {view === 'history' && renderHistory()}
        {view === 'templates' && renderTemplates()}
        {view === 'insights' && renderInsights()}
      </main>
    </div>
  )
}

export default App

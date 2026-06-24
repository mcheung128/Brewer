import { BREW_METHODS, type AppState, type RecipeTemplate, type TasteScores } from './types'

const STORAGE_KEY = 'brewer-app-state-v1'

const defaultScores = (): TasteScores => ({
  acidity: null,
  sweetness: null,
  bitterness: null,
  body: null,
  clarity: null,
  aftertaste: null,
  strength: null,
  balance: null,
})

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const template = (
  name: string,
  method: (typeof BREW_METHODS)[number],
  dose: number,
  water: number,
  grindSize: string,
  grinderUsed: string | null,
  waterTemp: number,
  numberOfPours: number | null,
  pourTiming: string | null,
  pourAmounts: string | null,
  filterType: string | null,
): RecipeTemplate => ({
  id: createId(),
  name,
  method,
  dose,
  water,
  grindSize,
  grinderUsed,
  waterTemp,
  numberOfPours,
  pourTiming,
  pourAmounts,
  filterType,
})

export const seededTemplates = (): RecipeTemplate[] => [
  template(
    'James Hoffmann V60',
    'V60',
    30,
    500,
    'Medium-fine',
    'Comandante C40',
    96,
    5,
    '0:00 bloom, then pours every 30s',
    '60g bloom, then 110g, 110g, 110g, 110g',
    'Paper',
  ),
  template(
    'My Daily V60',
    'V60',
    18,
    300,
    'Medium',
    'Baratza Encore',
    94,
    4,
    'Pulse pours every 25s',
    '60g bloom, then 80g, 80g, 80g',
    'Paper',
  ),
  template(
    'Daily AeroPress',
    'AeroPress',
    18,
    220,
    'Fine',
    '1Zpresso JX',
    92,
    null,
    null,
    null,
    'Paper',
  ),
]

export const createDefaultState = (): AppState => ({
  beans: [],
  brews: [],
  templates: seededTemplates(),
})

export const loadLegacyState = (): AppState => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return createDefaultState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      beans: parsed.beans ?? [],
      brews:
        parsed.brews?.map((brew) => ({
          ...brew,
          grinderUsed: brew.grinderUsed ?? null,
          filterType: brew.filterType ?? null,
          totalBrewTime: brew.totalBrewTime ?? null,
          numberOfPours: brew.numberOfPours ?? null,
          pourTiming: brew.pourTiming ?? null,
          pourAmounts: brew.pourAmounts ?? null,
          tasteScores: { ...defaultScores(), ...brew.tasteScores },
        })) ?? [],
      templates:
        parsed.templates && parsed.templates.length > 0
          ? parsed.templates.map((template) => ({
              ...template,
              grinderUsed: template.grinderUsed ?? null,
              numberOfPours: template.numberOfPours ?? null,
              pourTiming: template.pourTiming ?? null,
              pourAmounts: template.pourAmounts ?? null,
              filterType: template.filterType ?? null,
            }))
          : seededTemplates(),
    }
  } catch {
    return createDefaultState()
  }
}

export const clearLegacyState = () => window.localStorage.removeItem(STORAGE_KEY)

export const createDefaultScores = defaultScores

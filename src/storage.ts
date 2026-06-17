import { BREW_METHODS, type AppState, type RecipeTemplate, type TasteScores } from './types'

const STORAGE_KEY = 'brewer-app-state-v1'

const defaultScores = (): TasteScores => ({
  acidity: 5,
  sweetness: 5,
  bitterness: 5,
  body: 5,
  clarity: 5,
  aftertaste: 5,
  strength: 5,
  balance: 5,
})

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const template = (
  name: string,
  method: (typeof BREW_METHODS)[number],
  dose: number,
  water: number,
  grindSize: string,
  waterTemp: number,
  bloomTime: number,
  bloomWater: number,
  numberOfPours: number,
  pourTiming: string,
  totalBrewTime: string,
  agitation: string,
  filterType: string,
  waterType: string,
): RecipeTemplate => ({
  id: createId(),
  name,
  method,
  dose,
  water,
  grindSize,
  waterTemp,
  bloomTime,
  bloomWater,
  numberOfPours,
  pourTiming,
  totalBrewTime,
  agitation,
  filterType,
  waterType,
})

export const seededTemplates = (): RecipeTemplate[] => [
  template(
    'James Hoffmann V60',
    'V60',
    30,
    500,
    'Medium-fine',
    96,
    45,
    60,
    5,
    '0:00 bloom, then pours every 30s',
    '3:30',
    'Gentle swirl after bloom',
    'Paper',
    'Filtered',
  ),
  template(
    'My Daily V60',
    'V60',
    18,
    300,
    'Medium',
    94,
    35,
    45,
    4,
    'Pulse pours every 25s',
    '2:50',
    'Light center swirl',
    'Paper',
    'Third wave profile',
  ),
  template(
    'Stronger Iced Pourover',
    'Kalita',
    24,
    220,
    'Medium-fine',
    95,
    40,
    60,
    4,
    'Short aggressive pulses',
    '2:40',
    'One stir after bloom',
    'Wave paper',
    'Filtered',
  ),
]

const defaultState = (): AppState => ({
  beans: [],
  brews: [],
  templates: seededTemplates(),
})

export const loadState = (): AppState => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return defaultState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      beans: parsed.beans ?? [],
      brews:
        parsed.brews?.map((brew) => ({
          ...brew,
          tasteScores: brew.tasteScores ?? defaultScores(),
        })) ?? [],
      templates:
        parsed.templates && parsed.templates.length > 0
          ? parsed.templates
          : seededTemplates(),
    }
  } catch {
    return defaultState()
  }
}

export const saveState = (state: AppState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const createDefaultScores = defaultScores

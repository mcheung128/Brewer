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
  numberOfPours: number,
  pourTiming: string,
  totalBrewTime: string,
  filterType: string,
): RecipeTemplate => ({
  id: createId(),
  name,
  method,
  dose,
  water,
  grindSize,
  waterTemp,
  numberOfPours,
  pourTiming,
  totalBrewTime,
  filterType,
})

export const seededTemplates = (): RecipeTemplate[] => [
  template(
    'James Hoffmann V60',
    'V60',
    30,
    500,
    'Medium-fine',
    96,
    5,
    '0:00 bloom, then pours every 30s',
    '3:30',
    'Paper',

  ),
  template(
    'My Daily V60',
    'V60',
    18,
    300,
    'Medium',
    94,
    4,
    'Pulse pours every 25s',
    '2:50',
    'Paper',
  ),
  template(
    'Daily AeroPress',
    'AeroPress',
    18,
    220,
    'Fine',
    92,
    0,
    '',
    '1:45',
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
          tasteScores: brew.tasteScores ?? defaultScores(),
        })) ?? [],
      templates:
        parsed.templates && parsed.templates.length > 0
          ? parsed.templates
          : seededTemplates(),
    }
  } catch {
    return createDefaultState()
  }
}

export const clearLegacyState = () => window.localStorage.removeItem(STORAGE_KEY)

export const createDefaultScores = defaultScores

export const BREW_METHODS = [
  'V60',
  'Chemex',
  'AeroPress',
  'Espresso',
  'Cold brew',
] as const

export type BrewMethod = (typeof BREW_METHODS)[number]

export type TasteAttribute =
  | 'acidity'
  | 'sweetness'
  | 'bitterness'
  | 'body'
  | 'clarity'
  | 'aftertaste'
  | 'strength'
  | 'balance'

export type TasteScores = Record<TasteAttribute, number | null>

export interface Bean {
  id: string
  roaster: string
  coffeeName: string
  originCountry: string
  regionFarm: string
  variety: string
  process: string
  roastLevel: string
  roastDate: string
  bagNotes: string
  price: string
  bagSize: string
  grinderPairing: string
  createdAt: string
}

export interface RecipeTemplate {
  id: string
  name: string
  method: BrewMethod
  dose: number
  water: number
  grindSize: string
  grinderUsed: string | null
  waterTemp: number
  numberOfPours: number | null
  pourTiming: string | null
  pourAmounts: string | null
  filterType: string | null
}

export interface Brew {
  id: string
  name: string
  method: BrewMethod
  brewedAt: string
  beanId: string
  templateId?: string
  rating: number
  notes: string
  dose: number
  water: number
  grindSize: string
  grinderUsed: string | null
  waterTemp: number
  filterType: string | null
  totalBrewTime: string | null
  numberOfPours: number | null
  pourTiming: string | null
  pourAmounts: string | null
  changeNextTime: string
  tasteScores: TasteScores
  createdAt: string
}

export interface NewBrewDraft {
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
  grinderUsed: string | null
  waterTemp: number
  filterType: string | null
  totalBrewTime: string | null
  numberOfPours: number | null
  pourTiming: string | null
  pourAmounts: string | null
  changeNextTime: string
  tasteScores: TasteScores
}

export type NewBeanDraft = Omit<Bean, 'id' | 'createdAt'>

export interface AppState {
  beans: Bean[]
  brews: Brew[]
  templates: RecipeTemplate[]
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

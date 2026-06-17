export const BREW_METHODS = [
  'V60',
  'Chemex',
  'Kalita',
  'AeroPress',
  'French press',
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

export type TasteScores = Record<TasteAttribute, number>

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
  waterTemp: number
  bloomTime: number
  bloomWater: number
  numberOfPours: number
  pourTiming: string
  totalBrewTime: string
  agitation: string
  filterType: string
  waterType: string
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
  createdAt: string
}

export interface AppState {
  beans: Bean[]
  brews: Brew[]
  templates: RecipeTemplate[]
}

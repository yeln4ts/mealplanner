const envUrl = import.meta.env.VITE_POCKETBASE_URL || ''
const dynamicUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8090`
    : ''

export const POCKETBASE_URL = dynamicUrl
export const MAX_HISTORY_ITEMS = 8
export const SIMILARITY_THRESHOLD = 0.3
export const MAX_MENU_DAYS = 14
export const MEAL_TYPES = {
  DINNER_ONLY: 'dinner',
  LUNCH_DINNER: 'lunch_dinner'
}

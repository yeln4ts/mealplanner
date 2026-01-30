import PocketBase from 'pocketbase'
import { POCKETBASE_URL } from '../config'

const STORAGE_KEY = 'mealplanner:data:v1'

async function pbFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PocketBase error ${response.status}: ${text}`)
  }
  if (response.status === 204) return null
  return response.json()
}

function createPocketBaseStorage(baseUrl) {
  const collection = 'app_state'
  const key = 'default'
  let unsubscribe = null
  let lastSnapshot = ''
  const pb = new PocketBase(baseUrl)

  const recordUrl = (id = '') =>
    `${baseUrl.replace(/\/$/, '')}/api/collections/${collection}/records${id ? `/${id}` : ''}`

  return {
    name: 'pocketbase',
    async loadAll() {
      try {
        const result = await pbFetch(`${recordUrl()}?perPage=1&filter=key%3D%22${key}%22`)
        const record = result?.items?.[0]
        if (!record?.data) {
          return {
            meals: [],
            menuHistory: [],
            currentMenu: null,
            draftMenu: null,
            presets: [],
            defaults: {
              lunchCount: 0,
              dinnerCount: 7,
              lunchUnique: 1,
              dinnerUnique: 5,
              mealPrepLunch: false,
              mealPrepDinner: true
            }
          }
        }
        return record.data
      } catch (error) {
        console.error(error)
        return {
          meals: [],
          menuHistory: [],
          currentMenu: null,
          draftMenu: null,
          presets: [],
          defaults: {
            lunchCount: 0,
            dinnerCount: 7,
            lunchUnique: 1,
            dinnerUnique: 5,
            mealPrepLunch: false,
            mealPrepDinner: true
          }
        }
      }
    },
    async saveAll(data) {
      const result = await pbFetch(`${recordUrl()}?perPage=1&filter=key%3D%22${key}%22`)
      const record = result?.items?.[0]
      if (record?.id) {
        await pbFetch(recordUrl(record.id), {
          method: 'PATCH',
          body: JSON.stringify({ key, data })
        })
      } else {
        await pbFetch(recordUrl(), {
          method: 'POST',
          body: JSON.stringify({ key, data })
        })
      }
    },
    startSync(onData) {
      if (unsubscribe) return () => {}
      pb.collection(collection)
        .subscribe('*', (event) => {
          const record = event.record
          if (!record || record.key !== key) return
          const payload = record.data
          if (!payload) return
          const snapshot = JSON.stringify(payload)
          if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot
            onData(payload)
          }
        })
        .then((unsub) => {
          unsubscribe = unsub
        })
        .catch((error) => {
          console.warn(error)
        })
      return () => {
        if (unsubscribe) {
          try {
            unsubscribe()
          } catch {
            pb.collection(collection).unsubscribe('*').catch(() => {})
          }
          unsubscribe = null
        }
      }
    },
    async addMeal(meal) {
      return meal
    },
    async updateMeal() {},
    async deleteMeal() {},
    async addPreset(preset) {
      return preset
    },
    async updatePreset() {},
    async deletePreset() {},
    async saveCurrentMenu(menu) {
      return menu
    },
    async updateCurrentMenu(menu) {
      return menu
    },
    async clearCurrentMenu() {},
    async archiveCurrentMenu() {},
    async saveMenuToHistory(menu) {
      return menu
    }
  }
}

function createLocalStorage() {
  return {
    name: 'local',
    async loadAll() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return {
          meals: [],
          menuHistory: [],
          currentMenu: null,
          presets: []
        }
      }
      try {
        return JSON.parse(raw)
      } catch {
        return {
          meals: [],
          menuHistory: [],
          currentMenu: null,
          presets: []
        }
      }
    },
    async saveAll(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },
    async addMeal(meal) {
      return meal
    },
    async updateMeal() {},
    async deleteMeal() {},
    async addPreset(preset) {
      return preset
    },
    async updatePreset() {},
    async deletePreset() {},
    async saveCurrentMenu(menu) {
      return menu
    },
    async updateCurrentMenu(menu) {
      return menu
    },
    async clearCurrentMenu() {},
    async archiveCurrentMenu() {},
    async saveMenuToHistory(menu) {
      return menu
    },
    startSync() {
      return () => {}
    }
  }
}

export function useStorage() {
  if (POCKETBASE_URL) {
    return createPocketBaseStorage(POCKETBASE_URL)
  }
  return createLocalStorage()
}

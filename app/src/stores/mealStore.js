import { defineStore } from 'pinia'
import { useStorage } from '../composables/useStorage'
import { generateMenu, regenerateSlot } from '../composables/useMenuGenerator'
import { MAX_HISTORY_ITEMS, MEAL_TYPES } from '../config'

const storage = useStorage()

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useMealStore = defineStore('meals', {
  state: () => ({
    meals: [],
    menuHistory: [],
    currentMenu: null,
    draftMenu: null,
    activeTab: 'meals',
    presets: [],
    defaults: {
      lunchCount: 0,
      dinnerCount: 7,
      lunchUnique: 1,
      dinnerUnique: 5,
      mealPrepLunch: false,
      mealPrepDinner: true
    },
    generationConfig: null,
    generationQueue: {
      lunch: [],
      dinner: []
    },
    loading: true,
    syncStop: null,
    dragState: {
      isDragging: false,
      source: null,
      target: null
    }
  }),
  getters: {
    allTags: (state) => [...new Set(state.meals.flatMap((m) => m.tags || []))].sort(),
    hasCurrentMenu: (state) => state.currentMenu !== null,
    currentMenuMealCount: (state) => {
      if (!state.currentMenu) return 0
      return state.currentMenu.days.reduce((acc, day) => {
        return acc + ['lunch', 'dinner'].filter((type) => day[type]?.mealId).length
      }, 0)
    },
    queuedMeals: (state) => (mealType) =>
      state.meals.filter((m) => state.generationQueue[mealType]?.includes(m.id)),
    isInQueue: (state) => (mealId, mealType) => {
      if (mealType) return state.generationQueue[mealType]?.includes(mealId)
      return (
        state.generationQueue.lunch.includes(mealId) ||
        state.generationQueue.dinner.includes(mealId)
      )
    }
  },
  actions: {
    async loadData() {
      const data = await storage.loadAll()
      this.applyRemoteData(data)
      this.loading = false
      if (!this.syncStop && storage.startSync) {
        this.syncStop = storage.startSync((payload) => {
          this.applyRemoteData(payload)
        })
      }
    },
    async persist() {
      await storage.saveAll({
        meals: this.meals,
        menuHistory: this.menuHistory,
        currentMenu: this.currentMenu,
        draftMenu: this.draftMenu,
        presets: this.presets,
        defaults: this.defaults
      })
    },
    async addMeal(name, tags) {
      const meal = {
        id: createId(),
        name,
        tags
      }
      this.meals.unshift(meal)
      await this.persist()
      return meal
    },
    async updateMeal(updated) {
      const index = this.meals.findIndex((meal) => meal.id === updated.id)
      if (index !== -1) {
        this.meals[index] = { ...updated }
        await this.persist()
      }
    },
    async deleteMeal(id) {
      this.meals = this.meals.filter((meal) => meal.id !== id)
      this.generationQueue.lunch = this.generationQueue.lunch.filter((mealId) => mealId !== id)
      this.generationQueue.dinner = this.generationQueue.dinner.filter((mealId) => mealId !== id)
      if (this.currentMenu) {
        this.currentMenu.days.forEach((day) => {
          ['lunch', 'dinner'].forEach((type) => {
            if (day[type]?.mealId === id) day[type] = null
          })
        })
      }
      await this.persist()
    },
    addToQueue(mealId, mealType = 'dinner') {
      if (!this.generationQueue[mealType].includes(mealId)) {
        this.generationQueue[mealType].push(mealId)
      }
    },
    removeFromQueue(mealId, mealType = 'dinner') {
      this.generationQueue[mealType] = this.generationQueue[mealType].filter((id) => id !== mealId)
    },
    toggleInQueue(mealId, mealType = 'dinner') {
      if (this.generationQueue[mealType].includes(mealId)) {
        this.removeFromQueue(mealId, mealType)
      } else {
        this.addToQueue(mealId, mealType)
      }
    },
    clearQueue(mealType) {
      if (!mealType) {
        this.generationQueue = { lunch: [], dinner: [] }
        return
      }
      this.generationQueue[mealType] = []
    },
    async generateMenu(config) {
      const menu = generateMenu({
        meals: this.meals,
        menuHistory: this.menuHistory,
        config: {
          ...config,
          mealTypes: config.mealTypes || MEAL_TYPES.DINNER_ONLY,
          lunchCount: config.lunchCount || 0,
          dinnerCount: config.dinnerCount || 0,
          lunchUnique: config.lunchUnique,
          dinnerUnique: config.dinnerUnique,
          queueMeals: config.queueMeals || this.generationQueue,
          pinnedMeals: config.pinnedMeals || [],
          tagConstraints: config.tagConstraints || []
        }
      })
      this.draftMenu = menu
      await this.persist()
      return menu
    },
    async setDraftMenu(menu) {
      this.draftMenu = menu
      await this.persist()
    },
    async clearDraftMenu() {
      this.draftMenu = null
      await this.persist()
    },
    async updateDraftSlot(dayIndex, mealType, meal) {
      if (!this.draftMenu) return
      this.draftMenu.days[dayIndex][mealType] = meal
        ? { mealId: meal.id, mealName: meal.name, mealTags: meal.tags || [] }
        : null
      this.draftMenu.modified = new Date().toISOString()
      await this.persist()
    },
    async swapDraftSlots(source, target) {
      if (!this.draftMenu) return
      const days = this.draftMenu.days
      const temp = days[source.dayIndex][source.mealType]
      days[source.dayIndex][source.mealType] = days[target.dayIndex][target.mealType]
      days[target.dayIndex][target.mealType] = temp
      this.draftMenu.modified = new Date().toISOString()
      await this.persist()
    },
    async regenerateDraftSlot(dayIndex, mealType, constraints) {
      if (!this.draftMenu) return
      const updated = regenerateSlot({
        meals: this.meals,
        menuHistory: this.menuHistory,
        menu: this.draftMenu,
        dayIndex,
        mealType,
        constraints
      })
      if (updated) {
        this.draftMenu = updated
        await this.persist()
      }
    },
    async commitDraftToCurrent() {
      if (!this.draftMenu) return
      if (this.currentMenu) {
        const archived = { ...this.currentMenu, id: createId() }
        this.menuHistory = [archived, ...this.menuHistory].slice(0, MAX_HISTORY_ITEMS)
      }
      this.currentMenu = { ...this.draftMenu, modified: new Date().toISOString() }
      this.draftMenu = null
      await this.persist()
    },
    async setCurrentMenu(menu) {
      this.currentMenu = menu
      await this.persist()
    },
    async updateMealSlot(dayIndex, mealType, meal) {
      if (!this.currentMenu) return
      this.currentMenu.days[dayIndex][mealType] = meal
        ? { mealId: meal.id, mealName: meal.name, mealTags: meal.tags || [] }
        : null
      this.currentMenu.modified = new Date().toISOString()
      await this.persist()
    },
    async swapMealSlots(source, target) {
      if (!this.currentMenu) return
      const days = this.currentMenu.days
      const temp = days[source.dayIndex][source.mealType]
      days[source.dayIndex][source.mealType] = days[target.dayIndex][target.mealType]
      days[target.dayIndex][target.mealType] = temp
      this.currentMenu.modified = new Date().toISOString()
      await this.persist()
    },
    async clearMealSlot(dayIndex, mealType) {
      if (!this.currentMenu) return
      this.currentMenu.days[dayIndex][mealType] = null
      this.currentMenu.modified = new Date().toISOString()
      await this.persist()
    },
    async regenerateSlot(dayIndex, mealType, constraints) {
      if (!this.currentMenu) return
      const updated = regenerateSlot({
        meals: this.meals,
        menuHistory: this.menuHistory,
        menu: this.currentMenu,
        dayIndex,
        mealType,
        constraints
      })
      if (updated) {
        this.currentMenu = updated
        await this.persist()
      }
    },
    async archiveCurrentMenu() {
      if (!this.currentMenu) return
      const archived = {
        ...this.currentMenu,
        id: createId()
      }
      this.menuHistory = [archived, ...this.menuHistory].slice(0, MAX_HISTORY_ITEMS)
      this.currentMenu = null
      await this.persist()
    },
    async reuseFromHistory(menuId) {
      const menu = this.menuHistory.find((m) => m.id === menuId)
      if (!menu) return
      this.currentMenu = { ...menu, modified: new Date().toISOString() }
      await this.persist()
    },
    async deleteFromHistory(menuId) {
      this.menuHistory = this.menuHistory.filter((menu) => menu.id !== menuId)
      await this.persist()
    },
    async addPreset(preset) {
      const item = { ...preset, id: createId() }
      this.presets.push(item)
      await this.persist()
      return item
    },
    async updatePreset(updated) {
      const index = this.presets.findIndex((preset) => preset.id === updated.id)
      if (index !== -1) {
        this.presets[index] = { ...updated }
        await this.persist()
      }
    },
    async deletePreset(id) {
      this.presets = this.presets.filter((preset) => preset.id !== id)
      await this.persist()
    },
    async updateDefaults(nextDefaults) {
      this.defaults = { ...this.defaults, ...nextDefaults }
      await this.persist()
    },
    applyRemoteData(data) {
      this.meals = data.meals || []
      this.menuHistory = data.menuHistory || []
      this.currentMenu = data.currentMenu || null
      this.draftMenu = data.draftMenu || null
      this.presets = data.presets || []
      this.defaults = {
        lunchCount: data.defaults?.lunchCount ?? 0,
        dinnerCount: data.defaults?.dinnerCount ?? 7,
        lunchUnique: data.defaults?.lunchUnique ?? 1,
        dinnerUnique: data.defaults?.dinnerUnique ?? 5,
        mealPrepLunch: data.defaults?.mealPrepLunch ?? false,
        mealPrepDinner: data.defaults?.mealPrepDinner ?? true
      }
    },
    setActiveTab(tabKey) {
      this.activeTab = tabKey
    }
  }
})

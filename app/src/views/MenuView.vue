<template>
  <section class="space-y-4">
    <div class="card p-4 border-violet-200 bg-violet-50/60 shadow-glow">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-900">Current menu</h2>
        <button class="btn-secondary" :disabled="!store.currentMenu" @click="reuseAsDraft(store.currentMenu)">
          Edit
        </button>
      </div>
      <p v-if="store.currentMenu" class="text-xs text-slate-500">
        Updated {{ formatDate(store.currentMenu.modified) }}
      </p>
      <div v-if="store.currentMenu" class="mt-3 space-y-3">
        <div v-for="day in store.currentMenu.days" :key="day.dayIndex" class="rounded-2xl border border-violet-200 bg-white p-3">
          <div class="flex items-center justify-between">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Day {{ day.dayIndex + 1 }}</span>
          </div>
          <div class="mt-3 space-y-2">
            <div
              v-if="showLunch"
              class="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2"
            >
              <span class="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">Lunch</span>
              <p class="min-w-0 flex-1 truncate text-sm text-slate-900">{{ day.lunch?.mealName || 'No meal' }}</p>
              <span v-if="day.lunch?.isRepeated" class="rounded-full bg-violet-200 px-2 py-0.5 text-[10px]">×{{ day.lunch.repeatCount }}</span>
            </div>
            <div
              v-if="showDinner"
              class="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2"
            >
              <span class="rounded-lg bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">Dinner</span>
              <p class="min-w-0 flex-1 truncate text-sm text-slate-900">{{ day.dinner?.mealName || 'No meal' }}</p>
              <span v-if="day.dinner?.isRepeated" class="rounded-full bg-violet-200 px-2 py-0.5 text-[10px]">×{{ day.dinner.repeatCount }}</span>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="mt-3 text-sm text-slate-500">No current menu yet. Generate one to get started.</p>
    </div>

    <div class="card p-4 space-y-3">
      <h2 class="text-base font-semibold text-slate-900">Past menus</h2>
      <div v-if="!store.menuHistory.length" class="text-sm text-slate-500">No archived menus yet.</div>
      <div v-for="menu in store.menuHistory" :key="menu.id" class="rounded-xl border border-slate-100 bg-white p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ formatDate(menu.created) }}</p>
            <p class="text-xs text-slate-500">{{ menuSummary(menu) }}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" @click="reuseAsDraft(menu)">Reuse</button>
            <button class="btn-secondary" @click="store.deleteFromHistory(menu.id)">Delete</button>
          </div>
        </div>
        <div class="mt-2 grid gap-2" :class="historyShowBoth(menu) ? 'grid-cols-2' : 'grid-cols-1'">
          <div v-for="day in menu.days" :key="day.dayIndex" class="rounded-lg bg-slate-50 p-2">
            <p class="text-xs font-semibold text-slate-600">Day {{ day.dayIndex + 1 }}</p>
            <p class="text-xs text-slate-500" v-if="historyShowLunch(menu) && day.lunch">Lunch: {{ day.lunch.mealName }}</p>
            <p class="text-xs text-slate-500" v-if="historyShowDinner(menu) && day.dinner">Dinner: {{ day.dinner.mealName }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useMealStore } from '../stores/mealStore'

const store = useMealStore()
const mealTypes = computed(() => {
  if (!store.currentMenu) return []
  const lunchCount = store.currentMenu.lunchCount ?? (store.currentMenu.mealTypes === 'dinner' ? 0 : 1)
  const dinnerCount = store.currentMenu.dinnerCount ?? 1
  const types = []
  if (lunchCount > 0) types.push('lunch')
  if (dinnerCount > 0) types.push('dinner')
  return types
})

const showLunch = computed(() => (store.currentMenu?.lunchCount ?? 0) > 0)
const showDinner = computed(() => (store.currentMenu?.dinnerCount ?? 1) > 0)
const showBothTypes = computed(() => showLunch.value && showDinner.value)

const historyShowLunch = (menu) => (menu.lunchCount ?? (menu.mealTypes === 'dinner' ? 0 : 1)) > 0
const historyShowDinner = (menu) => (menu.dinnerCount ?? 1) > 0
const historyShowBoth = (menu) => historyShowLunch(menu) && historyShowDinner(menu)

const menuSummary = (menu) => {
  const lunchCount = menu.lunchCount ?? 0
  const dinnerCount = menu.dinnerCount ?? 0
  if (lunchCount > 0 && dinnerCount > 0) return 'Lunch & Dinner'
  if (lunchCount > 0) return 'Lunch only'
  return 'Dinner only'
}

const typeLabel = (type) => (type === 'lunch' ? 'Lunch' : 'Dinner')

const formatDate = (date) => {
  const value = new Date(date)
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const reuseAsDraft = async (menu) => {
  await store.setDraftMenu({ ...menu, modified: new Date().toISOString() })
  store.setActiveTab('generate')
}
</script>

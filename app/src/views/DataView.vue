<template>
  <section class="space-y-4">
    <div class="card p-4 space-y-3">
      <h2 class="text-base font-semibold text-slate-900">Statistics</h2>
      <div class="grid gap-3 grid-cols-2">
        <div class="rounded-2xl bg-violet-50 p-3">
          <p class="text-2xl font-semibold text-violet-600">{{ store.meals.length }}</p>
          <p class="text-xs text-slate-600">Total meals</p>
        </div>
        <div class="rounded-2xl bg-violet-50 p-3">
          <p class="text-2xl font-semibold text-violet-600">{{ store.allTags.length }}</p>
          <p class="text-xs text-slate-600">Tags</p>
        </div>
        <div class="rounded-2xl bg-violet-50 p-3">
          <p class="text-2xl font-semibold text-violet-600">{{ store.menuHistory.length }}</p>
          <p class="text-xs text-slate-600">Saved menus</p>
        </div>
        <div class="rounded-2xl bg-violet-50 p-3">
          <p class="text-2xl font-semibold text-violet-600">{{ store.presets.length }}</p>
          <p class="text-xs text-slate-600">Presets</p>
        </div>
      </div>
    </div>

    <div class="card p-4 space-y-3">
      <h2 class="text-base font-semibold text-slate-900">Defaults</h2>
      <p class="text-xs text-slate-500">Used when opening the Generate tab.</p>
      <div class="grid gap-3 grid-cols-2">
        <label class="text-sm text-slate-600">
          Default lunch meals
          <input type="number" min="0" max="14" v-model.number="defaults.lunchCount" class="input mt-1" />
        </label>
        <label class="text-sm text-slate-600">
          Default dinner meals
          <input type="number" min="0" max="14" v-model.number="defaults.dinnerCount" class="input mt-1" />
        </label>
        <label class="text-sm text-slate-600">
          Default unique lunch meals
          <input type="number" min="1" max="14" v-model.number="defaults.lunchUnique" class="input mt-1" />
        </label>
        <label class="text-sm text-slate-600">
          Default unique dinner meals
          <input type="number" min="1" max="14" v-model.number="defaults.dinnerUnique" class="input mt-1" />
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="defaults.mealPrepLunch" /> Default meal prep lunch
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="defaults.mealPrepDinner" /> Default meal prep dinner
        </label>
      </div>
      <button class="btn-secondary" @click="saveDefaults">Save defaults</button>
    </div>

    <div class="card p-4 space-y-3">
      <h2 class="text-base font-semibold text-slate-900">Export Data</h2>
      <a class="btn-primary w-full" :href="downloadHref" download="mealplanner-backup.json">
        Download Full Backup (JSON)
      </a>
      <button class="btn-secondary w-full" @click="toggleTextExport">Export Meals as Text</button>
      <div v-if="showTextExport" class="space-y-2">
        <textarea readonly class="input h-32" :value="bulkExport"></textarea>
        <button class="btn-secondary w-full" @click="copyTextExport">Copy to clipboard</button>
      </div>
    </div>

    <div class="card p-4 space-y-3">
      <h2 class="text-base font-semibold text-slate-900">Import Data</h2>
      <input ref="fileInputRef" type="file" @change="handleFile" class="hidden" />
      <button class="btn-secondary w-full" @click="triggerFileSelect">
        Import Full Backup
      </button>
      <button class="text-xs text-violet-600" @click="showPaste = !showPaste">
        {{ showPaste ? '▼' : '▶' }} Or paste JSON backup
      </button>
      <div v-if="showPaste" class="space-y-2">
        <textarea v-model="importText" class="input h-32" placeholder="Paste JSON backup here..."></textarea>
        <button class="btn-primary w-full" @click="importData">Import from Paste</button>
      </div>
      <p v-if="importMessage" class="text-xs text-emerald-600">{{ importMessage }}</p>
      <p class="text-xs text-slate-500">Import replaces meals, history, current menu, presets, and defaults.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMealStore } from '../stores/mealStore'

const store = useMealStore()
const importText = ref('')
const defaults = ref({ ...store.defaults })
const showPaste = ref(false)
const showTextExport = ref(false)
const importMessage = ref('')
const fileInputRef = ref(null)

const exportJson = computed(() =>
  JSON.stringify({
    version: 1,
    meals: store.meals,
    menuHistory: store.menuHistory,
    currentMenu: store.currentMenu,
    draftMenu: store.draftMenu,
    presets: store.presets,
    defaults: store.defaults
  }, null, 2)
)

const downloadHref = computed(() => `data:application/json;charset=utf-8,${encodeURIComponent(exportJson.value)}`)

const bulkExport = computed(() =>
  store.meals.map((meal) => `${meal.name} | ${meal.tags.join(', ')}`).join('\n')
)

const copyExport = async () => {
  if (!navigator.clipboard) return
  await navigator.clipboard.writeText(exportJson.value)
}

const handleFile = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importText.value = reader.result
    importData()
  }
  reader.readAsText(file)
}

const importData = async () => {
  if (!importText.value.trim()) return
  const data = JSON.parse(importText.value)
  store.meals = data.meals || []
  store.menuHistory = data.menuHistory || []
  store.currentMenu = data.currentMenu || null
  store.draftMenu = data.draftMenu || null
  store.presets = data.presets || []
  store.defaults = {
    lunchCount: data.defaults?.lunchCount ?? 0,
    dinnerCount: data.defaults?.dinnerCount ?? 7,
    lunchUnique: data.defaults?.lunchUnique ?? 1,
    dinnerUnique: data.defaults?.dinnerUnique ?? 5,
    mealPrepLunch: data.defaults?.mealPrepLunch ?? false,
    mealPrepDinner: data.defaults?.mealPrepDinner ?? true
  }
  await store.persist()
  importText.value = ''
  importMessage.value = 'Import successful'
  setTimeout(() => {
    importMessage.value = ''
  }, 2500)
}

const toggleTextExport = () => {
  showTextExport.value = !showTextExport.value
}

const copyTextExport = async () => {
  const text = bulkExport.value
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const temp = document.createElement('textarea')
  temp.value = text
  temp.setAttribute('readonly', '')
  temp.style.position = 'absolute'
  temp.style.left = '-9999px'
  document.body.appendChild(temp)
  temp.select()
  document.execCommand('copy')
  document.body.removeChild(temp)
}

const triggerFileSelect = () => {
  if (fileInputRef.value) fileInputRef.value.click()
}

const saveDefaults = async () => {
  await store.updateDefaults({ ...defaults.value })
}

watch(
  () => store.defaults,
  (value) => {
    defaults.value = { ...value }
  },
  { deep: true }
)
</script>

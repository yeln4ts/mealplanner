<template>
  <section class="space-y-4">
    <div class="card p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-900">Quick generate</h2>
        <button
          v-if="store.presets.length"
          class="btn-secondary text-xs"
          @click="deleteMode = !deleteMode"
        >
          {{ deleteMode ? 'Exit delete' : 'Delete presets' }}
        </button>
      </div>
      <div v-if="deleteMode" class="text-xs text-slate-600">
        <span class="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-700">
          Delete mode · Click the × on a preset to delete it.
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <template v-for="preset in store.presets" :key="preset.id">
          <button
            v-if="!deleteMode"
            class="pill"
            @click="onPresetClick(preset)"
          >
            {{ preset.name }}
          </button>
          <span v-else class="pill">
            {{ preset.name }}
            <button
              class="text-violet-800"
              @click.stop="store.deletePreset(preset.id)"
            >×</button>
          </span>
        </template>
        <p v-if="!store.presets.length" class="text-xs text-slate-500">No presets saved yet.</p>
      </div>
    </div>

    <div class="card p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-900">Generate configuration</h2>
        <button class="btn-secondary" @click="configOpen = !configOpen">
          {{ configOpen ? 'Hide' : 'Show' }}
        </button>
      </div>
      <div v-if="configOpen" class="space-y-4">
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-slate-900">Meal counts</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="text-sm text-slate-600">
              Lunch meals
              <input type="number" min="0" max="14" v-model.number="lunchCount" class="input mt-1" />
            </label>
            <label class="text-sm text-slate-600">
              Dinner meals
              <input type="number" min="0" max="14" v-model.number="dinnerCount" class="input mt-1" />
            </label>
          </div>
          <div class="grid gap-2 md:grid-cols-2">
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" v-model="mealPrepLunch" :disabled="lunchCount === 0" /> Meal prep lunch
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" v-model="mealPrepDinner" :disabled="dinnerCount === 0" /> Meal prep dinner
            </label>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <label v-if="mealPrepLunch" class="text-sm text-slate-600">
              Unique lunch meals
              <input
                type="number"
                min="1"
                :max="lunchCount || 1"
                v-model.number="lunchUnique"
                class="input mt-1"
                :disabled="lunchCount === 0"
              />
            </label>
            <div v-else></div>
            <label v-if="mealPrepDinner" class="text-sm text-slate-600">
              Unique dinner meals
              <input
                type="number"
                min="1"
                :max="dinnerCount || 1"
                v-model.number="dinnerUnique"
                class="input mt-1"
                :disabled="dinnerCount === 0"
              />
            </label>
            <div v-else></div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3"></div>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900">Generation queue</h3>
            <button class="text-xs text-violet-600" @click="clearAllQueues">Clear all</button>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-slate-600">Lunch queue</p>
                <button class="text-xs text-slate-500" @click="store.clearQueue('lunch')">Clear</button>
              </div>
              <p class="text-xs text-slate-500" v-if="queueTooLongLunch">More queued meals than lunch slots.</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="meal in lunchQueueMeals" :key="meal.id" class="pill">
                  {{ meal.name }}
                  <button class="text-red-500" @click="store.removeFromQueue(meal.id, 'lunch')">×</button>
                </span>
              </div>
              <div class="relative" ref="lunchDropdownRef">
                <button class="btn-secondary w-full" @click="toggleQueueDropdown('lunch')">
                  Add lunch meal
                </button>
                <div v-if="queueDropdown.lunch" class="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <input v-model="queueSearchLunch" class="input" placeholder="Filter meals" />
                  <div class="mt-2 max-h-40 overflow-y-auto space-y-1">
                    <button
                      v-for="meal in queueOptionsLunch"
                      :key="meal.id"
                      class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-100"
                      @click="addToQueue(meal.id, 'lunch')"
                    >
                      {{ meal.name }}
                    </button>
                    <p v-if="queueSearchLunch && !queueOptionsLunch.length" class="text-xs text-slate-500">No matches.</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-slate-600">Dinner queue</p>
                <button class="text-xs text-slate-500" @click="store.clearQueue('dinner')">Clear</button>
              </div>
              <p class="text-xs text-slate-500" v-if="queueTooLongDinner">More queued meals than dinner slots.</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="meal in dinnerQueueMeals" :key="meal.id" class="pill">
                  {{ meal.name }}
                  <button class="text-red-500" @click="store.removeFromQueue(meal.id, 'dinner')">×</button>
                </span>
              </div>
              <div class="relative" ref="dinnerDropdownRef">
                <button class="btn-secondary w-full" @click="toggleQueueDropdown('dinner')">
                  Add dinner meal
                </button>
                <div v-if="queueDropdown.dinner" class="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <input v-model="queueSearchDinner" class="input" placeholder="Filter meals" />
                  <div class="mt-2 max-h-40 overflow-y-auto space-y-1">
                    <button
                      v-for="meal in queueOptionsDinner"
                      :key="meal.id"
                      class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-100"
                      @click="addToQueue(meal.id, 'dinner')"
                    >
                      {{ meal.name }}
                    </button>
                    <p v-if="queueSearchDinner && !queueOptionsDinner.length" class="text-xs text-slate-500">No matches.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3"></div>
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-slate-900">Tag constraints</h3>
          <p class="text-xs text-slate-500">Select one or more tags, then set how many meals must include them.</p>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <p class="text-xs font-semibold text-slate-600">Lunch constraints</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in store.allTags"
                  :key="`lunch-${tag}`"
                  class="pill"
                  :class="selectedConstraintTagsLunch.includes(tag) ? 'pill-selected' : ''"
                  @click="toggleConstraintTag(tag, 'lunch')"
                >
                  {{ tag }}
                </button>
                <p v-if="!store.allTags.length" class="text-xs text-slate-500">No tags yet. Add tags in Meals.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <input v-model.number="constraintCountLunch" type="number" min="1" class="input" placeholder="Count" />
                <button class="btn-secondary" @click="addConstraint('lunch')">Add</button>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-xs font-semibold text-slate-600">Dinner constraints</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in store.allTags"
                  :key="`dinner-${tag}`"
                  class="pill"
                  :class="selectedConstraintTagsDinner.includes(tag) ? 'pill-selected' : ''"
                  @click="toggleConstraintTag(tag, 'dinner')"
                >
                  {{ tag }}
                </button>
                <p v-if="!store.allTags.length" class="text-xs text-slate-500">No tags yet. Add tags in Meals.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <input v-model.number="constraintCountDinner" type="number" min="1" class="input" placeholder="Count" />
                <button class="btn-secondary" @click="addConstraint('dinner')">Add</button>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="(constraint, index) in tagConstraints" :key="index" class="pill">
              {{ constraint.mealType }}: {{ constraint.count }} with {{ constraint.tags.join(', ') }}
              <button class="text-red-500" @click="tagConstraints.splice(index,1)">×</button>
            </span>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3"></div>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900">Pinned meals</h3>
            <button class="text-xs text-slate-500" @click="pinnedOpen = !pinnedOpen">{{ pinnedOpen ? 'Hide' : 'Show' }}</button>
          </div>
          <div v-if="pinnedOpen" class="space-y-3">
            <div v-for="day in totalDays" :key="day" class="rounded-xl border border-slate-200 p-3">
              <p class="text-xs font-semibold text-slate-600">Day {{ day }}</p>
              <div class="mt-2 grid gap-2" :class="lunchCount > 0 && dinnerCount > 0 ? 'grid-cols-2' : 'grid-cols-1'">
                <div v-for="mealType in mealTypeOptions" :key="mealType" class="space-y-1">
                  <label class="text-xs text-slate-500">{{ mealTypeLabel(mealType) }}</label>
                  <select
                    class="input"
                    :value="getPinned(day - 1, mealType)"
                    :disabled="!isSlotEnabled(day - 1, mealType)"
                    @change="setPinned(day - 1, mealType, $event.target.value)"
                  >
                    <option value="">Any</option>
                    <option v-for="meal in store.meals" :key="meal.id" :value="meal.id">{{ meal.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3"></div>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-primary w-full sm:w-auto" @click="generate">Generate menu</button>
          <div class="flex-1"></div>
          <div class="flex w-full items-center gap-2 sm:w-auto">
            <input v-model="presetName" class="input flex-1 sm:w-48" placeholder="Preset name" />
            <button class="btn-secondary whitespace-nowrap" @click="savePreset">Save as preset</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 text-xs text-slate-600">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="presetIncludePinned" /> Include pinned meals
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="presetIncludeQueue" /> Include queued meals
          </label>
        </div>
      </div>
    </div>

    <div class="card p-4 space-y-3" v-if="store.draftMenu">
      <div class="relative flex flex-wrap items-center justify-between gap-2 pr-10 sm:pr-0">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Draft menu</h3>
          <p class="text-xs text-slate-500">Edit before committing to current menu.</p>
        </div>
        <div class="flex flex-wrap gap-2 sm:ml-auto">
          <button class="btn-secondary bg-amber-100 text-amber-800 hover:bg-amber-200" @click="toggleMoveMode">
            {{ moveMode ? 'Cancel move' : 'Move meals' }}
          </button>
          <button class="btn-secondary bg-red-100 text-red-700 hover:bg-red-200" @click="store.clearDraftMenu">Discard</button>
          <button
            class="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm sm:static"
            :disabled="!store.draftMenu"
            @click="generate"
            title="Regenerate all"
          >
            <span class="material-icons">cached</span>
          </button>
        </div>
      </div>
      <p v-if="moveMode" class="text-xs text-slate-500">
        Tap a meal slot to pick it up, then tap another slot to move it.
      </p>
      <div class="space-y-3">
        <div v-for="day in store.draftMenu.days" :key="day.dayIndex" class="rounded-2xl border border-slate-200 bg-white p-3">
          <div class="flex items-center justify-between">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Day {{ day.dayIndex + 1 }}</span>
          </div>
          <div class="mt-3 space-y-2">
            <div
              v-if="draftShowLunch"
              class="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2"
              :class="slotClass(day.dayIndex, 'lunch', !!day.lunch)"
              @click="onMoveTap(day.dayIndex, 'lunch')"
            >
              <span class="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">Lunch</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-slate-900">{{ day.lunch?.mealName || 'No meal' }}</p>
                <div v-if="day.lunch?.mealTags?.length" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="tag in day.lunch.mealTags" :key="tag" class="pill px-2 py-0.5 text-[10px]">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <span v-if="day.lunch?.isRepeated" class="rounded-full bg-violet-200 px-2 py-0.5 text-[10px]">×{{ day.lunch.repeatCount }}</span>
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm"
                  @click.stop="store.regenerateDraftSlot(day.dayIndex, 'lunch', tagConstraints)"
                  title="Regenerate"
                >
                  <span class="material-icons">cached</span>
                </button>
                <div class="relative">
                  <button class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm" @click.stop="toggleReplaceDropdown(day.dayIndex, 'lunch')">
                    <span class="material-icons">swap_horiz</span>
                  </button>
                  <div
                    v-if="replaceDropdown[getReplaceKey(day.dayIndex, 'lunch')]"
                    class="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
                    data-replace-dropdown
                    @click.stop
                  >
                    <input
                      v-model="replaceSearch[getReplaceKey(day.dayIndex, 'lunch')]"
                      class="input"
                      placeholder="Search meals"
                    />
                    <div class="mt-2 max-h-40 overflow-y-auto space-y-1">
                      <button
                        v-for="meal in replaceOptions(day.dayIndex, 'lunch')"
                        :key="meal.id"
                        class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-100"
                        @click="replaceDraft(day.dayIndex, 'lunch', meal.id)"
                      >
                        {{ meal.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="draftShowDinner"
              class="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2"
              :class="slotClass(day.dayIndex, 'dinner', !!day.dinner)"
              @click="onMoveTap(day.dayIndex, 'dinner')"
            >
              <span class="rounded-lg bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">Dinner</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-slate-900">{{ day.dinner?.mealName || 'No meal' }}</p>
                <div v-if="day.dinner?.mealTags?.length" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="tag in day.dinner.mealTags" :key="tag" class="pill px-2 py-0.5 text-[10px]">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <span v-if="day.dinner?.isRepeated" class="rounded-full bg-violet-200 px-2 py-0.5 text-[10px]">×{{ day.dinner.repeatCount }}</span>
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm"
                  @click.stop="store.regenerateDraftSlot(day.dayIndex, 'dinner', tagConstraints)"
                  title="Regenerate"
                >
                  <span class="material-icons">cached</span>
                </button>
                <div class="relative">
                  <button class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm" @click.stop="toggleReplaceDropdown(day.dayIndex, 'dinner')">
                    <span class="material-icons">swap_horiz</span>
                  </button>
                  <div
                    v-if="replaceDropdown[getReplaceKey(day.dayIndex, 'dinner')]"
                    class="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
                    data-replace-dropdown
                    @click.stop
                  >
                    <input
                      v-model="replaceSearch[getReplaceKey(day.dayIndex, 'dinner')]"
                      class="input"
                      placeholder="Search meals"
                    />
                    <div class="mt-2 max-h-40 overflow-y-auto space-y-1">
                      <button
                        v-for="meal in replaceOptions(day.dayIndex, 'dinner')"
                        :key="meal.id"
                        class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-100"
                        @click="replaceDraft(day.dayIndex, 'dinner', meal.id)"
                      >
                        {{ meal.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="btn-primary w-full" @click="store.commitDraftToCurrent">
        Set as current menu
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMealStore } from '../stores/mealStore'
const store = useMealStore()

const lunchCount = ref(0)
const dinnerCount = ref(7)
const mealPrepLunch = ref(false)
const mealPrepDinner = ref(true)
const lunchUnique = ref(1)
const dinnerUnique = ref(5)
const queueSearchLunch = ref('')
const queueSearchDinner = ref('')
const constraintCountLunch = ref(1)
const constraintCountDinner = ref(1)
const tagConstraints = ref([])
const selectedConstraintTagsLunch = ref([])
const selectedConstraintTagsDinner = ref([])
const pinnedMeals = ref([])
const pinnedOpen = ref(false)
const presetName = ref('')
const presetIncludePinned = ref(true)
const presetIncludeQueue = ref(true)
const deleteMode = ref(false)
const configOpen = ref(false)
const lunchDropdownRef = ref(null)
const dinnerDropdownRef = ref(null)
const replaceDropdown = ref({})
const replaceSearch = ref({})
const moveMode = ref(false)
const moveSource = ref(null)
const queueDropdown = ref({ lunch: false, dinner: false })
const configInitialized = ref(false)

const applyConfig = (config) => {
  if (!config) return
  lunchCount.value = config.lunchCount ?? 0
  dinnerCount.value = config.dinnerCount ?? 7
  lunchUnique.value = config.lunchUnique ?? Math.max(1, lunchCount.value || 1)
  dinnerUnique.value = config.dinnerUnique ?? Math.max(1, dinnerCount.value || 1)
  mealPrepLunch.value = config.mealPrepLunch ?? false
  mealPrepDinner.value = config.mealPrepDinner ?? true
  constraintCountLunch.value = config.constraintCountLunch ?? 1
  constraintCountDinner.value = config.constraintCountDinner ?? 1
  tagConstraints.value = config.tagConstraints ? [...config.tagConstraints] : []
  selectedConstraintTagsLunch.value = config.selectedConstraintTagsLunch
    ? [...config.selectedConstraintTagsLunch]
    : []
  selectedConstraintTagsDinner.value = config.selectedConstraintTagsDinner
    ? [...config.selectedConstraintTagsDinner]
    : []
  pinnedMeals.value = config.pinnedMeals ? [...config.pinnedMeals] : []
  presetIncludePinned.value = config.presetIncludePinned ?? true
  presetIncludeQueue.value = config.presetIncludeQueue ?? true
  configOpen.value = config.configOpen ?? false
}

const captureConfig = () => ({
  lunchCount: lunchCount.value,
  dinnerCount: dinnerCount.value,
  lunchUnique: lunchUnique.value,
  dinnerUnique: dinnerUnique.value,
  mealPrepLunch: mealPrepLunch.value,
  mealPrepDinner: mealPrepDinner.value,
  constraintCountLunch: constraintCountLunch.value,
  constraintCountDinner: constraintCountDinner.value,
  tagConstraints: [...tagConstraints.value],
  selectedConstraintTagsLunch: [...selectedConstraintTagsLunch.value],
  selectedConstraintTagsDinner: [...selectedConstraintTagsDinner.value],
  pinnedMeals: [...pinnedMeals.value],
  presetIncludePinned: presetIncludePinned.value,
  presetIncludeQueue: presetIncludeQueue.value,
  configOpen: configOpen.value
})

const mealTypeOptions = computed(() => {
  const types = []
  if (lunchCount.value > 0) types.push('lunch')
  if (dinnerCount.value > 0) types.push('dinner')
  return types
})

const totalSlots = computed(() => lunchCount.value + dinnerCount.value)

const totalDays = computed(() => Math.max(lunchCount.value, dinnerCount.value, 1))

const queueTooLongLunch = computed(
  () => lunchCount.value > 0 && store.generationQueue.lunch.length > lunchCount.value
)
const queueTooLongDinner = computed(
  () => dinnerCount.value > 0 && store.generationQueue.dinner.length > dinnerCount.value
)

const draftShowLunch = computed(() => (store.draftMenu?.lunchCount ?? lunchCount.value) > 0)
const draftShowDinner = computed(() => (store.draftMenu?.dinnerCount ?? dinnerCount.value) > 0)
const draftShowBoth = computed(() => draftShowLunch.value && draftShowDinner.value)

const mealTypeLabel = (type) => (type === 'lunch' ? 'Lunch' : 'Dinner')

const getPinned = (dayIndex, mealType) => {
  const pin = pinnedMeals.value.find((p) => p.dayIndex === dayIndex && p.mealType === mealType)
  return pin ? pin.mealId : ''
}

const setPinned = (dayIndex, mealType, mealId) => {
  const existing = pinnedMeals.value.find((p) => p.dayIndex === dayIndex && p.mealType === mealType)
  if (!mealId) {
    if (existing) pinnedMeals.value = pinnedMeals.value.filter((p) => p !== existing)
    return
  }
  if (existing) {
    existing.mealId = mealId
  } else {
    pinnedMeals.value.push({ dayIndex, mealType, mealId })
  }
}

const isSlotEnabled = (dayIndex, mealType) => {
  if (mealType === 'lunch') return dayIndex < lunchCount.value
  if (mealType === 'dinner') return dayIndex < dinnerCount.value
  return false
}

const lunchQueueMeals = computed(() => store.queuedMeals('lunch'))
const dinnerQueueMeals = computed(() => store.queuedMeals('dinner'))

const queueOptionsLunch = computed(() => {
  const query = queueSearchLunch.value.trim().toLowerCase()
  const base = store.meals.filter((meal) => !store.generationQueue.lunch.includes(meal.id))
  if (!query) return base.slice(0, 8)
  return base.filter((meal) => meal.name.toLowerCase().includes(query)).slice(0, 12)
})

const queueOptionsDinner = computed(() => {
  const query = queueSearchDinner.value.trim().toLowerCase()
  const base = store.meals.filter((meal) => !store.generationQueue.dinner.includes(meal.id))
  if (!query) return base.slice(0, 8)
  return base.filter((meal) => meal.name.toLowerCase().includes(query)).slice(0, 12)
})

const addToQueue = (mealId, mealType) => {
  if (!mealId) return
  store.addToQueue(mealId, mealType)
}

const toggleQueueDropdown = (mealType) => {
  queueDropdown.value[mealType] = !queueDropdown.value[mealType]
}

const clearAllQueues = () => {
  store.clearQueue()
}

const onPresetClick = (preset) => {
  if (deleteMode.value) return
  applyPreset(preset)
}

const toggleConstraintTag = (tag, mealType) => {
  const target = mealType === 'lunch' ? selectedConstraintTagsLunch : selectedConstraintTagsDinner
  if (target.value.includes(tag)) {
    target.value = target.value.filter((t) => t !== tag)
  } else {
    target.value.push(tag)
  }
}

const addConstraint = (mealType) => {
  const target = mealType === 'lunch' ? selectedConstraintTagsLunch : selectedConstraintTagsDinner
  const count = mealType === 'lunch' ? constraintCountLunch : constraintCountDinner
  if (!target.value.length || !count.value) return
  tagConstraints.value.push({
    mealType,
    tags: [...target.value],
    count: count.value
  })
  target.value = []
  count.value = 1
}

const generate = async () => {
  if (totalSlots.value === 0) return
  await store.generateMenu({
    lunchCount: lunchCount.value,
    dinnerCount: dinnerCount.value,
    mealPrepMode: mealPrepLunch.value || mealPrepDinner.value,
    mealPrepLunch: mealPrepLunch.value,
    mealPrepDinner: mealPrepDinner.value,
    lunchUnique: mealPrepLunch.value ? lunchUnique.value : lunchCount.value,
    dinnerUnique: mealPrepDinner.value ? dinnerUnique.value : dinnerCount.value,
    tagConstraints: tagConstraints.value,
    pinnedMeals: presetIncludePinned.value ? pinnedMeals.value : [],
    queueMeals: store.generationQueue
  })
}

const replaceDraft = (dayIndex, mealType, mealId) => {
  if (!mealId) return
  const meal = store.meals.find((item) => item.id === mealId)
  if (!meal) return
  store.updateDraftSlot(dayIndex, mealType, meal)
}

const getReplaceKey = (dayIndex, mealType) => `${dayIndex}:${mealType}`

const toggleReplaceDropdown = (dayIndex, mealType) => {
  const key = getReplaceKey(dayIndex, mealType)
  replaceDropdown.value = { ...replaceDropdown.value, [key]: !replaceDropdown.value[key] }
}

const replaceOptions = (dayIndex, mealType) => {
  const key = getReplaceKey(dayIndex, mealType)
  const query = (replaceSearch.value[key] || '').trim().toLowerCase()
  if (!query) return store.meals.slice(0, 8)
  return store.meals.filter((meal) => meal.name.toLowerCase().includes(query)).slice(0, 12)
}

const toggleMoveMode = () => {
  moveMode.value = !moveMode.value
  moveSource.value = null
}

const onMoveTap = (dayIndex, mealType) => {
  if (!moveMode.value || !store.draftMenu) return
  const slot = store.draftMenu.days[dayIndex][mealType]
  if (!moveSource.value) {
    if (!slot) return
    moveSource.value = { dayIndex, mealType }
    return
  }
  const source = moveSource.value
  if (source.dayIndex === dayIndex && source.mealType === mealType) {
    moveSource.value = null
    return
  }
  store.swapDraftSlots(source, { dayIndex, mealType })
  moveSource.value = null
}

const slotClass = (dayIndex, mealType, hasMeal) => {
  const isSelected =
    moveMode.value &&
    moveSource.value &&
    moveSource.value.dayIndex === dayIndex &&
    moveSource.value.mealType === mealType
  return isSelected ? 'ring-2 ring-violet-400' : ''
}

const savePreset = async () => {
  if (!presetName.value.trim()) return
  await store.addPreset({
    name: presetName.value.trim(),
    lunchCount: lunchCount.value,
    dinnerCount: dinnerCount.value,
    mealPrepLunch: mealPrepLunch.value,
    mealPrepDinner: mealPrepDinner.value,
    lunchUnique: mealPrepLunch.value ? lunchUnique.value : lunchCount.value,
    dinnerUnique: mealPrepDinner.value ? dinnerUnique.value : dinnerCount.value,
    includePinned: presetIncludePinned.value,
    includeQueue: presetIncludeQueue.value,
    tagConstraints: tagConstraints.value,
    pinnedMeals: presetIncludePinned.value ? pinnedMeals.value : [],
    queueMeals: presetIncludeQueue.value ? store.generationQueue : { lunch: [], dinner: [] }
  })
  presetName.value = ''
}

const applyPreset = (preset) => {
  lunchCount.value = preset.lunchCount ?? 0
  dinnerCount.value = preset.dinnerCount ?? preset.numDays ?? 7
  mealPrepLunch.value = preset.mealPrepLunch ?? false
  mealPrepDinner.value = preset.mealPrepDinner ?? true
  lunchUnique.value = preset.lunchUnique ?? Math.max(1, lunchCount.value || 1)
  dinnerUnique.value = preset.dinnerUnique ?? Math.max(1, dinnerCount.value || 1)
  presetIncludePinned.value = preset.includePinned ?? true
  presetIncludeQueue.value = preset.includeQueue ?? true
  tagConstraints.value = preset.tagConstraints || []
  pinnedMeals.value = preset.includePinned === false ? [] : preset.pinnedMeals || []
  if (preset.includeQueue === false) {
    store.generationQueue = { lunch: [], dinner: [] }
  } else if (preset.queueMeals) {
    if (Array.isArray(preset.queueMeals)) {
      store.generationQueue = {
        lunch: [],
        dinner: [...preset.queueMeals]
      }
    } else {
      store.generationQueue = {
        lunch: [...(preset.queueMeals.lunch || [])],
        dinner: [...(preset.queueMeals.dinner || [])]
      }
    }
  }
  generate()
}

watch([lunchCount, dinnerCount], () => {
  if (lunchUnique.value > lunchCount.value && lunchCount.value > 0) lunchUnique.value = lunchCount.value
  if (dinnerUnique.value > dinnerCount.value && dinnerCount.value > 0) dinnerUnique.value = dinnerCount.value
})

watch(
  () => store.defaults,
  (defaults) => {
    if (!defaults) return
    if (configInitialized.value || store.generationConfig) return
    applyConfig(defaults)
    configInitialized.value = true
  },
  { immediate: true, deep: true }
)

const handleClickOutside = (event) => {
  const lunchEl = lunchDropdownRef.value
  const dinnerEl = dinnerDropdownRef.value
  if (lunchEl && lunchEl.contains(event.target)) return
  if (dinnerEl && dinnerEl.contains(event.target)) return
  if (event.target.closest('[data-replace-dropdown]')) return
  queueDropdown.value.lunch = false
  queueDropdown.value.dinner = false
  replaceDropdown.value = {}
}

onMounted(() => {
  if (store.generationConfig) {
    applyConfig(store.generationConfig)
    configInitialized.value = true
  }
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  store.generationConfig = captureConfig()
})

watch(
  [
    lunchCount,
    dinnerCount,
    lunchUnique,
    dinnerUnique,
    mealPrepLunch,
    mealPrepDinner,
    constraintCountLunch,
    constraintCountDinner,
    tagConstraints,
    selectedConstraintTagsLunch,
    selectedConstraintTagsDinner,
    pinnedMeals,
    presetIncludePinned,
    presetIncludeQueue,
    configOpen
  ],
  () => {
    store.generationConfig = captureConfig()
  },
  { deep: true }
)
</script>

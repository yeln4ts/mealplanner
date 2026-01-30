<template>
  <section class="space-y-4">
    <div class="card p-4">
      <h2 class="text-base font-semibold text-slate-900">Add a meal</h2>
      <div class="mt-3 grid gap-2">
        <input v-model="singleName" class="input" placeholder="Meal name" @keydown.enter.prevent="handleAddSingle" />
        <input v-model="singleTags" class="input" placeholder="Tags (comma separated)" @keydown.enter.prevent="handleAddSingle" />
        <button class="btn-primary" @click="handleAddSingle">Add meal</button>
      </div>
      <button class="mt-4 text-sm font-medium text-violet-600" @click="bulkOpen = !bulkOpen">
        {{ bulkOpen ? 'Hide bulk add' : 'Bulk add meals' }}
      </button>
      <div v-if="bulkOpen" class="mt-3 space-y-2">
        <textarea v-model="bulkText" rows="5" class="input" placeholder="Meal Name | tag1, tag2"></textarea>
        <button class="btn-secondary" @click="handleBulkAdd">Add all</button>
      </div>
    </div>

    <div class="card p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-900">Meals</h2>
        <button class="btn-secondary" @click="toggleSelection">
          {{ selectionMode ? 'Done' : 'Select' }}
        </button>
      </div>
      <input v-model="searchQuery" class="input" placeholder="Search meals" />

      <div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in visibleTags"
            :key="tag"
            class="pill"
            :class="selectedTags.includes(tag) ? 'bg-violet-200 text-violet-900' : ''"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <button v-if="allTags.length > 10" class="text-xs text-slate-500" @click="tagsExpanded = !tagsExpanded">
            {{ tagsExpanded ? 'Show less' : `Show all ${allTags.length} tags` }}
          </button>
          <button v-if="selectedTags.length" class="text-xs text-violet-600" @click="selectedTags = []">Clear</button>
        </div>
      </div>

      <div v-if="selectionMode" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-secondary" @click="selectAll">Select all</button>
          <button class="btn-secondary" @click="clearSelection">Deselect all</button>
        </div>
        <div class="mt-3 space-y-2">
          <input v-model="bulkTagInput" class="input" placeholder="Add tag to selected" />
          <button class="btn-secondary" @click="applyBulkTags">Add tag</button>
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in commonTags" :key="tag" class="pill">
              {{ tag }}
              <button class="text-red-500" @click="removeBulkTag(tag)">×</button>
            </span>
          </div>
        </div>
        <div class="mt-3">
          <button class="btn-danger" :disabled="!selectedIds.length" @click="confirmBulkDelete = true">
            Delete {{ selectedIds.length }} meals
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="meal in filteredMeals"
          :key="meal.id"
          class="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
          @click="handleRowClick(meal)"
        >
          <div class="flex items-start gap-3 sm:items-center">
            <input
              v-if="selectionMode"
              type="checkbox"
              :checked="selectedIds.includes(meal.id)"
              @change.stop="toggleSelected(meal.id)"
            />
            <div v-if="editingId !== meal.id" class="min-w-0">
              <p class="truncate font-medium text-slate-900">{{ meal.name }}</p>
              <div class="mt-1 flex flex-wrap gap-1">
                <span v-if="!meal.tags.length" class="text-xs text-slate-400">No tags</span>
                <span v-for="tag in meal.tags" :key="tag" class="pill px-2 py-0.5 text-[10px]">
                  {{ tag }}
                </span>
              </div>
            </div>
            <div v-else class="space-y-2">
              <input v-model="editName" class="input" @keydown.enter.prevent="saveEdit" />
              <div class="flex flex-wrap gap-2">
                <span v-for="tag in editTags" :key="tag" class="pill">
                  {{ tag }}
                  <button class="text-violet-800" @click.stop="removeEditTag(tag)">×</button>
                </span>
                <span v-if="!editTags.length" class="text-xs text-slate-400">No tags yet</span>
              </div>
              <div class="relative tag-picker">
                <div class="flex flex-wrap items-center gap-2">
                  <input
                    v-model="editTagInput"
                    class="input flex-1"
                    placeholder="Add tag"
                    @focus="tagPickerOpen = true"
                    @keydown.enter.prevent="addEditTag"
                  />
                  <button class="btn-secondary" @click.stop="addEditTag">Add tag</button>
                </div>
                <div
                  v-if="tagPickerOpen"
                  class="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <div class="max-h-40 overflow-y-auto">
                    <button
                      v-for="tag in filteredEditTags"
                      :key="tag"
                      class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-100"
                      @click.stop="selectEditTag(tag)"
                    >
                      {{ tag }}
                    </button>
                    <p v-if="!filteredEditTags.length" class="px-2 py-1 text-xs text-slate-500">No matches</p>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary" @click.stop="cancelEdit">Cancel</button>
                <button class="btn-primary" @click.stop="saveEdit">Save</button>
              </div>
            </div>
          </div>
          <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:ml-auto">
            <button
              class="px-3 py-1 text-xs rounded-xl"
              :class="store.isInQueue(meal.id, 'lunch') ? 'bg-emerald-500 text-white' : 'btn-secondary'"
              @click.stop="toggleQueue(meal.id, 'lunch')"
            >
              {{ store.isInQueue(meal.id, 'lunch') ? '✓ Lunch' : '+ Lunch' }}
            </button>
            <button
              class="px-3 py-1 text-xs rounded-xl"
              :class="store.isInQueue(meal.id, 'dinner') ? 'bg-emerald-500 text-white' : 'btn-secondary'"
              @click.stop="toggleQueue(meal.id, 'dinner')"
            >
              {{ store.isInQueue(meal.id, 'dinner') ? '✓ Dinner' : '+ Dinner' }}
            </button>
            <div class="flex-1"></div>
            <button class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50" @click.stop="deleteMeal(meal.id)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <DuplicateReviewModal
      :open="duplicateModalOpen"
      :items="duplicateItems"
      @close="closeDuplicateModal"
      @skip="skipDuplicate"
      @accept="acceptDuplicate"
    />

    <ConfirmModal
      :open="confirmBulkDelete"
      title="Delete meals"
      message="This will permanently remove selected meals."
      @cancel="confirmBulkDelete = false"
      @confirm="performBulkDelete"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMealStore } from '../stores/mealStore'
import { findSimilarMeals } from '../composables/useFuzzyMatch'
import DuplicateReviewModal from '../components/modals/DuplicateReviewModal.vue'
import ConfirmModal from '../components/modals/ConfirmModal.vue'

const store = useMealStore()

const singleName = ref('')
const singleTags = ref('')
const bulkOpen = ref(false)
const bulkText = ref('')
const searchQuery = ref('')
const selectedTags = ref([])
const tagsExpanded = ref(false)
const selectionMode = ref(false)
const selectedIds = ref([])
const bulkTagInput = ref('')
const editingId = ref(null)
const editName = ref('')
const editTags = ref([])
const editTagInput = ref('')
const tagPickerOpen = ref(false)
const confirmBulkDelete = ref(false)

const duplicateModalOpen = ref(false)
const duplicateItems = ref([])

const allTags = computed(() => store.allTags)
const visibleTags = computed(() => (tagsExpanded.value ? allTags.value : allTags.value.slice(0, 10)))

const filteredMeals = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return store.meals.filter((meal) => {
    const matchesQuery = !query || meal.name.toLowerCase().includes(query)
    const matchesTags = selectedTags.value.every((tag) => meal.tags.includes(tag))
    return matchesQuery && matchesTags
  })
})

const commonTags = computed(() => {
  if (!selectedIds.value.length) return []
  const selectedMeals = store.meals.filter((meal) => selectedIds.value.includes(meal.id))
  return selectedMeals
    .map((meal) => new Set(meal.tags))
    .reduce((acc, set) => {
      if (!acc) return new Set(set)
      return new Set([...acc].filter((tag) => set.has(tag)))
    }, null) || []
})

const normalizeTags = (tags) =>
  tags
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)

const buildDuplicateItem = (name, tags, similarMeals) => ({
  tempId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name,
  tags,
  similarMeals,
  reasonSummary: similarMeals.map((item) => item.reason).join(', ')
})

const enqueueDuplicate = (name, tags, similarMeals) => {
  duplicateItems.value.push(buildDuplicateItem(name, tags, similarMeals))
  duplicateModalOpen.value = true
}

const handleAddSingle = async () => {
  if (!singleName.value.trim()) return
  const name = singleName.value.trim()
  const tags = normalizeTags(singleTags.value)
  const similarMeals = findSimilarMeals(name, store.meals)
  if (similarMeals.length) {
    enqueueDuplicate(name, tags, similarMeals)
  } else {
    await store.addMeal(name, tags)
  }
  singleName.value = ''
  singleTags.value = ''
}

const handleBulkAdd = async () => {
  const lines = bulkText.value.split('\n').map((line) => line.trim()).filter(Boolean)
  for (const line of lines) {
    const [namePart, tagPart] = line.split('|')
    const name = namePart?.trim()
    if (!name) continue
    const tags = tagPart ? normalizeTags(tagPart) : []
    const similarMeals = findSimilarMeals(name, store.meals)
    if (similarMeals.length) {
      enqueueDuplicate(name, tags, similarMeals)
    } else {
      await store.addMeal(name, tags)
    }
  }
  bulkText.value = ''
}

const closeDuplicateModal = () => {
  duplicateModalOpen.value = false
}

const acceptDuplicate = async (tempId) => {
  const item = duplicateItems.value.find((dup) => dup.tempId === tempId)
  if (!item) return
  await store.addMeal(item.name, item.tags)
  duplicateItems.value = duplicateItems.value.filter((dup) => dup.tempId !== tempId)
  if (!duplicateItems.value.length) duplicateModalOpen.value = false
}

const skipDuplicate = (tempId) => {
  duplicateItems.value = duplicateItems.value.filter((dup) => dup.tempId !== tempId)
  if (!duplicateItems.value.length) duplicateModalOpen.value = false
}

const toggleTag = (tag) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value.push(tag)
  }
}

const toggleSelection = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) selectedIds.value = []
}

const handleRowClick = (meal) => {
  if (selectionMode.value) {
    toggleSelected(meal.id)
    return
  }
  if (editingId.value === meal.id) return
  editingId.value = meal.id
  editName.value = meal.name
  editTags.value = [...meal.tags]
  editTagInput.value = ''
}

const toggleSelected = (mealId) => {
  if (selectedIds.value.includes(mealId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== mealId)
  } else {
    selectedIds.value.push(mealId)
  }
}

const selectAll = () => {
  selectedIds.value = filteredMeals.value.map((meal) => meal.id)
}

const clearSelection = () => {
  selectedIds.value = []
}

const applyBulkTags = async () => {
  const tag = bulkTagInput.value.trim().toLowerCase()
  if (!tag) return
  const selectedMeals = store.meals.filter((meal) => selectedIds.value.includes(meal.id))
  for (const meal of selectedMeals) {
    if (!meal.tags.includes(tag)) {
      meal.tags.push(tag)
      await store.updateMeal(meal)
    }
  }
  bulkTagInput.value = ''
}

const removeBulkTag = async (tag) => {
  const selectedMeals = store.meals.filter((meal) => selectedIds.value.includes(meal.id))
  for (const meal of selectedMeals) {
    meal.tags = meal.tags.filter((t) => t !== tag)
    await store.updateMeal(meal)
  }
}

const performBulkDelete = async () => {
  for (const id of selectedIds.value) {
    await store.deleteMeal(id)
  }
  selectedIds.value = []
  confirmBulkDelete.value = false
}

const saveEdit = async () => {
  const meal = store.meals.find((item) => item.id === editingId.value)
  if (!meal) return
  meal.name = editName.value.trim() || meal.name
  meal.tags = [...new Set(editTags.value.map((tag) => tag.toLowerCase().trim()).filter(Boolean))]
  await store.updateMeal(meal)
  tagPickerOpen.value = false
  cancelEdit()
}

const cancelEdit = () => {
  editingId.value = null
  editName.value = ''
  editTags.value = []
  editTagInput.value = ''
  tagPickerOpen.value = false
}

const addEditTag = () => {
  const tag = editTagInput.value.trim().toLowerCase()
  if (!tag) return
  if (!editTags.value.includes(tag)) {
    editTags.value.push(tag)
  }
  editTagInput.value = ''
}

const removeEditTag = (tag) => {
  editTags.value = editTags.value.filter((t) => t !== tag)
}

const filteredEditTags = computed(() => {
  const query = editTagInput.value.trim().toLowerCase()
  const base = store.allTags.filter((tag) => !editTags.value.includes(tag))
  if (!query) return base.slice(0, 8)
  return base.filter((tag) => tag.includes(query)).slice(0, 10)
})

const selectEditTag = (tag) => {
  if (!editTags.value.includes(tag)) {
    editTags.value.push(tag)
  }
  editTagInput.value = ''
}

const handleTagPickerClick = (event) => {
  const within = event.target.closest?.('.tag-picker')
  if (within) return
  tagPickerOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleTagPickerClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleTagPickerClick, true)
})

const deleteMeal = async (mealId) => {
  await store.deleteMeal(mealId)
}

const toggleQueue = (mealId, mealType) => {
  store.toggleInQueue(mealId, mealType)
}

onMounted(() => {
  if (store.loading) store.loadData()
})
</script>

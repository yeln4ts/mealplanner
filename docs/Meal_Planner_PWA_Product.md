# Meal Planner PWA - Product Requirements Document

## Overview

A mobile-first Progressive Web App for household meal planning. Allows users to manage a meal database, generate diverse weekly menus with constraints for both lunch and dinner, and sync data between multiple users via PocketBase backend.

**Target Users:** Couples/roommates sharing meal planning responsibilities  
**Platform:** Mobile-first PWA (works on desktop)  
**Tech Stack:** Vue 3 + Composition API, Tailwind CSS, PocketBase backend

---

## Core Features

### 1. Meal Management

#### 1.1 Add Single Meal
- Text input for meal name
- Text input for tags (comma-separated)
- Tags auto-lowercase and trim whitespace
- Press Enter or click button to add

#### 1.2 Bulk Add Meals
- Collapsible textarea for adding multiple meals
- Format: `Meal Name | tag1, tag2, tag3` (one per line)
- Tags are optional (just `Meal Name` works)
- "Add All" button processes all lines

#### 1.3 Edit Meal (Inline)
- Click on meal to enter edit mode
- Edit name and tags inline
- Edit tags should allow to add new or select existing one using a chip select
- Save with Enter or Save button
- Cancel with Escape or Cancel button

#### 1.4 Delete Meal
- Trash icon on each meal row
- Single click deletes (no confirmation for single)

#### 1.5 Fuzzy Duplicate Detection
On any add operation (single, bulk, import):
- Check for exact matches (case-insensitive, accent-normalized)
- Check if new name contains existing or vice versa
- Calculate Levenshtein distance similarity (threshold: 70%)
- Show review modal for potential duplicates
- User can skip individual duplicates or add anyway

### 2. Search & Filter

#### 2.1 Search
- Real-time text search by meal name
- Case-insensitive

#### 2.2 Tag Filtering
- Display all unique tags as pill buttons
- **AND logic**: selecting multiple tags shows meals with ALL of those tags
- Show first 10 tags collapsed, "Show all X tags" expands
- Clear button resets filter

#### 2.3 Add to Generation Queue
- Each meal row shows a "+" or "Add to menu" icon/button
- Clicking adds the meal to the **Generation Queue** (see Section 4.1)
- Visual feedback: brief toast/confirmation, icon changes to checkmark
- If meal already in queue: icon shows checkmark, clicking removes it
- Badge on Generate tab shows queue count (e.g., "Generate (3)")

### 3. Selection Mode & Bulk Operations

#### 3.1 Selection Mode Toggle
- "Select" button enables selection mode
- Checkboxes appear on each meal row
- Clicking meal row toggles selection (not edit)
- "Done" button exits mode and clears selection

#### 3.2 Bulk Tag Operations
- "Select all" / "Deselect all" button
- Select Text input with existing tags search to add tags to all selected meals. Allowed to add new tag if existing one not found
- Show common tags of selected meals as removable pills
- Click tag pill to remove that tag from all selected

#### 3.3 Bulk Delete
- "Delete X meals" button (red)
- Confirmation prompt before deletion

### 4. Menu Generation

#### 4.1 Configuration

**Basic Settings:**
- Number of days input (1-14, default 7)
- Meal types toggle:
  - "Dinner only" (default) — generates one meal per day
  - "Lunch & Dinner" — generates two meals per day (lunch and dinner)

**Generation Queue (Must-Include Meals):**
- List of meals that MUST be included in the generated menu
- Added from Meals view via "Add to menu" button (see Section 2.3)
- Displayed as removable pills showing meal name
- Click X on pill to remove from queue
- Can also add directly via searchable meal picker in this section
- Queue persists during session until manually cleared or menu is generated
- Queue is NOT persisted to storage (resets on page refresh)
- To save queue for future use: include in a preset (see Section 6)
- "Clear queue" button removes all
- If queue has more meals than available slots: warning shown, extras ignored

**Meal Prep Mode (Repeat Meals):**
- Toggle: "Meal prep mode" (default off)
- When enabled, show: "Unique meals" number input
  - Range: 1 to (numDays × mealTypesCount)
  - Example: 7 days dinner-only → max 7 unique meals
  - Example: 7 days lunch & dinner → max 14 unique meals
- Algorithm distributes unique meals across the week
- Visual indicator shows which meals repeat and on which days
- Queue meals count toward unique meals limit

**Tag Constraints:**
- "At least X meals with tag Y"
  - Multi select pills to select one or multiple tags
  - Number input for count (max = unique meals count if meal prep mode, else total slots)
  - Add button creates constraint pill
  - Click X on pill to remove constraint

**Pinned Meals (Specific Day/Slot Assignments):**
- "Pin meals to specific days" collapsible section
- For each day (and meal type if lunch & dinner enabled):
  - Dropdown/searchable select to pick an existing meal
  - "Any" option (default) = let algorithm choose
- Pinned meals count against unique meal limit in meal prep mode
- Pinned meals satisfy tag constraints
- Pinned meals are separate from queue (queue = "include somewhere", pinned = "include here specifically")

#### 4.2 Generation Algorithm
- **Priority order for slot filling:**
  1. Pinned meals (placed in their specified slots)
  2. Queue meals (placed in remaining slots, best fit based on scoring)
  3. Generated meals (fill remaining slots using diversity algorithm)
- Diversity scoring based on menu history:
  - Meals from recent menus get penalty (decreasing by week)
  - Meals in current menu get heavy penalty
  - Random factor (±20 points) prevents identical regenerations
- Constraint satisfaction:
  - Track tag counts as menu builds
  - Prioritize meals with needed tags when constraints unmet
  - Queue and pinned meals contribute to constraint satisfaction
- Meal prep mode:
  - Collect pinned + queue meals first as part of unique set
  - Select additional unique meals up to limit based on scoring
  - Distribute across days, balancing repetition evenly
- Standard mode: Avoid same meal twice in same menu (unless pinned or from queue duplicates)

#### 4.3 Generated Menu Display
- Grid/list showing days as rows
- If lunch & dinner: two columns (Lunch | Dinner) per day row
- Show meal name and tags for each slot
- Visual badge for repeated meals (e.g., "×3" indicator)
- Per-slot regenerate button (refresh icon)
- Full menu regenerate button
- "Save" button commits to current menu (not history)
- Constraint status indicators (green=met, red=unmet)

### 5. Current Menu (Editable)

The current menu is the active working menu, separate from history. It supports full editing capabilities.

#### 5.1 Current Menu Section
- Displayed prominently in History view (or own tab)
- Header: "Current Menu" with date created/modified
- Visual distinction from historical menus (highlighted card, different background)

#### 5.2 Drag & Drop Reordering
- Each meal slot is draggable
- Drag a meal to another day/slot to swap positions
- Visual feedback during drag (ghost element, drop zone highlight)
- Works within same meal type (lunch↔lunch, dinner↔dinner)
- Optional: Allow cross-type swapping (lunch↔dinner) with confirmation

#### 5.3 Replace Meal
Each meal slot has a dropdown menu (⋮ or tap-hold) with options:
- **Regenerate** — Pick a new random meal respecting constraints
- **Replace with existing** — Opens meal picker modal:
  - Search/filter existing meals
  - Tag filter available
  - Click meal to select and replace
- **Replace with new** — Opens inline form:
  - Add new meal (name + tags)
  - Meal is added to database AND placed in slot
- **Clear slot** — Remove meal from slot (empty)

#### 5.4 Meal Slot States
- **Filled** — Shows meal name and tags
- **Empty** — Shows "No meal" with "+" button to add
- **Repeated** — Visual indicator showing repetition count

#### 5.5 Save to History
- "Archive Menu" button moves current menu to history
- Clears current menu slot for new generation
- Confirmation prompt if current menu has unsaved changes

### 6. Presets (Quick Generate)

#### 6.1 Save Preset
- "Save as Preset" button after configuring generation settings
- Text input for preset name
- Stores:
  - name
  - numDays
  - mealTypes ('dinner' | 'lunch_dinner')
  - mealPrepMode (boolean)
  - uniqueMeals (number, if meal prep mode)
  - tagConstraints array
  - pinnedMeals array (day/mealType/mealId mappings)
  - queueMeals array (optional, meal IDs to pre-populate queue)

#### 6.2 Preset Options
- When saving preset, checkboxes for:
  - "Include pinned meal assignments"
  - "Include queued meals"
- If meal no longer exists when using preset: show warning, skip that meal

#### 6.3 Use Preset
- Quick Generate section shows all presets
- Preset pill shows: name + icons for meal type, meal prep mode, queue count
- Click preset → loads settings and optionally populates queue, then generates
- Long-press or edit button → view/edit preset details before generating
- Remove button to enter delete mode for preset by adding a x to the pills

### 7. Menu History

#### 7.1 History List
- Store last 8 archived menus
- Display in reverse chronological order
- Show date and relative time ("Most recent", "2 weeks ago")
- Grid layout showing all days/meals (with lunch/dinner columns if applicable)
- History items are **read-only** (no editing)

#### 7.2 History Actions
- "View" — Expand to see full menu details
- "Reuse" — Copy menu to current menu for editing
- "Delete" — Remove from history (with confirmation)

### 8. Data Management

#### 8.1 Full Backup Export
- JSON format with version number
- Includes: meals, menuHistory, currentMenu, presets
- Modal with:
  - "Download" button (file download)
  - "Copy" button (clipboard)
  - Textarea showing content

#### 8.2 Full Backup Import
- Modal with:
  - File upload button
  - Paste textarea
- **Replaces** all existing data (with confirmation)
- Imports meals, presets, menuHistory, currentMenu

#### 8.3 Bulk Text Export
- Simple text format: `Meal Name | tag1, tag2`
- Compatible with bulk add feature

#### 8.4 Statistics
- Total meals count
- Total tags count
- Saved menus count
- Current menu status (active/empty)
- Presets count

---

## Technical Requirements

### Storage Architecture

Dual-mode storage abstraction:

```javascript
// Interface
{
  name: 'local' | 'pocketbase',
  loadAll(): Promise<{ meals, menuHistory, currentMenu, presets }>,
  saveAll(data): Promise<void>, // local only
  addMeal(meal): Promise<meal>,
  updateMeal(meal): Promise<void>,
  deleteMeal(id): Promise<void>,
  addPreset(preset): Promise<preset>,
  updatePreset(preset): Promise<void>,
  deletePreset(id): Promise<void>,
  saveCurrentMenu(menu): Promise<menu>,
  updateCurrentMenu(menu): Promise<void>,
  clearCurrentMenu(): Promise<void>,
  archiveCurrentMenu(): Promise<void>, // moves to history
  saveMenuToHistory(menu): Promise<void>
}
```

#### Local Storage Mode
- Use browser localStorage or IndexedDB
- Single key storing all data as JSON
- Auto-save on any state change

#### PocketBase Mode
- REST API calls to PocketBase instance
- Collections: meals, menu_history, current_menu, presets
- Toggle via config constant: `POCKETBASE_URL`

### PocketBase Collections Schema

#### `meals`
| Field | Type |
|-------|------|
| name | text (required) |
| tags | json (array of strings) |

#### `menu_history`
| Field | Type |
|-------|------|
| mealTypes | text ('dinner' | 'lunch_dinner') |
| days | json (array of {dayIndex, lunch?, dinner?, mealId, mealName}) |
| created | datetime |

#### `current_menu`
| Field | Type |
|-------|------|
| mealTypes | text ('dinner' | 'lunch_dinner') |
| days | json (see menu slot structure below) |
| created | datetime |
| modified | datetime |

**Menu Slot Structure:**
```javascript
// For dinner-only mode
{
  dayIndex: 0,          // 0-13
  dinner: {
    mealId: 'abc123',   // or null if empty
    mealName: 'Pasta',
    isRepeated: false,  // true if meal appears multiple times
    repeatCount: 1      // total occurrences in menu
  }
}

// For lunch & dinner mode
{
  dayIndex: 0,
  lunch: { mealId, mealName, isRepeated, repeatCount },
  dinner: { mealId, mealName, isRepeated, repeatCount }
}
```

#### `presets`
| Field | Type |
|-------|------|
| name | text (required) |
| numDays | number |
| mealTypes | text ('dinner' | 'lunch_dinner') |
| mealPrepMode | boolean |
| uniqueMeals | number (nullable) |
| tagConstraints | json (array of {tags: string[], count: number}) |
| pinnedMeals | json (array of {dayIndex, mealType, mealId}) |
| queueMeals | json (array of mealIds) |

### Fuzzy Matching Algorithm

```javascript
// Normalize: lowercase, trim, remove accents
normalize(str) → str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Levenshtein distance for similarity
levenshtein(a, b) → number

// Find similar meals
findSimilarMeals(name, existingMeals, threshold = 0.3) → [
  { meal, reason: 'exact' | 'contains' | 'similar', score: 0-1 }
]
```

### Drag & Drop Implementation

```javascript
// Using native HTML5 drag-drop or vue-draggable
// State tracking for drag operations
{
  isDragging: boolean,
  dragSource: { dayIndex, mealType },
  dragTarget: { dayIndex, mealType },
  draggedMeal: { mealId, mealName }
}

// On drop: swap meals between source and target slots
swapMealSlots(source, target) → void
```

---

## UI/UX Requirements

### Layout

- **Mobile-first** responsive design
- Max width container (max-w-2xl) centered
- Fixed header with app title and sync status
- Fixed bottom navigation (4 tabs)
- Main content area with bottom padding for nav

### Navigation

Bottom tab bar with 4 items:
1. **Meals** (List icon) - Meal management
2. **Generate** (Sparkles icon) - Menu generation
3. **Menu** (Calendar icon) - Current menu & History
4. **Data** (Settings icon) - Import/Export/Stats

### Current Menu & History View Layout

```
┌─────────────────────────────────┐
│ Current Menu                    │
│ ┌─────────────────────────────┐ │
│ │ [Highlighted Card]          │ │
│ │ Mon: Pasta 🔄               │ │
│ │ Tue: Chicken Stir-fry       │ │
│ │ Wed: Pasta 🔄               │ │
│ │ ...                         │ │
│ │ [Archive] [Edit Mode]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ Past Menus                      │
│ ┌─────────────────────────────┐ │
│ │ Jan 15 - Most recent        │ │
│ │ [Read-only grid]            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Jan 8 - 1 week ago          │ │
│ │ [Read-only grid]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Design System

- **Colors:**
  - Primary: Violet-600 to Indigo-600 gradient
  - Success: Emerald-500
  - Danger: Red-500
  - Background: Slate-50 to Violet-50 gradient
  - Current Menu Highlight: Violet-100 border, subtle glow

- **Components:**
  - Cards: white bg, rounded-2xl, shadow-sm, border-gray-100
  - Current Menu Card: violet-50 bg, violet-200 border, shadow-md
  - Buttons: rounded-xl, font-medium, active:scale-[0.98]
  - Inputs: bg-gray-50, rounded-xl, focus:ring-2 focus:ring-violet-500
  - Pills/Tags: rounded-full, text-sm
  - Modals: slide up from bottom on mobile, centered on desktop
  - Drag handles: grip icon, cursor-grab
  - Drop zones: dashed border highlight during drag

- **Typography:**
  - Headers: font-bold, gradient text for main title
  - Labels: text-sm font-medium text-gray-600
  - Body: text-gray-900
  - Secondary: text-gray-500

- **Meal Slot States:**
  - Filled: Normal card with meal name
  - Empty: Dashed border, "+" icon, muted text
  - Dragging: Opacity reduced, scale slightly up
  - Drop target: Violet border highlight
  - Repeated: Small badge "×N" in corner

### Mobile Considerations

- Touch targets minimum 44px
- Bottom sheet modals (rounded-t-3xl)
- Safe area insets for notched phones
- No horizontal overflow
- Inputs stack vertically on narrow screens
- Drag & drop: long-press to initiate on touch devices
- Swipe actions for meal slot options (optional enhancement)

---

## Vue 3 Architecture

### Project Structure

```
src/
├── App.vue
├── main.js
├── stores/
│   └── mealStore.js          # Pinia store
├── composables/
│   ├── useStorage.js         # Storage abstraction
│   ├── useFuzzyMatch.js      # Duplicate detection
│   ├── useMenuGenerator.js   # Generation algorithm
│   └── useDragDrop.js        # Drag & drop state management
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue
│   │   └── BottomNav.vue
│   ├── meals/
│   │   ├── MealList.vue
│   │   ├── MealItem.vue
│   │   ├── AddMealForm.vue
│   │   ├── BulkAddForm.vue
│   │   ├── TagFilter.vue
│   │   └── SelectionToolbar.vue
│   ├── generate/
│   │   ├── GenerateSettings.vue
│   │   ├── MealTypeToggle.vue
│   │   ├── MealPrepConfig.vue
│   │   ├── GenerationQueue.vue
│   │   ├── PinnedMealsConfig.vue
│   │   ├── PresetList.vue
│   │   ├── GeneratedMenu.vue
│   │   └── ConstraintInput.vue
│   ├── menu/
│   │   ├── CurrentMenuCard.vue
│   │   ├── MenuDayRow.vue
│   │   ├── MealSlot.vue
│   │   ├── MealSlotActions.vue
│   │   ├── MealPickerModal.vue
│   │   └── HistoryList.vue
│   ├── data/
│   │   └── DataManagement.vue
│   └── modals/
│       ├── ExportModal.vue
│       ├── ImportModal.vue
│       ├── DuplicateReviewModal.vue
│       └── ConfirmModal.vue
└── views/
    ├── MealsView.vue
    ├── GenerateView.vue
    ├── MenuView.vue          # Combined current menu + history
    └── DataView.vue
```

### State Management (Pinia)

```javascript
// stores/mealStore.js
export const useMealStore = defineStore('meals', {
  state: () => ({
    meals: [],
    menuHistory: [],
    currentMenu: null,    // { mealTypes, days, created, modified }
    presets: [],
    generationQueue: [],  // Array of meal IDs to include in next generation
    loading: true,
    // Drag & drop state
    dragState: {
      isDragging: false,
      source: null,
      target: null
    }
  }),
  
  getters: {
    allTags: (state) => [...new Set(state.meals.flatMap(m => m.tags))].sort(),
    hasCurrentMenu: (state) => state.currentMenu !== null,
    currentMenuMealCount: (state) => { /* count filled slots */ },
    queuedMeals: (state) => state.meals.filter(m => state.generationQueue.includes(m.id)),
    isInQueue: (state) => (mealId) => state.generationQueue.includes(mealId),
    // ... other computed properties
  },
  
  actions: {
    async loadData() {},
    async addMeal(name, tags) {},
    async updateMeal(meal) {},
    async deleteMeal(id) {},
    
    // Generation queue
    addToQueue(mealId) {},
    removeFromQueue(mealId) {},
    toggleInQueue(mealId) {},
    clearQueue() {},
    
    // Menu generation
    async generateMenu(config) {}, // config includes queue
    
    // Current menu operations
    async setCurrentMenu(menu) {},
    async updateMealSlot(dayIndex, mealType, meal) {},
    async swapMealSlots(source, target) {},
    async clearMealSlot(dayIndex, mealType) {},
    async regenerateSlot(dayIndex, mealType, constraints) {},
    async archiveCurrentMenu() {},
    async clearCurrentMenu() {},
    
    // History
    async reuseFromHistory(menuId) {},
    async deleteFromHistory(menuId) {},
    
    // Presets
    async addPreset(preset) {},
    async updatePreset(preset) {},
    async deletePreset(id) {},
    async applyPreset(presetId) {}, // loads settings + queue
    
    // Drag & drop
    startDrag(source, meal) {},
    updateDragTarget(target) {},
    endDrag() {},
    executeDrop() {}
  }
})
```

### Key Composables

```javascript
// composables/useStorage.js
export function useStorage() {
  const storage = POCKETBASE_URL 
    ? createPocketBaseStorage(POCKETBASE_URL)
    : createLocalStorage()
  return storage
}

// composables/useFuzzyMatch.js
export function useFuzzyMatch() {
  const normalize = (str) => { /* ... */ }
  const levenshtein = (a, b) => { /* ... */ }
  const findSimilarMeals = (name, meals) => { /* ... */ }
  return { findSimilarMeals }
}

// composables/useMenuGenerator.js
export function useMenuGenerator(meals, menuHistory) {
  const getMealScores = () => { /* ... */ }
  const selectMealForDay = (scores, used, existing, constraints) => { /* ... */ }
  
  // Updated to support all new config options
  const generateMenu = (config) => {
    // config: { numDays, mealTypes, mealPrepMode, uniqueMeals, tagConstraints, pinnedMeals, queueMeals }
    
    if (config.mealPrepMode) {
      return generateMealPrepMenu(config)
    } else {
      return generateDiverseMenu(config)
    }
  }
  
  const generateMealPrepMenu = (config) => {
    // 1. Place pinned meals in their specified slots
    // 2. Place queue meals in best available slots
    // 3. Select remaining unique meals up to uniqueMeals count
    // 4. Distribute across all remaining slots
  }
  
  const generateDiverseMenu = (config) => {
    // 1. Place pinned meals in their specified slots
    // 2. Place queue meals in best available slots (respecting constraints)
    // 3. Fill remaining with diversity algorithm
  }
  
  return { generateMenu }
}

// composables/useDragDrop.js
export function useDragDrop() {
  const dragState = reactive({
    isDragging: false,
    source: null,
    target: null,
    meal: null
  })
  
  const startDrag = (dayIndex, mealType, meal) => { /* ... */ }
  const onDragOver = (dayIndex, mealType) => { /* ... */ }
  const onDrop = () => { /* ... */ }
  const cancelDrag = () => { /* ... */ }
  
  return { dragState, startDrag, onDragOver, onDrop, cancelDrag }
}
```

---

## Configuration

```javascript
// config.js
export const POCKETBASE_URL = '' // Empty = local storage, or 'http://host:8090'
export const MAX_HISTORY_ITEMS = 8
export const SIMILARITY_THRESHOLD = 0.3
export const MAX_MENU_DAYS = 14
export const MEAL_TYPES = {
  DINNER_ONLY: 'dinner',
  LUNCH_DINNER: 'lunch_dinner'
}
```

---

## Acceptance Criteria

### Meal Management
- [ ] Can add single meal with name and tags
- [ ] Can bulk add multiple meals from text
- [ ] Can edit meal inline by clicking
- [ ] Can delete single meal
- [ ] Duplicate detection shows review modal
- [ ] Can skip or add duplicates from review

### Search & Filter
- [ ] Search filters meals in real-time
- [ ] Tag filter uses AND logic
- [ ] Tags collapse to 10 with expand option
- [ ] Clear button resets filters
- [ ] Can add meal to generation queue from meal list
- [ ] Queue indicator shows on meals already in queue
- [ ] Badge on Generate tab shows queue count

### Selection Mode
- [ ] Toggle enables/disables selection UI
- [ ] Can select/deselect all
- [ ] Can bulk add tags to selected
- [ ] Can bulk remove tags from selected
- [ ] Can bulk delete selected with confirmation

### Menu Generation
- [ ] Can configure days (1-14)
- [ ] Can toggle between dinner-only and lunch & dinner modes
- [ ] Lunch & dinner mode generates two meals per day
- [ ] Can enable meal prep mode
- [ ] Meal prep mode respects unique meals limit
- [ ] Meals repeat evenly in meal prep mode
- [ ] Can add/remove tag constraints
- [ ] Generation queue displays as removable pills
- [ ] Can add meals to queue directly in Generate view
- [ ] Can clear entire queue
- [ ] Warning shown if queue exceeds available slots
- [ ] Queue meals are included in generated menu
- [ ] Can pin specific meals to specific days/slots
- [ ] Pinned meals appear in generated menu
- [ ] Generated menu shows diversity (or intentional repetition)
- [ ] Can regenerate single slot
- [ ] Can regenerate full menu
- [ ] Can save menu to current menu
- [ ] Constraint status shows met/unmet

### Current Menu Editing
- [ ] Current menu displays prominently, separate from history
- [ ] Can drag and drop meals between slots
- [ ] Drag visual feedback works correctly
- [ ] Can replace meal with existing meal from picker
- [ ] Can replace meal with newly created meal
- [ ] Can regenerate single slot
- [ ] Can clear a slot
- [ ] Repeated meals show indicator badge
- [ ] Can archive current menu to history

### Presets
- [ ] Can save current config as preset
- [ ] Presets store meal type and meal prep settings
- [ ] Can include pinned meals in preset
- [ ] Can include queued meals in preset
- [ ] Can quick-generate from preset
- [ ] Preset loads queue when applied
- [ ] Can view/edit preset before generating
- [ ] Can delete preset
- [ ] Warning shown if pinned/queued meal no longer exists

### History
- [ ] Shows last 8 archived menus
- [ ] Displays dates and meals with correct layout (lunch/dinner columns)
- [ ] History items are read-only
- [ ] Can reuse menu from history (copies to current)
- [ ] Can delete menu from history

### Data Management
- [ ] Full export includes currentMenu
- [ ] Full import restores currentMenu
- [ ] Bulk text export works
- [ ] Stats display correctly including current menu status

### Storage
- [ ] Local storage mode persists data
- [ ] PocketBase mode syncs correctly
- [ ] Mode indicator shows in header

### Mobile UX
- [ ] Bottom nav always visible
- [ ] Modals slide up from bottom
- [ ] No horizontal scroll
- [ ] Touch targets adequate size
- [ ] Long-press initiates drag on touch devices
- [ ] Lunch/dinner grid displays correctly on narrow screens

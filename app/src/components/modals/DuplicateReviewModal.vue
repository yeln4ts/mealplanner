<template>
  <div v-if="open" class="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-4">
    <div class="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
      <h3 class="text-lg font-semibold text-slate-900">Potential duplicates</h3>
      <p class="text-sm text-slate-500">Review similar meals before adding.</p>
      <div class="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
        <div v-for="item in items" :key="item.tempId" class="rounded-xl border border-slate-200 p-3">
          <div class="flex items-start justify-between">
            <div>
              <p class="font-medium text-slate-900">{{ item.name }}</p>
              <p class="text-xs text-slate-500">Tags: {{ item.tags.join(', ') || 'None' }}</p>
            </div>
            <div class="text-xs text-slate-500">{{ item.reasonSummary }}</div>
          </div>
          <div class="mt-2 text-xs text-slate-500">
            Similar to: {{ item.similarMeals.map(m => m.name).join(', ') }}
          </div>
          <div class="mt-3 flex gap-2">
            <button class="btn-secondary" @click="$emit('skip', item.tempId)">Skip</button>
            <button class="btn-primary" @click="$emit('accept', item.tempId)">Add anyway</button>
          </div>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button class="btn-secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: Boolean,
  items: {
    type: Array,
    default: () => []
  }
})
</script>

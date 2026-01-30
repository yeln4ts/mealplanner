<template>
  <div v-if="open" class="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
    <div class="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <p class="mt-1 text-sm text-slate-500">{{ message }}</p>
      <div class="mt-4 flex justify-end gap-2">
        <button class="btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button class="btn-danger" @click="$emit('confirm')">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: {
    type: String,
    default: 'Confirm'
  },
  message: {
    type: String,
    default: 'Are you sure?'
  }
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100">
    <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-1">
      <div class="flex items-center gap-3">
        <img
          src="/mealplanner_logo.png"
          alt="Meal Planner logo"
          class="h-[52px] w-[52px] rounded"
          loading="eager"
          decoding="async"
        />
        <h1 class="text-lg font-bold text-slate-900">
          <span class="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Meal Planner
          </span>
        </h1>
      </div>
      <div class="flex items-center gap-1 text-xs text-slate-500">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-1"
          :class="isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
          :title="isOnline ? 'Connected' : 'Not connected'"
        >
          <span class="material-icons text-[14px]">
            {{ isOnline ? 'cloud_done' : 'cloud_off' }}
          </span>
          <span>{{ isOnline ? 'Connected' : 'Not connected' }}</span>
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isOnline = ref(true)

const updateOnlineStatus = () => {
  if (typeof navigator !== 'undefined') {
    isOnline.value = navigator.onLine
  }
}

onMounted(() => {
  updateOnlineStatus()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

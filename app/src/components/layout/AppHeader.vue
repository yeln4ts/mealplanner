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
      <div class="text-xs text-slate-500">
        <span class="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700" v-if="storageMode === 'local'">
          Local
        </span>
        <span class="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700" v-else>
          PocketBase
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { POCKETBASE_URL } from '../../config'

const storageMode = POCKETBASE_URL ? 'pocketbase' : 'local'
</script>

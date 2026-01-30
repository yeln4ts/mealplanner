<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 pb-24 pt-20">
    <AppHeader />
    <main class="mx-auto max-w-2xl px-4">
      <MealsView v-if="store.activeTab === 'meals'" />
      <GenerateView v-else-if="store.activeTab === 'generate'" />
      <MenuView v-else-if="store.activeTab === 'menu'" />
      <DataView v-else />
    </main>
    <BottomNav :active="store.activeTab" :items="navItems" @change="store.setActiveTab($event)" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMealStore } from './stores/mealStore'
import AppHeader from './components/layout/AppHeader.vue'
import BottomNav from './components/layout/BottomNav.vue'
import MealsView from './views/MealsView.vue'
import GenerateView from './views/GenerateView.vue'
import MenuView from './views/MenuView.vue'
import DataView from './views/DataView.vue'

const store = useMealStore()
const navItems = computed(() => {
  const queueCount = store.generationQueue.lunch.length + store.generationQueue.dinner.length
  return [
    { key: 'meals', label: 'Meals', icon: 'material-restaurant' },
    { key: 'generate', label: 'Generate', icon: 'material-auto_awesome', badge: queueCount || '' },
    { key: 'menu', label: 'Menu', icon: 'material-calendar_month' },
    { key: 'data', label: 'Data', icon: 'material-settings' }
  ]
})

onMounted(() => {
  if (store.loading) store.loadData()
})
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-100 bg-white">
    <div class="mx-auto flex max-w-2xl items-center justify-around px-3 py-2">
      <button
        v-for="item in items"
        :key="item.key"
        class="flex flex-col items-center gap-1 text-xs font-medium"
        :class="active === item.key ? 'text-violet-600' : 'text-slate-400'"
        @click="$emit('change', item.key)"
      >
        <span v-if="item.icon && item.icon.startsWith('material-')" class="material-icons text-lg">
          {{ item.icon.replace('material-', '') }}
        </span>
        <span v-else class="text-lg">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="-mt-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] text-white">
          {{ item.badge }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  active: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})
</script>

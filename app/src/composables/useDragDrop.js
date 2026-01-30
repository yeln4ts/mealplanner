import { reactive } from 'vue'

export function useDragDrop() {
  const dragState = reactive({
    isDragging: false,
    source: null,
    target: null,
    meal: null
  })

  const startDrag = (source, meal) => {
    dragState.isDragging = true
    dragState.source = source
    dragState.meal = meal
  }

  const updateTarget = (target) => {
    dragState.target = target
  }

  const resetDrag = () => {
    dragState.isDragging = false
    dragState.source = null
    dragState.target = null
    dragState.meal = null
  }

  return { dragState, startDrag, updateTarget, resetDrag }
}

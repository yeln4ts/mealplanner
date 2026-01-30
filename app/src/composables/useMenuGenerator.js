import { MEAL_TYPES } from '../config'

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function getMealPenalty(mealId, menuHistory) {
  if (!menuHistory.length) return 0
  let penalty = 0
  menuHistory.slice(0, 3).forEach((menu, index) => {
    const weight = [40, 20, 10][index] || 5
    const ids = menu.days
      .flatMap((day) => [day.lunch?.mealId, day.dinner?.mealId])
      .filter(Boolean)
    if (ids.includes(mealId)) penalty -= weight
  })
  return penalty
}

function scoreMeal(meal, menuHistory) {
  return randomBetween(0, 100) + getMealPenalty(meal.id, menuHistory)
}

function createSlots(lunchCount, dinnerCount) {
  const slots = []
  const totalDays = Math.max(lunchCount, dinnerCount)
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    if (dayIndex < lunchCount) slots.push({ dayIndex, mealType: 'lunch' })
    if (dayIndex < dinnerCount) slots.push({ dayIndex, mealType: 'dinner' })
  }
  return slots
}

function initDays(lunchCount, dinnerCount) {
  const totalDays = Math.max(lunchCount, dinnerCount)
  return Array.from({ length: totalDays }, (_, dayIndex) => ({
    dayIndex,
    ...(lunchCount > 0 ? { lunch: null } : {}),
    ...(dinnerCount > 0 ? { dinner: null } : {})
  }))
}

function placeMeal(days, slot, meal) {
  const payload = meal
    ? {
        mealId: meal.id,
        mealName: meal.name,
        mealTags: meal.tags || []
      }
    : null
  days[slot.dayIndex][slot.mealType] = payload
}

function countSlots(days) {
  return days.reduce((acc, day) => {
    if (day.lunch !== undefined) acc += 1
    if (day.dinner !== undefined) acc += 1
    return acc
  }, 0)
}

function markRepeats(days) {
  const counts = {}
  days.forEach((day) => {
    ['lunch', 'dinner'].forEach((type) => {
      const slot = day[type]
      if (slot?.mealId) {
        counts[slot.mealId] = (counts[slot.mealId] || 0) + 1
      }
    })
  })
  days.forEach((day) => {
    ['lunch', 'dinner'].forEach((type) => {
      const slot = day[type]
      if (slot?.mealId) {
        slot.isRepeated = counts[slot.mealId] > 1
        slot.repeatCount = counts[slot.mealId]
      }
    })
  })
}

function meetsConstraint(meal, constraint) {
  return constraint.tags.every((tag) => meal.tags?.includes(tag))
}

function constraintNeeds(constraint, days, mealType) {
  const count = days.reduce((total, day) => {
    return total + ['lunch', 'dinner'].filter((type) => {
      if (mealType && type !== mealType) return false
      const slot = day[type]
      if (!slot?.mealId) return false
      const tags = slot.mealTags || []
      return constraint.tags.every((tag) => tags.includes(tag))
    }).length
  }, 0)
  return Math.max(0, constraint.count - count)
}

function pickMealByScore(candidates, menuHistory) {
  if (!candidates.length) return null
  return candidates
    .map((meal) => ({ meal, score: scoreMeal(meal, menuHistory) }))
    .sort((a, b) => b.score - a.score)[0].meal
}

export function generateMenu({
  meals,
  menuHistory,
  config
}) {
  const lunchCount = Number(config.lunchCount || 0)
  const dinnerCount = Number(config.dinnerCount || 0)
  const totalSlots = lunchCount + dinnerCount
  const days = initDays(lunchCount, dinnerCount)
  const slots = createSlots(lunchCount, dinnerCount)
  const used = new Set()

  const pinnedMap = new Map()
  config.pinnedMeals.forEach((pin) => {
    if (pin.mealType === 'lunch' && pin.dayIndex >= lunchCount) return
    if (pin.mealType === 'dinner' && pin.dayIndex >= dinnerCount) return
    pinnedMap.set(`${pin.dayIndex}:${pin.mealType}`, pin.mealId)
  })

  slots.forEach((slot) => {
    const key = `${slot.dayIndex}:${slot.mealType}`
    const mealId = pinnedMap.get(key)
    if (mealId) {
      const meal = meals.find((m) => m.id === mealId)
      if (meal) {
        placeMeal(days, slot, meal)
        used.add(meal.id)
      }
    }
  })

  if (config.mealPrepMode) {
    const lunchUniqueLimit = Math.max(0, Number(config.lunchUnique ?? lunchCount))
    const dinnerUniqueLimit = Math.max(0, Number(config.dinnerUnique ?? dinnerCount))

    const buildUniquePool = (mealType, limit) => {
      const pool = []
      const ids = new Set()

      const pushUnique = (meal) => {
        if (!meal || ids.has(meal.id)) return
        ids.add(meal.id)
        pool.push(meal)
      }

      config.pinnedMeals
        .filter((pin) => pin.mealType === mealType)
        .forEach((pin) => pushUnique(meals.find((m) => m.id === pin.mealId)))

      const queueIds = Array.isArray(config.queueMeals)
        ? config.queueMeals
        : config.queueMeals?.[mealType] || []
      queueIds.forEach((id) => pushUnique(meals.find((m) => m.id === id)))

      const remaining = meals.filter((meal) => !ids.has(meal.id))
      while (pool.length < limit && remaining.length) {
        const candidate = pickMealByScore(remaining, menuHistory)
        if (!candidate) break
        pushUnique(candidate)
        const idx = remaining.findIndex((meal) => meal.id === candidate.id)
        remaining.splice(idx, 1)
      }
      return pool
    }

    const lunchPool = lunchCount ? buildUniquePool('lunch', lunchUniqueLimit) : []
    const dinnerPool = dinnerCount ? buildUniquePool('dinner', dinnerUniqueLimit) : []
    const cursors = { lunch: 0, dinner: 0 }

    slots.forEach((slot) => {
      const pool = slot.mealType === 'lunch' ? lunchPool : dinnerPool
      if (!pool.length) return
      const current = days[slot.dayIndex][slot.mealType]
      const meal = pool[cursors[slot.mealType] % pool.length]
      if (!current) {
        placeMeal(days, slot, meal)
      }
      cursors[slot.mealType] += 1
    })
  } else {
    const queueByType = {
      lunch: Array.isArray(config.queueMeals) ? config.queueMeals : [...(config.queueMeals?.lunch || [])],
      dinner: Array.isArray(config.queueMeals) ? config.queueMeals : [...(config.queueMeals?.dinner || [])]
    }
    slots.forEach((slot) => {
      if (days[slot.dayIndex][slot.mealType]) return
      const queue = queueByType[slot.mealType] || []
      const nextQueue = queue.find((id) => !used.has(id))
      if (nextQueue) {
        const meal = meals.find((m) => m.id === nextQueue)
        if (meal) {
          placeMeal(days, slot, meal)
          used.add(meal.id)
          queue.splice(queue.indexOf(nextQueue), 1)
          return
        }
      }

      let candidates = meals.filter((meal) => !used.has(meal.id))
      if (config.tagConstraints?.length) {
        const unmet = config.tagConstraints.find(
          (constraint) =>
            (!constraint.mealType || constraint.mealType === slot.mealType) &&
            constraintNeeds(constraint, days, slot.mealType) > 0
        )
        if (unmet) {
          const tagged = candidates.filter((meal) => meetsConstraint(meal, unmet))
          if (tagged.length) candidates = tagged
        }
      }

      const meal = pickMealByScore(candidates, menuHistory)
      if (meal) {
        placeMeal(days, slot, meal)
        used.add(meal.id)
      }
    })
  }

  markRepeats(days)

  let mealTypes = MEAL_TYPES.DINNER_ONLY
  if (lunchCount > 0 && dinnerCount > 0) {
    mealTypes = MEAL_TYPES.LUNCH_DINNER
  } else if (lunchCount > 0 && dinnerCount === 0) {
    mealTypes = MEAL_TYPES.LUNCH_DINNER
  }

  return {
    mealTypes,
    lunchCount,
    dinnerCount,
    totalSlots,
    days,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  }
}

export function regenerateSlot({
  meals,
  menuHistory,
  menu,
  dayIndex,
  mealType,
  constraints
}) {
  const used = new Set()
  menu.days.forEach((day) => {
    ['lunch', 'dinner'].forEach((type) => {
      if (day[type]?.mealId) used.add(day[type].mealId)
    })
  })

  let candidates = meals.filter((meal) => !used.has(meal.id))
  if (!candidates.length) {
    candidates = meals
  }

  if (constraints?.length) {
    const unmet = constraints.find(
      (constraint) =>
        (!constraint.mealType || constraint.mealType === mealType) &&
        constraintNeeds(constraint, menu.days, mealType) > 0
    )
    if (unmet) {
      const tagged = candidates.filter((meal) => meetsConstraint(meal, unmet))
      if (tagged.length) candidates = tagged
    }
  }

  const meal = pickMealByScore(candidates, menuHistory)
  if (!meal) return null

  const nextMenu = JSON.parse(JSON.stringify(menu))
  nextMenu.days[dayIndex][mealType] = {
    mealId: meal.id,
    mealName: meal.name,
    mealTags: meal.tags || []
  }
  markRepeats(nextMenu.days)
  nextMenu.modified = new Date().toISOString()
  return nextMenu
}

import { SIMILARITY_THRESHOLD } from '../config'

export function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => [])
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

export function similarityScore(a, b) {
  if (!a.length && !b.length) return 1
  const distance = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return 1 - distance / maxLen
}

export function findSimilarMeals(name, existingMeals, threshold = SIMILARITY_THRESHOLD) {
  const normalized = normalizeString(name)
  return existingMeals
    .map((meal) => {
      const candidate = normalizeString(meal.name)
      if (candidate === normalized) {
        return { meal, reason: 'exact', score: 1 }
      }
      if (candidate.includes(normalized) || normalized.includes(candidate)) {
        return { meal, reason: 'contains', score: 0.8 }
      }
      const score = similarityScore(normalized, candidate)
      if (score >= 1 - threshold) {
        return { meal, reason: 'similar', score }
      }
      return null
    })
    .filter(Boolean)
}

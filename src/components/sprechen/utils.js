import { CHARACTER_LIST } from './data/characters'
import { findThemeById, THEME_INDEX } from './data/themes'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function average(values = []) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function formatDuration(valueInSeconds = 0) {
  const minutes = Math.floor(valueInSeconds / 60)
  const seconds = Math.floor(valueInSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function normalizeLevel(level) {
  if (!level) return null
  const normalized = String(level).toUpperCase()
  return ['A1', 'A2', 'B1', 'B2'].includes(normalized) ? normalized : null
}

export function resolveTheme(themeId) {
  return findThemeById(themeId)
}

export function getCharacterOptionsForTheme(themeId) {
  return CHARACTER_LIST.filter((character) => character.suitableFor.includes(themeId))
}

export function pickDefaultCharacter(themeId) {
  return getCharacterOptionsForTheme(themeId)[0] || CHARACTER_LIST[0]
}

export function extractVocabularyCandidates(text, vocabularyHints = [], seenWords = []) {
  const seen = new Set(seenWords.map((word) => word.toLowerCase()))
  const hintSet = new Set(vocabularyHints.map((hint) => hint.toLowerCase()))

  return text
    .split(/[\s,.!?;:()]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length > 4 || hintSet.has(word.toLowerCase()))
    .filter((word) => /^[A-Za-zÄÖÜäöüß-]+$/.test(word))
    .filter((word) => !seen.has(word.toLowerCase()))
    .slice(0, 3)
}

export function computeConfidenceScore({
  responseTimeMs = 0,
  hesitationCount = 0,
  wordCount = 0,
}) {
  let score = 52

  if (responseTimeMs < 3000) score += 20
  else if (responseTimeMs < 6000) score += 10
  else score -= 10

  if (hesitationCount === 0) score += 15
  else if (hesitationCount > 2) score -= 15

  score += Math.min(wordCount * 2, 12)

  return clamp(Math.round(score), 8, 100)
}

export function buildRescuePhrase(theme, level) {
  const templates = {
    cafe_a1: 'Ich mochte einen Kaffee, bitte. Wie viel kostet das?',
    presentation_a1: 'Ich heisse Alex. Ich komme aus Antananarivo. Und du?',
    transport_a1: 'Entschuldigung, wie komme ich zum Brandenburger Tor?',
    restaurant_a2: 'Entschuldigung, ich habe eine vegetarische Pizza bestellt.',
    shopping_a2: 'Haben Sie diesen Pullover in Grosse L? Ich mochte ihn anprobieren.',
    entretien_b1: 'Meine Starken sind Zuverlassigkeit und Teamarbeit. Ich habe schon Erfahrung gesammelt.',
    opinion_b1: 'Ich bin der Meinung, dass es nicht so einfach ist. Einerseits stimmt das, andererseits gibt es Vorteile.',
    apartment_b2: 'Konnen Sie bitte klaren, ob die Nebenkosten im Preis enthalten sind und ab wann die Wohnung verfugbar ist?',
  }

  return (
    templates[theme?.id] ||
    (level === 'A1'
      ? `${theme?.vocabularyHints?.[0] || 'Entschuldigung'}, ich brauche Hilfe.`
      : 'Ich mochte genauer antworten, aber ich brauche einen Moment.')
  )
}

export function simplifyPrompt(aiMessage, theme) {
  if (!aiMessage) {
    return `Reponds avec une phrase simple en utilisant ${theme?.vocabularyHints?.slice(0, 2).join(' et ') || 'les mots du theme'}.`
  }

  if (theme?.id === 'opinion_b1') {
    return 'Version simple: donne ton avis, puis ajoute un argument concret.'
  }

  if (theme?.id === 'entretien_b1') {
    return 'Version simple: cite une competence, puis explique ou tu l as utilisee.'
  }

  return `Version simple: reponds en une phrase courte a "${aiMessage}".`
}

export function safeJSONParse(value, fallback = null) {
  if (!value || typeof value !== 'string') return fallback

  try {
    return JSON.parse(value)
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) return fallback
    try {
      return JSON.parse(match[0])
    } catch {
      return fallback
    }
  }
}

export function getSessionHeadline(theme, character) {
  return `${theme.label} avec ${character.name}`
}

export function scoreLabel(score = 0) {
  if (score >= 85) return 'Fort'
  if (score >= 70) return 'Solide'
  if (score >= 50) return 'Fragile'
  return 'A retravailler'
}

export function summarizeSession({ theme, character, level, transcript, feedback, scores, hintsUsed }) {
  return {
    id: `${Date.now()}`,
    d: new Date().toISOString().split('T')[0],
    t: theme.id,
    themeLabel: theme.label,
    characterId: character.id,
    characterName: character.name,
    l: level,
    s: feedback.globalScore,
    x: feedback.xpEarned,
    hintsUsed,
    turns: transcript.slice(-14).map((turn) => ({
      r: turn.role,
      m: turn.content,
      c: turn.correction?.status || null,
    })),
    scores,
  }
}

export function getPreviousSessionScores(sessionHistory = []) {
  const previous = sessionHistory.at(-2)
  return previous?.scores || null
}

export function getLevelProgress(globalXP = 0) {
  const checkpoints = [
    { label: 'A1', min: 0, max: 199 },
    { label: 'A2', min: 200, max: 499 },
    { label: 'B1', min: 500, max: 999 },
    { label: 'B2', min: 1000, max: 1400 },
  ]

  const current = checkpoints.find((item) => globalXP >= item.min && globalXP <= item.max) || checkpoints.at(-1)
  const span = Math.max(current.max - current.min, 1)
  const within = clamp(globalXP - current.min, 0, span)

  return {
    currentLevel: current.label,
    percentage: Math.round((within / span) * 100),
    currentXP: globalXP,
    nextLabel: checkpoints[checkpoints.indexOf(current) + 1]?.label || current.label,
  }
}

export function listAllThemes() {
  return THEME_INDEX
}

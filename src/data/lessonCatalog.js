const RAW_LESSON_MODULES = import.meta.glob('./lecon/**/*.{json,txt}', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const KEYWORD_STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'oder', 'mit', 'von', 'des', 'dem', 'den', 'ein', 'eine', 'einer', 'einem',
  'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'ist', 'sind', 'war', 'were', 'sein', 'haben', 'nicht', 'noch',
  'pour', 'avec', 'dans', 'sans', 'plus', 'tres', 'tout', 'toute', 'toutes', 'quelque', 'comme', 'cela',
  'cette', 'cet', 'ces', 'des', 'les', 'une', 'un', 'est', 'sont', 'sur', 'par', 'que', 'qui', 'quoi',
  'your', 'vous', 'nous', 'ils', 'elles', 'their', 'from', 'into', 'vers', 'chez', 'oder', 'mais',
])

function uniqueStrings(values) {
  const seen = new Set()
  const output = []
  for (const item of Array.isArray(values) ? values : []) {
    const value = String(item || '').trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function scalarToText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function compactObject(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => {
      if (value == null) return false
      if (value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    })
  )
}

function pickFirstText(source, keys) {
  for (const key of keys) {
    const value = scalarToText(source?.[key])
    if (value) return value
  }
  return ''
}

function numericSuffix(value, fallback = 0) {
  const match = String(value || '').match(/(\d+)(?!.*\d)/)
  if (!match) return fallback
  return parseInt(match[1], 10)
}

function buildObjectSummary(value) {
  if (typeof value === 'string') return value.trim()
  if (!value || typeof value !== 'object') return ''

  const preferredPairs = [
    ['structure', 'sens'],
    ['Structure', 'Sens'],
    ['mot', 'usage'],
    ['mot', 'sens'],
    ['mot', 'traduction'],
    ['mot', 'explication'],
    ['type', 'phrase'],
    ['type', 'exemple'],
    ['temps', 'usage'],
    ['Verbe', 'Exemple'],
    ['usage', 'exemple'],
    ['usage', 'explication'],
    ['expression', 'usage'],
    ['exemple', 'explication'],
  ]

  for (const [leftKey, rightKey] of preferredPairs) {
    const left = scalarToText(value[leftKey])
    const right = scalarToText(value[rightKey])
    if (left && right) return `${left}: ${right}`
  }

  const parts = Object.values(value)
    .map((item) => scalarToText(item))
    .filter(Boolean)
    .slice(0, 4)
  return parts.join(' - ')
}

function normalizeGrammarSection(section, index) {
  if (!section || typeof section !== 'object') return null

  const bullets = uniqueStrings([
    ...toArray(section.liste).map(buildObjectSummary),
    ...toArray(section.tableau).map(buildObjectSummary),
    ...toArray(section.points).map(buildObjectSummary),
    ...toArray(section.exemples).map(buildObjectSummary),
    ...toArray(section.formes).map(buildObjectSummary),
  ])

  return compactObject({
    id: `${index + 1}`,
    title: pickFirstText(section, ['titre', 'title']) || `Point ${index + 1}`,
    body: pickFirstText(section, ['explication', 'note', 'contraction', 'regle']),
    bullets,
  })
}

function normalizeVocabularyItem(item, index) {
  if (!item || typeof item !== 'object') return null
  const de = pickFirstText(item, ['de', 'mot', 'expression'])
  const fr = pickFirstText(item, ['fr', 'traduction', 'sens'])
  if (!de && !fr) return null

  return compactObject({
    id: `${index + 1}`,
    de: de || fr,
    fr: fr || de,
    type: pickFirstText(item, ['type']),
    note: pickFirstText(item, ['usage', 'note', 'pluriel', 'frequence', 'antonyme', 'info']),
    phonetique: pickFirstText(item, ['phonetique']),
  })
}

function normalizeInfoCard(item, index, fallbackTitle = 'Repere') {
  if (typeof item === 'string') {
    return { id: `${index + 1}`, title: `${fallbackTitle} ${index + 1}`, body: item }
  }
  if (!item || typeof item !== 'object') return null

  return compactObject({
    id: `${index + 1}`,
    title: pickFirstText(item, ['titre', 'title', 'sujet', 'type']) || `${fallbackTitle} ${index + 1}`,
    body: pickFirstText(item, ['explication', 'astuce', 'phrase', 'description', 'sens', 'example', 'note']),
  })
}

function pickDialogueEntries(source) {
  if (Array.isArray(source?.dialogue)) return source.dialogue
  if (Array.isArray(source?.dialogue_modele)) return source.dialogue_modele
  if (Array.isArray(source?.dialogue_audio)) return source.dialogue_audio
  if (Array.isArray(source?.presentation_model)) return source.presentation_model
  return []
}

function normalizePhrase(entry, index) {
  if (!entry || typeof entry !== 'object') return null
  const de = pickFirstText(entry, ['de', 'allemand', 'texte'])
  const fr = pickFirstText(entry, ['fr', 'traduction'])
  if (!de && !fr) return null

  const notes = uniqueStrings(
    toArray(entry.analyse_mot_par_mot).map((item) => {
      if (!item || typeof item !== 'object') return ''
      const head = pickFirstText(item, ['mot', 'lemme', 'expression']) || 'Repere'
      const body = pickFirstText(item, ['traduction_directe', 'traduction', 'usage', 'regle', 'explication', 'note'])
      return body ? `${head}: ${body}` : head
    })
  )

  return compactObject({
    id: String(entry.id || index + 1),
    alemana: de || fr,
    traductionDe: de || fr,
    frantsay: fr || de,
    audio: de || fr,
    audioUrl: pickFirstText(entry, ['audio']),
    phonetique: pickFirstText(entry, ['phonetique']),
    registre: pickFirstText(entry, ['registre']),
    intonation: pickFirstText(entry, ['intonation']),
    notes: notes.slice(0, 5),
  })
}

function cleanAcceptedAnswer(answer) {
  return String(answer || '')
    .replace(/\((?:ou|oder)\s*:\s*[^)]+\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitAnswerVariants(answer) {
  const text = String(answer || '').trim()
  if (!text) return []

  const variants = [text]
  const cleaned = cleanAcceptedAnswer(text)
  if (cleaned && cleaned !== text) variants.push(cleaned)

  const slashParts = text
    .split(/\s*\/\s*/)
    .map((item) => cleanAcceptedAnswer(item))
    .filter(Boolean)
  variants.push(...slashParts)

  const parentheticalAlt = text.match(/\((?:ou|oder)\s*:\s*([^)]+)\)/i)
  if (parentheticalAlt?.[1]) variants.push(cleanAcceptedAnswer(parentheticalAlt[1]))

  return uniqueStrings(variants)
}

function tokenizeForKeywords(text) {
  return uniqueStrings(
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !KEYWORD_STOPWORDS.has(token))
  )
}

function buildKeywords(exercise, acceptedAnswers, modelAnswer) {
  const keywords = [
    ...acceptedAnswers.flatMap((value) => tokenizeForKeywords(value)),
    ...toArray(exercise?.criteres_evaluation).flatMap((value) => tokenizeForKeywords(value)),
    ...toArray(exercise?.expressions_bonus).flatMap((value) => tokenizeForKeywords(value)),
    ...tokenizeForKeywords(modelAnswer),
  ]

  return uniqueStrings(keywords).slice(0, 10)
}

function difficultyToScore(value) {
  const difficulty = Math.max(1, Math.min(5, Number(value) || 2))
  return Math.round(15 + difficulty * 17)
}

function quotedSentence(text) {
  const match = String(text || '').match(/['"]([^'"]*(?:_{3,}|…)[^'"]*)['"]/)
  return match?.[1] || ''
}

function normalizeBlankPrompt(question) {
  const text = quotedSentence(question) || String(question || '')
  const blankMatch = text.match(/^(.*?)(_{3,}|…)(.*)$/)
  if (!blankMatch) return null

  const before = blankMatch[1]
    .replace(/^.*?:\s*/, '')
    .replace(/^.*?compl[eé]tez\s*:\s*/i, '')
    .trim()
  const after = blankMatch[3].trim()

  if (!before && !after) return null
  return {
    avant: before,
    apres: after,
    phraseDe: text.trim(),
  }
}

function normalizeOpenExercise(exercise, lessonId, index) {
  const acceptedAnswers = uniqueStrings([
    ...splitAnswerVariants(exercise.reponse_attendue),
    ...toArray(exercise.reponses_acceptees).flatMap(splitAnswerVariants),
  ])

  const modelAnswer = acceptedAnswers[0]
    || uniqueStrings(toArray(exercise.modele_reponse)).join(' ')
    || ''

  const sourceType = String(exercise.type || 'reponse_libre')
  const longFormTypes = new Set(['situation', 'oral_simulation', 'argumentation'])
  const forceKeywords = longFormTypes.has(sourceType) && acceptedAnswers.length <= 1
  const keywords = buildKeywords(exercise, acceptedAnswers, modelAnswer)
  const fillPrompt = normalizeBlankPrompt(exercise.question)

  if (fillPrompt && acceptedAnswers[0] && acceptedAnswers[0].split(/\s+/).length <= 4) {
    return compactObject({
      id: String(exercise.id || `${lessonId}-fill-${index + 1}`),
      type: 'fill',
      avant: fillPrompt.avant,
      apres: fillPrompt.apres,
      phraseDe: fillPrompt.phraseDe,
      reponse: acceptedAnswers[0],
      indice: pickFirstText(exercise, ['explication']),
      explication: pickFirstText(exercise, ['explication']),
      conceptTag: `${lessonId}_${sourceType}`,
      skill: 'ECRIRE',
      difficulty: difficultyToScore(exercise.difficulte),
      targetMs: 35000,
    })
  }

  return compactObject({
    id: String(exercise.id || `${lessonId}-open-${index + 1}`),
    type: 'open',
    sourceType,
    questionFr: pickFirstText(exercise, ['question']),
    questionDe: pickFirstText(exercise, ['question']),
    reponse: acceptedAnswers[0] || modelAnswer,
    accepte: acceptedAnswers,
    modelAnswerFr: modelAnswer || null,
    explication: pickFirstText(exercise, ['explication']),
    criteria: uniqueStrings(toArray(exercise.criteres_evaluation)),
    bonusExpressions: uniqueStrings(toArray(exercise.expressions_bonus)),
    textarea: forceKeywords || modelAnswer.length > 100,
    evaluationMode: forceKeywords ? 'keywords' : 'exact',
    keywords,
    keywordThreshold: forceKeywords ? 0.6 : null,
    conceptTag: `${lessonId}_${sourceType}`,
    skill: sourceType === 'oral_simulation' ? 'PARLER' : 'ECRIRE',
    difficulty: difficultyToScore(exercise.difficulte),
    targetMs: forceKeywords ? 90000 : 45000,
  })
}

function normalizeExercise(exercise, lessonId, index) {
  const sourceType = String(exercise?.type || '').toLowerCase()

  if (sourceType === 'choix_multiple' || sourceType === 'expression' || sourceType === 'ponctuation') {
    return compactObject({
      id: String(exercise.id || `${lessonId}-qcm-${index + 1}`),
      type: 'qcm',
      questionFr: pickFirstText(exercise, ['question']),
      questionDe: pickFirstText(exercise, ['question']),
      options: toArray(exercise.options).map((option) => ({ de: scalarToText(option), fr: scalarToText(option) })),
      reponse: Number(exercise.reponse_correcte) || 0,
      explication: pickFirstText(exercise, ['explication']),
      conceptTag: `${lessonId}_${sourceType}`,
      skill: 'LIRE',
      difficulty: difficultyToScore(exercise.difficulte),
      targetMs: 35000,
    })
  }

  if (sourceType === 'traduction') {
    const acceptedAnswers = uniqueStrings([
      ...splitAnswerVariants(exercise.reponse_attendue),
      ...toArray(exercise.reponses_acceptees).flatMap(splitAnswerVariants),
    ])

    return compactObject({
      id: String(exercise.id || `${lessonId}-translation-${index + 1}`),
      type: 'traduction',
      sourceFr: pickFirstText(exercise, ['question']),
      sourceDe: pickFirstText(exercise, ['question']),
      reponse: acceptedAnswers[0] || '',
      accepte: acceptedAnswers,
      explication: pickFirstText(exercise, ['explication']),
      conceptTag: `${lessonId}_${sourceType}`,
      skill: 'ECRIRE',
      difficulty: difficultyToScore(exercise.difficulte),
      targetMs: 45000,
    })
  }

  if (sourceType === 'vrai_faux') {
    return compactObject({
      id: String(exercise.id || `${lessonId}-vf-${index + 1}`),
      type: 'qcm',
      questionFr: pickFirstText(exercise, ['question']),
      questionDe: pickFirstText(exercise, ['question']),
      options: [
        { de: 'Richtig', fr: 'Vrai' },
        { de: 'Falsch', fr: 'Faux' },
      ],
      reponse: exercise.reponse ? 0 : 1,
      explication: pickFirstText(exercise, ['explication']),
      conceptTag: `${lessonId}_${sourceType}`,
      skill: 'LIRE',
      difficulty: difficultyToScore(exercise.difficulte),
      targetMs: 25000,
    })
  }

  if (sourceType === 'association') {
    return compactObject({
      id: String(exercise.id || `${lessonId}-match-${index + 1}`),
      type: 'match',
      promptFr: pickFirstText(exercise, ['question']),
      promptDe: pickFirstText(exercise, ['question']),
      pairs: toArray(exercise.paires)
        .map((pair) => ({
          de: pickFirstText(pair, ['gauche']),
          fr: pickFirstText(pair, ['droite']),
        }))
        .filter((pair) => pair.de && pair.fr),
      explication: pickFirstText(exercise, ['explication']),
      conceptTag: `${lessonId}_${sourceType}`,
      skill: 'LIRE',
      difficulty: difficultyToScore(exercise.difficulte),
      targetMs: 50000,
    })
  }

  if (sourceType === 'reconstruction') {
    const words = uniqueStrings(toArray(exercise.mots))
    const answer = uniqueStrings(toArray(exercise.solution)).join(' ') || words.join(' ')
    return compactObject({
      id: String(exercise.id || `${lessonId}-build-${index + 1}`),
      type: 'build',
      promptFr: pickFirstText(exercise, ['question']),
      promptDe: pickFirstText(exercise, ['question']),
      words,
      answer,
      explication: pickFirstText(exercise, ['explication']),
      conceptTag: `${lessonId}_${sourceType}`,
      skill: 'ECRIRE',
      difficulty: difficultyToScore(exercise.difficulte),
      targetMs: 60000,
    })
  }

  return normalizeOpenExercise(exercise, lessonId, index)
}

function normalizeLearningGoals(source) {
  const objectifs = source?.objectifs || {}
  return uniqueStrings([
    objectifs.communicatif ? `Objectif communicatif: ${objectifs.communicatif}` : '',
    objectifs.linguistique ? `Point linguistique: ${objectifs.linguistique}` : '',
    objectifs.culturel ? `Repere culturel: ${objectifs.culturel}` : '',
    objectifs.cognitif ? `Competence cognitive: ${objectifs.cognitif}` : '',
  ]).map((body, index) => ({
    id: `${index + 1}`,
    title: body.split(':')[0],
    body: body.slice(body.indexOf(':') + 1).trim(),
  }))
}

function normalizeCulture(source) {
  if (!source?.culture) return []
  if (typeof source.culture === 'string') {
    return [{ id: '1', title: 'Culture', body: source.culture }]
  }

  if (Array.isArray(source.culture)) {
    return source.culture.map((item, index) => normalizeInfoCard(item, index, 'Culture')).filter(Boolean)
  }

  return [
    compactObject({
      id: '1',
      title: pickFirstText(source.culture, ['titre']) || 'Culture',
      body: pickFirstText(source.culture, ['explication', 'description', 'astuce']),
    }),
  ].filter((item) => item.title || item.body)
}

function pickIntroDescription(source) {
  return pickFirstText(source, ['description'])
    || pickFirstText(source?.objectifs, ['communicatif'])
    || pickFirstText(source?.situation, ['contexte'])
    || 'Contenu pedagogique charge depuis la bibliotheque locale.'
}

function normalizeLesson(source, niveau, index) {
  const lessonId = String(source?.id || `${niveau.toLowerCase()}-${String(index + 1).padStart(3, '0')}`).toLowerCase()
  const numero = numericSuffix(source?.id || '', index + 1)
  const phrases = pickDialogueEntries(source).map(normalizePhrase).filter(Boolean)
  const exercises = toArray(source?.exercices).map((exercise, exIndex) => normalizeExercise(exercise, lessonId, exIndex)).filter(Boolean)
  const grammarSections = toArray(source?.grammaire).map(normalizeGrammarSection).filter(Boolean)
  const vocabulary = [
    ...toArray(source?.vocabulaire_complet),
    ...toArray(source?.vocabulaire_cles),
    ...toArray(source?.vocabulaire_professionnel),
  ].map(normalizeVocabularyItem).filter(Boolean)
  const cultureNotes = normalizeCulture(source)
  const comprehensionChecks = toArray(source?.comprehension).map((item, itemIndex) => normalizeInfoCard(item, itemIndex, 'Comprehension')).filter(Boolean)
  const tipCards = toArray(source?.astuces_pedagogiques).map((item, itemIndex) => normalizeInfoCard(item, itemIndex, 'Astuce')).filter(Boolean)
  const learningGoals = normalizeLearningGoals(source)
  const situation = source?.situation || {}
  const metadata = source?.metadonnees || {}
  const progression = source?.progression || {}
  const description = pickIntroDescription(source)

  return compactObject({
    id: lessonId,
    numero,
    niveau,
    module: pickFirstText(source, ['module']),
    titre: pickFirstText(source, ['titre']) || `Lecon ${numero}`,
    description,
    duree: Number(metadata?.duree_estimee_minutes) || 0,
    phrasesCount: phrases.length,
    exercicesCount: exercises.length,
    wordsCount: vocabulary.length,
    phrases,
    exercices: exercises,
    objectives: compactObject({
      communicatif: pickFirstText(source?.objectifs, ['communicatif']),
      linguistique: pickFirstText(source?.objectifs, ['linguistique']),
      culturel: pickFirstText(source?.objectifs, ['culturel']),
      cognitif: pickFirstText(source?.objectifs, ['cognitif']),
    }),
    intro: compactObject({
      module: pickFirstText(source, ['module']),
      prerequis: uniqueStrings(toArray(metadata?.prerequis)),
      competences: uniqueStrings(toArray(metadata?.competences_visees)),
      themes: uniqueStrings(toArray(metadata?.themes_croises)),
      difficulte: Number(metadata?.difficulte_cognitive) || null,
      contexte: pickFirstText(situation, ['contexte']),
      lieu: pickFirstText(situation, ['lieu']),
      type: pickFirstText(situation, ['type']),
      registre: pickFirstText(situation, ['registre']),
    }),
    progression: compactObject({
      xp: Number(progression?.xp) || 0,
      badges: uniqueStrings(toArray(progression?.badges_deblocables)),
      nextLessonId: pickFirstText(progression, ['niveau_suivant']).toLowerCase(),
      nextPreview: pickFirstText(progression, ['apercu_suivant']),
    }),
    learningGoals,
    prerequisites: uniqueStrings(toArray(metadata?.prerequis)),
    skills: uniqueStrings(toArray(metadata?.competences_visees)),
    crossThemes: uniqueStrings(toArray(metadata?.themes_croises)),
    grammarSections,
    vocabulary,
    cultureNotes,
    comprehensionChecks,
    tipCards,
    registerLabel: pickFirstText(situation, ['registre']),
    situationLabel: pickFirstText(situation, ['type']),
  })
}

function buildLessons() {
  const rawEntries = Object.entries(RAW_LESSON_MODULES)
    .map(([filePath, raw]) => {
      const levelMatch = filePath.match(/\/lecon\/([^/]+)\//i)
      const fileName = filePath.split('/').pop() || ''
      const level = (levelMatch?.[1] || '').toUpperCase()
      const source = JSON.parse(raw)
      return {
        filePath,
        fileName,
        level,
        source,
      }
    })
    .filter((item) => LEVELS.includes(item.level))

  const sortedEntries = rawEntries.sort((left, right) => {
    if (left.level !== right.level) return LEVELS.indexOf(left.level) - LEVELS.indexOf(right.level)
    const leftOrder = numericSuffix(left.source?.id || left.fileName, 0)
    const rightOrder = numericSuffix(right.source?.id || right.fileName, 0)
    if (leftOrder !== rightOrder) return leftOrder - rightOrder
    return left.fileName.localeCompare(right.fileName)
  })

  const normalized = sortedEntries.map((item, index) => normalizeLesson(item.source, item.level, index))
  const deduped = new Map()

  for (const lesson of normalized) {
    const existing = deduped.get(lesson.id)
    if (!existing) {
      deduped.set(lesson.id, lesson)
      continue
    }

    const candidateScore = lesson.numero === numericSuffix(lesson.id) ? 1 : 0
    const existingScore = existing.numero === numericSuffix(existing.id) ? 1 : 0
    if (candidateScore >= existingScore) deduped.set(lesson.id, lesson)
  }

  return [...deduped.values()].sort((left, right) => {
    if (left.niveau !== right.niveau) return LEVELS.indexOf(left.niveau) - LEVELS.indexOf(right.niveau)
    if (left.numero !== right.numero) return left.numero - right.numero
    return left.id.localeCompare(right.id)
  })
}

const ALL_LESSONS = buildLessons()
const LESSONS_BY_LEVEL = LEVELS.reduce((acc, level) => {
  acc[level] = ALL_LESSONS.filter((lesson) => lesson.niveau === level)
  return acc
}, {})

function normalizeLevel(level) {
  const normalized = String(level || '').toUpperCase()
  return LEVELS.includes(normalized) ? normalized : null
}

function listAvailableLevels() {
  return LEVELS.filter((level) => LESSONS_BY_LEVEL[level]?.length)
}

function listLevelLessons(level) {
  const normalized = normalizeLevel(level)
  if (!normalized) return []
  return LESSONS_BY_LEVEL[normalized] || []
}

function findLessonById(lessonId, levelHint = null) {
  const requestedId = String(lessonId || '').toLowerCase()
  if (!requestedId) return null

  const exact = ALL_LESSONS.find((lesson) => lesson.id === requestedId)
  if (exact) return exact

  const normalizedLevel = normalizeLevel(levelHint)
  if (!normalizedLevel) return null

  const byNumber = numericSuffix(requestedId, 0)
  if (!byNumber) return null
  return listLevelLessons(normalizedLevel)[byNumber - 1] || null
}

function findNextLesson(currentLesson) {
  if (!currentLesson) return null

  const nextFromProgression = currentLesson.progression?.nextLessonId
    ? findLessonById(currentLesson.progression.nextLessonId)
    : null
  if (nextFromProgression) return nextFromProgression

  const levelLessons = listLevelLessons(currentLesson.niveau)
  const index = levelLessons.findIndex((lesson) => lesson.id === currentLesson.id)
  if (index >= 0 && index < levelLessons.length - 1) return levelLessons[index + 1]

  const levelIndex = listAvailableLevels().indexOf(currentLesson.niveau)
  if (levelIndex >= 0) {
    const nextLevel = listAvailableLevels()[levelIndex + 1]
    return nextLevel ? listLevelLessons(nextLevel)[0] || null : null
  }

  return null
}

function buildLevelUnlockMap(level, progression = {}) {
  const lessons = listLevelLessons(level)
  const map = new Map()

  lessons.forEach((lesson, index) => {
    const previousLesson = index > 0 ? lessons[index - 1] : null
    const previousComplete = previousLesson ? Boolean(progression[previousLesson.id]?.complete) : true
    const prereqs = lesson.prerequisites || []
    const prereqsComplete = prereqs.every((lessonId) => !findLessonById(lessonId) || progression[lessonId]?.complete)
    const alreadyStarted = Boolean(progression[lesson.id])
    const complete = Boolean(progression[lesson.id]?.complete)
    const unlocked = index === 0 || complete || alreadyStarted || (previousComplete && prereqsComplete)

    let lockedReason = null
    if (!unlocked) {
      if (!previousComplete && previousLesson) {
        lockedReason = `Termine ${previousLesson.id.toUpperCase()} d'abord`
      } else if (!prereqsComplete && prereqs.length > 0) {
        lockedReason = `Prerequis: ${prereqs.join(', ').toUpperCase()}`
      }
    }

    map.set(lesson.id, {
      unlocked,
      complete,
      lockedReason,
      xp: lesson.progression?.xp || 0,
    })
  })

  return map
}

function findNextRecommendedLesson(preferredLevel = null, progression = {}) {
  const orderedLevels = uniqueStrings([normalizeLevel(preferredLevel), ...listAvailableLevels()]).filter(Boolean)

  for (const level of orderedLevels) {
    const unlockMap = buildLevelUnlockMap(level, progression)
    const lesson = listLevelLessons(level).find((item) => {
      const state = unlockMap.get(item.id)
      return state?.unlocked && !state?.complete
    })
    if (lesson) return lesson
  }

  return ALL_LESSONS[0] || null
}

function getCatalogStats() {
  const levels = listAvailableLevels()
  return levels.reduce((acc, level) => {
    const lessons = listLevelLessons(level)
    acc.levels += 1
    acc.lessons += lessons.length
    acc.phrases += lessons.reduce((sum, lesson) => sum + (lesson.phrasesCount || 0), 0)
    acc.exercises += lessons.reduce((sum, lesson) => sum + (lesson.exercicesCount || 0), 0)
    acc.words += lessons.reduce((sum, lesson) => sum + (lesson.wordsCount || 0), 0)
    return acc
  }, { levels: 0, lessons: 0, phrases: 0, exercises: 0, words: 0 })
}

export {
  ALL_LESSONS,
  LEVELS,
  buildLevelUnlockMap,
  findLessonById,
  findNextLesson,
  findNextRecommendedLesson,
  getCatalogStats,
  listAvailableLevels,
  listLevelLessons,
  normalizeLevel,
}

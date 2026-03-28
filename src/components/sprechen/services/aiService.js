import { buildCorrectionPrompt, buildFeedbackPrompt } from '../data/prompts'
import { clamp, safeJSONParse } from '../utils'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

function shouldUseDirectGroq(config = {}) {
  return Boolean(config.groqKey) && (!config.apiEndpoint || config.apiEndpoint === 'groq_direct')
}

function isEndpointMode(config = {}) {
  return Boolean(config.apiEndpoint) && config.apiEndpoint !== 'groq_direct'
}

function extractMessageContent(data) {
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

async function callGroqDirect(messages, config, options = {}) {
  const payload = {
    model: GROQ_MODEL,
    max_tokens: options.maxTokens ?? 180,
    temperature: options.temperature ?? 0.75,
    messages,
  }

  if (options.jsonMode) {
    payload.response_format = { type: 'json_object' }
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new Error(errorPayload?.error?.message || `Groq error ${response.status}`)
  }

  const data = await response.json()
  return extractMessageContent(data)
}

async function callParentEndpoint(payload, config) {
  const token =
    (typeof window !== 'undefined' && (localStorage.getItem('eam_token') || localStorage.getItem('token'))) || ''

  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Parent endpoint error ${response.status}`)
  }

  const data = await response.json()
  return data?.content || data?.message || data
}

async function callGeminiFallback(prompt, config) {
  if (!config.geminiKey) throw new Error('Gemini key missing')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}`)
  }

  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

function offlineConversationReply(messages, config = {}) {
  const theme = config.theme
  const character = config.character
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || ''

  if (config.forceTwist && theme?.possibleTwist) {
    return `${theme.possibleTwist} Was machen Sie jetzt?`
  }

  if (!lastUserMessage) {
    const openings = {
      cafe_a1: 'Guten Morgen! Was darf es fur Sie sein?',
      presentation_a1: 'Hallo! Ich bin Anna. Wie heisst du?',
      transport_a1: 'Ja, bitte? Wohin mochten Sie fahren?',
      restaurant_a2: 'Guten Abend. Was ist das Problem genau?',
      shopping_a2: 'Gerne. Wonach suchen Sie genau?',
      entretien_b1: 'Guten Tag. Erzahlen Sie mir bitte kurz von sich.',
      opinion_b1: 'Ich finde Elektroautos gar nicht so grun. Wie siehst du das?',
      apartment_b2: 'Guten Tag. Was mochten Sie uber die Wohnung zuerst wissen?',
    }

    return openings[theme?.id] || `Hallo, ich bin ${character?.name || 'dein Partner'}. Legen wir los.`
  }

  const genericFollowUps = [
    'Verstehe. Konnen Sie das etwas genauer sagen?',
    'Gut. Und was mochten Sie als Nachstes tun?',
    'Alles klar. Warum genau ist das wichtig fur Sie?',
    'Interessant. Haben Sie noch eine Frage dazu?',
  ]

  if (theme?.id === 'cafe_a1') {
    return /kaffee/i.test(lastUserMessage)
      ? 'Naturlich. Mochten Sie auch etwas zu essen?'
      : 'Kein Problem. Sonst noch etwas?'
  }

  if (theme?.id === 'transport_a1') {
    return 'Sie mussen mit der U2 fahren und einmal umsteigen. Ist das klar?'
  }

  if (theme?.id === 'restaurant_a2') {
    return /falsch|bestellt|fleisch/i.test(lastUserMessage)
      ? 'Entschuldigung. Ich prufe das sofort. Mochten Sie lieber warten oder etwas anderes?'
      : 'Gut, ich notiere das. Brauchen Sie noch etwas?'
  }

  if (theme?.id === 'entretien_b1') {
    return 'Konnen Sie ein konkretes Beispiel aus Ihrer Erfahrung geben?'
  }

  if (theme?.id === 'opinion_b1') {
    return 'Das ist ein Punkt, aber ich bin noch nicht uberzeugt. Welches Argument ist fur dich am starksten?'
  }

  if (theme?.id === 'apartment_b2') {
    return 'Die Wohnung ist ab Mai verfugbar. Welche Vertragsdetails sind fur Sie entscheidend?'
  }

  return genericFollowUps[Math.floor(Math.random() * genericFollowUps.length)]
}

function offlineCorrection(userMessage) {
  const message = String(userMessage || '').trim()
  const lower = message.toLowerCase()

  if (!message) {
    return {
      status: 'incorrect',
      score: 15,
      correctedVersion: null,
      explanation: 'La reponse est vide.',
      grammarPoint: 'production orale',
      confidence: 'high',
      weaknessDetected: { type: 'vocabulary', detail: 'reponse trop courte ou absente' },
    }
  }

  if (/zu\s+supermarkt/i.test(lower) && !/zum supermarkt/i.test(lower)) {
    return {
      status: 'acceptable',
      score: 76,
      correctedVersion: message.replace(/zu\s+Supermarkt/i, 'zum Supermarkt'),
      explanation: 'On contracte souvent "zu dem" en "zum".',
      grammarPoint: 'preposition + article contracte',
      confidence: 'medium',
      weaknessDetected: { type: 'grammar', detail: 'usage incomplet de la contraction zu dem > zum' },
    }
  }

  if (/ich bin gut/i.test(lower)) {
    return {
      status: 'correct',
      score: 92,
      correctedVersion: null,
      explanation: null,
      grammarPoint: null,
      confidence: 'high',
      weaknessDetected: null,
    }
  }

  if (message.split(/\s+/).length < 2) {
    return {
      status: 'acceptable',
      score: 70,
      correctedVersion: null,
      explanation: 'La reponse est comprise mais reste trop courte pour bien faire avancer la scene.',
      grammarPoint: 'developpement de reponse',
      confidence: 'medium',
      weaknessDetected: { type: 'vocabulary', detail: 'reponses trop courtes' },
    }
  }

  if (!/\b(ich|du|sie|wir|er|es)\b/i.test(lower)) {
    return {
      status: 'acceptable',
      score: 72,
      correctedVersion: null,
      explanation: 'Le message se comprend mais gagnerait en clarte avec un sujet explicite.',
      grammarPoint: 'ordre de la phrase simple',
      confidence: 'low',
      weaknessDetected: { type: 'grammar', detail: 'sujet implicite ou manquant dans une phrase simple' },
    }
  }

  return {
    status: 'correct',
    score: 88,
    correctedVersion: null,
    explanation: null,
    grammarPoint: null,
    confidence: 'medium',
    weaknessDetected: null,
  }
}

function offlineFeedback(sessionData) {
  const globalScore = clamp(
    Math.round(
      sessionData.scores.average * 0.62 +
        sessionData.scores.fluency * 0.14 +
        sessionData.scores.vocabulary * 0.12 +
        sessionData.scores.reactivity * 0.12
    ),
    20,
    98
  )

  const badges = []
  if (sessionData.sessionCount === 0) badges.push('first_session')
  if (sessionData.hintsUsed === 0) badges.push('no_hints_used')
  if (sessionData.scores.vocabularyUsed >= sessionData.theme.vocabularyHints.length) badges.push('vocabulary_master')
  if (sessionData.scores.avgResponseTime > 0 && sessionData.scores.avgResponseTime < 3) badges.push('speed_talker')
  if (globalScore >= 90) badges.push('perfect_session')

  return {
    characterMessage:
      globalScore >= 85
        ? `${sessionData.character.name} te dirait que la scene etait credible et fluide. Tu tiens le fil sans te cacher derriere des phrases toutes faites.`
        : `${sessionData.character.name} a senti de bonnes intentions, mais il faut encore stabiliser tes reponses sous pression. Le plus important: tu es reste dans la scene.`,
    globalScore,
    strengths: [
      sessionData.scores.avgResponseTime < 5 ? 'Tu reagis assez vite quand la question est claire.' : 'Tu restes engage meme quand la scene se complique.',
      sessionData.scores.vocabularyUsed > 1 ? 'Tu as reutilise du vocabulaire cible.' : 'Tu as maintenu le contact jusqu au bout.',
    ],
    toImprove: [
      sessionData.scores.grammar < 75 ? 'Stabiliser les structures de base avant de complexifier.' : 'Rallonger certaines reponses avec un detail concret.',
      sessionData.hintsUsed > 1 ? 'Moins dependre des aides quand la tension monte.' : 'Continuer a varier les formulations.',
    ],
    tip:
      sessionData.scores.avgResponseTime > 6
        ? 'Refais une scene courte et impose-toi une reponse en moins de cinq secondes.'
        : 'Reprends deux repliques de la session et redis-les a voix haute trois fois de suite.',
    xpEarned: clamp(Math.round(globalScore * 0.8), 20, 100),
    badges,
  }
}

export async function getAIResponse(messages, systemPrompt, config = {}) {
  const requestMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((message) => ({
      role: message.role === 'ai' ? 'assistant' : 'user',
      content: message.content,
    })),
  ]

  try {
    if (shouldUseDirectGroq(config)) {
      return await callGroqDirect(requestMessages, config, {
        maxTokens: 160,
        temperature: 0.82,
      })
    }

    if (isEndpointMode(config)) {
      const result = await callParentEndpoint(
        {
          task: 'conversation',
          messages: requestMessages,
          themeId: config.theme?.id,
          level: config.level,
        },
        config
      )

      return typeof result === 'string' ? result : result?.content || offlineConversationReply(messages, config)
    }
  } catch (error) {
    console.warn('Primary AI provider failed for conversation.', error)
  }

  if (config.geminiKey) {
    try {
      return await callGeminiFallback(
        `${systemPrompt}\n\nHISTORIQUE:\n${requestMessages.map((message) => `${message.role}: ${message.content}`).join('\n')}`,
        config
      )
    } catch (error) {
      console.warn('Gemini fallback failed for conversation.', error)
    }
  }

  return offlineConversationReply(messages, config)
}

export async function getCorrectionAnalysis(userMessage, history, level, config = {}) {
  const prompt = buildCorrectionPrompt(userMessage, history, level)

  try {
    if (shouldUseDirectGroq(config)) {
      const content = await callGroqDirect([{ role: 'user', content: prompt }], config, {
        maxTokens: 320,
        temperature: 0.1,
        jsonMode: true,
      })
      return safeJSONParse(content, offlineCorrection(userMessage)) || offlineCorrection(userMessage)
    }

    if (isEndpointMode(config)) {
      const result = await callParentEndpoint(
        {
          task: 'correction',
          prompt,
          history,
          level,
        },
        config
      )

      if (typeof result === 'string') {
        return safeJSONParse(result, offlineCorrection(userMessage)) || offlineCorrection(userMessage)
      }

      return result
    }
  } catch (error) {
    console.warn('Primary AI provider failed for correction.', error)
  }

  if (config.geminiKey) {
    try {
      const content = await callGeminiFallback(prompt, config)
      return safeJSONParse(content, offlineCorrection(userMessage)) || offlineCorrection(userMessage)
    } catch (error) {
      console.warn('Gemini fallback failed for correction.', error)
    }
  }

  return offlineCorrection(userMessage)
}

export async function generateFinalFeedback(sessionData, config = {}) {
  const prompt = buildFeedbackPrompt(sessionData)

  try {
    if (shouldUseDirectGroq(config)) {
      const content = await callGroqDirect([{ role: 'user', content: prompt }], config, {
        maxTokens: 520,
        temperature: 0.45,
        jsonMode: true,
      })

      return safeJSONParse(content, offlineFeedback(sessionData)) || offlineFeedback(sessionData)
    }

    if (isEndpointMode(config)) {
      const result = await callParentEndpoint(
        {
          task: 'feedback',
          prompt,
          sessionData,
        },
        config
      )

      if (typeof result === 'string') {
        return safeJSONParse(result, offlineFeedback(sessionData)) || offlineFeedback(sessionData)
      }

      return result
    }
  } catch (error) {
    console.warn('Primary AI provider failed for final feedback.', error)
  }

  if (config.geminiKey) {
    try {
      const content = await callGeminiFallback(prompt, config)
      return safeJSONParse(content, offlineFeedback(sessionData)) || offlineFeedback(sessionData)
    } catch (error) {
      console.warn('Gemini fallback failed for feedback.', error)
    }
  }

  return offlineFeedback(sessionData)
}

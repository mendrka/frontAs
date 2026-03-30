import { create } from 'zustand'

export const SESSION_VIEWS = {
  ONBOARDING: 'onboarding',
  WARMUP: 'warmup',
  SESSION: 'session',
  FEEDBACK: 'feedback',
  JOURNAL: 'journal',
}

const initialState = {
  currentView: SESSION_VIEWS.ONBOARDING,
  view: SESSION_VIEWS.ONBOARDING,
  selectedMode: 'training',
  selectedLevel: null,
  selectedTheme: null,
  selectedCharacter: null,
  config: {
    mode: 'training',
    level: null,
    theme: null,
    character: null,
  },
  conversationHistory: [],
  currentTurn: 0,
  isAiSpeaking: false,
  isAiThinking: false,
  isUserSpeaking: false,
  isTwistTriggered: false,
  sessionStartTime: null,
  sessionId: null,
  lastAiMessageTime: null,
  liveTranscript: '',
  finalTranscript: '',
  micState: 'idle',
  responseTimes: [],
  hesitationCounts: [],
  turnScores: [],
  hintsUsed: 0,
  currentHintLevel: 0,
  hintVisible: false,
  hintContent: null,
  hintLevel: 0,
  collectedWords: [],
  newWordsSpotted: [],
  sessionFeedback: null,
  speechSupport: { stt: true, tts: true },
  confidenceScore: 52,
  errorMessage: null,
  hasSessionStarted: false,
}

export const useSessionStore = create((set) => ({
  ...initialState,

  setCurrentView: (currentView) => set({ currentView, view: currentView }),
  setView: (view) => set({ currentView: view, view }),
  setSelectedMode: (selectedMode) =>
    set((state) => ({
      selectedMode,
      config: { ...state.config, mode: selectedMode },
    })),
  setSelectedLevel: (selectedLevel) =>
    set((state) => ({
      selectedLevel,
      config: { ...state.config, level: selectedLevel },
    })),
  setSelectedTheme: (selectedTheme) =>
    set((state) => ({
      selectedTheme,
      config: { ...state.config, theme: selectedTheme },
    })),
  setSelectedCharacter: (selectedCharacter) =>
    set((state) => ({
      selectedCharacter,
      config: { ...state.config, character: selectedCharacter },
    })),
  setConfig: (config) =>
    set((state) => ({
      config: { ...state.config, ...(config || {}) },
      selectedMode: config?.mode ?? state.selectedMode,
      selectedLevel: config?.level ?? state.selectedLevel,
      selectedTheme: config?.theme ?? state.selectedTheme,
      selectedCharacter: config?.character ?? state.selectedCharacter,
    })),
  setSpeechSupport: (speechSupport) => set({ speechSupport }),
  setSessionId: (sessionId) => set({ sessionId }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  setFinalTranscript: (finalTranscript) => set({ finalTranscript }),
  setMicState: (micState) => set({ micState }),
  setIsAiSpeaking: (isAiSpeaking) => set({ isAiSpeaking }),
  setIsAiThinking: (isAiThinking) => set({ isAiThinking }),
  setIsUserSpeaking: (isUserSpeaking) => set({ isUserSpeaking }),
  setLastAiMessageTime: (lastAiMessageTime) => set({ lastAiMessageTime }),
  setConfidenceScore: (confidenceScore) => set({ confidenceScore }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),

  setHintLevel: (currentHintLevel, incrementUsage = false) =>
    set((state) => ({
      currentHintLevel,
      hintLevel: currentHintLevel,
      hintVisible: currentHintLevel > 0,
      hintsUsed:
        incrementUsage && currentHintLevel > state.currentHintLevel
          ? state.hintsUsed + 1
          : state.hintsUsed,
    })),

  showHint: (content, level = 1) =>
    set((state) => ({
      hintVisible: true,
      hintContent: content,
      hintLevel: level,
      currentHintLevel: level,
      hintsUsed: level > state.currentHintLevel ? state.hintsUsed + 1 : state.hintsUsed,
    })),
  hideHint: () => set({ hintVisible: false, hintContent: null }),
  incrementHints: () => set((state) => ({ hintsUsed: state.hintsUsed + 1 })),
  resetHints: () => set({ currentHintLevel: 0, hintVisible: false, hintContent: null, hintLevel: 0 }),
  triggerTwist: () => set({ isTwistTriggered: true }),
  markSessionStarted: () => set({ hasSessionStarted: true }),

  spotWords: (words) =>
    set((state) => ({
      newWordsSpotted: [...new Set([...state.newWordsSpotted, ...words])].slice(-6),
    })),

  dismissWord: (word) =>
    set((state) => ({
      newWordsSpotted: state.newWordsSpotted.filter((candidate) => candidate !== word),
    })),

  collectWord: (word) =>
    set((state) => ({
      collectedWords: state.collectedWords.includes(word)
        ? state.collectedWords
        : [...state.collectedWords, word],
      newWordsSpotted: state.newWordsSpotted.filter((candidate) => candidate !== word),
    })),

  addMessage: (role, content, correction = null, extras = {}) =>
    set((state) => ({
      conversationHistory: [
        ...state.conversationHistory,
        {
          id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
          role,
          content,
          correction,
          timestamp: Date.now(),
          turn: state.currentTurn,
          pending: extras.pending || false,
          responseTimeMs: extras.responseTimeMs ?? null,
        },
      ],
      currentTurn: role === 'user' ? state.currentTurn + 1 : state.currentTurn,
      finalTranscript: role === 'user' ? content : state.finalTranscript,
    })),

  updateLastUserMessage: ({ correction, responseTimeMs }) =>
    set((state) => {
      const history = [...state.conversationHistory]
      const index = [...history].reverse().findIndex((message) => message.role === 'user')
      if (index === -1) return state
      const actualIndex = history.length - 1 - index
      history[actualIndex] = {
        ...history[actualIndex],
        correction: correction ?? history[actualIndex].correction,
        pending: false,
        responseTimeMs: responseTimeMs ?? history[actualIndex].responseTimeMs,
      }
      return { conversationHistory: history }
    }),

  recordTurnMetrics: ({ responseTime, score, hesitationCount, confidenceScore }) =>
    set((state) => ({
      responseTimes: [...state.responseTimes, responseTime],
      turnScores: [...state.turnScores, score],
      hesitationCounts: [...state.hesitationCounts, hesitationCount],
      confidenceScore: confidenceScore ?? state.confidenceScore,
    })),

  startSession: ({ mode, level, theme, character }) =>
    set({
      ...initialState,
      selectedMode: mode,
      selectedLevel: level,
      selectedTheme: theme,
      selectedCharacter: character,
      config: { mode, level, theme, character },
      currentView: SESSION_VIEWS.SESSION,
      view: SESSION_VIEWS.SESSION,
      sessionStartTime: Date.now(),
      sessionId: null,
      speechSupport: initialState.speechSupport,
    }),

  endSession: (sessionFeedback) =>
    set({
      sessionFeedback,
      currentView: SESSION_VIEWS.FEEDBACK,
      view: SESSION_VIEWS.FEEDBACK,
      isAiSpeaking: false,
      isAiThinking: false,
      isUserSpeaking: false,
      liveTranscript: '',
      finalTranscript: '',
      micState: 'idle',
    }),

  goToJournal: () => set({ currentView: SESSION_VIEWS.JOURNAL, view: SESSION_VIEWS.JOURNAL }),

  backToOnboarding: () =>
    set((state) => ({
      ...initialState,
      selectedMode: state.selectedMode,
      selectedLevel: state.selectedLevel,
      selectedTheme: state.selectedTheme,
      selectedCharacter: state.selectedCharacter,
      config: state.config,
      currentView: SESSION_VIEWS.ONBOARDING,
      view: SESSION_VIEWS.ONBOARDING,
    })),

  resetSession: () => set({ ...initialState }),
}))

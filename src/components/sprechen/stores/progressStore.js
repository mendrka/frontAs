import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

function deriveSpeakingLevel(globalXP = 0) {
  if (globalXP >= 1000) return 'B2'
  if (globalXP >= 500) return 'B1'
  if (globalXP >= 200) return 'A2'
  return 'A1'
}

export const useProgressStore = create(
  persist(
    (set) => ({
      globalXP: 0,
      level: 'A1',
      streakDays: 0,
      lastSessionDate: null,
      sessionsCount: 0,
      dna: {
        phonology: 34,
        fluency: 38,
        vocabulary: 31,
        grammar: 33,
        reactivity: 36,
      },
      badges: [],
      weaknesses: [],
      sessionHistory: [],

      addXP: (amount) =>
        set((state) => {
          const globalXP = state.globalXP + amount
          return {
            globalXP,
            level: deriveSpeakingLevel(globalXP),
          }
        }),

      updateStreak: () =>
        set((state) => {
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()

          if (state.lastSessionDate === today) {
            return state
          }

          return {
            streakDays: state.lastSessionDate === yesterday ? state.streakDays + 1 : 1,
            lastSessionDate: today,
          }
        }),

      updateDNA: (sessionScores) =>
        set((state) => {
          const weight = 0.35
          const mapScore = (current, next) =>
            Math.round(current * (1 - weight) + (typeof next === 'number' ? next : current) * weight)

          return {
            dna: {
              phonology: mapScore(state.dna.phonology, sessionScores.phonology),
              fluency: mapScore(state.dna.fluency, sessionScores.fluency),
              vocabulary: mapScore(state.dna.vocabulary, sessionScores.vocabulary),
              grammar: mapScore(state.dna.grammar, sessionScores.grammar),
              reactivity: mapScore(state.dna.reactivity, sessionScores.reactivity),
            },
          }
        }),

      addBadge: (badgeId) =>
        set((state) => ({
          badges: state.badges.includes(badgeId) ? state.badges : [...state.badges, badgeId],
        })),

      addWeakness: (weakness) =>
        set((state) => {
          const existing = state.weaknesses.find((item) => item.detail === weakness.detail)
          if (existing) {
            return {
              weaknesses: state.weaknesses.map((item) =>
                item.detail === weakness.detail
                  ? { ...item, frequency: (item.frequency || 1) + 1 }
                  : item
              ),
            }
          }

          return {
            weaknesses: [...state.weaknesses, { ...weakness, frequency: 1 }].slice(-20),
          }
        }),

      addSession: (sessionData) =>
        set((state) => ({
          sessionHistory: [...state.sessionHistory, sessionData].slice(-50),
          sessionsCount: state.sessionsCount + 1,
        })),
    }),
    {
      name: 'sprechen-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)

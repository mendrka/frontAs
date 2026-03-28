import { create } from 'zustand'

const initialState = {
  debug: false,
  serviceIndicator: null, // { stt?:string, tts?:string, ai?:string }
  panels: {
    vocabOpen: false,
    metricsOpen: false,
  },
}

export const useSprechenUIStore = create((set) => ({
  ...initialState,
  setDebug: (debug) => set({ debug: Boolean(debug) }),
  setServiceIndicator: (serviceIndicator) => set({ serviceIndicator }),
  togglePanel: (key) =>
    set((state) => ({
      panels: { ...state.panels, [key]: !state.panels[key] },
    })),
  resetUI: () => set({ ...initialState }),
}))


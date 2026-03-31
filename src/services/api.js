import axios from 'axios'
import { API_URL, LOGIN_PATH } from '@config/runtime'

// ── Clé localStorage (même que AuthContext) ────────────────
const TOKEN_KEY = 'eam_token'

// ══════════════════════════════════════════════════════════
// INSTANCE AXIOS CENTRALISÉE
// ══════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15s — important pour connexions lentes Madagascar
  headers: {
    'Content-Type': 'application/json',
  },
})

const requestCache = new Map()
const DEFAULT_CACHE_TTL = 60 * 1000

function buildCacheKey(url, params = {}) {
  const search = new URLSearchParams()

  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => {
      search.set(key, String(value))
    })

  const query = search.toString()
  return query ? `${url}?${query}` : url
}

function readCachedData(cacheKey) {
  const entry = requestCache.get(cacheKey)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    requestCache.delete(cacheKey)
    return null
  }

  return entry.data
}

function writeCachedData(cacheKey, data, ttl) {
  requestCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttl,
  })
}

function invalidateCache(...fragments) {
  if (!fragments.length) return

  for (const key of requestCache.keys()) {
    if (fragments.some((fragment) => key.includes(fragment))) {
      requestCache.delete(key)
    }
  }
}

function cachedGet(url, options = {}, config = {}) {
  const { ttl = DEFAULT_CACHE_TTL, enabled = true, cacheKey } = config

  if (!enabled) {
    return api.get(url, options)
  }

  const resolvedCacheKey = cacheKey || buildCacheKey(url, options.params)
  const cachedData = readCachedData(resolvedCacheKey)

  if (cachedData) {
    return Promise.resolve({
      data: cachedData,
      cached: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: options,
    })
  }

  return api.get(url, options).then((response) => {
    writeCachedData(resolvedCacheKey, response.data, ttl)
    return response
  })
}

function postWithInvalidation(url, payload, fragments = []) {
  return api.post(url, payload).then((response) => {
    invalidateCache(...fragments)
    return response
  })
}

function putWithInvalidation(url, payload, fragments = []) {
  return api.put(url, payload).then((response) => {
    invalidateCache(...fragments)
    return response
  })
}

function deleteWithInvalidation(url, options = {}, fragments = []) {
  return api.delete(url, options).then((response) => {
    invalidateCache(...fragments)
    return response
  })
}

// ══════════════════════════════════════════════════════════
// INTERCEPTEUR REQUÊTE — Injecter le token JWT automatiquement
// ══════════════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ══════════════════════════════════════════════════════════
// INTERCEPTEUR RÉPONSE — Gestion erreurs globale
// ══════════════════════════════════════════════════════════
api.interceptors.response.use(
  // Réponse OK → retourner directement les données
  (response) => response,

  // Erreur → traitement centralisé
  (error) => {
    const status = error.response?.status

    // Token expiré → nettoyer et rediriger vers login
    if (status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/')
      if (!isAuthRoute) {
        // Token invalide sur une route protégée → déconnexion forcée
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('eam_user')
        // Redirection sans react-router (hors composant)
        if (window.location.pathname !== LOGIN_PATH) {
          window.location.replace(LOGIN_PATH)
        }
      }
    }

    // 403 Forbidden
    if (status === 403) {
      console.warn('EAM API: Accès refusé (403)')
    }

    // 500+ → Erreur serveur
    if (status >= 500) {
      console.error('EAM API: Erreur serveur', error.response?.data)
    }

    // Timeout ou pas de réseau
    if (error.code === 'ECONNABORTED') {
      error.message = 'Timeout — Vérifiez votre connexion internet'
    }

    if (error.code === 'ERR_NETWORK') {
      error.message = 'Connexion impossible au serveur â€” verifiez le reseau ou la configuration API mobile'
    }

    return Promise.reject(error)
  }
)

// ══════════════════════════════════════════════════════════
// ENDPOINTS AUTH
// ══════════════════════════════════════════════════════════
export const authAPI = {
  login:    (email, password)  => api.post('/auth/login',    { email, password }),
  register: (userData)         => api.post('/auth/register', userData),
  me:       ()                 => cachedGet('/auth/me', {}, { ttl: 30 * 1000 }),
  logout:   ()                 => api.post('/auth/logout'),
}

// ══════════════════════════════════════════════════════════
// ENDPOINTS COURS
// ══════════════════════════════════════════════════════════
export const coursAPI = {
  // Liste tous les cours (optionnel: filtrer par niveau)
  getAll:       (niveau)        => cachedGet('/cours', { params: niveau ? { niveau } : {} }, { ttl: 5 * 60 * 1000 }),
  // Détail d'un cours
  getById:      (coursId)       => cachedGet(`/cours/${coursId}`, {}, { ttl: 5 * 60 * 1000 }),
  // Leçons d'un cours
  getLecons:    (coursId)       => cachedGet(`/cours/${coursId}/lecons`, {}, { ttl: 5 * 60 * 1000 }),
  // Détail d'une leçon
  getLecon:     (leconId)       => cachedGet(`/cours/lecon/${leconId}`, {}, { ttl: 5 * 60 * 1000 }),
}

export const adaptiveCoursAPI = {
  startSession: (payload) => api.post('/adaptive-cours/session/start', payload || {}),
  submitAttempt: (sessionId, payload) => api.post(`/adaptive-cours/session/${sessionId}/attempt`, payload || {}),
  finishSession: (sessionId) => api.post(`/adaptive-cours/session/${sessionId}/finish`, {}),
  getRecommendation: () => cachedGet('/adaptive-cours/recommendation', {}, { ttl: 60 * 1000 }),
}

// ══════════════════════════════════════════════════════════
// ENDPOINTS PROGRESSION
// ══════════════════════════════════════════════════════════
export const progressionAPI = {
  // Récupérer la progression complète de l'utilisateur
  getAll:       ()              => cachedGet('/cours/progression', {}, { ttl: 30 * 1000 }),
  // Récupérer progression d'un cours spécifique
  getCours:     (coursId)       => cachedGet('/cours', { params: { niveau: coursId } }, { ttl: 60 * 1000 }),
  // Marquer une leçon comme complétée
  completeLecon:(leconId, data) => postWithInvalidation(`/cours/progression/lecon/${leconId}/complete`, data, ['/cours/progression', '/cours?', `/cours/lecon/${leconId}`]),
  // Sauvegarder résultat d'un exercice
  saveExercice: (exerciceId, data) => postWithInvalidation(`/cours/progression/exercice/${exerciceId}`, data, ['/cours/progression']),
  // Statistiques globales de l'utilisateur
  getStats:     ()              => cachedGet('/cours/progression/stats', {}, { ttl: 30 * 1000 }),
}

// ══════════════════════════════════════════════════════════
// ENDPOINTS SPRECHEN
// ══════════════════════════════════════════════════════════
export const sprechenAPI = {
  // Rejoindre la file d'attente de matching
  joinQueue:    (niveau)        => api.post('/sprechen/queue', { niveau }),
  // Quitter la file
  leaveQueue:   ()              => deleteWithInvalidation('/sprechen/queue', {}, ['/sprechen']),
  // Historique des sessions
  getHistorique:()              => cachedGet('/sprechen/historique', {}, { ttl: 60 * 1000 }),
  // Détail d'une session
  getSession:   (sessionId)     => cachedGet(`/sprechen/session/${sessionId}`, {}, { ttl: 60 * 1000 }),
  // Sauvegarder une session terminée
  saveSession:  (data)          => postWithInvalidation('/sprechen/session', data, ['/sprechen']),
  // Statistiques spreken
  getStats:     ()              => cachedGet('/sprechen/stats', {}, { ttl: 30 * 1000 }),
}

// ══════════════════════════════════════════════════════════
// ENDPOINTS COMMUNAUTÉ / CHAT
// ══════════════════════════════════════════════════════════
export const chatAPI = {
  // Liste des canaux disponibles
  getCanaux:    ()              => cachedGet('/chat/canaux', {}, { ttl: 5 * 60 * 1000 }),
  // Messages d'un canal (avec pagination)
  getMessages:  (canal, page)   => cachedGet(`/chat/canaux/${canal}/messages`, { params: { page: page || 1 } }, { ttl: 15 * 1000 }),
  // Envoyer un message (REST fallback si socket ko)
  sendMessage:  (canal, texte)  => postWithInvalidation(`/chat/canaux/${canal}/messages`, { texte }, ['/chat/canaux/', '/chat/direct/']),
  // Annuaire et conversations privees
  getDirectUsers: (q = '')      => cachedGet('/chat/direct/users', { params: q ? { q } : {} }, { ttl: 30 * 1000 }),
  getDirectConversations: ()    => cachedGet('/chat/direct/conversations', {}, { ttl: 30 * 1000 }),
  getDirectMessages: (userId, page) => cachedGet(`/chat/direct/${userId}/messages`, { params: { page: page || 1 } }, { ttl: 15 * 1000 }),
  sendDirectMessage: (userId, texte) => postWithInvalidation(`/chat/direct/${userId}/messages`, { texte }, ['/chat/direct/', '/chat/canaux/']),
}

// ══════════════════════════════════════════════════════════
// ENDPOINTS UTILISATEUR
// ══════════════════════════════════════════════════════════
export const userAPI = {
  // Récupérer le profil
  getProfil:    ()              => cachedGet('/user/profil', {}, { ttl: 30 * 1000 }),
  // Mettre à jour le profil
  updateProfil: (data)          => putWithInvalidation('/user/profil', data, ['/user/profil', '/user/dashboard', '/gamification']),
  // Changer le mot de passe
  changePassword:(data)         => api.put('/user/password', data),
  // Tableau de bord — toutes les données résumées
  getDashboard: ()              => cachedGet('/user/dashboard', {}, { ttl: 30 * 1000 }),
}

export const gamificationAPI = {
  getStats:      ()              => cachedGet('/gamification/stats', {}, { ttl: 30 * 1000 }),
  addXp:         (amount, action) => postWithInvalidation('/gamification/xp', { amount, action }, ['/gamification', '/user/dashboard']),
  checkStreak:   ()              => api.post('/gamification/streak/check'),
  getBadges:     ()              => cachedGet('/gamification/badges', {}, { ttl: 60 * 1000 }),
  markBadgeSeen: (badgeId)       => postWithInvalidation(`/gamification/badge/${badgeId}/vu`, {}, ['/gamification/badges']),
  getLeaderboard:(limit = 10)    => cachedGet('/gamification/leaderboard', { params: { limit } }, { ttl: 60 * 1000 }),
}

// ══════════════════════════════════════════════════════════
// HELPER — Gestion offline
// ══════════════════════════════════════════════════════════
export const isOnline = () => navigator.onLine

// Helper pour appels avec fallback localStorage
export const withOfflineFallback = async (apiCall, localKey, fallbackData = null) => {
  if (!isOnline()) {
    const cached = localStorage.getItem(localKey)
    return cached ? JSON.parse(cached) : fallbackData
  }
  try {
    const res = await apiCall()
    // Mettre en cache pour usage offline futur
    localStorage.setItem(localKey, JSON.stringify(res.data))
    return res.data
  } catch {
    const cached = localStorage.getItem(localKey)
    return cached ? JSON.parse(cached) : fallbackData
  }
}

// ══════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT — instance axios brute si besoin
// ══════════════════════════════════════════════════════════
// ENDPOINTS STATS (public)
export const statsAPI = {
  getOverview: () => cachedGet('/stats/overview', {}, { ttl: 5 * 60 * 1000 }),
  getTemoignages: (limit = 3) => cachedGet('/stats/temoignages', { params: { limit } }, { ttl: 5 * 60 * 1000 }),
}

export default api

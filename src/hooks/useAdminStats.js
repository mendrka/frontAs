import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@context/AuthContext'
import { adminAPI } from '@services/api'

const DEFAULT_DATA = {
  uOv: {
    totalUsers: 0,
    newToday: 0,
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0,
    churnRate: 0,
  },
  reg: [],
  act: [],
  ret: {
    day1: 0,
    day7: 0,
    day30: 0,
  },
  rec: [],
  sOv: {
    totalSessions: 0,
    sessionsToday: 0,
    avgScoreGlobal: 0,
    avgDurationMinutes: 0,
    topScene: 'general',
    completionRate: 0,
  },
  ses: [],
  sc: [],
  dur: [],
  top: [],
}

function normalizeErrorMessage(error) {
  return error?.response?.data?.error || 'Données indisponibles'
}

export function useAdminStats(days = 30) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})
  const [data, setData] = useState(DEFAULT_DATA)

  const fetchAll = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)

    const request = (key, factory, fallback) =>
      factory()
        .then((response) => ({
          key,
          data: response.data,
          error: null,
        }))
        .catch((requestError) => ({
          key,
          data: fallback,
          error: normalizeErrorMessage(requestError),
        }))

    const results = await Promise.all([
      request('uOv', () => adminAPI.getUsersOverview(), DEFAULT_DATA.uOv),
      request('reg', () => adminAPI.getUserRegistrations(days), DEFAULT_DATA.reg),
      request('act', () => adminAPI.getActiveUsers(days), DEFAULT_DATA.act),
      request('ret', () => adminAPI.getUserRetention(), DEFAULT_DATA.ret),
      request('rec', () => adminAPI.getRecentUsers(10), DEFAULT_DATA.rec),
      request('sOv', () => adminAPI.getSprechenOverview(), DEFAULT_DATA.sOv),
      request('ses', () => adminAPI.getSprechenSessions(days), DEFAULT_DATA.ses),
      request('sc', () => adminAPI.getSprechenScores(), DEFAULT_DATA.sc),
      request('dur', () => adminAPI.getSprechenDurationByLevel(), DEFAULT_DATA.dur),
      request('top', () => adminAPI.getSprechenTopUsers(5), DEFAULT_DATA.top),
    ])

    const nextData = {}
    const nextErrors = {}

    results.forEach((result) => {
      nextData[result.key] = result.data
      if (result.error) {
        nextErrors[result.key] = result.error
      }
    })

    setData((current) => ({
      ...current,
      ...nextData,
    }))
    setErrors(nextErrors)
    setError(Object.keys(nextErrors).length === results.length ? 'Erreur lors du chargement du dashboard admin.' : null)
    setLoading(false)
  }, [days, token])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const timer = window.setInterval(fetchAll, 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [fetchAll])

  return {
    loading,
    error,
    errors,
    fetchAll,
    ...data,
  }
}

export default useAdminStats

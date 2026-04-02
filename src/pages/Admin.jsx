import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { useAuth } from '@context/AuthContext'
import { useGamification } from '@context/GamificationContext'
import Icon from '@components/ui/Icon'
import { useAdminStats } from '@hooks/useAdminStats'

const C = {
  gDark: '#0a5032',
  gMid: '#128c50',
  gBright: '#22c570',
  gLight: '#c8f5de',
  gPale: '#e8faf1',
  gAccent: '#00d97e',
  white: '#ffffff',
  offWhite: '#f5fdf9',
  gray200: '#c8d8ce',
  gray400: '#7a9888',
  gray600: '#3a5044',
  nearBlack: '#0c1e16',
}

const SERIES = {
  primary: { bg: 'rgba(34,197,112,0.25)', border: '#22c570' },
  secondary: { bg: 'rgba(18,140,80,0.20)', border: '#128c50' },
  accent: { bg: 'rgba(0,217,126,0.20)', border: '#00d97e' },
  dark: { bg: 'rgba(10,80,50,0.20)', border: '#0a5032' },
}

const PERIODS = [7, 30, 90]
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
const SCORE_COLORS = ['#c8f5de', '#b6efcf', '#9be6bb', '#7fdca6', '#63d592', '#4ccc7e', '#33bb68', '#239a53', '#167641', '#0a5032']

const ADMIN_VARS = {
  '--g-dark': C.gDark,
  '--g-mid': C.gMid,
  '--g-bright': C.gBright,
  '--g-light': C.gLight,
  '--g-pale': C.gPale,
  '--g-accent': C.gAccent,
  '--g-white': C.white,
  '--g-off-white': C.offWhite,
  '--g-gray-200': C.gray200,
  '--g-gray-400': C.gray400,
  '--g-gray-600': C.gray600,
  '--g-near-black': C.nearBlack,
}

const KPI_CARDS = [
  { id: 'users', key: 'uOv', icon: '👥', label: 'Utilisateurs total', value: (s) => s.uOv.totalUsers, format: (v) => n(v), trend: (s) => `+${n(s.uOv.newToday)} aujourd'hui` },
  { id: 'today', key: 'uOv', icon: '🟢', label: "Actifs aujourd'hui", value: (s) => s.uOv.activeToday, format: (v) => n(v) },
  { id: 'week', key: 'uOv', icon: '📅', label: 'Actifs cette semaine', value: (s) => s.uOv.activeThisWeek, format: (v) => n(v) },
  { id: 'sessions', key: 'sOv', icon: '🎤', label: 'Sessions Sprechen', value: (s) => s.sOv.sessionsToday, format: (v) => n(v), trend: () => "aujourd'hui" },
  { id: 'score', key: 'sOv', icon: '⭐', label: 'Score moyen Sprechen', value: (s) => s.sOv.avgScoreGlobal, format: (v) => pct(v) },
  { id: 'completion', key: 'sOv', icon: '✅', label: 'Taux de completion', value: (s) => s.sOv.completionRate, format: (v) => pct(v) },
]

const boxClass = 'rounded-3xl border border-[var(--g-light)] bg-[var(--g-off-white)]/95 shadow-[0_24px_60px_-36px_rgba(10,80,50,0.28)]'

const n = (value) => Number(value || 0).toLocaleString('fr-FR')
const pct = (value) => `${Number(value || 0).toFixed(1)}%`
const dateFr = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) => (value ? new Date(value).toLocaleDateString('fr-FR', options) : '—')
const dayLabel = (value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

function avg(values, size = 7) {
  return values.map((_, index) => {
    const part = values.slice(Math.max(0, index - size + 1), index + 1)
    return Number((part.reduce((sum, value) => sum + value, 0) / Math.max(part.length, 1)).toFixed(2))
  })
}

function csv(columns, rows) {
  const esc = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return `\uFEFF${columns.map((c) => esc(c.label)).join(',')}\n${rows.map((row) => columns.map((c) => esc(row[c.key])).join(',')).join('\n')}`
}

function download(name, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function Skeleton({ w = '100%', h = '20px' }) {
  return <div className="admin-skeleton rounded-md" style={{ width: w, height: h }} />
}

function Panel({ title, subtitle, error, children }) {
  return (
    <article className={`${boxClass} p-4 sm:p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--g-mid)]">{title}</p>
          <p className="mt-2 text-sm text-[var(--g-gray-600)]">{subtitle}</p>
        </div>
        {error ? <span className="rounded-full bg-[var(--g-light)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--g-mid)]">indisponible</span> : null}
      </div>
      {children}
    </article>
  )
}

function ChartPanel({ title, subtitle, config, loading, error }) {
  const ref = useRef(null)
  useEffect(() => {
    if (loading || error || !ref.current || !config) return undefined
    const chart = new Chart(ref.current, config)
    return () => chart.destroy()
  }, [config, error, loading])

  const datasets = config?.data?.datasets || []
  const hasData = datasets.some((set) => Array.isArray(set.data) && set.data.some((value) => Number(value) > 0))

  return (
    <Panel title={title} subtitle={subtitle} error={error}>
      <div className="chart-container">
        {loading ? (
          <div className="space-y-3 pt-2"><Skeleton h="18px" w="40%" /><Skeleton h="260px" /></div>
        ) : error ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[var(--g-light)] bg-[var(--g-pale)] text-sm font-semibold text-[var(--g-mid)]">Données indisponibles</div>
        ) : !hasData ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[var(--g-light)] bg-[var(--g-pale)] text-sm font-medium text-[var(--g-gray-600)]">Aucune donnée.</div>
        ) : (
          <canvas ref={ref} />
        )}
      </div>
    </Panel>
  )
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      tooltip: { backgroundColor: C.gDark, titleColor: C.gLight, bodyColor: C.gPale, borderColor: C.gBright, borderWidth: 1, padding: 12 },
      legend: { labels: { color: C.nearBlack, usePointStyle: true } },
    },
    scales: {
      x: { grid: { color: 'rgba(200,216,206,0.2)' }, ticks: { color: C.gray600, maxTicksLimit: 10 } },
      y: { beginAtZero: true, grid: { color: 'rgba(200,216,206,0.2)' }, ticks: { color: C.gray600 } },
    },
  }
}

function avgScorePlugin(score) {
  return {
    id: 'avg-score-line',
    afterDatasetsDraw(chart) {
      if (!Number.isFinite(score) || score <= 0) return
      const x = chart.scales.x?.getPixelForValue(Math.min(9.9, score / 10))
      if (!x) return
      const { ctx, chartArea } = chart
      ctx.save()
      ctx.strokeStyle = C.gAccent
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = C.gDark
      ctx.font = '600 12px Outfit'
      ctx.fillText(`Moyenne ${pct(score)}`, Math.min(x + 8, chartArea.right - 95), chartArea.top + 14)
      ctx.restore()
    },
  }
}

function UsersTable({ rows, loading, error, search, setSearch }) {
  const debounced = useDebouncedValue(search, 300)
  const filtered = useMemo(() => {
    const query = debounced.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query))
  }, [debounced, rows])

  return (
    <article className={`${boxClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[var(--g-light)] bg-[var(--g-off-white)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--g-mid)]">Dernieres inscriptions</p>
          <p className="mt-1 text-sm text-[var(--g-gray-600)]">10 comptes recents, recherche en temps reel.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher nom ou email"
          className="w-full rounded-2xl border border-[var(--g-light)] bg-[var(--g-white)] px-4 py-3 text-sm text-[var(--g-near-black)] outline-none transition focus:border-[var(--g-bright)] sm:max-w-xs"
        />
      </div>
      {loading ? (
        <div className="space-y-3 p-4 sm:p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h="42px" />)}</div>
      ) : error ? (
        <div className="p-5 text-sm font-semibold text-[var(--g-mid)]">Données indisponibles</div>
      ) : filtered.length === 0 ? (
        <div className="p-5 text-sm text-[var(--g-gray-600)]">Aucun utilisateur ne correspond à la recherche.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-[var(--g-dark)] text-[var(--g-white)]">
              <tr>{['Nom', 'Inscrit le', 'Niveau', 'Sprechen', 'Actif', 'Email'].map((label) => <th key={label} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id} className={`${index % 2 === 0 ? 'bg-[var(--g-pale)]' : 'bg-[var(--g-white)]'} transition hover:bg-[var(--g-light)]`}>
                  <td className="px-4 py-3 font-semibold text-[var(--g-near-black)]">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--g-gray-600)]">{dateFr(row.createdAt)}</td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-md bg-[var(--g-light)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--g-dark)]">{row.level}</span></td>
                  <td className="px-4 py-3 text-sm text-[var(--g-gray-600)]">{n(row.sprechenSessions)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[var(--g-dark)]"><span className={row.isActive ? 'text-[var(--g-bright)]' : 'text-[var(--g-gray-200)]'}>●</span> {row.isActive ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--g-gray-600)]">{row.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

function TopUsers({ rows, loading, error }) {
  return (
    <Panel title="Top utilisateurs" subtitle="Podium Sprechen des profils les plus engages." error={error}>
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="space-y-2 rounded-2xl border border-[var(--g-light)] bg-[var(--g-pale)] p-4"><Skeleton h="20px" w="55%" /><Skeleton h="14px" w="72%" /><Skeleton h="10px" /></div>)}</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-[var(--g-gray-600)]">Aucune session Sprechen disponible.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={`${row.name}-${index}`} className="rounded-2xl border border-[var(--g-light)] bg-[var(--g-pale)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-[var(--g-near-black)]"><span className="mr-2">{MEDALS[index] || '•'}</span>{row.name}</p>
                  <p className="mt-1 text-sm text-[var(--g-gray-600)]">{n(row.sessions)} sessions · {pct(row.avgScore)} · {n(row.totalMinutes)} min</p>
                </div>
                <span className="rounded-full bg-[var(--g-light)] px-3 py-1 text-xs font-semibold uppercase text-[var(--g-dark)]">{row.level}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--g-light)]"><div className="h-full rounded-full bg-[var(--g-bright)]" style={{ width: `${Math.max(4, Math.min(100, row.avgScore))}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function AdminPage() {
  const { user } = useAuth()
  const { data: gamification } = useGamification()
  const [days, setDays] = useState(30)
  const [search, setSearch] = useState('')
  const { loading, error, errors, fetchAll, uOv, reg, act, ret, rec, sOv, ses, sc, dur, top } = useAdminStats(days)

  const registrationsConfig = useMemo(() => ({
    type: 'line',
    data: { labels: reg.map((item) => dayLabel(item.date)), datasets: [{ label: 'Nouvelles inscriptions', data: reg.map((item) => item.count), borderColor: SERIES.primary.border, backgroundColor: 'rgba(34,197,112,0.12)', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6 }, { label: 'Moyenne 7j', data: avg(reg.map((item) => item.count), 7), borderColor: SERIES.secondary.border, borderWidth: 1.5, borderDash: [6, 3], pointRadius: 0, fill: false, tension: 0.4 }] },
    options: baseOptions(),
  }), [reg])

  const activeConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: act.map((item) => dayLabel(item.date)), datasets: [{ label: 'Utilisateurs actifs', data: act.map((item) => item.count), backgroundColor: 'rgba(18,140,80,0.6)', borderColor: '#128c50', borderWidth: 1, borderRadius: 6, borderSkipped: false, hoverBackgroundColor: 'rgba(34,197,112,0.8)' }] },
    options: baseOptions(),
  }), [act])

  const retentionConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: ['Retention J+1', 'Retention J+7', 'Retention J+30'], datasets: [{ data: [ret.day1, ret.day7, ret.day30], backgroundColor: ['rgba(34,197,112,0.7)', 'rgba(18,140,80,0.7)', 'rgba(10,80,50,0.7)'], borderColor: ['#22c570', '#128c50', '#0a5032'], borderWidth: 2, borderRadius: 8 }] },
    options: { ...baseOptions(), indexAxis: 'y', plugins: { ...baseOptions().plugins, legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${Number(ctx.raw || 0).toFixed(1)}% reviennent` } } }, scales: { x: { min: 0, max: 100, ticks: { color: C.gray600, callback: (value) => `${value}%` }, grid: { color: 'rgba(200,216,206,0.2)' } }, y: { ticks: { color: C.nearBlack, font: { weight: '600' } }, grid: { display: false } } } },
  }), [ret.day1, ret.day7, ret.day30])

  const sprechenSessionsConfig = useMemo(() => ({
    type: 'line',
    data: { labels: ses.map((item) => dayLabel(item.date)), datasets: [{ label: 'Sessions demarrees', data: ses.map((item) => item.count), borderColor: '#00d97e', backgroundColor: 'rgba(0,217,126,0.10)', fill: true, tension: 0.4, pointRadius: 3 }, { label: 'Sessions terminees', data: ses.map((item) => Number(((item.count * sOv.completionRate) / 100).toFixed(1))), borderColor: '#128c50', borderDash: [5, 3], pointRadius: 0, fill: false, tension: 0.4 }] },
    options: baseOptions(),
  }), [ses, sOv.completionRate])

  const scoresConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: sc.map((item) => item.range), datasets: [{ label: 'Distribution des scores', data: sc.map((item) => item.count), backgroundColor: SCORE_COLORS, borderColor: SCORE_COLORS, borderRadius: 8, borderSkipped: false }] },
    options: baseOptions(),
    plugins: [avgScorePlugin(sOv.avgScoreGlobal)],
  }), [sc, sOv.avgScoreGlobal])

  const durationConfig = useMemo(() => ({
    type: 'bar',
    data: { labels: dur.map((item) => item.level), datasets: [{ label: 'Duree moyenne', data: dur.map((item) => item.avgMinutes), backgroundColor: ['#c8f5de', '#22c570', '#128c50', '#0a5032'], borderColor: ['#c8f5de', '#22c570', '#128c50', '#0a5032'], borderRadius: 8, borderSkipped: false }] },
    options: { ...baseOptions(), scales: { ...baseOptions().scales, y: { beginAtZero: true, grid: { color: 'rgba(200,216,206,0.2)' }, ticks: { color: C.gray600, callback: (value) => `${value} min` } } } },
  }), [dur])

  const exportUsers = () => download(`eam-admin-users-${days}j.csv`, csv([{ key: 'name', label: 'Nom' }, { key: 'email', label: 'Email' }, { key: 'createdAt', label: 'Inscrit le' }, { key: 'level', label: 'Niveau' }, { key: 'sprechenSessions', label: 'Sessions Sprechen' }, { key: 'isActive', label: 'Actif' }], rec.map((row) => ({ ...row, createdAt: dateFr(row.createdAt), isActive: row.isActive ? 'Oui' : 'Non' }))))
  const exportSprechen = () => download(`eam-admin-sprechen-${days}j.csv`, csv([{ key: 'name', label: 'Nom' }, { key: 'sessions', label: 'Sessions' }, { key: 'avgScore', label: 'Score moyen' }, { key: 'totalMinutes', label: 'Minutes totales' }, { key: 'level', label: 'Niveau' }], top.map((row) => ({ ...row, avgScore: pct(row.avgScore) }))))

  return (
    <div style={ADMIN_VARS} className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,112,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,217,126,0.12),transparent_22%),linear-gradient(180deg,var(--g-off-white)_0%,var(--g-white)_44%,var(--g-pale)_100%)]">
      <div className="mx-auto max-w-7xl space-y-6 px-3.5 py-5 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
        <section className={`${boxClass} p-5 sm:p-7`}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--g-light)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--g-dark)]"><span className="h-2 w-2 rounded-full bg-[var(--g-bright)]" />Admin dashboard</div>
              <div>
                <h1 className="font-display text-[clamp(2rem,1.5rem+2vw,3.4rem)] font-semibold tracking-tight text-[var(--g-near-black)]">Vision admin EAM</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--g-gray-600)]">Analyse des inscriptions, de l'activite et des performances Sprechen pour piloter la plateforme.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--g-gray-600)]">
                <span className="rounded-full border border-[var(--g-light)] bg-[var(--g-pale)] px-3 py-2">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date())}</span>
                <span className="rounded-full border border-[var(--g-light)] bg-[var(--g-pale)] px-3 py-2">Admin connecté: {user?.prenom || '—'} {user?.nom || ''}</span>
                <span className="rounded-full border border-[var(--g-light)] bg-[var(--g-pale)] px-3 py-2">XP perso: {n(gamification?.stats?.xp)}</span>
                <span className="rounded-full border border-[var(--g-light)] bg-[var(--g-pale)] px-3 py-2">Serie: {n(gamification?.stats?.streakCurrent)} j</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">{PERIODS.map((value) => <button key={value} type="button" onClick={() => setDays(value)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${days === value ? 'border-[var(--g-bright)] bg-[var(--g-bright)] text-[var(--g-white)]' : 'border-[var(--g-light)] bg-[var(--g-white)] text-[var(--g-dark)] hover:bg-[var(--g-pale)]'}`}>{value}j</button>)}</div>
              <button type="button" onClick={fetchAll} className="inline-flex items-center gap-2 rounded-full border border-[var(--g-dark)] bg-[var(--g-dark)] px-5 py-3 text-sm font-semibold text-[var(--g-white)] transition hover:bg-[var(--g-mid)]"><Icon name="refresh" size={16} className={loading ? 'animate-spin' : ''} />Actualiser</button>
            </div>
          </div>
        </section>
        {ret.day1 < 40 ? (
          <div className="rounded-3xl border border-[var(--g-light)] bg-[var(--g-pale)] px-5 py-4 text-sm font-semibold text-[var(--g-dark)]">
            Alerte retention: J+1 est sous le seuil de 40%. Prioriser onboarding et relances.
          </div>
        ) : null}
        {error ? <div className="rounded-3xl border border-[var(--g-light)] bg-[var(--g-pale)] px-5 py-4 text-sm font-semibold text-[var(--g-mid)]">{error}</div> : null}
        <section className="kpi-strip grid gap-3">
          {KPI_CARDS.map((card) => (
            <article key={card.id} className={`${boxClass} overflow-hidden p-4`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="text-2xl">{card.icon}</span>
                {errors[card.key] ? <span className="rounded-full bg-[var(--g-light)] px-2.5 py-1 text-[10px] font-semibold uppercase text-[var(--g-mid)]">indisponible</span> : null}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--g-gray-600)]">{card.label}</p>
              <div className="mt-4 min-h-[54px]">
                {loading && !errors[card.key] ? (
                  <div className="space-y-2"><Skeleton h="38px" w="75%" /><Skeleton h="14px" w="50%" /></div>
                ) : errors[card.key] ? (
                  <p className="text-sm font-semibold text-[var(--g-mid)]">Données indisponibles</p>
                ) : (
                  <>
                    <p className="text-4xl font-bold tracking-tight text-[var(--g-dark)]">{card.format(card.value({ uOv, sOv }))}</p>
                    {card.trend ? <p className="mt-1 text-xs font-medium text-[var(--g-mid)]">{card.trend({ uOv, sOv })}</p> : null}
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={exportUsers} className="rounded-full border border-[var(--g-light)] bg-[var(--g-white)] px-4 py-2.5 text-sm font-semibold text-[var(--g-dark)] transition hover:bg-[var(--g-pale)]">Export CSV utilisateurs</button>
          <button type="button" onClick={exportSprechen} className="rounded-full border border-[var(--g-light)] bg-[var(--g-white)] px-4 py-2.5 text-sm font-semibold text-[var(--g-dark)] transition hover:bg-[var(--g-pale)]">Export CSV Sprechen</button>
        </div>
        <section className="space-y-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--g-mid)]">Section</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--g-near-black)]">Utilisateurs</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--g-gray-600)]">Lecture globale des inscriptions, de l'activite et de la retention des apprenants.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel title={`Inscriptions ${days}j`} subtitle="Nouvelles inscriptions et moyenne glissante 7 jours." config={registrationsConfig} loading={loading} error={errors.reg} />
            <ChartPanel title={`Actifs ${days}j`} subtitle="Utilisateurs uniques actifs par jour." config={activeConfig} loading={loading} error={errors.act} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <ChartPanel title="Retention" subtitle="Retour des utilisateurs aux jalons J+1, J+7 et J+30." config={retentionConfig} loading={loading} error={errors.ret} />
              <div className={`${boxClass} flex flex-wrap items-center gap-3 p-4 text-sm text-[var(--g-gray-600)]`}>
                <span>Benchmark industrie: J+1 40% · J+7 25% · J+30 10%</span>
                {ret.day1 >= 40 && ret.day7 >= 25 && ret.day30 >= 10 ? <span className="rounded-full bg-[var(--g-light)] px-3 py-1 font-semibold text-[var(--g-dark)]">🏆 Au-dessus de la moyenne</span> : null}
              </div>
            </div>
            <UsersTable rows={rec} loading={loading} error={errors.rec} search={search} setSearch={setSearch} />
          </div>
        </section>
        <section className="space-y-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--g-mid)]">Section</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--g-near-black)]">Sprechen</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--g-gray-600)]">Suivi des sessions orales, des scores et des utilisateurs les plus engages.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel title={`Sessions ${days}j`} subtitle={`Sessions demarrees et projection terminee sur ${days} jours.`} config={sprechenSessionsConfig} loading={loading} error={errors.ses || errors.sOv} />
            <ChartPanel title="Distribution des scores" subtitle={`10 tranches de score, moyenne globale ${pct(sOv.avgScoreGlobal)}.`} config={scoresConfig} loading={loading} error={errors.sc || errors.sOv} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <ChartPanel title="Duree par niveau" subtitle={`Top scene: ${sOv.topScene || 'general'} · moyenne ${Number(sOv.avgDurationMinutes || 0).toFixed(1)} min.`} config={durationConfig} loading={loading} error={errors.dur} />
            <TopUsers rows={top} loading={loading} error={errors.top} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminPage

import Card from '../shared/Card'

const metricMeta = [
  { key: 'average', label: 'Score global', suffix: '/100' },
  { key: 'grammar', label: 'Grammaire', suffix: '/100' },
  { key: 'fluency', label: 'Fluidite', suffix: '/100' },
  { key: 'vocabulary', label: 'Vocabulaire', suffix: '/100' },
  { key: 'reactivity', label: 'Reactivite', suffix: '/100' },
]

export default function ScoreBreakdown({ scores }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metricMeta.map((metric) => (
        <Card key={metric.key} tone="soft" className="p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">{metric.label}</p>
          <p className="mt-4 sprechen-display text-3xl font-semibold text-white">
            {Math.round(scores?.[metric.key] || 0)}
            <span className="ml-1 text-base text-white/42">{metric.suffix}</span>
          </p>
          <div className="mt-4 h-2 rounded-full bg-white/8">
            <div
              className="h-2 rounded-full bg-[linear-gradient(90deg,#f76f45_0%,#f9c15c_45%,#6ef0c4_100%)]"
              style={{ width: `${Math.min(Math.max(scores?.[metric.key] || 0, 0), 100)}%` }}
            />
          </div>
        </Card>
      ))}
    </div>
  )
}

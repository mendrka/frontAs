import { useEffect, useMemo, useState } from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { useProgressStore } from '../../stores/progressStore'
import { getPreviousSessionScores } from '../../utils'
import Card from '../shared/Card'

const axes = [
  { key: 'phonology', label: 'Phonologie' },
  { key: 'fluency', label: 'Fluidite' },
  { key: 'vocabulary', label: 'Vocabulaire' },
  { key: 'grammar', label: 'Grammaire' },
  { key: 'reactivity', label: 'Reactivite' },
]

export default function SpokenDNA({ scores }) {
  const sessionHistory = useProgressStore((state) => state.sessionHistory)
  const previousScores = getPreviousSessionScores(sessionHistory)
  const [animatedScores, setAnimatedScores] = useState({
    phonology: 0,
    fluency: 0,
    vocabulary: 0,
    grammar: 0,
    reactivity: 0,
  })

  useEffect(() => {
    const frame = window.setTimeout(() => {
      setAnimatedScores({
        phonology: scores?.phonology || 0,
        fluency: scores?.fluency || 0,
        vocabulary: scores?.vocabulary || 0,
        grammar: scores?.grammar || 0,
        reactivity: scores?.reactivity || 0,
      })
    }, 80)

    return () => window.clearTimeout(frame)
  }, [scores])

  const data = useMemo(
    () =>
      axes.map((axis) => ({
        axis: axis.label,
        current: animatedScores[axis.key] || 0,
        previous: previousScores?.[axis.key] || 0,
      })),
    [animatedScores, previousScores]
  )

  return (
    <Card tone="elevated" className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Speaking DNA</p>
          <h3 className="mt-3 sprechen-display text-3xl font-semibold text-white">Ton profil oral en radar</h3>
        </div>
        <p className="text-sm text-white/56">La ligne fantome montre la session precedente.</p>
      </div>

      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.12)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
            <Radar
              name="Avant"
              dataKey="previous"
              stroke="rgba(255,255,255,0.22)"
              fill="rgba(255,255,255,0.06)"
              fillOpacity={0.18}
            />
            <Radar
              name="Maintenant"
              dataKey="current"
              stroke="#f8734b"
              fill="rgba(248,115,75,0.34)"
              fillOpacity={0.55}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

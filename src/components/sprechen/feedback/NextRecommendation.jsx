import { useMemo } from 'react'

export const NextRecommendation = ({ level, theme }) => {
  const suggestion = useMemo(() => {
    if (!level) return 'Refaire une session courte pour consolider.'
    if (level === 'A1') return 'Refaire un thème A1, puis passer à A2 quand tu es à l’aise.'
    if (level === 'A2') return 'Varier les thèmes A2 et ajouter 3 nouveaux mots par session.'
    if (level === 'B1') return 'Argumenter plus: donne 2 raisons + un exemple.'
    return 'Défi: réponds plus vite, avec des connecteurs (weil, obwohl, deshalb).'
  }, [level])

  return (
    <div className="mt-6 rounded-[26px] border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-semibold text-white/90">Prochaine session</p>
      <p className="mt-2 text-sm leading-6 text-white/68">{suggestion}</p>
      {theme?.id && <p className="mt-3 text-xs text-white/45">Basé sur le thème: {theme.id}</p>}
    </div>
  )
}

export default NextRecommendation


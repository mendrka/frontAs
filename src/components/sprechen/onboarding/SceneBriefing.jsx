export const SceneBriefing = ({ theme, level, character, onStart }) => {
  return (
    <div className="grid gap-5 rounded-[32px] border border-white/10 bg-white/6 p-6 sm:p-8 xl:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">Briefing</p>
        <p className="mt-3 sprechen-display text-3xl font-semibold text-white">
          {theme?.emoji} {theme?.label || 'Scène'}
        </p>
        <p className="mt-3 text-sm leading-7 text-white/68">{theme?.scenarioBriefing || 'Prépare-toi à parler.'}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {level && (
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white/75">
              Niveau {String(level).toUpperCase()}
            </span>
          )}
          {character?.name && (
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white/75">
              Partenaire: {character.name}
            </span>
          )}
          {theme?.duration && (
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white/75">
              {theme.duration}
            </span>
          )}
        </div>
      </div>
      <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
        <p className="text-sm font-semibold text-white/85">Objectif</p>
        <p className="mt-2 text-sm leading-7 text-white/68">
          Réponds vite, utilise au moins 2 mots du vocabulaire, et demande une précision si tu bloques.
        </p>
        <button
          type="button"
          onClick={() => onStart?.()}
          className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Lancer la session
        </button>
      </div>
    </div>
  )
}

export default SceneBriefing

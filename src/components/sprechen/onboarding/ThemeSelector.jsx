import { getThemesForLevel } from '../data/themes'

export const ThemeSelector = ({ level = 'A1', value, onChange }) => {
  const themes = getThemesForLevel(level)
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {themes.map((theme) => {
        const active = value?.id === theme.id
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange?.(theme)}
            className={`rounded-[32px] border p-5 text-left transition ${
              active ? 'border-emerald-300/55 bg-emerald-300/18' : 'border-white/10 bg-white/6 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl">{theme.emoji}</p>
                <p className="mt-3 sprechen-display text-2xl font-semibold text-white">{theme.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/68">{theme.description}</p>
              </div>
              <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">
                {theme.duration}
              </span>
            </div>
            <p className="mt-4 rounded-[22px] bg-black/20 px-4 py-3 text-sm text-white/72">
              {theme.scenarioBriefing}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export default ThemeSelector

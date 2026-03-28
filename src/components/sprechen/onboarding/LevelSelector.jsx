import { LEVEL_OPTIONS } from '../data/themes'

export const LevelSelector = ({ value, onChange }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {LEVEL_OPTIONS.map((level) => {
        const active = value === level.id
        return (
          <button
            key={level.id}
            type="button"
            onClick={() => onChange?.(level.id)}
            className={`rounded-[28px] border p-5 text-left transition ${
              active ? 'border-cyan-300/55 bg-cyan-300/18' : 'border-white/10 bg-white/6 hover:bg-white/10'
            }`}
          >
            <span className="mb-4 inline-flex rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">
              {level.label}
            </span>
            <p className="sprechen-display text-xl font-semibold text-white">{level.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/68">{level.description}</p>
          </button>
        )
      })}
    </div>
  )
}

export default LevelSelector

import { CHARACTER_LIST } from '../data/characters'
import Avatar from '../components/shared/Avatar'

export const CharacterSelector = ({ options = CHARACTER_LIST, value, onChange }) => {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {options.map((character) => {
        const active = value?.id === character.id
        return (
          <button
            key={character.id}
            type="button"
            onClick={() => onChange?.(character)}
            className={`rounded-[30px] border p-5 text-left transition ${
              active ? 'border-fuchsia-300/50 bg-fuchsia-300/16' : 'border-white/10 bg-white/6 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <Avatar character={character} />
              <div>
                <p className="sprechen-display text-2xl font-semibold text-white">{character.name}</p>
                <p className="text-sm text-white/68">{character.role}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.26em] text-white/42">{character.catchphrase}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">{character.personality}</p>
          </button>
        )
      })}
    </div>
  )
}

export default CharacterSelector

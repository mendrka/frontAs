import { Mic2, Users } from 'lucide-react'

const options = [
  {
    id: 'training',
    title: 'Training IA',
    subtitle: 'Conversation immersive avec personnage IA',
    icon: Mic2,
    available: true,
  },
  {
    id: 'duo',
    title: 'Duo',
    subtitle: 'Mode 2 joueurs (bientôt)',
    icon: Users,
    available: false,
  },
]

export const ModeSelector = ({ value, onChange }) => {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {options.map((option) => {
        const Icon = option.icon
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            disabled={!option.available}
            onClick={() => option.available && onChange?.(option.id)}
            className={`rounded-[28px] border p-5 text-left transition ${
              active
                ? 'border-orange-300/60 bg-orange-300/18'
                : 'border-white/10 bg-white/6 hover:border-white/18 hover:bg-white/10'
            } ${!option.available ? 'opacity-55' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Icon size={20} />
              </span>
              <div>
                <p className="sprechen-display text-xl font-semibold text-white">{option.title}</p>
                <p className="text-sm text-white/65">{option.subtitle}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default ModeSelector

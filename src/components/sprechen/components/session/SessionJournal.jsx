import { BookMarked, Flame, PlusCircle } from 'lucide-react'
import { useProgressStore } from '../../stores/progressStore'
import { useSessionStore } from '../../stores/sessionStore'
import Badge from '../shared/Badge'
import Button from '../shared/Button'
import Card from '../shared/Card'

export default function SessionJournal() {
  const sessionHistory = useProgressStore((state) => state.sessionHistory)
  const streakDays = useProgressStore((state) => state.streakDays)
  const globalXP = useProgressStore((state) => state.globalXP)
  const sessionFeedback = useSessionStore((state) => state.sessionFeedback)
  const selectedTheme = useSessionStore((state) => state.selectedTheme)
  const setCurrentView = useSessionStore((state) => state.setCurrentView)
  const backToOnboarding = useSessionStore((state) => state.backToOnboarding)

  const entries = [...sessionHistory].reverse()

  return (
    <div className="relative min-h-[680px] overflow-hidden rounded-[24px] border border-white/10 bg-[#060811] p-4 text-white sm:min-h-[760px] sm:rounded-[36px] sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,191,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,123,87,0.16),transparent_35%),linear-gradient(145deg,#070913_0%,#0c1020_55%,#070913_100%)]" />

      <div className="relative z-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="neutral" className="mb-4">
              Journal
            </Badge>
            <h2 className="sprechen-display text-[clamp(2rem,1.35rem+2.6vw,3rem)] font-semibold text-white">Tes scenes laissees en memoire</h2>
            <p className="mt-3 text-white/64">
              {entries.length} session{entries.length > 1 ? 's' : ''} archivee{entries.length > 1 ? 's' : ''} • {globalXP} XP • {streakDays} jour{streakDays > 1 ? 's' : ''} de streak
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setCurrentView(sessionFeedback ? 'feedback' : selectedTheme ? 'session' : 'onboarding')}
            >
              {sessionFeedback ? 'Retour feedback' : selectedTheme ? 'Retour scene' : 'Retour'}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => backToOnboarding()}>
              <PlusCircle size={16} />
              Nouvelle scene
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {entries.length === 0 && (
            <Card tone="soft" className="p-6 text-center sm:p-8">
              <BookMarked className="mx-auto h-10 w-10 text-white/45" />
              <p className="mt-4 text-lg text-white">Aucune session enregistree pour le moment.</p>
              <p className="mt-2 text-sm text-white/56">Termine une scene pour remplir cette timeline.</p>
            </Card>
          )}

          {entries.map((entry) => (
            <Card key={entry.id} tone="soft" className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{entry.l}</Badge>
                    <Badge variant="neutral">{entry.d}</Badge>
                    <Badge variant="neutral">{entry.characterName}</Badge>
                  </div>
                  <h3 className="mt-4 sprechen-display text-xl font-semibold text-white sm:text-2xl">{entry.themeLabel}</h3>
                  <p className="mt-2 text-sm text-white/62">
                    Score {entry.s}/100 • +{entry.x} XP • {entry.hintsUsed || 0} hint{entry.hintsUsed > 1 ? 's' : ''}.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-orange-100">
                  <Flame size={16} />
                  Scene archivee
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {entry.turns?.slice(0, 4).map((turn, index) => (
                  <div
                    key={`${entry.id}-${index}`}
                    className={`${index > 1 ? 'hidden sm:block ' : ''}rounded-[20px] px-4 py-3 text-sm line-clamp-3 ${
                      turn.r === 'ai' ? 'bubble-ai' : 'bubble-user'
                    }`}
                  >
                    {turn.m}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

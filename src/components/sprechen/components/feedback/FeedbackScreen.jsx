import { BookOpen, RotateCcw } from 'lucide-react'
import { useProgressStore } from '../../stores/progressStore'
import { useSessionStore } from '../../stores/sessionStore'
import Avatar from '../shared/Avatar'
import Badge from '../shared/Badge'
import Button from '../shared/Button'
import Card from '../shared/Card'
import ScoreBreakdown from './ScoreBreakdown'
import SpokenDNA from './SpokenDNA'
import XPAnimation from './XPAnimation'

export default function FeedbackScreen() {
  const {
    sessionFeedback,
    selectedCharacter,
    selectedTheme,
    selectedLevel,
    collectedWords,
    goToJournal,
    backToOnboarding,
  } = useSessionStore()

  const globalXP = useProgressStore((state) => state.globalXP)
  const level = useProgressStore((state) => state.level)

  if (!sessionFeedback || !selectedCharacter || !selectedTheme) {
    return null
  }

  return (
    <div className="relative min-h-[780px] overflow-hidden rounded-[36px] border border-white/10 bg-[#05070f] p-5 text-white sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(248,115,75,0.17),transparent_30%),linear-gradient(145deg,#060913_0%,#0b1021_50%,#060913_100%)]" />

      <div className="relative z-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <Avatar character={selectedCharacter} size="lg" />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">{selectedLevel}</Badge>
                <Badge variant="neutral">{selectedTheme.label}</Badge>
              </div>
              <h2 className="mt-4 sprechen-display text-4xl font-semibold text-white">Debrief avec {selectedCharacter.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">{sessionFeedback.characterMessage}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => goToJournal()}>
              <BookOpen size={16} />
              Ouvrir le journal
            </Button>
            <Button onClick={() => backToOnboarding()}>
              <RotateCcw size={16} />
              Rejouer une scene
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <XPAnimation feedback={sessionFeedback} globalXP={globalXP} level={level} />
          <ScoreBreakdown scores={sessionFeedback.scores} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_0.92fr]">
            <SpokenDNA scores={sessionFeedback.scores} />

            <div className="space-y-5">
              <Card tone="soft" className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Forces</p>
                <div className="mt-4 space-y-3">
                  {sessionFeedback.strengths?.map((strength) => (
                    <div key={strength} className="rounded-[20px] border border-white/8 bg-white/6 px-4 py-3 text-sm text-white/76">
                      {strength}
                    </div>
                  ))}
                </div>
              </Card>

              <Card tone="soft" className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">A retravailler</p>
                <div className="mt-4 space-y-3">
                  {sessionFeedback.toImprove?.map((item) => (
                    <div key={item} className="rounded-[20px] border border-white/8 bg-white/6 px-4 py-3 text-sm text-white/76">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[22px] border border-orange-300/22 bg-orange-400/10 px-4 py-4 text-sm text-white/80">
                  Conseil concret: {sessionFeedback.tip}
                </div>
              </Card>

              <Card tone="soft" className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Mots captures</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {collectedWords.length === 0 && <p className="text-sm text-white/54">Aucun mot capture cette fois.</p>}
                  {collectedWords.map((word) => (
                    <Badge key={word} variant="neutral">
                      {word}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

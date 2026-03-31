import { startTransition, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronUp, Info, Mic2, Sparkles, Users } from 'lucide-react'
import { CHARACTER_LIST } from '../../data/characters'
import { getThemesForLevel, LEVEL_OPTIONS } from '../../data/themes'
import { useSessionStore } from '../../stores/sessionStore'
import { getCharacterOptionsForTheme, pickDefaultCharacter, resolveTheme } from '../../utils'
import Avatar from '../shared/Avatar'
import Badge from '../shared/Badge'
import Button from '../shared/Button'
import Card from '../shared/Card'

const stepMeta = [
  { id: 'mode', label: 'Mode' },
  { id: 'level', label: 'Niveau' },
  { id: 'theme', label: 'Scene' },
  { id: 'character', label: 'Role' },
  { id: 'briefing', label: 'Briefing' },
]

const modeOptions = [
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
    subtitle: 'Mode 2 joueurs prevu en V2',
    icon: Users,
    available: false,
  },
]

export default function OnboardingWizard({ presetLevel = null, presetThemeId = null }) {
  const {
    selectedMode,
    selectedLevel,
    selectedTheme,
    selectedCharacter,
    setSelectedMode,
    setSelectedLevel,
    setSelectedTheme,
    setSelectedCharacter,
    setCurrentView,
    startSession,
  } = useSessionStore()

  const [step, setStep] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [mobileGuideOpen, setMobileGuideOpen] = useState(false)
  const [mobilePrepOpen, setMobilePrepOpen] = useState(false)

  useEffect(() => {
    if (presetLevel && !selectedLevel) {
      setSelectedLevel(presetLevel)
    }
  }, [presetLevel, selectedLevel, setSelectedLevel])

  useEffect(() => {
    if (!presetThemeId) return
    const foundTheme = resolveTheme(presetThemeId)
    if (!foundTheme) return
    if (!selectedLevel) setSelectedLevel(foundTheme.level)
    if (!selectedTheme || selectedTheme.id !== foundTheme.id) {
      setSelectedTheme(foundTheme)
    }
  }, [presetThemeId, selectedLevel, selectedTheme, setSelectedLevel, setSelectedTheme])

  const themesForLevel = useMemo(() => getThemesForLevel(selectedLevel || presetLevel || 'A1'), [presetLevel, selectedLevel])
  const compatibleCharacters = useMemo(
    () => (selectedTheme ? getCharacterOptionsForTheme(selectedTheme.id) : CHARACTER_LIST),
    [selectedTheme]
  )

  useEffect(() => {
    if (selectedTheme && compatibleCharacters.length && !selectedCharacter) {
      setSelectedCharacter(pickDefaultCharacter(selectedTheme.id))
    }
  }, [compatibleCharacters, selectedCharacter, selectedTheme, setSelectedCharacter])

  useEffect(() => {
    if (countdown === null) return undefined

    if (countdown === 0) {
      const character = selectedCharacter || pickDefaultCharacter(selectedTheme?.id)
      startTransition(() => {
        startSession({
          mode: selectedMode || 'training',
          level: selectedLevel || presetLevel || 'A1',
          theme: selectedTheme,
          character,
        })
      })
      return undefined
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 650)
    return () => window.clearTimeout(timer)
  }, [countdown, presetLevel, selectedCharacter, selectedLevel, selectedMode, selectedTheme, startSession])

  useEffect(() => {
    setMobileGuideOpen(false)
    setMobilePrepOpen(false)
  }, [step, selectedTheme?.id, selectedCharacter?.id])

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(selectedMode)
    if (step === 1) return Boolean(selectedLevel || presetLevel)
    if (step === 2) return Boolean(selectedTheme)
    if (step === 3) return Boolean(selectedCharacter)
    return Boolean(selectedTheme && (selectedLevel || presetLevel))
  }, [presetLevel, selectedCharacter, selectedLevel, selectedMode, selectedTheme, step])

  const handleNext = () => {
    if (!canContinue) return
    setStep((current) => Math.min(current + 1, stepMeta.length - 1))
  }

  const handleBack = () => {
    if (step === 0) return
    setStep((current) => Math.max(current - 1, 0))
  }

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {modeOptions.map((option) => {
            const Icon = option.icon
            const active = selectedMode === option.id

            return (
              <button
                key={option.id}
                type="button"
                disabled={!option.available}
                onClick={() => option.available && setSelectedMode(option.id)}
                className={`rounded-[24px] border p-4 text-left transition sm:rounded-[28px] sm:p-5 ${
                  active
                    ? 'border-orange-300/60 bg-orange-300/18 shadow-[0_24px_55px_-35px_rgba(248,99,63,0.9)]'
                    : 'border-white/10 bg-white/6 hover:border-white/18 hover:bg-white/10'
                } ${!option.available ? 'opacity-55' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white sm:h-12 sm:w-12">
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="sprechen-display text-lg font-semibold text-white sm:text-xl">{option.title}</p>
                      <p className={active ? 'text-sm text-white/65' : 'hidden text-sm text-white/65 sm:block'}>
                        {option.subtitle}
                      </p>
                    </div>
                  </div>
                  {!option.available && <Badge variant="warning">V2</Badge>}
                </div>
              </button>
            )
          })}
        </div>
      )
    }

    if (step === 1) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {LEVEL_OPTIONS.map((level) => {
            const active = (selectedLevel || presetLevel) === level.id
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setSelectedLevel(level.id)}
                className={`rounded-[24px] border p-4 text-left transition sm:rounded-[28px] sm:p-5 ${
                  active
                    ? 'border-cyan-300/55 bg-cyan-300/18'
                    : 'border-white/10 bg-white/6 hover:border-white/18 hover:bg-white/10'
                }`}
              >
                <Badge variant="level" className="mb-4">
                  {level.label}
                </Badge>
                <p className="sprechen-display text-lg font-semibold text-white sm:text-xl">{level.title}</p>
                <p className={active ? 'mt-2 text-sm leading-6 text-white/68' : 'mt-2 hidden text-sm leading-6 text-white/68 sm:block'}>
                  {level.description}
                </p>
              </button>
            )
          })}
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {themesForLevel.map((theme) => {
            const active = selectedTheme?.id === theme.id
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme)
                  setSelectedCharacter(pickDefaultCharacter(theme.id))
                }}
                className={`rounded-[26px] border p-4 text-left transition sm:rounded-[32px] sm:p-5 ${
                  active
                    ? 'border-emerald-300/55 bg-emerald-300/18'
                    : 'border-white/10 bg-white/6 hover:border-white/18 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl sm:text-3xl">{theme.emoji}</p>
                    <p className="mt-3 sprechen-display text-xl font-semibold text-white sm:text-2xl">{theme.label}</p>
                    <p className={active ? 'mt-2 text-sm leading-6 text-white/68' : 'mt-2 hidden text-sm leading-6 text-white/68 sm:block'}>
                      {theme.description}
                    </p>
                  </div>
                  <Badge variant="accent">{theme.duration}</Badge>
                </div>
                <p className={active ? 'mt-4 rounded-[18px] bg-black/20 px-4 py-3 text-sm text-white/72 sm:rounded-[22px]' : 'mt-4 hidden rounded-[18px] bg-black/20 px-4 py-3 text-sm text-white/72 sm:block sm:rounded-[22px]'}>
                  {theme.scenarioBriefing}
                </p>
              </button>
            )
          })}
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {compatibleCharacters.map((character) => {
            const active = selectedCharacter?.id === character.id
            return (
              <button
                key={character.id}
                type="button"
                onClick={() => setSelectedCharacter(character)}
                className={`rounded-[26px] border p-4 text-left transition sm:rounded-[30px] sm:p-5 ${
                  active
                    ? 'border-fuchsia-300/50 bg-fuchsia-300/16'
                    : 'border-white/10 bg-white/6 hover:border-white/18 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar character={character} />
                  <div>
                    <p className="sprechen-display text-xl font-semibold text-white sm:text-2xl">{character.name}</p>
                    <p className="text-sm text-white/68">{character.role}</p>
                    <p className={active ? 'mt-1 text-xs uppercase tracking-[0.26em] text-white/42' : 'mt-1 hidden text-xs uppercase tracking-[0.26em] text-white/42 sm:block'}>
                      {character.catchphrase}
                    </p>
                  </div>
                </div>
                <p className={active ? 'mt-4 text-sm leading-6 text-white/70' : 'mt-4 hidden text-sm leading-6 text-white/70 sm:block'}>
                  {character.personality}
                </p>
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <div className="grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
        <Card tone="elevated" className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar character={selectedCharacter} />
            <div>
              <Badge variant="accent" className="mb-3">
                {selectedLevel || presetLevel}
              </Badge>
              <p className="sprechen-display text-2xl font-semibold text-white sm:text-3xl">{selectedTheme?.label}</p>
              <p className="mt-2 text-sm text-white/68">{selectedCharacter?.role}</p>
            </div>
          </div>
          <p className="mt-6 text-base leading-7 text-white/78">{selectedTheme?.scenarioBriefing}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Card tone="soft" className="p-3.5 sm:p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Objectif</p>
              <p className="mt-3 text-sm leading-6 text-white/76">{selectedTheme?.userObjective}</p>
            </Card>
            <Card tone="soft" className="p-3.5 sm:p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Twist</p>
              <p className="mt-3 text-sm leading-6 text-white/76">{selectedTheme?.possibleTwist}</p>
            </Card>
          </div>
        </Card>

        <Card tone="soft" className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Preparation compacte</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/72 transition hover:bg-white/14 hover:text-white sm:hidden"
              onClick={() => setMobilePrepOpen((value) => !value)}
              aria-expanded={mobilePrepOpen}
            >
              <Info size={14} />
              Focus
              {mobilePrepOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <div className={mobilePrepOpen ? 'mt-4 block sm:block' : 'mt-4 hidden sm:block'}>
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Vocabulaire a recycler</p>
            <div className="mt-4 flex flex-wrap gap-2">
            {selectedTheme?.vocabularyHints?.map((hint) => (
              <Badge key={hint} variant="neutral">
                {hint}
              </Badge>
            ))}
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.28em] text-white/45">Focus grammaire</p>
            <ul className="mt-4 space-y-2 text-sm text-white/74">
            {selectedTheme?.grammarFocus?.map((focus) => (
              <li key={focus}>- {focus}</li>
            ))}
          </ul>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full sm:mt-8"
            onClick={() => setCountdown(3)}
            disabled={!selectedTheme}
          >
            <Sparkles size={18} />
            Entrer dans la scene
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-[680px] overflow-hidden rounded-[24px] border border-white/10 bg-[#070814] p-4 text-white sm:min-h-[760px] sm:rounded-[36px] sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,124,65,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(75,208,255,0.12),transparent_30%),linear-gradient(140deg,#090b16_10%,#0f1328_55%,#090b16_100%)]" />
      <div className="relative z-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="neutral" className="mb-4">
              Sprechen
            </Badge>
            <h2 className="sprechen-display text-[clamp(2rem,1.35rem+3.6vw,3.2rem)] font-semibold tracking-tight leading-[0.95] text-white">
              Tu n apprends pas l allemand. Tu survis a des scenes.
            </h2>
            <p className="mt-4 hidden max-w-3xl text-base leading-7 text-white/68 sm:block">
              Une micro-aventure orale, un personnage, un decor, une tension. L objectif est de tenir la scene assez longtemps pour que la langue cesse d etre un exercice.
            </p>
            <div className="mt-4 sm:hidden">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/78 transition hover:bg-white/14 hover:text-white"
                onClick={() => setMobileGuideOpen((value) => !value)}
                aria-expanded={mobileGuideOpen}
              >
                <Info size={14} />
                Briefing
                {mobileGuideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {mobileGuideOpen && (
                <p className="mt-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-6 text-white/72">
                  Une micro-aventure orale, un personnage, un decor, une tension. L objectif est de tenir la scene assez longtemps pour que la langue cesse d etre un exercice.
                </p>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setCurrentView('journal')}>
            <BookOpen size={16} />
            Journal
          </Button>
        </div>

        <div className="mt-8 -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {stepMeta.map((item, index) => (
            <div
              key={item.id}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs sm:gap-3 sm:px-4 sm:text-sm ${
                index === step
                  ? 'border-white/26 bg-white/12 text-white'
                  : index < step
                    ? 'border-orange-300/35 bg-orange-300/15 text-orange-100'
                    : 'border-white/10 bg-white/6 text-white/52'
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] sm:h-6 sm:w-6 sm:text-xs">
                {index + 1}
              </span>
              {item.label}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={handleBack} disabled={step === 0 || countdown !== null}>
            <ArrowLeft size={16} />
            Retour
          </Button>

          {step < stepMeta.length - 1 ? (
            <Button className="w-full sm:w-auto" onClick={handleNext} disabled={!canContinue || countdown !== null}>
              Continuer
              <ArrowRight size={16} />
            </Button>
          ) : (
            <p className="text-sm text-white/55">
              {countdown !== null
                ? `Demarrage dans ${countdown}...`
                : 'Le decompte apparait ici avant l entree en scene.'}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#05070f]/72 backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="sprechen-display text-[clamp(4rem,18vw,7rem)] font-semibold leading-none text-white"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

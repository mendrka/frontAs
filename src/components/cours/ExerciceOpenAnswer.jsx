import { useMemo, useState } from 'react'
import { useLang } from '@context/LangContext'
import { normalizeAnswer } from '@utils/normalizeAnswer'
import { cx } from '@utils/ui'
import {
  exerciseBadge,
  exerciseShell,
  explainBox,
  feedbackClass,
  inputBase,
  primaryButton,
  questionCard,
  questionText,
  subText,
} from './exerciseUi'

function keywordScore(value, keywords) {
  const user = normalizeAnswer(value)
  if (!user || !Array.isArray(keywords) || keywords.length === 0) return 0
  const matched = keywords.filter((keyword) => user.includes(normalizeAnswer(keyword))).length
  return matched / keywords.length
}

function ExerciceOpenAnswer({ data, onValide }) {
  const { t } = useLang()
  const [valeur, setValeur] = useState('')
  const [valide, setValide] = useState(false)
  const [correct, setCorrect] = useState(null)
  const [ratio, setRatio] = useState(0)

  const acceptedAnswers = useMemo(() => {
    if (Array.isArray(data?.accepte) && data.accepte.length > 0) return data.accepte
    return data?.reponse ? [data.reponse] : []
  }, [data?.accepte, data?.reponse])

  const expectedAnswer = useMemo(() => {
    return data?.reponse || data?.modelAnswerFr || acceptedAnswers[0] || ''
  }, [acceptedAnswers, data?.modelAnswerFr, data?.reponse])

  const promptTxt = useMemo(() => {
    const de = data?.questionDe || data?.promptDe || data?.questionFr || data?.question
    const fr = data?.questionFr || data?.promptFr || data?.question
    return t(de || fr, fr || de)
  }, [data?.promptDe, data?.promptFr, data?.question, data?.questionDe, data?.questionFr, t])

  const helperTxt = useMemo(() => {
    if (data?.textarea) {
      return t(
        'Antworte mit ein oder mehreren deutschen Saetzen.',
        'Reponds avec une ou plusieurs phrases en allemand.'
      )
    }
    return t('Antworte auf Deutsch.', 'Reponds en allemand.')
  }, [data?.textarea, t])

  const sourceLabel = useMemo(() => {
    const type = String(data?.sourceType || '').toLowerCase()
    if (type === 'situation') return t('Situation', 'Situation')
    if (type === 'oral_simulation') return t('Simulation', 'Simulation')
    if (type === 'argumentation') return t('Argumentation', 'Argumentation')
    if (type === 'transformation') return t('Transformation', 'Transformation')
    return t('Freie Antwort', 'Reponse libre')
  }, [data?.sourceType, t])

  const handleValider = () => {
    if (!valeur.trim() || valide) return

    const evaluationMode = data?.evaluationMode || 'exact'
    let ok = false
    let score = 0

    if (evaluationMode === 'keywords' && Array.isArray(data?.keywords) && data.keywords.length > 0) {
      score = keywordScore(valeur, data.keywords)
      ok = score >= Number(data?.keywordThreshold || 0.6)
    } else {
      ok = acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(valeur))
      score = ok ? 1 : 0
    }

    setCorrect(ok)
    setRatio(score)
    setValide(true)
    setTimeout(() => onValide(ok, {
      userAnswer: valeur,
      expectedAnswer,
      hintsUsed: 0,
    }), 900)
  }

  const handleKey = (event) => {
    if (!data?.textarea && event.key === 'Enter') handleValider()
  }

  return (
    <div className={exerciseShell}>
      <div className={exerciseBadge}>{sourceLabel}</div>

      <div className={questionCard}>
        <p className={questionText}>{promptTxt}</p>
        <p className={subText}>{helperTxt}</p>
      </div>

      {!valide && (
        <div className="flex flex-col gap-3">
          {data?.textarea ? (
            <textarea
              className={cx(inputBase, 'min-h-[160px] resize-y')}
              placeholder={t('Schreibe deine Antwort...', 'Ecris ta reponse...')}
              value={valeur}
              onChange={(event) => setValeur(event.target.value)}
              autoFocus
              spellCheck={false}
            />
          ) : (
            <input
              type="text"
              className={inputBase}
              placeholder={t('Schreibe auf Deutsch...', 'Ecris en allemand...')}
              value={valeur}
              onChange={(event) => setValeur(event.target.value)}
              onKeyDown={handleKey}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          )}

          <button
            className={cx(primaryButton, 'self-end')}
            onClick={handleValider}
            disabled={!valeur.trim()}
            type="button"
          >
            {t('Prufen', 'Valider')}
          </button>
        </div>
      )}

      {valide && (
        <>
          <div className={feedbackClass(correct)}>
            {correct
              ? t('Richtig!', 'Correct !')
              : `${t('Antwort erwartet', 'Reponse attendue')} : ${expectedAnswer}`}
          </div>

          <div className={explainBox}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">
              {t('Feedback', 'Feedback')}
            </div>
            <div className="space-y-2">
              {data?.evaluationMode === 'keywords' && Array.isArray(data?.keywords) && data.keywords.length > 0 ? (
                <div>
                  <strong>{t('Deckung', 'Couverture')}:</strong> {Math.round(ratio * 100)}%
                </div>
              ) : null}
              {data?.explication ? (
                <div>
                  <strong>{t('Erklarung', 'Explication')}:</strong> {data.explication}
                </div>
              ) : null}
              {Array.isArray(data?.criteria) && data.criteria.length > 0 ? (
                <div>
                  <strong>{t('Kriterien', 'Criteres')}:</strong> {data.criteria.join(' · ')}
                </div>
              ) : null}
              {Array.isArray(data?.keywords) && data.keywords.length > 0 ? (
                <div>
                  <strong>{t('Schlusselworter', 'Mots-cles')}:</strong> {data.keywords.join(', ')}
                </div>
              ) : null}
              {Array.isArray(data?.bonusExpressions) && data.bonusExpressions.length > 0 ? (
                <div>
                  <strong>{t('Bonus', 'Bonus')}:</strong> {data.bonusExpressions.join(' · ')}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExerciceOpenAnswer

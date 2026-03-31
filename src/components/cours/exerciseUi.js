import { buttonClass, cardClass, cx, inputClass } from '@utils/ui'

export const exerciseShell = cx(cardClass.base, 'flex flex-col gap-4 p-4 sm:gap-5 sm:p-6')
export const exerciseBadge =
  'inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-brand-border/70 bg-brand-sky/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-blue sm:text-xs sm:tracking-[0.24em]'
export const questionCard = 'rounded-[1.2rem] bg-brand-sky/55 p-4 sm:rounded-[1.5rem] sm:p-5'
export const questionText = 'font-display text-xl font-semibold tracking-tight text-brand-text sm:text-2xl'
export const subText = 'mt-2 text-[15px] leading-relaxed text-brand-brown sm:text-sm'
export const feedbackClass = (correct) =>
  cx(
    'rounded-[1.2rem] border px-4 py-3 text-sm font-semibold sm:rounded-[1.4rem]',
    correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
  )
export const explainBox = 'rounded-[1.2rem] border border-brand-border/70 bg-white/72 p-4 text-sm leading-relaxed text-brand-brown sm:rounded-[1.5rem]'
export const optionBase =
  'flex w-full items-center gap-3 rounded-[1.15rem] border border-brand-border/80 bg-white/80 px-3.5 py-3 text-left text-sm text-brand-text transition hover:border-brand-blue/50 hover:bg-brand-sky/65 disabled:cursor-not-allowed disabled:opacity-80 sm:rounded-[1.4rem] sm:px-4'
export const optionSelected = 'border-brand-blue bg-brand-sky/80 shadow-soft'
export const optionCorrect = 'border-emerald-300 bg-emerald-50 text-emerald-700'
export const optionWrong = 'border-rose-300 bg-rose-50 text-rose-700'
export const inputBase = inputClass
export const ghostButton = buttonClass.ghost
export const primaryButton = buttonClass.primary
export const outlineButton = buttonClass.outline

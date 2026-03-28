import { useSprechenUIStore } from '../stores/sprechenUIStore'

export const ServiceIndicator = () => {
  const debug = useSprechenUIStore((s) => s.debug)
  const indicator = useSprechenUIStore((s) => s.serviceIndicator)
  if (!debug) return null

  return (
    <div className="absolute bottom-4 right-4 z-30 rounded-[18px] border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/75 backdrop-blur">
      <div>ai: {indicator?.ai || 'n/a'}</div>
      <div>stt: {indicator?.stt || 'n/a'}</div>
      <div>tts: {indicator?.tts || 'n/a'}</div>
    </div>
  )
}

export default ServiceIndicator


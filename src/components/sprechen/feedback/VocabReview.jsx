export const VocabReview = ({ words = [] }) => {
  if (!words?.length) return null
  return (
    <div className="mt-6 rounded-[26px] border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-semibold text-white/90">Mots capturés</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((word) => (
          <span
            key={word}
            className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/80"
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}

export default VocabReview


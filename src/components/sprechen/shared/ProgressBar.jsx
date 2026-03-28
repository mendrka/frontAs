export const ProgressBar = ({ value = 0, className = '' }) => {
  const percent = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`progress-track ${className}`}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default ProgressBar


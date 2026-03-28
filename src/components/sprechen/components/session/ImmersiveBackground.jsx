import { useBackground } from '../../hooks/useBackground'

const PARTICLE_CONFIGS = {
  cafe: {
    type: 'steam',
    positions: [15, 22, 35, 42, 55, 63, 72, 80],
    durations: [4.5, 5.2, 4.8, 6.1, 5.0, 4.3, 5.7, 4.9],
    delays: [0, 1.2, 0.4, 2.1, 0.8, 1.7, 0.2, 2.5],
  },
  restaurant: {
    type: 'candle',
    positions: [20, 50, 78],
    durations: [2.8, 3.2, 2.5],
    delays: [0, 0.8, 1.5],
  },
  metro: {
    type: 'rain',
    positions: [5, 12, 18, 26, 34, 42, 51, 58, 66, 73, 82, 90],
    durations: [1.4, 1.7, 1.2, 1.8, 1.5, 1.3, 1.6, 1.9, 1.4, 1.7, 1.1, 1.5],
    delays: [0, 0.3, 0.7, 0.1, 0.5, 0.9, 0.2, 0.6, 1.0, 0.4, 0.8, 0.15],
  },
  office: {
    type: 'rain',
    positions: [10, 25, 40, 60, 75, 88],
    durations: [1.8, 2.1, 1.6, 2.3, 1.9, 1.7],
    delays: [0, 0.6, 1.2, 0.3, 0.9, 1.5],
  },
  shop: { type: 'none' },
  classroom: { type: 'none' },
}

export default function ImmersiveBackground({ themeBgKey = 'cafe' }) {
  const { imageUrl, imageLoaded } = useBackground(themeBgKey)
  const particleConfig = PARTICLE_CONFIGS[themeBgKey] || { type: 'none' }

  return (
    <div className="sp-bg-layer" aria-hidden="true">
      <div className={`sp-bg-fallback ${themeBgKey || 'cafe'}`} />
      {imageUrl && <img className={`sp-bg-image ${imageLoaded ? 'loaded' : ''}`} src={imageUrl} alt="" />}
      <div className="sp-bg-overlay" />
      <div className="sp-bg-grain" />
      <div className="sp-particles">
        {particleConfig.type === 'steam' &&
          particleConfig.positions.map((pos, index) => (
            <div
              key={`steam-${pos}`}
              className="sp-steam-particle"
              style={{
                left: `${pos}%`,
                bottom: `${10 + ((index * 7) % 20)}%`,
                height: `${28 + ((index * 9) % 26)}px`,
                '--duration': `${particleConfig.durations[index]}s`,
                '--delay': `${particleConfig.delays[index]}s`,
              }}
            />
          ))}

        {particleConfig.type === 'rain' &&
          particleConfig.positions.map((pos, index) => (
            <div
              key={`rain-${pos}`}
              className="sp-rain-particle"
              style={{
                left: `${pos}%`,
                height: `${42 + ((index * 11) % 50)}px`,
                '--duration': `${particleConfig.durations[index]}s`,
                '--delay': `${particleConfig.delays[index]}s`,
              }}
            />
          ))}

        {particleConfig.type === 'candle' &&
          particleConfig.positions.map((pos, index) => (
            <div
              key={`candle-${pos}`}
              className="sp-candle-light"
              style={{
                left: `${pos}%`,
                bottom: '20%',
                '--duration': `${particleConfig.durations[index]}s`,
                '--delay': `${particleConfig.delays[index]}s`,
              }}
            />
          ))}
      </div>
    </div>
  )
}

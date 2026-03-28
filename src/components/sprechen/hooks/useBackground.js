import { useEffect, useRef, useState } from 'react'

const BACKGROUND_PROMPTS = {
  cafe: { prompt: 'berlin cafe interior morning moody warm amber bokeh dark atmospheric cinematic 35mm film', seed: 42 },
  metro: { prompt: 'berlin underground subway station empty night neon blue tiles dark atmospheric cinematic', seed: 77 },
  restaurant: { prompt: 'munich restaurant interior evening candlelight dark red wood elegant empty tables', seed: 15 },
  office: { prompt: 'modern berlin startup office night city lights dark blue dramatic cinematic', seed: 33 },
  shop: { prompt: 'hamburg boutique fashion interior soft moody light minimalist dark elegant', seed: 58 },
  classroom: { prompt: 'german language school classroom morning golden light warm wooden desks empty', seed: 91 },
}

const buildPollinationsURL = (themeKey) => {
  const config = BACKGROUND_PROMPTS[themeKey] || BACKGROUND_PROMPTS.cafe
  const prompt = encodeURIComponent(config.prompt)
  return `https://image.pollinations.ai/prompt/${prompt}?width=1400&height=700&nologo=true&seed=${config.seed}`
}

export const useBackground = (themeBgKey) => {
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const imgRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!themeBgKey) return undefined

    setImageLoaded(false)
    setImageError(false)
    setImageUrl(null)

    const url = buildPollinationsURL(themeBgKey)
    const img = new Image()
    imgRef.current = img

    timeoutRef.current = window.setTimeout(() => {
      img.src = ''
      setImageError(true)
    }, 8000)

    img.onload = () => {
      window.clearTimeout(timeoutRef.current)
      setImageUrl(url)
      window.setTimeout(() => setImageLoaded(true), 100)
    }

    img.onerror = () => {
      window.clearTimeout(timeoutRef.current)
      setImageError(true)
    }

    img.src = url

    return () => {
      window.clearTimeout(timeoutRef.current)
      if (imgRef.current) imgRef.current.src = ''
    }
  }, [themeBgKey])

  return { imageUrl, imageLoaded, imageError }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { checkSpeechSupport, loadVoices } from '../services/speechService'

export function useSpeech() {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)
  const audioContextRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const startTimeRef = useRef(null)

  const [support, setSupport] = useState(() => checkSpeechSupport())
  const [voiceReady, setVoiceReady] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const cleanupAudio = useCallback(async () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

  useEffect(() => {
    const cleanupVoices = loadVoices((voice) => setVoiceReady(Boolean(voice)))
    return () => {
      cleanupVoices?.()
      cleanupAudio()
    }
  }, [cleanupAudio])

  const setupAudioPipeline = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1,
      },
    })

    streamRef.current = stream

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContextClass()
    audioContextRef.current = ctx

    const source = ctx.createMediaStreamSource(stream)
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 80

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 8000

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -30
    compressor.knee.value = 10
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.25

    const destination = ctx.createMediaStreamDestination()
    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(compressor)
    compressor.connect(destination)

    return { filteredStream: destination.stream, rawStream: stream, ctx }
  }, [])

  const startRecording = useCallback(async ({ onInterim, onVolumeLevel, onError } = {}) => {
    try {
      const currentSupport = checkSpeechSupport()
      setSupport(currentSupport)

      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        onError?.('microphone_not_supported')
        return false
      }

      chunksRef.current = []
      startTimeRef.current = Date.now()
      const { filteredStream, rawStream, ctx } = await setupAudioPipeline()

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition && onInterim) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'de-DE'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        let accum = ''
        recognition.onresult = (event) => {
          let interim = ''
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            if (event.results[index].isFinal) {
              accum += `${event.results[index][0].transcript} `
            } else {
              interim = event.results[index][0].transcript
            }
          }
          onInterim?.(accum + interim)
        }

        recognition.onerror = (event) => {
          if (!['no-speech', 'audio-capture'].includes(event.error)) {
            console.warn('[Speech] Non-fatal error:', event.error)
          }
        }

        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            try {
              recognition.start()
            } catch {}
          }
        }

        recognitionRef.current = recognition
        recognition.start()
      }

      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) || 'audio/webm'

      const recorder = new MediaRecorder(filteredStream, {
        mimeType,
        audioBitsPerSecond: 16000,
      })

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data)
      }

      recorder.start(250)
      mediaRecorderRef.current = recorder
      setIsListening(true)

      if (onVolumeLevel) {
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        const source2 = ctx.createMediaStreamSource(rawStream)
        source2.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        const volumeLoop = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((sum, value) => sum + value, 0) / data.length
            onVolumeLevel(Math.min(100, Math.round(avg * 2)))
            animationFrameRef.current = window.requestAnimationFrame(volumeLoop)
          }
        }

        animationFrameRef.current = window.requestAnimationFrame(volumeLoop)
      }

      return true
    } catch (error) {
      const message =
        error.name === 'NotAllowedError'
          ? 'microphone_denied'
          : error.name === 'NotFoundError'
            ? 'microphone_not_found'
            : 'microphone_error'
      onError?.(message)
      return false
    }
  }, [setupAudioPipeline])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const responseTimeMs = Date.now() - (startTimeRef.current || Date.now())

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
        recognitionRef.current = null
      }

      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        setIsListening(false)
        resolve({ blob: null, responseTimeMs })
        return
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        setIsListening(false)
        await cleanupAudio()
        resolve({ blob, responseTimeMs, mimeType })
      }

      recorder.stop()
      mediaRecorderRef.current = null
    })
  }, [cleanupAudio])

  const cancelRecording = useCallback(async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      try {
        mediaRecorderRef.current.stop()
      } catch {}
      mediaRecorderRef.current = null
    }
    chunksRef.current = []
    setIsListening(false)
    await cleanupAudio()
  }, [cleanupAudio])

  return {
    support,
    voiceReady,
    isListening,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}

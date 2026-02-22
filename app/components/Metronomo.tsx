'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Plus, Minus } from 'lucide-react'

export default function Metronomo() {
  const [bpm, setBpm] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBeat, setIsBeat] = useState(false)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializa AudioContext apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playClick = useCallback(() => {
    if (!audioContextRef.current) return
    
    const osc = audioContextRef.current.createOscillator()
    const gain = audioContextRef.current.createGain()
    
    osc.connect(gain)
    gain.connect(audioContextRef.current.destination)
    
    osc.frequency.value = 1000
    osc.type = 'sine'
    
    gain.gain.setValueAtTime(0.5, audioContextRef.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.05)
    
    osc.start(audioContextRef.current.currentTime)
    osc.stop(audioContextRef.current.currentTime + 0.05)
    
    // Visual feedback
    setIsBeat(true)
    setTimeout(() => setIsBeat(false), 100)
  }, [])

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000
      timerRef.current = setInterval(playClick, interval)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, bpm, playClick])

  const togglePlay = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    }
    setIsPlaying(!isPlaying)
  }

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(208, Math.max(40, prev + delta)))
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-full flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-500 p-2 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Metrônomo</h3>
          <p className="text-gray-400 text-sm">Mantenha o ritmo na prática</p>
        </div>
      </div>

      {/* Visualizador */}
      <div className="flex justify-center mb-6">
        <div 
          className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-100 ${
            isBeat 
              ? 'border-purple-500 bg-purple-500/20 scale-110' 
              : 'border-gray-600 bg-gray-700'
          }`}
        >
          <div className={`w-8 h-8 rounded-full bg-purple-500 transition-opacity duration-100 ${isBeat ? 'opacity-100' : 'opacity-30'}`} />
        </div>
      </div>

      {/* Controles de BPM */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => adjustBpm(-5)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
        
        <div className="text-center min-w-[80px]">
          <span className="text-3xl font-bold text-white">{bpm}</span>
          <p className="text-gray-400 text-xs">BPM</p>
        </div>
        
        <button
          onClick={() => adjustBpm(5)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Botão Play/Pause */}
      <button
        onClick={togglePlay}
        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
          isPlaying 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-5 h-5" />
            Pausar
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Iniciar
          </>
        )}
      </button>

      {/* Presets rápidos */}
      <div className="flex gap-2 mt-4 justify-center">
        {[60, 80, 100, 120].map(tempo => (
          <button
            key={tempo}
            onClick={() => setBpm(tempo)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              bpm === tempo 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tempo}
          </button>
        ))}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Play, Pause, Plus, Minus, Volume2, Disc, Zap, Music, Drum, X } from 'lucide-react'

interface MetronomoProps {
  onClose: () => void
}

type SoundType = 'beep' | 'drum' | 'wood' | 'digital'

export default function Metronomo({ onClose }: MetronomoProps) {
  const [bpm, setBpm] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [soundType, setSoundType] = useState<SoundType>('beep')
  const [volume, setVolume] = useState(0.5)
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentBeatRef = useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const playSound = useCallback((isAccent: boolean) => {
    if (!audioContextRef.current) return
    
    const osc = audioContextRef.current.createOscillator()
    const gain = audioContextRef.current.createGain()
    
    osc.connect(gain)
    gain.connect(audioContextRef.current.destination)
    
    switch (soundType) {
      case 'beep':
        osc.frequency.value = isAccent ? 1200 : 800
        osc.type = 'sine'
        gain.gain.setValueAtTime(volume * 0.5, audioContextRef.current.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1)
        osc.start(audioContextRef.current.currentTime)
        osc.stop(audioContextRef.current.currentTime + 0.1)
        break
        
      case 'drum':
        osc.frequency.value = isAccent ? 60 : 200
        osc.type = isAccent ? 'sine' : 'triangle'
        gain.gain.setValueAtTime(volume * 0.6, audioContextRef.current.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1)
        osc.start(audioContextRef.current.currentTime)
        osc.stop(audioContextRef.current.currentTime + 0.1)
        break
        
      case 'wood':
        osc.frequency.value = isAccent ? 800 : 600
        osc.type = 'square'
        gain.gain.setValueAtTime(volume * 0.3, audioContextRef.current.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.05)
        osc.start(audioContextRef.current.currentTime)
        osc.stop(audioContextRef.current.currentTime + 0.05)
        break
        
      case 'digital':
        osc.frequency.value = isAccent ? 880 : 440
        osc.type = 'sawtooth'
        gain.gain.setValueAtTime(volume * 0.3, audioContextRef.current.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.06)
        osc.start(audioContextRef.current.currentTime)
        osc.stop(audioContextRef.current.currentTime + 0.06)
        break
    }
  }, [soundType, volume])

  useEffect(() => {
    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
      
      const interval = (60 / bpm) * 1000
      timerRef.current = setInterval(() => {
        const isAccent = currentBeatRef.current === 0
        playSound(isAccent)
        setBeat(currentBeatRef.current)
        currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure
      }, interval)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      currentBeatRef.current = 0
      setBeat(0)
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, bpm, beatsPerMeasure, playSound])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleClose = () => {
    setIsPlaying(false) // Para o som ao fechar
    onClose()
  }

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(208, Math.max(40, prev + delta)))
  }

  const soundOptions: { value: SoundType; label: string; icon: React.ReactNode }[] = [
    { value: 'beep', label: 'Bip', icon: <Music className="w-4 h-4" /> },
    { value: 'drum', label: 'Bateria', icon: <Drum className="w-4 h-4" /> },
    { value: 'wood', label: 'Madeira', icon: <Disc className="w-4 h-4" /> },
    { value: 'digital', label: 'Tech', icon: <Zap className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md relative shadow-2xl">
        
        {/* Botão Fechar */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Conteúdo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
              <Disc className={`w-6 h-6 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: `${60/bpm}s` }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Metrônomo Pro</h3>
              <p className="text-gray-400 text-xs">Precisão de estúdio</p>
            </div>
          </div>

          {/* Display BPM */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <span className="text-6xl font-black text-white">{bpm}</span>
              <span className="text-gray-500 text-sm ml-2 font-medium">BPM</span>
            </div>
            
            {/* Controles */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <button onClick={() => adjustBpm(-5)} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
                <Minus className="w-5 h-5" />
              </button>
              <input 
                type="range" 
                min="40" 
                max="208" 
                value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-32 h-2 bg-gray-700 rounded-lg accent-pink-500"
              />
              <button onClick={() => adjustBpm(5)} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tipo de Som */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Tipo de Som</label>
            <div className="grid grid-cols-4 gap-2">
              {soundOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSoundType(option.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs ${
                    soundType === option.value 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compasso */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Compasso</label>
            <select 
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value={2}>2/4</option>
              <option value={3}>3/4</option>
              <option value={4}>4/4</option>
              <option value={6}>6/8</option>
            </select>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 mb-6 bg-gray-700/50 p-3 rounded-lg">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-600 rounded-lg accent-pink-500"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>

          {/* Botão Play */}
          <button
            onClick={togglePlay}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500'
            } text-white`}
          >
            {isPlaying ? (
              <><Pause className="w-6 h-6 fill-current" /> PAUSAR</>
            ) : (
              <><Play className="w-6 h-6 fill-current" /> INICIAR</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
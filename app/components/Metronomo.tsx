'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Plus, Minus, Volume2, Disc, Zap, Music, Drum } from 'lucide-react'

type SoundType = 'beep' | 'drum' | 'wood' | 'digital'

export default function Metronomo() {
  const [bpm, setBpm] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [soundType, setSoundType] = useState<SoundType>('beep')
  const [volume, setVolume] = useState(0.5)
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4)
  const [subdivision, setSubdivision] = useState(1) // 1 = quarto, 2 = oitavo
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const nextNoteTimeRef = useRef(0)
  const timerIDRef = useRef<NodeJS.Timeout | null>(null)
  const currentBeatRef = useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current)
    }
  }, [])

  // Gerenciamento de tempo preciso
  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm
    nextNoteTimeRef.current += secondsPerBeat / subdivision
    
    currentBeatRef.current++
    if (currentBeatRef.current === beatsPerMeasure * subdivision) {
      currentBeatRef.current = 0
    }
    setBeat(currentBeatRef.current)
  }, [bpm, beatsPerMeasure, subdivision])

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContextRef.current) return
    
    const isFirstBeat = beatNumber % beatsPerMeasure === 0
    const osc = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    
    osc.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    
    // Configurações de som diferentes
    switch (soundType) {
      case 'beep':
        osc.frequency.value = isFirstBeat ? 1200 : 800
        osc.type = 'sine'
        gainNode.gain.setValueAtTime(volume * 0.5, time)
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
        osc.start(time)
        osc.stop(time + 0.1)
        break
        
      case 'drum':
        // Simulação de bateria: Caixa (snare) no tempo forte, bumbo nos outros
        if (isFirstBeat) {
          // Bumbo - frequência grave + ruído
          osc.frequency.value = 60
          osc.type = 'sine'
          gainNode.gain.setValueAtTime(volume * 0.8, time)
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
          osc.start(time)
          osc.stop(time + 0.15)
        } else {
          // Caixa - ruído + frequência média
          osc.frequency.value = 200
          osc.type = 'triangle'
          gainNode.gain.setValueAtTime(volume * 0.4, time)
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.08)
          osc.start(time)
          osc.stop(time + 0.08)
        }
        break
        
      case 'wood':
        // Som de madeira/bloco
        osc.frequency.value = isFirstBeat ? 800 : 600
        osc.type = 'square'
        // Filtro para suavizar
        const filter = audioContextRef.current.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1200
        osc.disconnect()
        osc.connect(filter)
        filter.connect(gainNode)
        
        gainNode.gain.setValueAtTime(volume * 0.3, time)
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05)
        osc.start(time)
        osc.stop(time + 0.05)
        break
        
      case 'digital':
        // Som eletrônico moderno
        osc.frequency.value = isFirstBeat ? 880 : 440
        osc.type = 'sawtooth'
        gainNode.gain.setValueAtTime(volume * 0.3, time)
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.06)
        osc.start(time)
        osc.stop(time + 0.06)
        break
    }
  }, [soundType, volume, beatsPerMeasure])

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return
    
    // Schedule ahead time para precisão
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current)
      nextNote()
    }
    
    timerIDRef.current = setTimeout(scheduler, 25)
  }, [nextNote, scheduleNote])

  useEffect(() => {
    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
      currentBeatRef.current = 0
      nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.05
      scheduler()
    } else {
      if (timerIDRef.current) clearTimeout(timerIDRef.current)
    }
    
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current)
    }
  }, [isPlaying, scheduler])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(208, Math.max(40, prev + delta)))
  }

  const tapTempo = () => {
    const now = Date.now()
    if (!tapTempo.lastTap) {
      tapTempo.lastTap = now
      return
    }
    const diff = now - tapTempo.lastTap
    if (diff > 2000) { // Reset se demorar mais de 2s
      tapTempo.lastTap = now
      return
    }
    const newBpm = Math.round(60000 / diff)
    setBpm(Math.min(208, Math.max(40, newBpm)))
    tapTempo.lastTap = now
  }
  tapTempo.lastTap = 0 as number | undefined

  const soundOptions: { value: SoundType; label: string; icon: React.ReactNode }[] = [
    { value: 'beep', label: 'Bip', icon: <Music className="w-4 h-4" /> },
    { value: 'drum', label: 'Bateria', icon: <Drum className="w-4 h-4" /> },
    { value: 'wood', label: 'Madeira', icon: <Disc className="w-4 h-4" /> },
    { value: 'digital', label: 'Tech', icon: <Zap className="w-4 h-4" /> },
  ]

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 h-full flex flex-col relative overflow-hidden">
      {/* Background animado sutil */}
      <div className={`absolute inset-0 bg-purple-500/5 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg shadow-lg">
              <Disc className={`w-6 h-6 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: `${60/bpm}s` }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Metrônomo Pro</h3>
              <p className="text-gray-400 text-xs">Precisão de estúdio</p>
            </div>
          </div>
          
          {/* Indicador de batida */}
          <div className="flex gap-1">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-100 ${
                  isPlaying && (beat % beatsPerMeasure) === i 
                    ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/50' 
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Display principal */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <span className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 transition-all ${isPlaying ? 'scale-110' : ''}`}>
              {bpm}
            </span>
            <span className="text-gray-500 text-sm ml-2 font-medium">BPM</span>
          </div>
          
          {/* Controles de BPM */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => adjustBpm(-1)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all active:scale-95"
            >
              <Minus className="w-5 h-5" />
            </button>
            
            <input 
              type="range" 
              min="40" 
              max="208" 
              value={bpm} 
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            
            <button
              onClick={() => adjustBpm(1)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tap Tempo */}
          <button
            onClick={tapTempo}
            className="mt-2 text-xs text-gray-400 hover:text-orange-400 transition-colors uppercase tracking-wider font-bold"
          >
            Tap Tempo
          </button>
        </div>

        {/* Seleção de Som */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2 block">Tipo de Som</label>
          <div className="grid grid-cols-4 gap-2">
            {soundOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSoundType(option.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs ${
                  soundType === option.value 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configurações avançadas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1 block">Compasso</label>
            <select 
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-orange-500 focus:outline-none"
            >
              <option value={2}>2/4</option>
              <option value={3}>3/4</option>
              <option value={4}>4/4</option>
              <option value={6}>6/8</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1 block">Subdivisão</label>
            <select 
              value={subdivision}
              onChange={(e) => setSubdivision(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-orange-500 focus:outline-none"
            >
              <option value={1}>Quartos</option>
              <option value={2}>Oitavos</option>
              <option value={3}>Tercinas</option>
            </select>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mb-4 bg-gray-700/50 p-3 rounded-lg">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            value={volume} 
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-xs text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
        </div>

        {/* Botão Play principal */}
        <button
          onClick={togglePlay}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-600/30 animate-pulse' 
              : 'bg-gradient-to-r from-orange-600 to-pink-600 text-white shadow-orange-600/30 hover:shadow-orange-600/50'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-6 h-6 fill-current" />
              <span className="text-lg">PAUSAR</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" />
              <span className="text-lg">INICIAR</span>
            </>
          )}
        </button>

        {/* Presets rápidos */}
        <div className="flex gap-2 mt-4 justify-center">
          {[60, 80, 100, 120, 140].map(tempo => (
            <button
              key={tempo}
              onClick={() => setBpm(tempo)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                bpm === tempo 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {tempo}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
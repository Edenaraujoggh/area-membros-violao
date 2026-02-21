'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Mic, Volume2 } from 'lucide-react'

interface Corda {
  nota: string
  freq: number
  corda: number
  nome: string
}

const CORDAS_VIOLAO: Corda[] = [
  { nota: 'E', freq: 82.41, corda: 6, nome: 'Mi (Grave)' },
  { nota: 'A', freq: 110.00, corda: 5, nome: 'Lá' },
  { nota: 'D', freq: 146.83, corda: 4, nome: 'Ré' },
  { nota: 'G', freq: 196.00, corda: 3, nome: 'Sol' },
  { nota: 'B', freq: 246.94, corda: 2, nome: 'Si' },
  { nota: 'E', freq: 329.63, corda: 1, nome: 'Mi (Agudo)' },
]

export default function Afinador({ onClose }: { onClose: () => void }) {
  const [isListening, setIsListening] = useState(false)
  const [notaDetectada, setNotaDetectada] = useState<string>('')
  const [frequencia, setFrequencia] = useState<number>(0)
  const [diferenca, setDiferenca] = useState<number>(0)
  const [cordaMaisProxima, setCordaMaisProxima] = useState<Corda | null>(null)
  const [ultimasFreqs, setUltimasFreqs] = useState<number[]>([])
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const autoCorrelate = useCallback((buffer: Float32Array, sampleRate: number) => {
    let SIZE = buffer.length
    let rms = 0

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i]
      rms += val * val
    }
    rms = Math.sqrt(rms / SIZE)

    if (rms < 0.005) return -1  // Capta sons mais fracos/quietos

    let r1 = 0, r2 = SIZE - 1, thres = 0.2
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break }
    }

    buffer = buffer.slice(r1, r2)
    SIZE = buffer.length

    let c = new Array(SIZE).fill(0)
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j + i]
      }
    }

    let d = 0; while (c[d] > c[d + 1]) d++
    let maxval = -1, maxpos = -1
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i]
        maxpos = i
      }
    }
    let T0 = maxpos

    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1]
    let a = (x1 + x3 - 2 * x2) / 2
    let b = (x3 - x1) / 2
    if (a) T0 = T0 - b / (2 * a)

    return sampleRate / T0
  }, [])

  const encontrarCordaMaisProxima = useCallback((freq: number) => {
    let maisProxima = CORDAS_VIOLAO[0]
    let menorDif = Math.abs(freq - maisProxima.freq)

    for (const corda of CORDAS_VIOLAO) {
      const dif = Math.abs(freq - corda.freq)
      if (dif < menorDif) {
        menorDif = dif
        maisProxima = corda
      }
    }

    const difPercent = (freq - maisProxima.freq) / maisProxima.freq
    return { corda: maisProxima, diff: Math.max(-1, Math.min(1, difPercent)) }
  }, [])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false
      }})
      
      mediaStreamRef.current = stream
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 4096  // Maior precisão na detecção
      analyserRef.current = analyser
      
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      
      setIsListening(true)
      detectarPitch()
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      alert('Precisamos de permissão para usar o microfone!')
    }
  }

  const stopListening = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setIsListening(false)
  }

  const detectarPitch = () => {
    if (!analyserRef.current) return
    
    const buffer = new Float32Array(analyserRef.current.fftSize)
    analyserRef.current.getFloatTimeDomainData(buffer)
    
    const freq = autoCorrelate(buffer, audioContextRef.current!.sampleRate)
    
    if (freq !== -1 && freq > 70 && freq < 450) {
      setFrequencia(Math.round(freq))
      const { corda, diff } = encontrarCordaMaisProxima(freq)
      setCordaMaisProxima(corda)
      setDiferenca(diff)
      setNotaDetectada(corda.nota)
    }
    
    rafRef.current = requestAnimationFrame(detectarPitch)
  }

  useEffect(() => {
    startListening()
    return () => stopListening()
  }, [])

  const getCorAfinacao = () => {
    if (Math.abs(diferenca) < 0.02) return 'text-green-500'
    if (diferenca < 0) return 'text-red-500'
    return 'text-orange-500'
  }

  const getMensagem = () => {
    if (!cordaMaisProxima) return 'Toque uma corda...'
    if (Math.abs(diferenca) < 0.02) return 'Perfeito! ✅'
    if (diferenca < 0) return 'Aperte a corda ⬆️'
    return 'Solte a corda ⬇️'
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6 relative">
        <button 
          onClick={() => {
            stopListening()
            onClose()
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Afinador Digital</h2>
          <p className="text-gray-400 text-sm">Toque uma corda do violão</p>
        </div>

        <div className="relative h-48 mb-8 flex items-center justify-center">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-colors duration-200 ${
            Math.abs(diferenca) < 0.02 ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700/50'
          }`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getCorAfinacao()}`}>
                {notaDetectada || '-'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {cordaMaisProxima?.nome || ''}
              </div>
            </div>
          </div>

          <div className="absolute w-full h-2 bg-gray-700 rounded-full top-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 ${
                Math.abs(diferenca) < 0.02 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ 
                width: '4px', 
                left: `${50 + (diferenca * 50)}%`,
                position: 'absolute'
              }}
            />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50" />
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-mono text-white">
            {frequencia > 0 ? `${frequencia} Hz` : '--'}
          </div>
          <div className={`text-lg font-medium mt-2 ${getCorAfinacao()}`}>
            {getMensagem()}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 mb-6">
          {CORDAS_VIOLAO.map((corda) => (
            <div 
              key={corda.corda}
              className={`p-2 rounded-lg text-center text-xs font-bold transition-all ${
                cordaMaisProxima?.corda === corda.corda 
                  ? Math.abs(diferenca) < 0.02 
                    ? 'bg-green-500 text-white scale-110' 
                    : 'bg-orange-500 text-white scale-110'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {corda.nota}
              <div className="text-[10px] font-normal opacity-75">{corda.corda}ª</div>
            </div>
          ))}
        </div>

        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isListening ? (
            <>
              <Volume2 className="w-5 h-5" />
              Parar Afinador
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Iniciar Afinador
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Permita o acesso ao microfone quando solicitado
        </p>
      </div>
    </div>
  )
}
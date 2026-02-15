'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Play, CheckCircle, Circle, ChevronLeft, BookOpen, Clock } from 'lucide-react'

interface Aula {
  id: string
  titulo: string
  descricao: string
  video_url: string
  ordem: number
  duracao?: string
}

interface Curso {
  id: string
  titulo: string
  descricao: string
}

export default function CursoPage() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string
  
  const [curso, setCurso] = useState<Curso | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null)
  const [loading, setLoading] = useState(true)
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    fetchCurso()
    fetchAulas()
  }, [cursoId])

  async function fetchCurso() {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', cursoId)
      .single()
    
    if (data) setCurso(data)
  }

  async function fetchAulas() {
    try {
      const mockAulas: Aula[] = [
        {
          id: '1',
          titulo: 'Aula 1: Introdução ao Violão',
          descricao: 'Nesta aula você vai aprender as partes do violão e como segurar corretamente.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          ordem: 1,
          duracao: '15:30'
        },
        {
          id: '2',
          titulo: 'Aula 2: Acordes Básicos',
          descricao: 'Aprenda os acordes de Dó, Ré, Mi, Fá, Sol, Lá e Si maior.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          ordem: 2,
          duracao: '22:15'
        },
        {
          id: '3',
          titulo: 'Aula 3: Batidas e Ritmos',
          descricao: 'Dominando os ritmos mais usados na música popular brasileira.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          ordem: 3,
          duracao: '18:45'
        },
        {
          id: '4',
          titulo: 'Aula 4: Primeira Música',
          descricao: 'Vamos juntar acordes e ritmo para tocar sua primeira música completa.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          ordem: 4,
          duracao: '25:00'
        }
      ]
      
      setAulas(mockAulas)
      setAulaAtual(mockAulas[0])
      setProgresso(25)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  function selecionarAula(aula: Aula) {
    setAulaAtual(aula)
  }

  function toggleAulaConcluida(aulaId: string) {
    alert(`Aula ${aulaId} marcada como concluída!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white truncate max-w-md">
                {curso?.titulo || 'Carregando...'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Seu progresso</p>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-orange-500">{progresso}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              {aulaAtual?.video_url ? (
                <iframe
                  src={aulaAtual.video_url}
                  title={aulaAtual.titulo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Play className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {aulaAtual?.titulo}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {aulaAtual?.duracao || '00:00'}
                    </span>
                    <span>Aula {aulaAtual?.ordem} de {aulas.length}</span>
                  </div>
                </div>
                <button
                  onClick={() => aulaAtual && toggleAulaConcluida(aulaAtual.id)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Marcar como concluída
                </button>
              </div>
              
              <p className="text-gray-300 leading-relaxed">
                {aulaAtual?.descricao}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white">Conteúdo do Curso</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {aulas.length} aulas
                </p>
              </div>
              
              <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                {aulas.map((aula, index) => (
                  <button
                    key={aula.id}
                    onClick={() => selecionarAula(aula)}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-gray-750 ${
                      aulaAtual?.id === aula.id ? 'bg-gray-750 border-l-4 border-orange-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="mt-1">
                      {aulaAtual?.id === aula.id ? (
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white ml-0.5" />
                        </div>
                      ) : (
                        <Circle className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${
                        aulaAtual?.id === aula.id ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {index + 1}. {aula.titulo}
                      </h4>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {aula.duracao}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-center">
              <h4 className="text-white font-bold mb-2">Precisa de ajuda?</h4>
              <p className="text-white/80 text-sm mb-4">
                Tire suas dúvidas na nossa comunidade exclusiva
              </p>
              <button className="bg-white text-orange-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors w-full">
                Acessar Comunidade
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
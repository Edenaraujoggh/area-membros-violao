'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Play, BookOpen, Clock, User, LogOut } from 'lucide-react'

interface Curso {
  id: string
  titulo: string
  descricao: string
  imagem_url?: string
  created_at: string
  total_aulas?: number
  aulas_completadas?: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchCursos()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  async function fetchCursos() {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const cursosComProgresso = data?.map(curso => ({
        ...curso,
        total_aulas: Math.floor(Math.random() * 10) + 5,
        aulas_completadas: Math.floor(Math.random() * 5)
      })) || []
      
      setCursos(cursosComProgresso)
    } catch (error) {
      console.error('Erro ao buscar cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Área de Membros - Violão</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-5 h-5" />
              <span className="hidden sm:block text-sm">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bem-vindo de volta! 🎸
          </h2>
          <p className="text-gray-400">
            Continue sua jornada musical. Você tem {cursos.length} {cursos.length === 1 ? 'curso' : 'cursos'} disponíveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cursos em andamento</p>
                <p className="text-2xl font-bold text-orange-500 mt-1">
                  {cursos.filter(c => (c.aulas_completadas || 0) < (c.total_aulas || 0)).length}
                </p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-lg">
                <Play className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Aulas assistidas</p>
                <p className="text-2xl font-bold text-green-500 mt-1">
                  {cursos.reduce((acc, curso) => acc + (curso.aulas_completadas || 0), 0)}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de cursos</p>
                <p className="text-2xl font-bold text-blue-500 mt-1">{cursos.length}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-6">Seus Cursos</h3>
        
        {cursos.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum curso disponível ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => {
              const progresso = Math.round(((curso.aulas_completadas || 0) / (curso.total_aulas || 1)) * 100)
              
              return (
                <div 
                  key={curso.id} 
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-all duration-300 group cursor-pointer"
                  onClick={() => router.push(`/cursos/${curso.id}`)}
                >
                  <div className="h-48 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center relative overflow-hidden">
                    {curso.imagem_url ? (
                      <img 
                        src={curso.imagem_url} 
                        alt={curso.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-white/50" />
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {curso.titulo}
                    </h4>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {curso.descricao || 'Descrição do curso em breve...'}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-orange-500 font-medium">{progresso}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {curso.aulas_completadas} de {curso.total_aulas} aulas completadas
                      </p>
                    </div>

                    <button className="w-full mt-4 bg-gray-700 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                      {progresso === 0 ? 'Começar curso' : progresso === 100 ? 'Revisar curso' : 'Continuar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, Clock, Award, Settings, LogOut } from 'lucide-react'

interface Curso {
  id: string
  titulo: string
  descricao: string
  created_at: string
}

interface User {
  id: string
  email: string
  tipo?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchCursos()
  }, [])

 async function checkUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    console.log('🔍 Session encontrada:', session.user.email)

    // Buscar dados do usuário na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle()
    
    if (userError) {
      console.error('❌ ERRO na query:', userError)
      alert('Erro ao buscar usuário: ' + userError.message)
      return
    }

    if (userData) {
      console.log('✅ Usuário encontrado:', userData)
      setUser(userData)
    } else {
      console.log('❌ Usuário não encontrado para:', session.user.email)
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        tipo: 'aluno'
      })
    }
  } catch (error) {
    console.error('❌ Erro geral:', error)
    alert('Erro geral: ' + error)
  }
}
  

  async function fetchCursos() {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar cursos:', error)
        return
      }

      setCursos(data || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = user?.tipo === 'admin' || user?.email === 'musicainfor34@gmail.com'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Área de Membros - Violão</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm hidden sm:block">
  {user?.email}
  <span className="text-red-500 text-xs ml-2">({user?.tipo || 'sem tipo'})</span>
</span>
            
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo de volta! 🎸
          </h2>
          <p className="text-gray-400">
            Continue sua jornada musical. Você tem {cursos.length} curso(s) disponível(eis).
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cursos em andamento</p>
                <p className="text-3xl font-bold text-orange-500">{cursos.length}</p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Aulas assistidas</p>
                <p className="text-3xl font-bold text-green-500">0</p>
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
                <p className="text-3xl font-bold text-blue-500">{cursos.length}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Award className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Cursos */}
        <h3 className="text-xl font-bold mb-6">Seus Cursos</h3>
        
        {cursos.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum curso disponível ainda.</p>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="text-orange-500 hover:text-orange-400 font-medium"
              >
                Ir para Admin e criar cursos →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => (
              <div 
  key={curso.id} 
  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 
             transform transition-all duration-300 ease-out 
             hover:scale-105 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/20"
>
                {/* Capa */}
                <div className="h-48 bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center relative">
                  <BookOpen className="w-16 h-16 text-white/30" />
                  <div className="absolute top-4 right-4 bg-black/30 px-2 py-1 rounded text-xs text-white">
                    {new Date(curso.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                {/* Conteúdo */}
                <div className="p-6">
                  <h4 className="text-xl font-bold mb-2">{curso.titulo}</h4>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {curso.descricao || 'Sem descrição'}
                  </p>
                  
                  {/* Progresso mockado */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Progresso</span>
                      <span className="text-orange-500 font-bold">0%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full w-0"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">0 de 0 aulas completadas</p>
                  </div>
                  
                  {/* BOTÕES */}
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/cursos/${curso.id}`)}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      Começar curso
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => router.push(`/admin/cursos/${curso.id}/aulas`)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Gerenciar Aulas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, Clock, Award, Settings, LogOut, ChevronLeft, ChevronRight, Play, Download } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Curso {
  id: string
  titulo: string
  descricao: string
  created_at: string
    imagem_url?: string
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
const [progressosCursos, setProgressosCursos] = useState<Record<string, number>>({})
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
  
async function fetchProgressosCursos(cursosIds: string[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const progressos: Record<string, number> = {}

    for (const cursoId of cursosIds) {
      const { count: totalAulas } = await supabase
        .from('aulas')
        .select('*', { count: 'exact', head: true })
        .eq('curso_id', cursoId)

      const { data: concluidas } = await supabase
        .from('progresso_aulas')
        .select('aula_id')
        .eq('user_id', user.id)
        .eq('curso_id', cursoId)

      if (totalAulas && totalAulas > 0) {
        const qtdConcluidas = concluidas?.length || 0
        const percentual = Math.round((qtdConcluidas / totalAulas) * 100)
        progressos[cursoId] = percentual
      } else {
        progressos[cursoId] = 0
      }
    }

    setProgressosCursos(progressos)
  } catch (error) {
    console.error('Erro ao buscar progressos:', error)
  }
}
  async function fetchCursos() {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar cursos:', error)
        return
      }
setCursos(data || [])
if (data && data.length > 0) {
  await fetchProgressosCursos(data.map((c: any) => c.id))
}
console.log('Cursos do banco:', data)  // ADICIONAR ISSO
    
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

       {/* Botões de Ação */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
  
  {/* 1. Continue de onde parou */}
  <button 
    onClick={() => {
      const cursoEmAndamento = cursos.find(c => (progressosCursos[c.id] || 0) > 0) || cursos[0]
      if (cursoEmAndamento) {
        router.push(`/cursos/${cursoEmAndamento.id}`)
      }
    }}
    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-6 rounded-xl transition-all duration-300 text-left group flex items-center gap-4"
  >
    <div className="bg-orange-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
      <Play className="w-6 h-6 text-orange-500" fill="currentColor" />
    </div>
    <div className="flex-1">
      <h3 className="text-white font-bold text-lg">Continue de onde parou</h3>
      <div className="mt-2">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all"
           style={{
  width: `${progressosCursos[cursoEmAndamento?.id] || 0}%`
}}
          />
        </div>
        <p className="text-orange-400 text-sm mt-1">
          {(() => {
  const curso = cursos.find(c => (progressosCursos[c.id] || 0) > 0) || cursos[0]
  return `${progressosCursos[curso?.id] || 0}% completo`
})()}
        </p>
      </div>
    </div>
  </button>

  {/* 2. Dicionário de Acordes - Download do Drive */}
  <a 
    href="https://drive.google.com/uc?export=download&id=1hBnP9pUHKmqMLhS6NcC4HqHsSW8jqSZo"
    target="_blank"
    rel="noopener noreferrer"
    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-6 rounded-xl transition-all duration-300 text-left group flex items-center gap-4 block"
  >
    <div className="bg-green-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
      <BookOpen className="w-6 h-6 text-green-500" />
    </div>
    <div>
      <h3 className="text-white font-bold text-lg">Dicionário de Acordes</h3>
      <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
        <Download className="w-4 h-4" />
        Baixar apostila (PDF)
      </p>
    </div>
  </a>

</div>

      {/* Cursos - Carrossel Estilo Kiwify */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-bold">Seus Cursos</h3>
    <div className="flex gap-2">
      <button className="swiper-button-prev-custom w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-orange-600 hover:border-orange-500 transition-all disabled:opacity-50">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button className="swiper-button-next-custom w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-orange-600 hover:border-orange-500 transition-all disabled:opacity-50">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </div>
  
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
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={20}
      slidesPerView={1}
      navigation={{
        prevEl: '.swiper-button-prev-custom',
        nextEl: '.swiper-button-next-custom',
      }}
      pagination={{ clickable: true, dynamicBullets: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      breakpoints={{
        640: {
          slidesPerView: 1,
          spaceBetween: 20,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 24,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 24,
        },
      }}
      className="!pb-12"
    >
      {cursos.map((curso) => (
        <SwiperSlide key={curso.id}>
          <div 
            className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 
                       transform transition-all duration-300 ease-out 
                       hover:scale-105 hover:border-orange-500 
                       hover:shadow-2xl hover:shadow-orange-500/20 
                       cursor-pointer h-full"
            onClick={() => router.push(`/cursos/${curso.id}`)}
          >
         {/* Capa com Imagem */}
<div className="h-48 overflow-hidden relative">
  {curso.imagem_url ? (
    <img 
      src={curso.imagem_url}
      alt={curso.titulo}
      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
    />
  ) : (
    <div className="h-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center 
                    transform transition-transform duration-500 group-hover:scale-110">
      <BookOpen className="w-16 h-16 text-white/30" />
    </div>
  )}
  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium">
    {new Date(curso.created_at).toLocaleDateString('pt-BR')}
  </div>
  {/* Overlay gradiente */}
  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent pointer-events-none" />
</div>
            
            {/* Conteúdo */}
            <div className="p-6">
              <h4 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">
                {curso.titulo}
              </h4>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {curso.descricao || 'Sem descrição'}
              </p>
              
              {/* Progresso */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Progresso</span>
                  <span className="text-orange-500 font-bold">{progressosCursos[curso.id] || 0}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
  className="bg-orange-500 h-2 rounded-full transition-all duration-1000" 
  style={{ width: `${progressosCursos[curso.id] || 0}%` }}
></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">0 de 0 aulas completadas</p>
              </div>
              
              {/* Botões */}
              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/cursos/${curso.id}`)
                  }}
                  className="w-full bg-gray-700 group-hover:bg-orange-600 text-white font-medium py-3 rounded-lg 
                           transition-all duration-300"
                >
                  Começar curso
                </button>
                
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/cursos/${curso.id}/aulas`)
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg 
                             transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Gerenciar Aulas
                  </button>
                )}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )}
</div>
      </main>
    </div>
  )
}
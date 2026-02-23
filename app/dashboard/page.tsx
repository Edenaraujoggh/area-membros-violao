'use client'

import { Trophy, Crown, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, Clock, Award, Settings, LogOut, ChevronLeft, ChevronRight, Play, Download } from 'lucide-react'
import Afinador from '@/app/components/Afinador'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import Metronomo from '@/app/components/Metronomo'
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
  const [mostrarAfinador, setMostrarAfinador] = useState(false)
const [mostrarMetronomo, setMostrarMetronomo] = useState(false)
  // ✅ MOVAR PARA CÁ: Lógica do curso em andamento (disponível para todo o componente)
  const cursoEmAndamento = cursos.length > 0 
  ? cursos.reduce((prev, current) => {
      const prevProgress = progressosCursos[prev.id] || 0
      const currProgress = progressosCursos[current.id] || 0
      return currProgress > prevProgress ? current : prev
    })
  : null
  const progressoAtual = cursoEmAndamento ? (progressosCursos[cursoEmAndamento.id] || 0) : 0

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
        await fetchProgressosCursos(data.map((c: Curso) => c.id))
      }
      console.log('Cursos do banco:', data)
    
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
        {/* 🏆 Ranking Compacto Lateral + Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Coluna 1: Ranking Compacto (Ouro, Prata, Bronze) */}
          <div className="lg:col-span-1 space-y-3">
            
            {/* 🥇 Ouro */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3 hover:border-yellow-400 transition-all">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden bg-gray-800">
                  <img src="/aluno-ouro.jpg" alt="Ouro" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                  <div className="absolute inset-0 flex items-center justify-center text-yellow-500">
                    <Crown className="w-6 h-6" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-gray-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</div>
              </div>
              <div className="min-w-0">
                <div className="text-yellow-400 text-[10px] font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> OURO
                </div>
                <p className="text-white font-bold text-sm truncate">Maria Silva</p>
                <p className="text-gray-400 text-xs">52h</p>
              </div>
            </div>

            {/* 🥈 Prata */}
            <div className="bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/30 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 transition-all">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-gray-400 overflow-hidden bg-gray-800">
                  <img src="/aluno-prata.jpg" alt="Prata" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-gray-400 text-gray-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</div>
              </div>
              <div className="min-w-0">
                <div className="text-gray-300 text-[10px] font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" /> PRATA
                </div>
                <p className="text-white font-bold text-sm truncate">João Pedro</p>
                <p className="text-gray-400 text-xs">48h</p>
              </div>
            </div>

            {/* 🥉 Bronze */}
            <div className="bg-gradient-to-r from-orange-700/10 to-amber-800/10 border border-amber-700/30 rounded-lg p-3 flex items-center gap-3 hover:border-amber-600 transition-all">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-amber-700 overflow-hidden bg-gray-800">
                  <img src="/aluno-bronze.jpg" alt="Bronze" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                  <div className="absolute inset-0 flex items-center justify-center text-amber-700">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-700 text-gray-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">3</div>
              </div>
              <div className="min-w-0">
                <div className="text-amber-600 text-[10px] font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" /> BRONZE
                </div>
                <p className="text-white font-bold text-sm truncate">Ana Luiza</p>
                <p className="text-gray-400 text-xs">45h</p>
              </div>
            </div>
          </div>

          {/* Colunas 2-4: Continue de onde parou (simplificado) */}
          <div className="lg:col-span-3">
            <button 
              onClick={() => {
                if (cursoEmAndamento) {
                  router.push(`/cursos/${cursoEmAndamento.id}`)
                }
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 p-6 rounded-xl transition-all text-left group flex items-center gap-4"
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
                      style={{ width: `${progressoAtual}%` }}
                    />
                  </div>
                  <p className="text-orange-400 text-sm mt-1">
                    {progressoAtual}% completo {cursoEmAndamento && `- ${cursoEmAndamento.titulo}`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Ferramentas Rápidas - 3 Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
          {/* Dicionário */}
          <a 
            href="https://drive.google.com/uc?export=download&id=1hBnP9pUHKmqMLhS6NcC4HqHsSW8jqSZo"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="bg-green-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-white font-bold text-xs">Dicionário<br/>de Acordes</span>
          </a>

          {/* Afinador */}
          <button 
            onClick={() => setMostrarAfinador(true)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="bg-purple-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-white font-bold text-xs">Afinador<br/>Digital</span>
          </button>

          {/* Metrônomo */}
          <button 
            onClick={() => setMostrarMetronomo(true)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2 text-center group"
          >
            <div className="bg-pink-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xs">Metrônomo<br/>Pro</span>
          </button>
        </div>

        {/* Cursos - Carrossel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Seus Cursos</h3>
            <div className="flex gap-2">
              <button className="swiper-button-prev-custom w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-orange-600 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="swiper-button-next-custom w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-orange-600 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {cursos.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum curso disponível ainda.</p>
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
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="!pb-12"
            >
              {cursos.map((curso) => (
                <SwiperSlide key={curso.id}>
                  <div 
                    className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500 transition-all cursor-pointer h-full"
                    onClick={() => router.push(`/cursos/${curso.id}`)}
                  >
                    <div className="h-48 overflow-hidden relative">
                      {curso.imagem_url ? (
                        <img src={curso.imagem_url} alt={curso.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h4 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">{curso.titulo}</h4>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-orange-500 font-bold">{progressosCursos[curso.id] || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progressosCursos[curso.id] || 0}%` }} />
                        </div>
                      </div>
                      <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition-colors">
                        Acessar curso
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
              
        {mostrarAfinador && <Afinador onClose={() => setMostrarAfinador(false)} />}
        {mostrarMetronomo && <Metronomo onClose={() => setMostrarMetronomo(false)} />}         
      </main>
    </div>
  )
}
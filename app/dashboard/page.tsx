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

              {/* 🏆 HALL DA FAMA - Rank Lateral + Carrossel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Coluna 1: Podium Rank (Ouro, Prata, Bronze) */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* 🥇 1º Lugar - OURO */}
            <div className="bg-gradient-to-br from-yellow-500/20 via-yellow-600/20 to-orange-500/20 border-2 border-yellow-400 rounded-xl p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-3 border-yellow-400 overflow-hidden bg-gray-800 shadow-lg">
                    <img src="/aluno-ouro.jpg" alt="1º Lugar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                    <div className="absolute inset-0 flex items-center justify-center text-yellow-500">
                      <Crown className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-gray-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">1</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mb-0.5">
                    <Trophy className="w-3 h-3" fill="currentColor" />
                    OURO
                  </div>
                  <p className="text-white font-bold text-sm truncate">Maria Silva</p>
                  <p className="text-yellow-500/80 text-xs">52h praticadas</p>
                </div>
              </div>
            </div>

            {/* 🥈 2º Lugar - PRATA */}
            <div className="bg-gradient-to-br from-gray-400/20 via-gray-500/20 to-gray-600/20 border-2 border-gray-400 rounded-xl p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-400/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-3 border-gray-400 overflow-hidden bg-gray-800 shadow-lg">
                    <img src="/aluno-prata.jpg" alt="2º Lugar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Award className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-gray-400 text-gray-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">2</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-gray-300 text-xs font-bold mb-0.5">
                    <Award className="w-3 h-3" fill="currentColor" />
                    PRATA
                  </div>
                  <p className="text-white font-bold text-sm truncate">João Pedro</p>
                  <p className="text-gray-400/80 text-xs">48h praticadas</p>
                </div>
              </div>
            </div>

            {/* 🥉 3º Lugar - BRONZE */}
            <div className="bg-gradient-to-br from-orange-700/20 via-amber-800/20 to-orange-900/20 border-2 border-amber-700 rounded-xl p-4 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-700/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-3 border-amber-700 overflow-hidden bg-gray-800 shadow-lg">
                    <img src="/aluno-bronze.jpg" alt="3º Lugar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                    <div className="absolute inset-0 flex items-center justify-center text-amber-700">
                      <Award className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-amber-700 text-gray-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">3</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mb-0.5">
                    <Award className="w-3 h-3" fill="currentColor" />
                    BRONZE
                  </div>
                  <p className="text-white font-bold text-sm truncate">Ana Luiza</p>
                  <p className="text-amber-600/80 text-xs">45h praticadas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2-4: Carrossel Automático dos Destaques */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 h-full relative overflow-hidden">
              <div className="absolute top-4 left-6 z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  Alunos em Destaque
                </h3>
                <p className="text-gray-400 text-sm">Conheça os melhores do mês</p>
              </div>

              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="!pt-16 !pb-12 h-full"
              >
                {/* Slide 1 - Ouro */}
                <SwiperSlide>
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col md:flex-row items-center gap-6 max-w-2xl">
                      <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl shadow-yellow-500/20 relative">
                          <img src="/aluno-ouro.jpg" alt="Maria Silva" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2 shadow-lg">
                          <Trophy className="w-6 h-6 text-gray-900" fill="currentColor" />
                        </div>
                      </div>
                      <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold mb-2 border border-yellow-500/30">
                          <Crown className="w-4 h-4" />
                          1º Lugar - Ouro
                        </div>
                        <h4 className="text-2xl md:text-3xl font-bold text-white mb-1">Maria Silva</h4>
                        <p className="text-gray-400 mb-3">Semestre 2025.1</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 block text-xs">Prática</span>
                            <span className="text-yellow-400 font-bold text-lg">52 horas</span>
                          </div>
                          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 block text-xs">Conquistas</span>
                            <span className="text-yellow-400 font-bold text-lg">12 🏆</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                {/* Slide 2 - Prata */}
                <SwiperSlide>
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col md:flex-row items-center gap-6 max-w-2xl">
                      <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-400 overflow-hidden shadow-2xl shadow-gray-400/20 relative">
                          <img src="/aluno-prata.jpg" alt="João Pedro" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gray-400 rounded-full p-2 shadow-lg">
                          <Award className="w-6 h-6 text-gray-900" fill="currentColor" />
                        </div>
                      </div>
                      <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-gray-400/20 text-gray-300 px-3 py-1 rounded-full text-sm font-bold mb-2 border border-gray-400/30">
                          <Award className="w-4 h-4" />
                          2º Lugar - Prata
                        </div>
                        <h4 className="text-2xl md:text-3xl font-bold text-white mb-1">João Pedro</h4>
                        <p className="text-gray-400 mb-3">Semestre 2025.1</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 block text-xs">Prática</span>
                            <span className="text-gray-300 font-bold text-lg">48 horas</span>
                          </div>
                          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 block text-xs">Conquistas</span>
                            <span className="text-gray-300 font-bold text-lg">10 🥈</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                {/* Slide 3 - Bronze */}
                <SwiperSlide>
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col md:flex-row items-center gap-6 max-w-2xl">
                      <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-amber-700 overflow-hidden shadow-2xl shadow-amber-700/20 relative">
                          <img src="/aluno-bronze.jpg" alt="Ana Luiza" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-700 rounded-full p-2 shadow-lg">
                          <Award className="w-6 h-6 text-gray-900" fill="currentColor" />
                        </div>
                      </div>
                      <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-amber-700/20 text-amber-600 px-3 py-1 rounded-full text-sm font-bold mb-2 border border-amber-700/30">
                          <Award className="w-4 h-4" />
                          3º Lugar - Bronze
                        </div>
                        <h4 className="text-2xl md:text-3xl font-bold text-white mb-1">Ana Luiza</h4>
                        <p className="text-gray-400 mb-3">Semestre 2025.1</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 block text-xs">Prática</span>
                            <span className="text-amber-600 font-bold text-lg">45 horas</span>
                          </div>
                          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 block text-xs">Conquistas</span>
                            <span className="text-amber-600 font-bold text-lg">8 🥉</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Play, CheckCircle, Circle, ChevronLeft, BookOpen, Clock, FileText, Download, Paperclip, Loader2, MessageCircle, Send, Pause} from 'lucide-react'

interface Aula {
  id: string
  titulo: string
  descricao: string
  video_url: string
  ordem: number
  duracao_segundos?: number
}

interface Curso {
  id: string
  titulo: string
  descricao: string
}

interface Material {
  id: string
  nome: string
  tipo: string
  arquivo_path: string
  tamanho_bytes?: number
  created_at: string
}interface Comentario {
  id: string
  aula_id: string
  usuario_id: string
  conteudo: string
  created_at: string
  usuario?: {
    nome?: string
    email?: string
  }
}

// Função para transformar URL do YouTube em URL de embed
function getYoutubeEmbedUrl(url: string) {
  if (!url) return ''
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/
  const match = url.match(regExp)
  
  const videoId = (match && match[2].length === 11) ? match[2] : null
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  return url
}

// Função para formatar tamanho do arquivo
function formatarTamanho(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Função para obter ícone baseado no tipo do arquivo
function getTipoArquivo(tipo: string): string {
  if (tipo.includes('pdf')) return 'PDF'
  if (tipo.includes('image')) return 'Imagem'
  if (tipo.includes('word') || tipo.includes('document')) return 'DOC'
  if (tipo.includes('excel') || tipo.includes('sheet')) return 'XLS'
  if (tipo.includes('text')) return 'TXT'
  return 'Arquivo'
}

export default function CursoPage() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string
  
  const [curso, setCurso] = useState<Curso | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null)
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMateriais, setLoadingMateriais] = useState(false)
  const [baixandoId, setBaixandoId] = useState<string | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [aulasConcluidas, setAulasConcluidas] = useState<string[]>([])
const [comentarios, setComentarios] = useState<Comentario[]>([])
const [novoComentario, setNovoComentario] = useState('')
const [carregandoComentarios, setCarregandoComentarios] = useState(false)
const [enviandoComentario, setEnviandoComentario] = useState(false)
const [tempoPratica, setTempoPratica] = useState(0)
const [timerAtivo, setTimerAtivo] = useState(false)
const [tempoTotalSalvo, setTempoTotalSalvo] = useState(0)
  useEffect(() => {
    fetchCurso()
    fetchAulas()
  }, [cursoId])
  useEffect(() => {
  if (aulas.length > 0) {
    fetchProgresso()
  }
}, [aulas])

 useEffect(() => {
  if (aulaAtual?.id) {
    fetchMateriais(aulaAtual.id)
    buscarComentarios()
    buscarTempoPratica(aulaAtual.id)
    setTempoPratica(0) // reseta contador atual
    setTimerAtivo(false) // para timer ao trocar aula
  }
}, [aulaAtual?.id])

// Timer de prática - conta quando ativo
useEffect(() => {
  let interval: NodeJS.Timeout
  
  if (timerAtivo && aulaAtual) {
    interval = setInterval(() => {
      setTempoPratica(prev => prev + 1)
    }, 1000)
  }
  
  return () => clearInterval(interval)
}, [timerAtivo, aulaAtual])

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
      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .eq('curso_id', cursoId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar aulas:', error)
        return
      }

      if (data && data.length > 0) {
        setAulas(data)
        setAulaAtual(data[0])
      
      } else {
        setAulas([])
        setAulaAtual(null)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

async function fetchProgresso() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('progresso_aulas')
      .select('aula_id')
      .eq('user_id', user.id)
      .eq('curso_id', cursoId)

    if (data) {
      const aulasConcluidasIds = data.map(item => item.aula_id)
      setAulasConcluidas(aulasConcluidasIds)
      
      // Calcula progresso
      if (aulas.length > 0) {
        const percentual = Math.round((aulasConcluidasIds.length / aulas.length) * 100)
        setProgresso(percentual)
      }
    }
  } catch (error) {
    console.error('Erro ao buscar progresso:', error)
  }
}
async function buscarTempoPratica(aulaId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('registro_pratica')
      .select('tempo_segundos')
      .eq('user_id', user.id)
      .eq('aula_id', aulaId)
      .single()

    if (data) {
      setTempoTotalSalvo(data.tempo_segundos || 0)
    } else {
      setTempoTotalSalvo(0)
    }
  } catch (error) {
    console.error('Erro ao buscar tempo:', error)
    setTempoTotalSalvo(0)
  }
}

async function salvarTempoPratica() {
  if (!aulaAtual) return
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tempoTotal = tempoTotalSalvo + tempoPratica

    const { error } = await supabase
      .from('registro_pratica')
      .upsert({
        user_id: user.id,
        aula_id: aulaAtual.id,
        curso_id: cursoId,
        tempo_segundos: tempoTotal
      }, {
        onConflict: 'user_id,aula_id'
      })

    if (error) throw error
    
    setTempoTotalSalvo(tempoTotal)
    setTempoPratica(0)
    console.log('Tempo salvo:', tempoTotal)
  } catch (error) {
    console.error('Erro ao salvar tempo:', error)
  }
}

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600)
  const min = Math.floor((segundos % 3600) / 60)
  const sec = segundos % 60
  
  if (horas > 0) {
    return `${horas}h ${min}min ${sec}s`
  }
  return `${min}min ${sec}s`
}


  async function fetchMateriais(aulaId: string) {
    setLoadingMateriais(true)
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('aula_id', aulaId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar materiais:', error)
        setMateriais([])
      } else {
        setMateriais(data || [])
      }
    } catch (error) {
      console.error('Erro:', error)
      setMateriais([])
    } finally {
      setLoadingMateriais(false)
    }
  }
  // Buscar comentários da aula
// Buscar comentários da aula - SIMPLIFICADO
async function buscarComentarios() {
  console.log('Buscando comentários para aula:', aulaAtual?.id)
  if (!aulaAtual?.id) {
    console.log('Sem aula atual, retornando')
    return
  }
  
  setCarregandoComentarios(true)
  try {
    console.log('Fazendo query no Supabase...')
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('aula_id', aulaAtual.id)
      .order('created_a', { ascending: false })

    console.log('Resposta do Supabase:', { data, error })

    if (error) {
      console.error('Erro na query:', error)
      throw error
    }
    
    console.log('Comentários encontrados:', data?.length || 0)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const comentariosComUsuario = (data || []).map(c => ({
      ...c,
      usuario: {
        nome: user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Aluno',
        email: user?.email || ''
      }
    }))
    
    setComentarios(comentariosComUsuario)
  } catch (error) {
    console.error('Erro ao buscar comentários:', error)
  } finally {
    setCarregandoComentarios(false)
  }
}

// Enviar novo comentário - SIMPLIFICADO
async function enviarComentario(e: React.FormEvent) {
  e.preventDefault()
  if (!novoComentario.trim() || !aulaAtual?.id) return

  setEnviandoComentario(true)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Você precisa estar logado para comentar')
      return
    }

    const { data, error } = await supabase
      .from('comentarios')
      .insert({
        aula_id: aulaAtual.id,
        usuario_id: user.id,
        conteudo: novoComentario.trim()
      })
      .select()

    if (error) {
      console.error('Erro detalhado:', error)
      throw error
    }

    if (data && data[0]) {
      const novoComentarioComUsuario = {
        ...data[0],
        usuario: {
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Aluno',
          email: user.email || ''
        }
      }
      setComentarios(prev => [novoComentarioComUsuario, ...prev])
      setNovoComentario('')
    }
  } catch (error) {
    console.error('Erro ao enviar comentário:', error)
    alert('Erro ao enviar comentário - Veja o console (F12) para detalhes')
  } finally {
    setEnviandoComentario(false)
  }
}

  function selecionarAula(aula: Aula) {
    setAulaAtual(aula)
  }

  async function toggleAulaConcluida(aulaId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Você precisa estar logado')
        return
      }

      const jaConcluida = aulasConcluidas.includes(aulaId)

      if (jaConcluida) {
        // Desmarcar aula
        const { error } = await supabase
          .from('progresso_aulas')
          .delete()
          .eq('user_id', user.id)
          .eq('aula_id', aulaId)

        if (error) throw error

        setAulasConcluidas(prev => prev.filter(id => id !== aulaId))
        setProgresso(prev => {
          const novoProgresso = Math.max(0, prev - Math.round(100 / aulas.length))
          return novoProgresso
        })
      } else {
        // Marcar aula como concluída
        const { error } = await supabase
          .from('progresso_aulas')
          .insert({
            user_id: user.id,
            aula_id: aulaId,
            curso_id: cursoId,
            concluida: true
          })

        if (error) throw error

        setAulasConcluidas(prev => [...prev, aulaId])
        setProgresso(prev => {
          const novoProgresso = Math.min(100, prev + Math.round(100 / aulas.length))
          return novoProgresso
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
      alert('Erro ao salvar progresso')
    }
  }

  function formatarDuracao(segundos?: number) {
    if (!segundos) return '00:00'
    const min = Math.floor(segundos / 60)
    const sec = (segundos % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  // FUNÇÃO DE DOWNLOAD CORRIGIDA - Gera URL assinada do Supabase
function baixarMaterial(material: Material) {
  try {
    setBaixandoId(material.id)
    // Agora envia o arquivo_path em vez de url
    const downloadUrl = `/api/download?path=${encodeURIComponent(material.arquivo_path)}&name=${encodeURIComponent(material.nome)}`
    window.open(downloadUrl, '_blank')
    setTimeout(() => setBaixandoId(null), 1000)
  } catch (error) {
    console.error('Erro:', error)
    setBaixandoId(null)
   // Fallback: tenta abrir direto (não vai funcionar sem URL completa, mas é segurança)
    alert('Erro ao baixar arquivo')
  }
}

// ← Apenas UMA chave } fecha a função handleDownload
// ← Remova as chaves extras que estavam aqui!

if (loading) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
    </div>
  )
}

return 
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto sm:h-16 flex flex-col sm:flex-row items-center justify-between py-2 sm:py-0">
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
                <div className="w-24 sm:w-32 bg-gray-700 rounded-full h-2">
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
            {/* Player de Vídeo */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              {aulaAtual?.video_url ? (
                <iframe
                  src={getYoutubeEmbedUrl(aulaAtual.video_url)}
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

            {/* Informações da Aula */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {aulaAtual?.titulo}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatarDuracao(aulaAtual?.duracao_segundos)}
                    </span>
                    <span>Aula {aulaAtual?.ordem} de {aulas.length}</span>
           {(tempoTotalSalvo > 0 || tempoPratica > 0) && (
  <span className="flex items-center gap-1 text-blue-400 font-medium">
    <Clock className="w-4 h-4" />
    Praticado: {formatarTempo(tempoTotalSalvo + tempoPratica)}
  </span>
)}
                  </div>         
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Botão Timer de Prática */}
                  <button
                    onClick={() => {
                      if (timerAtivo) {
                        salvarTempoPratica()
                      }
                      setTimerAtivo(!timerAtivo)
                    }}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      timerAtivo 
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {timerAtivo ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pausar</span>
                        <span className="hidden sm:inline">({formatarTempo(tempoPratica)})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Praticar</span>
                        {tempoTotalSalvo > 0 && <span className="hidden sm:inline">({formatarTempo(tempoTotalSalvo)})</span>}
                      </>
                    )}
                  </button>

                  {/* Botão Concluir Aula - Menor no mobile */}
                  <button
                    onClick={() => aulaAtual && toggleAulaConcluida(aulaAtual.id)}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      aulaAtual && aulasConcluidas.includes(aulaAtual.id)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {aulaAtual && aulasConcluidas.includes(aulaAtual.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Concluída</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Marcar como concluída</span>
                        <span className="sm:hidden">Concluir</span>
                      </>
                    )}
                  </button>
                </div>
              
                <p className="text-gray-300 leading-relaxed mb-6">
                  {aulaAtual?.descricao}
                </p>

                {/* SEÇÃO DE MATERIAIS DE APOIO */}
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Paperclip className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-bold text-white">Materiais de Apoio</h3>
                    {materiais.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        {materiais.length}
                      </span>
                    )}
                  </div>

                {loadingMateriais ? (
                  <div className="flex items-center gap-2 text-gray-400 py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    <span className="text-sm">Carregando materiais...</span>
                  </div>
                ) : materiais.length === 0 ? (
                  <div className="bg-gray-750 rounded-lg p-4 text-center border border-dashed border-gray-600">
                    <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      Nenhum material disponível para esta aula
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materiais.map((material) => (
                      <div 
                        key={material.id}
                        className="flex items-center justify-between bg-gray-750 rounded-lg p-4 border border-gray-600 hover:border-orange-500/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-500/10 p-3 rounded-lg">
                            <FileText className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-orange-400 transition-colors">
                              {material.nome}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span className="bg-gray-700 px-2 py-0.5 rounded">
                                {getTipoArquivo(material.tipo)}
                              </span>
                              {material.tamanho_bytes && (
                                <span>{formatarTamanho(material.tamanho_bytes)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => baixarMaterial(material)}
                          disabled={baixandoId === material.id}
                          className="flex items-center gap-2 bg-gray-700 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {baixandoId === material.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Baixando...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Baixar
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* FIM DA SEÇÃO DE MATERIAIS */}
      {/* FIM DA SEÇÃO DE MATERIAIS */}
      
           {/* SEÇÃO DE COMENTÁRIOS */}
      <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-bold text-white">Comentários da Turma</h3>
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
            {comentarios.length}
          </span>
        </div>

        {/* Formulário de novo comentário */}
        <form onSubmit={enviarComentario} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Compartilhe sua dúvida ou experiência com esta aula..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                disabled={enviandoComentario}
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={enviandoComentario || !novoComentario.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {enviandoComentario ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Comentário
                </>
              )}
            </button>
          </div>
        </form>

        {/* Lista de comentários */}
        <div className="space-y-4">
          {carregandoComentarios ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          ) : (
            comentarios.map((comentario) => (
              <div key={comentario.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {(comentario.usuario?.nome || comentario.usuario?.email || 'A')[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-white">
                      {comentario.usuario?.nome || comentario.usuario?.email || 'Aluno'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {comentario.created_at ? new Date(comentario.created_at).toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
}) : 'Agora'}
                  </span>
                </div>
                <p className="text-zinc-300 leading-relaxed pl-10">
                  {comentario.conteudo}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
            </div>
          </div>

          {/* Sidebar - Lista de Aulas */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white">Conteúdo do Curso</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {aulas.length} aulas
                </p>
              </div>
              
              <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                {aulas.map((aula, index) => {
  const concluida = aulasConcluidas.includes(aula.id)
  return (
  <button
    key={aula.id}
    onClick={() => selecionarAula(aula)}
    className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-gray-750 ${
      aulaAtual?.id === aula.id ? 'bg-gray-750 border-l-4 border-orange-500' : 'border-l-4 border-transparent'
    }`}
  >
    <div className="mt-1">
      {concluida ? (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      ) : aulaAtual?.id === aula.id ? (
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
        {formatarDuracao(aula.duracao_segundos)}
      </span>
    </div>
  </button>
  )
})}
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-center">
              <h4 className="text-white font-bold mb-2">Precisa de ajuda?</h4>
              <p className="text-white/80 text-sm mb-4">
                Acesse a Comunidade para Conhecer os outros alunos, e se motivar mais ainda.
              </p>
<a 
  href="https://www.facebook.com/share/g/1afMhNT2Cb/"
  target="_blank"
  rel="noopener noreferrer"
  className="block bg-white text-orange-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors w-full text-center"
>
  Acessar Comunidade Agora
</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
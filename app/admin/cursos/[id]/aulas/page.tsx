'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit, Trash, Play, Save, X, Youtube } from 'lucide-react'
import MateriaisManager from './MateriaisManager'

interface Aula {
  id?: string
  titulo: string
  descricao: string
  video_url: string
  ordem: number
  duracao_segundos: number
  status: string
  curso_id: string
}

export default function GerenciarAulas() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string
  
  const [aulas, setAulas] = useState<Aula[]>([])
  const [cursoNome, setCursoNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAula, setEditingAula] = useState<Aula | null>(null)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState<Aula>({
    titulo: '',
    descricao: '',
    video_url: '',
    ordem: 1,
    duracao_segundos: 0,
    status: 'ativo',
    curso_id: cursoId
  })

  useEffect(() => {
    fetchCurso()
    fetchAulas()
  }, [cursoId])

  async function fetchCurso() {
    const { data } = await supabase
      .from('cursos')
      .select('titulo')
      .eq('id', cursoId)
      .single()
    if (data) setCursoNome(data.titulo)
  }

  async function fetchAulas() {
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('curso_id', cursoId)
      .order('ordem', { ascending: true })
    
    if (data) setAulas(data)
    setLoading(false)
  }

  function converterUrlYoutube(url: string) {
    // Se já for embed, retorna como está
    if (url.includes('embed/')) return url
    
    // Converte watch?v= para embed/
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^"&?\/\s]{11})/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    return url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const videoUrlConvertida = converterUrlYoutube(formData.video_url)
    
    const dadosParaSalvar = {
      ...formData,
      video_url: videoUrlConvertida,
      curso_id: cursoId
    }

    if (editingAula?.id) {
      // Atualizar
      const { error } = await supabase
        .from('aulas')
        .update(dadosParaSalvar)
        .eq('id', editingAula.id)
      
      if (!error) {
        setMessage('Aula atualizada com sucesso!')
      }
    } else {
      // Criar novo
      const { error } = await supabase
        .from('aulas')
        .insert([dadosParaSalvar])
      
      if (!error) {
        setMessage('Aula criada com sucesso!')
      }
    }

    setTimeout(() => setMessage(''), 3000)
    resetForm()
    fetchAulas()
  }

  async function deleteAula(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return
    
    const { error } = await supabase
      .from('aulas')
      .delete()
      .eq('id', id)

    if (!error) {
      setMessage('Aula excluída!')
      fetchAulas()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  function resetForm() {
    setFormData({
      titulo: '',
      descricao: '',
      video_url: '',
      ordem: aulas.length + 1,
      duracao_segundos: 0,
      status: 'ativo',
      curso_id: cursoId
    })
    setEditingAula(null)
    setShowForm(false)
  }

  function startEdit(aula: Aula) {
    setEditingAula(aula)
    setFormData(aula)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar aos Cursos
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Aulas</h1>
              <p className="text-gray-400 mt-1">Curso: {cursoNome}</p>
            </div>
            
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showForm ? 'Cancelar' : 'Nova Aula'}
            </button>
          </div>
        </div>

        {/* Mensagem */}
        {message && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-500 text-green-400 rounded-lg">
            {message}
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Youtube className="w-6 h-6 text-red-500" />
              {editingAula ? 'Editar Aula' : 'Cadastrar Nova Aula'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Título da Aula *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                    placeholder="Ex: Aula 1: Introdução"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Link do YouTube *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pode colar o link normal do YouTube que converto automaticamente
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="O que o aluno vai aprender nesta aula..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Ordem (número)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ordem}
                    onChange={(e) => setFormData({...formData, ordem: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duração (segundos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duracao_segundos}
                    onChange={(e) => setFormData({...formData, duracao_segundos: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                    placeholder="900 = 15 minutos"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingAula ? 'Atualizar' : 'Salvar'} Aula
                </button>
                
                {editingAula && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Lista de Aulas */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-750">
            <h3 className="text-lg font-bold">Aulas Cadastradas ({aulas.length})</h3>
          </div>
          
          {aulas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma aula cadastrada.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="text-orange-500 hover:text-orange-400 mt-2"
              >
                Cadastrar primeira aula
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {aulas.map((aula) => (
                <div key={aula.id} className="p-4 hover:bg-gray-750 transition-colors">
                  {/* Linha principal da aula */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-700 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-gray-400">
                        {aula.ordem}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{aula.titulo}</h4>
                        <p className="text-sm text-gray-400 line-clamp-1">{aula.descricao}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className={aula.status === 'ativo' ? 'text-green-400' : 'text-yellow-400'}>
                            {aula.status}
                          </span>
                          <span>•</span>
                          <span>
                            {Math.floor((aula.duracao_segundos || 0) / 60)}:{((aula.duracao_segundos || 0) % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(aula)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => aula.id && deleteAula(aula.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* COMPONENTE DE MATERIAIS - ADICIONADO AQUI */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <MateriaisManager aulaId={aula.id!} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
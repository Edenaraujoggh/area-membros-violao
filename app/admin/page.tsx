'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash, BookOpen } from 'lucide-react'

interface Curso {
  id: string
  titulo: string
  descricao: string
  imagem_url: string
  status: string
  created_at: string
}

export default function AdminCursos() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null)
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    imagem_url: '',
    status: 'ativo'
  })

  useEffect(() => {
    fetchCursos()
  }, [])

  async function fetchCursos() {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setCursos(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingCurso) {
      await supabase
        .from('cursos')
        .update(formData)
        .eq('id', editingCurso.id)
    } else {
      await supabase
        .from('cursos')
        .insert([formData])
    }

    setShowForm(false)
    setEditingCurso(null)
    setFormData({ titulo: '', descricao: '', imagem_url: '', status: 'ativo' })
    fetchCursos()
  }

  async function deleteCurso(id: string) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return
    
    await supabase.from('cursos').delete().eq('id', id)
    fetchCursos()
  }

  function startEdit(curso: Curso) {
    setEditingCurso(curso)
    setFormData({
      titulo: curso.titulo,
      descricao: curso.descricao,
      imagem_url: curso.imagem_url || '',
      status: curso.status
    })
    setShowForm(true)
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
            <p className="text-gray-400 mt-1">Administração dos cursos da plataforma</p>
          </div>
          
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingCurso(null)
              setFormData({ titulo: '', descricao: '', imagem_url: '', status: 'ativo' })
            }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Cancelar' : 'Novo Curso'}
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold mb-6">
              {editingCurso ? 'Editar Curso' : 'Cadastrar Novo Curso'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Título do Curso *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Violão para Iniciantes"
                />
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
                  placeholder="Descreva o curso..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL da Imagem/Thumbnail
                </label>
                <input
                  type="url"
                  value={formData.imagem_url}
                  onChange={(e) => setFormData({...formData, imagem_url: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="https://exemplo.com/imagem.jpg"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors"
                >
                  {editingCurso ? 'Atualizar' : 'Salvar'} Curso
                </button>
                
                {editingCurso && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingCurso(null)
                    }}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Lista de Cursos */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-750">
            <h3 className="text-lg font-bold">Cursos Cadastrados ({cursos.length})</h3>
          </div>
          
          {cursos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum curso cadastrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {cursos.map((curso) => (
                <div 
                  key={curso.id} 
                  className="p-4 hover:bg-gray-750 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-lg">{curso.titulo}</h4>
                      <p className="text-sm text-gray-400 line-clamp-1">{curso.descricao}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          curso.status === 'ativo' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {curso.status}
                        </span>
                        <span className="text-gray-500">
                          {new Date(curso.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/cursos/${curso.id}/aulas`)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors text-sm font-medium"
                    >
                      <BookOpen className="w-4 h-4" />
                      Aulas
                    </button>
                    
                    <button
                      onClick={() => startEdit(curso)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => deleteCurso(curso.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
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
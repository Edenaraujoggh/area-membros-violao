'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Plus, Edit, Trash, BookOpen, ChevronLeft } from 'lucide-react'

// NOVO: Cliente Supabase para upload
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  // NOVO: Estados para upload de imagem
  const [imagemCapa, setImagemCapa] = useState<File | null>(null)
  const [previewImagem, setPreviewImagem] = useState<string>('')
  const [uploading, setUploading] = useState(false)

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

    try {
      console.log('Iniciando salvamento do curso...')
      // NOVO: Upload da imagem primeiro (se tiver nova imagem)
      let imagemUrl = formData.imagem_url
      
      if (imagemCapa) {
        setUploading(true)
        const fileExt = imagemCapa.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `capas/${fileName}`
        console.log('Tentando fazer upload para:', filePath)

        const { error: uploadError } = await supabase.storage
         .from('IMAGENS-CURSOS')
          .upload(filePath, imagemCapa)

              if (uploadError) {
        console.error('ERRO NO UPLOAD:', uploadError)
        alert('Erro ao fazer upload da imagem: ' + uploadError.message)
        setUploading(false)
        return
      }
      console.log('Upload feito com sucesso!')

        const { data: { publicUrl } } = supabase.storage
           .from('IMAGENS-CURSOS')
          .getPublicUrl(filePath)

        imagemUrl = publicUrl
        setUploading(false)
      }

      const dadosParaSalvar = {
        ...formData,
        imagem_url: imagemUrl
      }

      if (editingCurso) {
        await supabase
          .from('cursos')
          .update(dadosParaSalvar)
          .eq('id', editingCurso.id)
      } else {
        await supabase
          .from('cursos')
          .insert([dadosParaSalvar])
      }

      setShowForm(false)
      setEditingCurso(null)
      setFormData({ titulo: '', descricao: '', imagem_url: '', status: 'ativo' })
      // NOVO: Limpar estados da imagem
      setImagemCapa(null)
      setPreviewImagem('')
      fetchCursos()
  } catch (error: any) {
  console.error('ERRO GERAL:', error)
  alert('Erro ao salvar curso: ' + (error?.message || 'Erro desconhecido'))
  setUploading(false)
}
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
    // NOVO: Carregar imagem existente no preview
    setPreviewImagem(curso.imagem_url || '')
    setImagemCapa(null)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingCurso(null)
    setFormData({ titulo: '', descricao: '', imagem_url: '', status: 'ativo' })
    // NOVO: Limpar imagem ao cancelar
    setImagemCapa(null)
    setPreviewImagem('')
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
          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
              <p className="text-gray-400 mt-1">Administração dos cursos da plataforma</p>
            </div>
            
            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditingCurso(null)
                setFormData({ titulo: '', descricao: '', imagem_url: '', status: 'ativo' })
                // NOVO: Limpar imagem ao criar novo
                setImagemCapa(null)
                setPreviewImagem('')
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              {showForm ? 'Cancelar' : 'Novo Curso'}
            </button>
          </div>
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

              {/* NOVO: Campo de Upload de Imagem (substituiu o URL) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Imagem de Capa
                </label>
                
                {/* Preview da imagem */}
                {previewImagem && (
                  <div className="mb-3">
                    <img 
                      src={previewImagem} 
                      alt="Preview" 
                      className="w-48 h-32 object-cover rounded-lg border border-gray-600"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {imagemCapa ? 'Nova imagem selecionada' : 'Imagem atual'}
                    </p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImagemCapa(file)
                      setPreviewImagem(URL.createObjectURL(file))
                    }
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Clique para selecionar uma imagem do seu computador
                </p>
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
                  disabled={uploading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                    uploading 
                      ? 'bg-green-600/50 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    `${editingCurso ? 'Atualizar' : 'Salvar'} Curso`
                  )}
                </button>
                
                {editingCurso && (
                  <button
                    type="button"
                    onClick={handleCancel}
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
                    {/* NOVO: Mostra a imagem do curso ou ícone padrão */}
                    {curso.imagem_url ? (
                      <img 
                        src={curso.imagem_url} 
                        alt={curso.titulo}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
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
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Curso {
  id: string
  titulo: string
  descricao: string
  imagem_capa: string | null
  status: string | null
  created_at: string
}

export default function AdminCursos() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null)
  
  // Form states
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  // Carregar cursos ao iniciar
  useEffect(() => {
    fetchCursos()
  }, [])

  const fetchCursos = async () => {
    try {
      const response = await fetch('/api/cursos')
      const result = await response.json()
      
      if (response.ok) {
        setCursos(result.data || [])
      } else {
        setErro('Erro ao carregar cursos')
      }
    } catch (error) {
      setErro('Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setMensagem('')

    try {
      const url = editingCurso ? `/api/cursos/${editingCurso.id}` : '/api/cursos'
      const method = editingCurso ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao }),
      })

      const result = await response.json()

      if (response.ok) {
        setMensagem(editingCurso ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!')
        setTitulo('')
        setDescricao('')
        setShowForm(false)
        setEditingCurso(null)
        fetchCursos() // Recarregar lista
      } else {
        setErro(result.error || 'Erro ao salvar curso')
      }
    } catch (error) {
      setErro('Erro ao salvar curso')
    }
  }

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso)
    setTitulo(curso.titulo)
    setDescricao(curso.descricao || '')
    setShowForm(true)
    setErro('')
    setMensagem('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return

    try {
      const response = await fetch(`/api/cursos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMensagem('Curso excluído com sucesso!')
        fetchCursos() // Recarregar lista
      } else {
        const result = await response.json()
        setErro(result.error || 'Erro ao excluir curso')
      }
    } catch (error) {
      setErro('Erro ao excluir curso')
    }
  }

  const handleNew = () => {
    setEditingCurso(null)
    setTitulo('')
    setDescricao('')
    setShowForm(true)
    setErro('')
    setMensagem('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCurso(null)
    setTitulo('')
    setDescricao('')
    setErro('')
    setMensagem('')
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gerenciar Cursos</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              ← Voltar ao Painel
            </Link>
          </div>
          <button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Novo Curso
          </button>
        </div>

        {/* Mensagens */}
        {mensagem && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {mensagem}
          </div>
        )}
        {erro && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {erro}
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {editingCurso ? 'Editar Curso' : 'Cadastrar Novo Curso'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Curso *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Curso de Violão Básico"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição do curso..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingCurso ? 'Atualizar' : 'Salvar'} Curso
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Cursos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Cursos Cadastrados ({cursos.length})
            </h2>
          </div>
          
          {cursos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum curso cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cursos.map((curso) => (
                    <tr key={curso.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {curso.titulo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {curso.descricao || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(curso.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(curso)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(curso.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
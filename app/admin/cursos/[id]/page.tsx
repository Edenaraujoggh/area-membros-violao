'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function EditarCursoPage() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState('ativo')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function buscarCurso() {
      try {
        const { data, error } = await supabase
          .from('cursos')  // ← tabela em português
          .select('*')
          .eq('id', cursoId)
          .single()

        if (error) {
          alert('Erro ao buscar curso: ' + error.message)
          router.push('/admin')
          return
        }

        if (data) {
          // ← campos em português
          setTitulo(data.titulo || '')
          setDescricao(data.descricao || '')
          setStatus(data.status || 'ativo')
        }
      } catch (err) {
        console.error(err)
        alert('Erro ao carregar curso')
      } finally {
        setLoading(false)
      }
    }

    buscarCurso()
  }, [cursoId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    try {
      const { error } = await supabase
        .from('cursos')  // ← tabela em português
        .update({
          titulo,           // ← campo em português
          descricao,        // ← campo em português
          status,           // ← campo em português
          updated_at: new Date().toISOString()
        })
        .eq('id', cursoId)

      if (error) {
        alert('Erro ao atualizar: ' + error.message)
        return
      }

      alert('Curso atualizado com sucesso!')
      router.push('/admin')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para lista
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            ✏️ Editar Curso
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Curso
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ex: Violão para Iniciantes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                placeholder="Descrição do curso..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="ativo">🟢 Ativo (visível para alunos)</option>
                <option value="rascunho">🟡 Rascunho (não visível)</option>
                <option value="inativo">🔴 Inativo</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">🎥 Gerenciar Aulas</h2>
          <p className="text-gray-600 mb-4">
            Adicione, edite ou organize as aulas deste curso.
          </p>
          <button
            onClick={() => router.push(`/admin/cursos/${cursoId}/videos`)}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            Ir para gerenciamento de aulas →
          </button>
        </div>
      </div>
    </div>
  )
}
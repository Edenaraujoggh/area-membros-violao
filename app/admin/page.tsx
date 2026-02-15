'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetchCursos()
  }, [])

  const fetchCursos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setCursos(data || [])
    } catch (error: any) {
      setErro('Erro ao carregar cursos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return

    try {
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCursos(cursos.filter(c => c.id !== id))
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
          <Link 
            href="/admin/cursos/novo"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Novo Curso
          </Link>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {erro}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">
          Cursos Cadastrados ({cursos.length})
        </h2>

        {cursos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            Nenhum curso cadastrado ainda.
          </div>
        ) : (
          <div className="grid gap-4">
            {cursos.map((curso) => (
              <div key={curso.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{curso.titulo}</h3>
                    <p className="text-gray-600 mt-2">{curso.descricao}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded text-sm ${
                      curso.status === 'ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {curso.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/cursos/${curso.id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(curso.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
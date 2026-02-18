'use client'

import { useState, useEffect, useCallback } from 'react'

interface Material {
  id: string
  nome: string
  tipo: string
  tamanho: number
  download_url: string
  created_at: string
}

interface MateriaisManagerProps {
  aulaId: string
}

export default function MateriaisManager({ aulaId }: MateriaisManagerProps) {
  const [materiais, setMateriais] = useState<Material[]>([])
  const [uploading, setUploading] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)

  const carregarMateriais = useCallback(async () => {
    try {
      const res = await fetch(`/api/aulas/${aulaId}/materiais`)
      const data = await res.json()
      if (data.materiais) setMateriais(data.materiais)
    } catch (error) {
      console.error('Erro:', error)
    }
  }, [aulaId])

  useEffect(() => {
    carregarMateriais()
  }, [carregarMateriais])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!arquivoSelecionado) return

    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', arquivoSelecionado)
    formData.append('nome', nomeArquivo || arquivoSelecionado.name)

    try {
      const res = await fetch(`/api/aulas/${aulaId}/materiais`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setNomeArquivo('')
        setArquivoSelecionado(null)
        carregarMateriais()
        alert('Material enviado com sucesso!')
      } else {
        alert('Erro ao enviar arquivo')
      }
    } catch (error) {
      alert('Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return

    try {
      const res = await fetch(`/api/aulas/${aulaId}/materiais?materialId=${materialId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        carregarMateriais()
      }
    } catch (error) {
      alert('Erro ao excluir')
    }
  }

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getIconePorTipo = (tipo: string) => {
    if (tipo === 'pdf') return '📄'
    if (['jpg', 'jpeg', 'png', 'gif'].includes(tipo)) return '🖼️'
    if (tipo === 'txt') return '📝'
    return '📎'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">📚 Materiais de Apoio</h3>
      
      {/* Form de Upload */}
      <form onSubmit={handleUpload} className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do material (opcional)
            </label>
            <input
              type="text"
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
              placeholder="Ex: Cifra completa da música"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecionar arquivo (PDF, JPG, PNG, TXT)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt"
              onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={!arquivoSelecionado || uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '⏫ Enviando...' : '⬆️ Fazer Upload'}
          </button>
        </div>
      </form>

      {/* Lista de Materiais */}
      <div className="space-y-2">
        {materiais.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum material anexado ainda</p>
        ) : (
          materiais.map((material) => (
            <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getIconePorTipo(material.tipo)}</span>
                <div>
                  <p className="font-medium text-gray-800">{material.nome}</p>
                  <p className="text-xs text-gray-500">{formatarTamanho(material.tamanho)} • {material.tipo.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={material.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium transition-colors"
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
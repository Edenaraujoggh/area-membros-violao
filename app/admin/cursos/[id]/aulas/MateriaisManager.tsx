'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Paperclip, Trash2, Download, X } from 'lucide-react'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('nome', file.name)

    try {
      const res = await fetch(`/api/aulas/${aulaId}/materiais`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        carregarMateriais()
        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        if (fileInputRef.current) fileInputRef.current.value = ''
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
    if (!confirm('Excluir este material?')) return

    try {
      const res = await fetch(`/api/aulas/${aulaId}/materiais?materialId=${materialId}`, {
        method: 'DELETE'
      })

      if (res.ok) carregarMateriais()
    } catch (error) {
      alert('Erro ao excluir')
    }
  }

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i]
  }

  const getIconePorTipo = (tipo: string) => {
    if (tipo === 'pdf') return '📄'
    if (['jpg', 'jpeg', 'png', 'gif'].includes(tipo)) return '🖼️'
    return '📎'
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Materiais ({materiais.length})
        </h4>
        
        {/* Botão de upload minimalista */}
        <label className={`cursor-pointer text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${uploading ? 'opacity-50' : ''}`}>
          <span>{uploading ? '⏳' : '+'}</span>
          <span>{uploading ? 'Enviando...' : 'Anexar'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Lista compacta */}
      {materiais.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">Nenhum arquivo anexado</p>
      ) : (
        <div className="space-y-2">
          {materiais.map((material) => (
            <div key={material.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 group hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-lg flex-shrink-0">{getIconePorTipo(material.tipo)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 truncate font-medium" title={material.nome}>
                    {material.nome}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatarTamanho(material.tamanho)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={material.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
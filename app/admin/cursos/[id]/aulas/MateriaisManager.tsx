'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, FileText, Image as ImageIcon, File, Trash2, Check } from 'lucide-react'

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
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArquivoSelecionado(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivoSelecionado(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!arquivoSelecionado) return

    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', arquivoSelecionado)
    formData.append('nome', arquivoSelecionado.name)

    try {
      const res = await fetch(`/api/aulas/${aulaId}/materiais`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setArquivoSelecionado(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        carregarMateriais()
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
    if (bytes === 0) return '0 KB'
    const kb = bytes / 1024
    return kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB'
  }

  const getIconePorTipo = (tipo: string) => {
    if (tipo === 'pdf') return <FileText className="w-5 h-5 text-red-500" />
    if (['jpg', 'jpeg', 'png', 'gif'].includes(tipo)) return <ImageIcon className="w-5 h-5 text-blue-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="mt-4">
      {/* Área de Upload */}
      <div 
        className={`bg-white rounded-xl border-2 border-dashed p-6 transition-all ${
          dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
        } ${arquivoSelecionado ? 'border-green-500 bg-green-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!arquivoSelecionado ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Arraste o arquivo aqui ou
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Buscar arquivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-2">
              PDF, JPG, PNG, TXT (máx. 10MB)
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {arquivoSelecionado.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatarTamanho(arquivoSelecionado.size)} • Pronto para upload
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setArquivoSelecionado(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Fazer Upload
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Arquivos */}
      {materiais.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Arquivos anexados ({materiais.length})
          </p>
          {materiais.map((material) => (
            <div 
              key={material.id} 
              className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getIconePorTipo(material.tipo)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate" title={material.nome}>
                    {material.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatarTamanho(material.tamanho)} • {material.tipo.toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={material.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                </a>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
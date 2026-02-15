'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NovoVideoPage() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [urlVideo, setUrlVideo] = useState('')
  const [ordem, setOrdem] = useState(0)
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase
      .from('videos')
      .insert({
        curso_id: cursoId,
        titulo,
        descricao,
        url_video: urlVideo,
        ordem
      })

    setSalvando(false)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
      return
    }

    alert('Vídeo adicionado com sucesso!')
    router.push(`/admin/cursos/${cursoId}/videos`)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '30px' }}>🎬 Adicionar Novo Vídeo</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Título do Vídeo *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            placeholder="Ex: Aula 1 - Introdução ao Violão"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Breve descrição do conteúdo da aula"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            URL do Vídeo *
          </label>
          <input
            type="url"
            value={urlVideo}
            onChange={(e) => setUrlVideo(e.target.value)}
            required
            placeholder="https://youtube.com/watch?v= ..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Ordem (número)
          </label>
          <input
            type="number"
            value={ordem}
            onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
            min={0}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={salvando}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: salvando ? 'not-allowed' : 'pointer',
              opacity: salvando ? 0.6 : 1
            }}
          >
            {salvando ? 'Salvando...' : '💾 Salvar Vídeo'}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/admin/cursos/${cursoId}/videos`)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Video {
  id: string
  titulo: string
  descricao: string
  url_video: string
  ordem: number
  created_at: string
}

export default function VideosCursoPage() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string

  const [videos, setVideos] = useState<Video[]>([])
  const [cursoNome, setCursoNome] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buscarDados() {
      // Buscar nome do curso
      const { data: curso } = await supabase
        .from('cursos')
        .select('titulo')
        .eq('id', cursoId)
        .single()

      if (curso) {
        setCursoNome(curso.titulo)
      }

      // Buscar vídeos do curso
      const { data: videosData, error } = await supabase
        .from('videos')
        .select('*')
        .eq('curso_id', cursoId)
        .order('ordem', { ascending: true })

      if (error) {
        console.error('Erro ao buscar vídeos:', error)
      } else {
        setVideos(videosData || [])
      }

      setLoading(false)
    }

    buscarDados()
  }, [cursoId])

  async function excluirVideo(videoId: string) {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)

    if (error) {
      alert('Erro ao excluir: ' + error.message)
      return
    }

    setVideos(videos.filter(v => v.id !== videoId))
    alert('Vídeo excluído com sucesso!')
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>🎬 Vídeos do Curso</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>{cursoNome}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link 
            href={`/admin/cursos/${cursoId}`}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              textDecoration: 'none',
              borderRadius: '8px'
            }}
          >
            ← Voltar ao Curso
          </Link>
          <Link 
            href={`/admin/cursos/${cursoId}/videos/novo`}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px'
            }}
          >
            + Novo Vídeo
          </Link>
        </div>
      </div>

      {videos.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px'
        }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
            Nenhum vídeo cadastrado neste curso
          </p>
          <Link 
            href={`/admin/cursos/${cursoId}/videos/novo`}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            Adicionar Primeiro Vídeo
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {videos.map((video, index) => (
            <div 
              key={video.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{video.titulo}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {video.descricao || 'Sem descrição'}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '12px' }}>
                  {video.url_video}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={video.url_video}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  ▶️ Ver
                </a>
                <button
                  onClick={() => excluirVideo(video.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
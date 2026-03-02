'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Download, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Aula {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  ordem: number;
  extra_id: string;
}

interface Material {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

export default function AulaSuportePage() {
  const params = useParams();
  const router = useRouter();
  const [aula, setAula] = useState<Aula | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAula();
    }
  }, [params.id]);

  const fetchAula = async () => {
    // Busca a aula atual
    const { data: aulaData, error: aulaError } = await supabase
      .from('aulas_extras')
      .select('*')
      .eq('id', params.id)
      .single();

    if (aulaError || !aulaData) {
      console.error('Erro ao buscar aula:', aulaError);
      setLoading(false);
      return;
    }

    setAula(aulaData);

    // Busca todas as aulas do mesmo módulo para navegação
    const { data: aulasData } = await supabase
      .from('aulas_extras')
      .select('*')
      .eq('extra_id', aulaData.extra_id)
      .order('ordem', { ascending: true });

    if (aulasData) setAulas(aulasData);

    // Busca materiais (PDFs) dessa aula
    const { data: materiaisData } = await supabase
      .from('materiais_extras')
      .select('*')
      .eq('aula_id', params.id);

    if (materiaisData) setMateriais(materiaisData);
    setLoading(false);
  };

  // Encontra aula anterior e próxima
  const aulaAtualIndex = aulas.findIndex(a => a.id === params.id);
  const aulaAnterior = aulaAtualIndex > 0 ? aulas[aulaAtualIndex - 1] : null;
  const proximaAula = aulaAtualIndex < aulas.length - 1 ? aulas[aulaAtualIndex + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!aula) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Aula não encontrada</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-orange-500 hover:text-orange-400"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => router.push(`/suporte/${aula.extra_id}`)}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{aula.titulo}</h1>
            <p className="text-xs text-gray-400">Aula {aulaAtualIndex + 1} de {aulas.length}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Player de Vídeo */}
        <div className="bg-black rounded-xl overflow-hidden mb-8 aspect-video shadow-2xl border border-gray-800">
          {aula.video_url ? (
            aula.video_url.includes('vimeo') ? (
              <iframe
                src={aula.video_url.replace('vimeo.com', 'player.vimeo.com/video')}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : aula.video_url.includes('youtube') || aula.video_url.includes('youtu.be') ? (
              <iframe
                src={`https://www.youtube.com/embed/${aula.video_url.split('v=')[1] || aula.video_url.split('/').pop()}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <iframe
                src={aula.video_url}
                className="w-full h-full"
                allowFullScreen
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="bg-gray-800 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p>Vídeo não disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal - Info da aula */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">{aula.titulo}</h2>
              {aula.descricao && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{aula.descricao}</p>
                </div>
              )}
            </div>

            {/* Navegação entre aulas */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
              {aulaAnterior ? (
                <Link 
                  href={`/suporte/aula/${aulaAnterior.id}`}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Anterior</p>
                    <p className="font-medium truncate max-w-[150px]">{aulaAnterior.titulo}</p>
                  </div>
                </Link>
              ) : (
                <div></div>
              )}

              {proximaAula ? (
                <Link 
                  href={`/suporte/aula/${proximaAula.id}`}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Próxima</p>
                    <p className="font-medium truncate max-w-[150px]">{proximaAula.titulo}</p>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <div></div>
              )}
            </div>
          </div>

          {/* Sidebar - Materiais */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Materiais Complementares
              </h3>
              
              {materiais.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum material disponível para esta aula.</p>
              ) : (
                <div className="space-y-3">
                  {materiais.map((material) => (
                    <a
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition group"
                    >
                      <div className="bg-orange-500/20 p-2 rounded-lg group-hover:bg-orange-500/30 transition">
                        <Download className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{material.nome}</p>
                        <p className="text-xs text-gray-500 uppercase">{material.tipo}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Progresso */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Progresso</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${((aulaAtualIndex + 1) / aulas.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-orange-500">
                  {aulaAtualIndex + 1}/{aulas.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
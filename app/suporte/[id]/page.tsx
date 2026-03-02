'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Play } from 'lucide-react';

interface AulaExtra {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  ordem: number;
}

interface Extra {
  id: string;
  title: string;
  description: string;
}

export default function SuportePage() {
  const params = useParams();
  const router = useRouter();
  const [extra, setExtra] = useState<Extra | null>(null);
  const [aulas, setAulas] = useState<AulaExtra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    const { data: extraData } = await supabase
      .from('extras')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data: aulasData } = await supabase
      .from('aulas_extras')
      .select('*')
      .eq('extra_id', params.id)
      .order('ordem', { ascending: true });

    if (extraData) setExtra(extraData);
    if (aulasData) setAulas(aulasData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!extra) return <div>Módulo não encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{extra.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-400 mb-6">{extra.description}</p>

        {aulas.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <p className="text-gray-500">Nenhuma aula cadastrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aulas.map((aula, index) => (
              <div 
                key={aula.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">Aula {index + 1}: {aula.titulo}</h3>
                    {aula.descricao && (
                      <p className="text-gray-400 text-sm">{aula.descricao}</p>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-orange-600 rounded-lg text-sm">
                    Assistir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
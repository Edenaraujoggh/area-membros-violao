'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2, Upload, FileText, Video, GripVertical, Edit2, X, Save } from 'lucide-react';

interface Aula {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  ordem: number;
  created_at: string;
}

interface Material {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  aula_id: string;
}

export default function AdminSuporteAulas() {
  const params = useParams();
  const router = useRouter();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [materiais, setMateriais] = useState<Record<string, Material[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Form states para nova aula
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoVideo, setNovoVideo] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Estados para edição
  const [editingAula, setEditingAula] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editVideo, setEditVideo] = useState('');

  useEffect(() => {
    fetchAulas();
  }, [params.id]);

  const fetchAulas = async () => {
    setLoading(true);
    
    const { data: aulasData, error } = await supabase
      .from('aulas_extras')
      .select('*')
      .eq('extra_id', params.id)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar aulas:', error);
      setLoading(false);
      return;
    }

    if (aulasData) {
      setAulas(aulasData);
      
      const materiaisMap: Record<string, Material[]> = {};
      
      for (const aula of aulasData) {
        const { data: mats } = await supabase
          .from('materiais_extras')
          .select('*')
          .eq('aula_id', aula.id);
        
        if (mats) {
          materiaisMap[aula.id] = mats;
        }
      }
      
      setMateriais(materiaisMap);
    }
    
    setLoading(false);
  };

  const adicionarAula = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoTitulo.trim()) {
      alert('Digite o título da aula');
      return;
    }

    const maxOrdem = aulas.length > 0 
      ? Math.max(...aulas.map(a => a.ordem)) 
      : 0;

    const { error } = await supabase.from('aulas_extras').insert({
      extra_id: params.id,
      titulo: novoTitulo,
      descricao: novaDescricao,
      video_url: novoVideo,
      ordem: maxOrdem + 1
    });

    if (error) {
      alert('Erro ao adicionar aula: ' + error.message);
      return;
    }

    setNovoTitulo('');
    setNovaDescricao('');
    setNovoVideo('');
    setShowForm(false);
    fetchAulas();
  };

  // NOVA FUNÇÃO: Iniciar edição
  const startEdit = (aula: Aula) => {
    setEditingAula(aula.id);
    setEditTitulo(aula.titulo);
    setEditDescricao(aula.descricao || '');
    setEditVideo(aula.video_url || '');
  };

  // NOVA FUNÇÃO: Salvar edição
  const saveEdit = async (aulaId: string) => {
    const { error } = await supabase
      .from('aulas_extras')
      .update({
        titulo: editTitulo,
        descricao: editDescricao,
        video_url: editVideo
      })
      .eq('id', aulaId);

    if (error) {
      alert('Erro ao atualizar: ' + error.message);
      return;
    }

    setEditingAula(null);
    fetchAulas();
  };

  // NOVA FUNÇÃO: Cancelar edição
  const cancelEdit = () => {
    setEditingAula(null);
    setEditTitulo('');
    setEditDescricao('');
    setEditVideo('');
  };

  const excluirAula = async (aulaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula? Todos os materiais vinculados serão perdidos.')) {
      return;
    }

    const { error } = await supabase
      .from('aulas_extras')
      .delete()
      .eq('id', aulaId);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    fetchAulas();
  };

  const uploadPDF = async (event: React.ChangeEvent<HTMLInputElement>, aulaId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Só é permitido upload de PDFs');
      return;
    }

    setUploading(aulaId);

    try {
      const normalizedName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');

      const fileName = `${Date.now()}-${normalizedName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('MATERIAIS-SUPORTE')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('MATERIAIS-SUPORTE')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('materiais_extras').insert({
        aula_id: aulaId,
        nome: file.name,
        url: urlData.publicUrl,
        tipo: 'pdf'
      });

      if (dbError) {
        throw dbError;
      }

      alert('PDF adicionado com sucesso!');
      fetchAulas();
      
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const excluirMaterial = async (materialId: string, aulaId: string) => {
    if (!confirm('Excluir este material?')) return;

    await supabase
      .from('materiais_extras')
      .delete()
      .eq('id', materialId);

    fetchAulas();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Gerenciar Aulas de Suporte</h1>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Aula
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Formulário Nova Aula */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-orange-500" />
              Adicionar Nova Aula
            </h2>
            
            <form onSubmit={adicionarAula} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Título da Aula *</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Aula 1 - Postura correta"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder="Conteúdo que será abordado..."
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Link do Vídeo (Vimeo/YouTube)</label>
                <input
                  type="url"
                  value={novoVideo}
                  onChange={(e) => setNovoVideo(e.target.value)}
                  placeholder="https://vimeo.com/123456789  ou https://youtube.com/watch?v=..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-medium transition"
                >
                  Salvar Aula
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Aulas */}
        <div className="space-y-6">
          {aulas.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhuma aula cadastrada</h3>
              <p className="text-sm text-gray-500">Clique em "Nova Aula" para começar</p>
            </div>
          ) : (
            aulas.map((aula, index) => (
              <div key={aula.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                {/* Header da Aula */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-gray-700 p-2 rounded-lg mt-1">
                        <GripVertical className="w-4 h-4 text-gray-500" />
                      </div>
                      
                      <div className="flex-1">
                        {/* MODO EDIÇÃO */}
                        {editingAula === aula.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-500">Título</label>
                              <input
                                type="text"
                                value={editTitulo}
                                onChange={(e) => setEditTitulo(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Descrição</label>
                              <textarea
                                value={editDescricao}
                                onChange={(e) => setEditDescricao(e.target.value)}
                                rows={2}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Link do Vídeo</label>
                              <input
                                type="url"
                                value={editVideo}
                                onChange={(e) => setEditVideo(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              />
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => saveEdit(aula.id)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition"
                              >
                                <Save className="w-4 h-4" />
                                Salvar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium transition"
                              >
                                <X className="w-4 h-4" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* MODO VISUALIZAÇÃO */
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-orange-500/20 text-orange-500 text-xs font-bold px-2 py-1 rounded">
                                AULA {index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(aula.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold mb-1">{aula.titulo}</h3>
                            {aula.descricao && (
                              <p className="text-sm text-gray-400 mb-2">{aula.descricao}</p>
                            )}
                            {aula.video_url && (
                              <p className="text-xs text-gray-500 truncate max-w-md">
                                🎥 {aula.video_url}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* BOTÕES DE AÇÃO (só aparecem se não estiver editando) */}
                    {editingAula !== aula.id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(aula)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition"
                          title="Editar aula"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => excluirAula(aula.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition"
                          title="Excluir aula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Materiais da Aula */}
                <div className="p-6 bg-gray-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      MATERIAIS ({materiais[aula.id]?.length || 0})
                    </h4>
                    
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition">
                      <Upload className="w-4 h-4" />
                      {uploading === aula.id ? 'Enviando...' : 'Adicionar PDF'}
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => uploadPDF(e, aula.id)}
                        disabled={uploading !== null}
                      />
                    </label>
                  </div>

                  {materiais[aula.id] && materiais[aula.id].length > 0 ? (
                    <div className="space-y-2">
                      {materiais[aula.id].map((mat) => (
                        <div key={mat.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg group">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-500/20 p-2 rounded">
                              <FileText className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{mat.nome}</p>
                              <p className="text-xs text-gray-500 uppercase">{mat.tipo}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <a
                              href={mat.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-xs"
                            >
                              Ver
                            </a>
                            <button
                              onClick={() => excluirMaterial(mat.id, aula.id)}
                              className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhum material adicionado</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
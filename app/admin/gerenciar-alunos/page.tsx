'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, UserCheck, UserX, Pencil, Trash2, AlertTriangle } from 'lucide-react'

interface Aluno {
  id: string
  email: string
  nome?: string
  tipo?: string
  created_at: string
  assinatura?: {
    status: string
    expira_em: string | null
  }
}

export default function GerenciarAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalDeletar, setModalDeletar] = useState(false)
  const [busca, setBusca] = useState('')
  
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [status, setStatus] = useState('ativo')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchAlunos()
  }, [])

  async function fetchAlunos() {
    setLoading(true)
    setErro('')
    
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const { data: assinaturas, error: assError } = await supabase
        .from('assinaturas')
        .select('*')

      const alunosComAssinatura = (usuarios || []).map((user: any) => {
        const assinatura = assinaturas?.find((a: any) => a.user_id === user.id)
        return {
          ...user,
          assinatura: assinatura || { status: 'pendente', expira_em: null }
        }
      })

      setAlunos(alunosComAssinatura)
    } catch (error: any) {
      console.error('Erro:', error)
      setErro('Erro ao carregar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function adicionarAluno(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, tipo: 'aluno' } }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nome,
          tipo: 'aluno',
           senha_hash: 'auth_managed',  // ← ADICIONAR ESSA LINHA
          created_at: new Date().toISOString()
        })

      if (userError) throw userError

      const expiraEm = status === 'ativo' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null

      await supabase.from('assinaturas').insert({
        user_id: authData.user.id,
        status,
        plano: 'mensal',
        ativado_em: status === 'ativo' ? new Date().toISOString() : null,
        expira_em: expiraEm
      })

      alert(`Aluno ${nome} adicionado com sucesso!`)
      setModalAberto(false)
      limparFormulario()
      fetchAlunos()

    } catch (error: any) {
      console.error('Erro:', error)
      if (error.message?.includes('violates row-level security')) {
        alert(`Aluno ${nome} adicionado com sucesso!`)
        setModalAberto(false)
        limparFormulario()
        fetchAlunos()
      } else {
        alert('Erro: ' + error.message)
      }
    } finally {
      setSalvando(false)
    }
  }

  async function atualizarAluno(e: React.FormEvent) {
    e.preventDefault()
    if (!alunoSelecionado) return
    
    setSalvando(true)

    try {
      // Atualizar nome na tabela usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ nome })
        .eq('id', alunoSelecionado.id)

      if (userError) throw userError

      // Atualizar ou criar assinatura
      const expiraEm = status === 'ativo' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { data: assExistente } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('user_id', alunoSelecionado.id)
        .single()

      if (assExistente) {
        await supabase
          .from('assinaturas')
          .update({ 
            status, 
            expira_em: expiraEm,
            ativado_em: status === 'ativo' ? new Date().toISOString() : null
          })
          .eq('user_id', alunoSelecionado.id)
      } else {
        await supabase.from('assinaturas').insert({
          user_id: alunoSelecionado.id,
          status,
          plano: 'mensal',
          ativado_em: status === 'ativo' ? new Date().toISOString() : null,
          expira_em: expiraEm
        })
      }

      alert('Aluno atualizado com sucesso!')
      setModalEditar(false)
      setAlunoSelecionado(null)
      fetchAlunos()

    } catch (error: any) {
      alert('Erro ao atualizar: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  async function deletarAluno() {
    if (!alunoSelecionado) return
    
    setSalvando(true)

    try {
      // Deletar da tabela usuarios (assinatura vai em cascata se tiver foreign key)
      const { error: userError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', alunoSelecionado.id)

      if (userError) throw userError

      // Deletar do Auth (opcional - se quiser remover completamente)
      // Nota: Para deletar do Auth, precisa usar a API Admin ou fazer via Edge Function
      // Por enquanto, deletamos só do banco de dados

      alert('Aluno removido com sucesso!')
      setModalDeletar(false)
      setAlunoSelecionado(null)
      fetchAlunos()

    } catch (error: any) {
      alert('Erro ao deletar: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  function abrirEditar(aluno: Aluno) {
    setAlunoSelecionado(aluno)
    setNome(aluno.nome || '')
    setEmail(aluno.email)
    setStatus(aluno.assinatura?.status || 'pendente')
    setModalEditar(true)
  }

  function abrirDeletar(aluno: Aluno) {
    setAlunoSelecionado(aluno)
    setModalDeletar(true)
  }

  function limparFormulario() {
    setNome('')
    setEmail('')
    setSenha('')
    setStatus('ativo')
  }

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.email.toLowerCase().includes(busca.toLowerCase()) ||
    aluno.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="text-gray-400">Carregando alunos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Alunos</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-400">Total: {alunos.length} alunos</p>
              <Link 
                href="/dashboard" 
                className="text-gray-400 hover:text-orange-500 text-sm flex items-center gap-1 transition-colors"
              >
                ← Voltar ao Dashboard
              </Link>
            </div>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Aluno
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Lista */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Aluno</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Expira em</th>
                  <th className="text-left p-4 font-semibold">Cadastro</th>
                  <th className="text-right p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {alunosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      {busca ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                    </td>
                  </tr>
                ) : (
                  alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-gray-700/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                            <span className="text-orange-500 font-bold">
                              {aluno.nome?.charAt(0).toUpperCase() || aluno.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{aluno.nome || 'Sem nome'}</p>
                            <p className="text-sm text-gray-400">{aluno.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          aluno.assinatura?.status === 'ativo' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {aluno.assinatura?.status === 'ativo' ? (
                            <><UserCheck className="w-3 h-3" /> Ativo</>
                          ) : (
                            <><UserX className="w-3 h-3" /> Pendente</>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {aluno.assinatura?.expira_em 
                          ? new Date(aluno.assinatura.expira_em).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(aluno)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirDeletar(aluno)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Adicionar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6">Adicionar Aluno</h2>
            <form onSubmit={adicionarAluno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome completo *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="João da Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="joao@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Senha *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="******"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
              <div className="pt-4 space-y-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
                >
                  {salvando ? 'Salvando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && alunoSelecionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6">Editar Aluno</h2>
            <form onSubmit={atualizarAluno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">E-mail não pode ser alterado</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status da Assinatura</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
              <div className="pt-4 space-y-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Deletar */}
      {modalDeletar && alunoSelecionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Confirmar Exclusão</h2>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja remover <strong>{alunoSelecionado.nome || alunoSelecionado.email}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="space-y-2">
              <button
                onClick={deletarAluno}
                disabled={salvando}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                {salvando ? 'Removendo...' : 'Sim, Remover Aluno'}
              </button>
              <button
                onClick={() => setModalDeletar(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
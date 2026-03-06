'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, UserCheck, UserX, Trash2, Edit } from 'lucide-react'

interface Aluno {
  id: string
  email: string
  created_at: string
  assinatura?: {
    status: string
    expira_em: string | null
  }
}

export default function GerenciarAlunos() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [busca, setBusca] = useState('')
  
  // Formulário novo aluno
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [status, setStatus] = useState('ativo') // 'ativo' ou 'pendente'
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchAlunos()
  }, [])

  async function fetchAlunos() {
    try {
      // Busca usuários do auth
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Para cada usuário, busca a assinatura
      const alunosComAssinatura = await Promise.all(
        usuarios.map(async (user) => {
          const { data: assinatura } = await supabase
            .from('assinaturas')
            .select('status, expira_em')
            .eq('user_id', user.id)
            .maybeSingle()
          
          return {
            ...user,
            assinatura: assinatura || { status: 'pendente', expira_em: null }
          }
        })
      )

      setAlunos(alunosComAssinatura)
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
      alert('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  async function adicionarAluno(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    try {
      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome: nome,
            tipo: 'aluno'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 2. Criar na tabela usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: email,
          nome: nome,
          tipo: 'aluno'
        })

      if (userError) throw userError

      // 3. Criar assinatura
      if (status === 'ativo') {
        const { error: assinaturaError } = await supabase
          .from('assinaturas')
          .insert({
            user_id: authData.user.id,
            status: 'ativo',
            plano: 'mensal',
            ativado_em: new Date().toISOString(),
            expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
          })

        if (assinaturaError) throw assinaturaError
      } else {
        // Se pendente, cria registro mas sem data de expiração
        const { error: assinaturaError } = await supabase
          .from('assinaturas')
          .insert({
            user_id: authData.user.id,
            status: 'pendente',
            plano: 'mensal'
          })

        if (assinaturaError) throw assinaturaError
      }

      alert(`Aluno ${nome} adicionado com sucesso!`)
      setModalAberto(false)
      limparFormulario()
      fetchAlunos() // Recarrega lista

    } catch (error: any) {
      console.error('Erro:', error)
      alert('Erro ao adicionar aluno: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  function limparFormulario() {
    setNome('')
    setEmail('')
    setSenha('')
    setStatus('ativo')
  }

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.email.toLowerCase().includes(busca.toLowerCase()) ||
    (aluno as any).nome?.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Alunos</h1>
            <p className="text-gray-400 mt-1">Adicione e gerencie os alunos do curso</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-bold transition-colors"
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
            placeholder="Buscar aluno por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Lista de Alunos */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left p-4 font-semibold">Aluno</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Expira em</th>
                <th className="text-left p-4 font-semibold">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {alunosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-gray-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <span className="text-orange-500 font-bold">
                            {(aluno as any).nome?.charAt(0).toUpperCase() || aluno.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{(aluno as any).nome || 'Sem nome'}</p>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Aluno */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Adicionar Aluno</h2>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={adicionarAluno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="João da Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="joao@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status da assinatura</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="ativo">✅ Ativo (já pagou)</option>
                  <option value="pendente">⏳ Pendente (aguardando pagamento)</option>
                </select>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {salvando ? 'Salvando...' : 'Adicionar Aluno'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
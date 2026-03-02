'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, ArrowRight, Loader2, CheckCircle, Music, Guitar } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(true)

  // Verifica se o token é válido quando a página carrega
  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Se não houver sessão ativa de recuperação, redireciona
      if (!session) {
        setErro('Link inválido ou expirado. Solicite uma nova recuperação de senha.')
      }
      setVerificando(false)
    }

    verificarSessao()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      })

      if (error) throw error

      setSucesso(true)
      // Desloga o usuário após trocar a senha
      await supabase.auth.signOut()
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      setErro('Erro ao redefinir senha: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Banner */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-red-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L30 45 M30 5 L40 15 M30 5 L20 15' stroke='white' stroke-width='2' fill='none'/%3E%3Ccircle cx='30' cy='50' r='5' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Guitar className="w-8 h-8 text-amber-300" />
              <Music className="w-6 h-6 text-orange-300" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
              Nova Senha
            </h1>
            <p className="text-amber-200 text-sm">Crie uma senha nova e segura</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#111827"/>
          </svg>
        </div>
      </div>

      <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8 -mt-10 relative z-20">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
            {sucesso ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Senha alterada!</h3>
                <p className="text-gray-400 mb-6">Sua senha foi redefinida com sucesso. Redirecionando para o login...</p>
              </div>
            ) : erro && !sucesso ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ops!</h3>
                <p className="text-gray-400 mb-6">{erro}</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-amber-500 hover:text-amber-400 font-medium"
                >
                  Voltar para o login
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Redefinir Senha</h3>
                  <p className="text-gray-400 text-sm">
                    Digite sua nova senha abaixo.
                  </p>
                </div>

                {erro && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
                    {erro}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="Digite novamente a senha"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Redefinir Senha
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-gray-600 text-sm mt-8">
            © 2024 Violão Passo a Passo Minucioso
          </p>
        </div>
      </div>
    </div>
  )
}
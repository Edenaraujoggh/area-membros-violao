'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, ArrowRight, Loader2, Music, Guitar, ArrowLeft, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoRecuperacao, setModoRecuperacao] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      
      if (error) throw error
      
      if (data.user) {
        // ✅ Simples: sempre vai pro dashboard
        window.location.href = '/dashboard'
      }
      
    } catch (error: any) {
      console.error('Erro no login:', error)
      setErrorMsg(error.message || 'Erro ao entrar. Verifique suas credenciais.')
      setLoading(false)
    }
  }

  async function handleRecuperacaoSenha(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMensagemSucesso('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      setMensagemSucesso('Email de recuperação enviado! Verifique sua caixa de entrada.')
      setTimeout(() => {
        setModoRecuperacao(false)
        setMensagemSucesso('')
      }, 5000)
    } catch (error: any) {
      setErrorMsg('Erro ao enviar email: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (modoRecuperacao) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="relative w-full h-64 md:h-80 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-red-700" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                Recuperar Senha
              </h1>
              <p className="text-amber-200 text-sm">Vamos te ajudar a voltar a tocar</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8 -mt-10 relative z-20">
          <div className="w-full max-w-md">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
              <button 
                onClick={() => setModoRecuperacao(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-amber-500 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Esqueceu sua senha?</h3>
                <p className="text-gray-400 text-sm">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              {mensagemSucesso ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400 mb-6">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{mensagemSucesso}</p>
                </div>
              ) : (
                <form onSubmit={handleRecuperacaoSenha} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link de recuperação'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="relative w-full h-64 md:h-80 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-red-700" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Guitar className="w-8 h-8 text-amber-300" />
              <Music className="w-6 h-6 text-orange-300 animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 drop-shadow-lg tracking-tight">
              Violão Passo a Passo
            </h1>
            <h2 className="text-xl md:text-2xl font-light text-amber-200 tracking-[0.2em] uppercase">
              Minucioso
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8 -mt-10 relative z-20">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Área de Membros</p>
              <h3 className="text-xl font-bold text-white">Acesse suas aulas</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400 mb-4">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{errorMsg}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Senha</label>
                  <button
                    type="button"
                    onClick={() => setModoRecuperacao(true)}
                    className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-center">
              <p className="text-gray-300 text-sm">
                <span className="text-amber-400 font-semibold">Ainda não é aluno?</span>
                <br /> Entre em contato com o professor para fazer sua matrícula.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
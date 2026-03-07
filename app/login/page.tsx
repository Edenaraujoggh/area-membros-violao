'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, ArrowRight, Loader2, Music, Guitar, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoRecuperacao, setModoRecuperacao] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      if (error) throw error
      
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
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
      alert('Erro ao enviar email: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // TELA DE RECUPERAÇÃO DE SENHA
  if (modoRecuperacao) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                Recuperar Senha
              </h1>
              <p className="text-amber-200 text-sm">Vamos te ajudar a voltar a tocar</p>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="seu@email.com"
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
                        Enviar link de recuperação
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // TELA DE LOGIN APENAS (SEM CADASTRO)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
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
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#111827"/>
          </svg>
        </div>
      </div>

      <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8 -mt-10 relative z-20">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">
                Área de Membros
              </p>
              <h3 className="text-xl font-bold text-white">
                Acesse suas aulas
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* CAMPO SENHA COM LINK DE RECUPERAÇÃO E OLHINHO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Senha
                  </label>
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
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* MENSAGEM DE MATRÍCULA */}
            <div className="mt-6 p-4 bg-gray-700/50 border border-gray-600 rounded-xl">
              <p className="text-gray-300 text-sm text-center">
                <span className="text-amber-400 font-semibold">Ainda não é aluno?</span>
                <br />
                Entre em contato com o professor para fazer sua matrícula.
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-3 opacity-30">
              <Music className="w-4 h-4 text-amber-400" />
              <span className="text-gray-500">♪</span>
              <Guitar className="w-4 h-4 text-orange-400" />
              <span className="text-gray-500">♫</span>
              <Music className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mt-8">
            © 2024 Violão Passo a Passo Minucioso - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
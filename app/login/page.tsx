'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoCadastro, setModoCadastro] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (modoCadastro) {
        // Cadastro
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
        })
        if (error) throw error
        alert('Cadastro realizado! Verifique seu email.')
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        })
        if (error) throw error
        
        // Redireciona para área do aluno
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎸 Área de Membros
          </h1>
          <p className="text-gray-600 mt-2">
            {modoCadastro ? 'Crie sua conta' : 'Acesse suas aulas'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading 
              ? 'Aguarde...' 
              : (modoCadastro ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setModoCadastro(!modoCadastro)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {modoCadastro 
              ? 'Já tem conta? Faça login' 
              : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  )
}
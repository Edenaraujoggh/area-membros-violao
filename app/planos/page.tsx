'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PlanosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  async function iniciarCheckout(plano: string) {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(plano)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          nome: user.user_metadata?.nome || user.email?.split('@')[0],
          plano: plano
        })
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erro ao criar checkout')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao iniciar pagamento')
    } finally {
      setLoading(null)
    }
  }

  const planos = [
    {
      id: 'mensal',
      nome: 'Plano Mensal',
      preco: 'R$ 49,90',
      periodo: '/mês',
      descricao: 'Acesso completo por 1 mês',
      popular: false
    },
    {
      id: 'trimestral',
      nome: 'Plano Trimestral',
      preco: 'R$ 129,90',
      periodo: '/3 meses',
      descricao: 'Economize R$ 19,80',
      popular: true
    },
    {
      id: 'anual',
      nome: 'Plano Anual',
      preco: 'R$ 399,90',
      periodo: '/ano',
      descricao: 'Economize R$ 198,90 - Melhor custo-benefício!',
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-400">
            Comece sua jornada no violão hoje mesmo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planos.map((plano) => (
            <div 
              key={plano.id}
              className={`relative rounded-2xl p-8 ${
                plano.popular 
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 transform scale-105 shadow-2xl' 
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {plano.popular && (
                <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </span>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plano.popular ? 'text-white' : 'text-gray-200'}`}>
                {plano.nome}
              </h3>
              
              <div className="mb-4">
                <span className={`text-4xl font-bold ${plano.popular ? 'text-white' : 'text-amber-500'}`}>
                  {plano.preco}
                </span>
                <span className={`text-sm ${plano.popular ? 'text-amber-100' : 'text-gray-400'}`}>
                  {plano.periodo}
                </span>
              </div>

              <p className={`mb-6 text-sm ${plano.popular ? 'text-amber-100' : 'text-gray-400'}`}>
                {plano.descricao}
              </p>

              <ul className={`space-y-3 mb-8 text-sm ${plano.popular ? 'text-white' : 'text-gray-300'}`}>
                <li className="flex items-center">
                  ✅ Acesso a todas as aulas
                </li>
                <li className="flex items-center">
                  ✅ Material
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TesteCheckout() {
  const [loading, setLoading] = useState(false)

  async function pagar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Faça login primeiro!')
      return
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        nome: user.user_metadata?.nome || 'Aluno',
        plano: 'mensal'
      })
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Erro: ' + JSON.stringify(data))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl font-bold mb-2">🎸 Área de Teste</h1>
      <p className="text-gray-400 mb-8">Plano Mensal - R$ 49,90</p>
      
      <button
        onClick={pagar}
        disabled={loading}
        className="bg-green-600 hover:bg-green-500 px-8 py-4 rounded-xl font-bold text-lg"
      >
        {loading ? 'Abrindo checkout...' : '💳 Pagar com Cartão Fake'}
      </button>
      
      <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm text-gray-300">
        <p className="font-bold mb-2">Dados do cartão de teste:</p>
        <p>Número: <span className="text-green-400">4242 4242 4242 4242</span></p>
        <p>Validade: qualquer data futura</p>
        <p>CVC: qualquer 3 números</p>
      </div>
    </div>
  )
}
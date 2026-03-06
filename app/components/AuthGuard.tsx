'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // 1. Verifica se está logado
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // 2. Verifica se tem assinatura ativa
      const { data: assinatura, error } = await supabase
        .from('assinaturas')
        .select('status, expira_em')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao verificar assinatura:', error)
      }

      // Verifica se existe assinatura com status ativo e não expirou
      const isActive = assinatura?.status === 'ativo' && 
        (!assinatura?.expira_em || new Date(assinatura.expira_em) > new Date())

      if (!isActive) {
        // Não tem acesso pago - manda para página de aguardando liberação
        router.push('/aguardando-liberacao')
        return
      }

      setHasActiveSubscription(true)
      setAuthenticated(true)
      setLoading(false)

    } catch (error) {
      console.error('Erro:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <span className="ml-3">Verificando acesso...</span>
      </div>
    )
  }

  if (!authenticated || !hasActiveSubscription) {
    return null
  }

  return <>{children}</>
}
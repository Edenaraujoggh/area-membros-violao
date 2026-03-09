import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover'
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature!, webhookSecret)
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log('Evento recebido:', event.type)

  // ✅ Pagamento aprovado (primeira vez)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    const userId = session.metadata?.userId
    const plano = session.metadata?.plano
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    console.log('Dados do pagamento:', { userId, plano, customerId, subscriptionId })

    if (userId && plano) {
      // ✅ Verifica se já existe assinatura para este usuário (evita duplicado)
      const { data: existingSub } = await supabaseAdmin
        .from('assinaturas')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .single()

      if (existingSub) {
        console.log('Assinatura já existe para este usuário, atualizando...')
        // Atualiza assinatura existente
        const { error } = await supabaseAdmin
          .from('assinaturas')
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            plano: plano,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', existingSub.id)
          
        if (error) console.error('Erro ao atualizar:', error)
      } else {
        // Cria nova assinatura
        const { error, data } = await supabaseAdmin
          .from('assinaturas')
          .insert({
            user_id: userId,
            status: 'ativo',
            plano: plano,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            ativado_em: new Date().toISOString(),
            expira_em: calcularExpiracao(plano) // ✅ Função para calcular data correta
          })
          .select()

        if (error) {
          console.error('Erro ao inserir assinatura:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        } else {
          console.log('✅ Assinatura ativada com sucesso:', data)
        }
      }
    }
  }

  // ✅ Novo: Renovação de assinatura
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string
    
    // Atualiza data de expiração
    const { data: assinatura } = await supabaseAdmin
      .from('assinaturas')
      .select('plano')
      .eq('stripe_subscription_id', subscriptionId)
      .single()
      
    if (assinatura) {
      await supabaseAdmin
        .from('assinaturas')
        .update({
          status: 'ativo',
          expira_em: calcularExpiracao(assinatura.plano),
          ultima_renovacao: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
    }
  }

  // ✅ Novo: Cancelamento ou falha de pagamento
  if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
    const subscription = event.data.object as Stripe.Subscription
    const subscriptionId = subscription.id
    
    await supabaseAdmin
      .from('assinaturas')
      .update({ 
        status: 'cancelado',
        cancelado_em: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)
      
    console.log('❌ Assinatura cancelada:', subscriptionId)
  }

  return NextResponse.json({ received: true })
}

// ✅ Helper para calcular data de expiração correta
function calcularExpiracao(plano: string): string {
  const agora = new Date()
  switch(plano) {
    case 'mensal':
      return new Date(agora.setMonth(agora.getMonth() + 1)).toISOString()
    case 'trimestral':
      return new Date(agora.setMonth(agora.getMonth() + 3)).toISOString()
    case 'anual':
      return new Date(agora.setFullYear(agora.getFullYear() + 1)).toISOString()
    default:
      return new Date(agora.setMonth(agora.getMonth() + 1)).toISOString()
  }
}
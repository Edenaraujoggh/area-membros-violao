import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover'
})

export async function POST(request: Request) {
  try {
    const { userId, email, nome, plano } = await request.json()

    const precos: Record<string, number> = {
      'mensal': 4990,
      'trimestral': 12990,
      'anual': 39990
    }

    const preco = precos[plano] || 4990

    // ✅ Corrigido: URL sem espaço e vindo do env
    const baseUrl = process.env.NEXT_PUBLIC_URL?.trim() || 'https://area-membros-violao.vercel.app'

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Curso de Violão - Plano ${plano}`,
              description: `Acesso completo por ${plano}`,
            },
            unit_amount: preco,
            recurring: {
              interval: plano === 'anual' ? 'year' : 'month',
              interval_count: plano === 'trimestral' ? 3 : 1
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        userId: userId,
        plano: plano,
        email: email // ✅ Adicionado para rastreio
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Erro Stripe:', error.message)
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    )
  }
}
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente com Service Role (privilégios totais, sem afetar sessão do navegador)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, nome, status } = await request.json()

    // 1. Criar usuário no Auth (SEM afetar a sessão do admin logado)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, tipo: 'aluno' }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Erro ao criar usuário no Auth')

    // 2. Inserir na tabela usuarios
    const { error: userError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email,
        nome,
        tipo: 'aluno',
        senha_hash: 'auth_managed',
        created_at: new Date().toISOString()
      })

    if (userError) throw userError

    // 3. Criar assinatura
    const expiraEm = status === 'ativo' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null

    await supabaseAdmin.from('assinaturas').insert({
      user_id: authData.user.id,
      status,
      plano: 'mensal',
      ativado_em: status === 'ativo' ? new Date().toISOString() : null,
      expira_em: expiraEm
    })

    return NextResponse.json({ 
      success: true, 
      message: `Aluno ${nome} criado com sucesso!` 
    })
    
  } catch (error: any) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno ao criar usuário' }, 
      { status: 500 }
    )
  }
}
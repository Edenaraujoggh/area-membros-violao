import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Dados faltando' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar histórico
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Montar mensagens no formato do Groq
    const messages = [
      {
        role: 'system',
        content: `Você é um professor de violão experiente chamado "Professor Virtual". 
Ajude alunos iniciantes com dicas práticas. Use emojis 🎸. Respostas curtas.`
      },
      ...(history ? history.reverse().map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })) : []),
      { role: 'user', content: message }
    ]

    // Chamar Groq via fetch direto
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',  // <-- TROCADO: era llama3-8b-8192 (descontinuado)
        messages,
        temperature: 0.7,
        max_tokens: 800
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Groq error:', error)
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    const data = await response.json()
    const fullResponse = data.choices[0]?.message?.content || 'Desculpe, não entendi.'

    // Salvar no Supabase
    await supabase.from('chat_messages').insert([
      { user_id: userId, content: message, role: 'user' },
      { user_id: userId, content: fullResponse, role: 'assistant' }
    ])

    return NextResponse.json({ response: fullResponse })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

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

    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Montar mensagens com tipagem correta
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      {
        role: 'system',
        content: `Você é um professor de violão experiente, paciente e encourajador chamado "Professor Virtual". 
Ajude alunos iniciantes com dicas práticas de violão, acordes, batidas e técnica. 
Use emojis 🎸 quando apropriado e mantenha respostas curtas (máximo 2-3 parágrafos).`
      }
    ]

    // Adicionar histórico
    if (history) {
      history.reverse().forEach(m => {
        messages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })
      })
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message })

    // Chamar Groq
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 800
    })

    const fullResponse = chatCompletion.choices[0]?.message?.content || 'Desculpe, não consegui responder.'

    await supabase.from('chat_messages').insert([
      { user_id: userId, content: message, role: 'user' },
      { user_id: userId, content: fullResponse, role: 'assistant' }
    ])

    return NextResponse.json({ response: fullResponse })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
  }
}
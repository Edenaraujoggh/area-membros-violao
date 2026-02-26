import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json()

    // Validação
    if (!message || !userId) {
      return NextResponse.json({ error: 'Mensagem ou usuário faltando' }, { status: 400 })
    }

    // Client Supabase direto (server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar histórico (últimas 5 mensagens para contexto)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Montar conversa no formato do Gemini
    const systemPrompt = `Você é um professor de violão experiente, paciente e encourajador chamado "Professor Virtual". 
Ajude alunos iniciantes com dicas práticas de violão, acordes, batidas e técnica. 
Use emojis 🎸 quando apropriado e mantenha respostas curtas e diretas (máximo 2-3 parágrafos).
Se não souber algo específico do método do professor Eden, sugira consultar o vídeo da aula.`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar com violão.' }] },
      ...(history?.reverse().map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })) || []),
      { role: 'user', parts: [{ text: message }] }
    ]

    // Chamar Gemini (modelo gratuito)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }
          ]
        })
      }
    )

    if (!geminiRes.ok) {
      const error = await geminiRes.text()
      console.error('Gemini error:', error)
      return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
    }

    // Stream da resposta + salvar no banco
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6))
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
                if (text) {
                  fullResponse += text
                  controller.enqueue(encoder.encode(text))
                }
              } catch (e) {
                // ignora linhas inválidas
              }
            }
          }
        }

        // Salvar conversa no Supabase após stream completar
        await supabase.from('chat_messages').insert([
          { user_id: userId, content: message, role: 'user' },
          { user_id: userId, content: fullResponse, role: 'assistant' }
        ])

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
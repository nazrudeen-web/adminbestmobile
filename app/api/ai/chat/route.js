import { Groq } from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const SYSTEM_PROMPT = `You are a mobile phone product copywriter and content specialist for an admin panel.
Your tasks:
1. Write professional product descriptions and marketing copy
2. Create device overviews and specifications summaries
3. Write comparison articles between phones
4. Generate engaging product content
5. Provide writing suggestions for mobile phone topics

GUIDELINES:
- For product descriptions: Keep it concise (3-5 key points), professional, marketing-focused
- For accuracy: If you're unsure about device specs (OS version, exact release year), ask user for details
- For Samsung Galaxy A series: Always verify - A-series phones have different specs by region/year
- Format with bullet points for easy reading
- Include key features that matter to buyers (display, camera, battery, price tier)
- Be honest if you lack current information - ask user to provide specs from their database

When user asks for product description:
- Ask briefly: "What are this device's main specs?" if details are unclear
- Never use outdated info (check year/generation)
- Focus on what makes it special at its price point`

export async function POST(request) {
  try {
    const { message, context = 'mobile specifications' } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Use Groq for AI responses
    if (process.env.GROQ_API_KEY) {
      const groqResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })

      return NextResponse.json({
        success: true,
        response: groqResponse.choices[0].message.content,
        source: 'groq',
        usage: {
          total_tokens: groqResponse.usage.total_tokens
        }
      })
    }

    // Groq API key not configured
    return NextResponse.json(
      {
        success: false,
        error: 'Groq API key not configured. Please set GROQ_API_KEY in .env.local'
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process AI request'
      },
      { status: 500 }
    )
  }
}

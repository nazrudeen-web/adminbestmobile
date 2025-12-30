import { Groq } from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const SYSTEM_PROMPT = `You are a mobile phone product copywriter for an admin panel.
Your tasks:
1. Write professional product descriptions using provided specifications
2. Create device overviews
3. Write marketing copy
4. Generate engaging product content

GUIDELINES:
- When specs are PROVIDED: Use them directly - write description without asking
- When specs are MISSING: Clearly state "Please provide specs: [list needed]"
- Format with bullet points (3-5 key points max)
- Keep descriptions concise, professional, marketing-focused
- Highlight unique features at this price tier
- Focus on what buyers care about: display, camera, battery, processor, price position

OUTPUT FORMAT:
**[Device Name]**
• Key feature 1
• Key feature 2
• Key feature 3
• Key feature 4
• Price positioning/target user`

export async function POST(request) {
  try {
    const { message, context = 'mobile specifications', productData } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Build message with product data if provided
    let userContent = message
    if (productData) {
      userContent = `Product Data from Database:
${JSON.stringify(productData, null, 2)}

User Request: ${message}`
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
            content: userContent
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

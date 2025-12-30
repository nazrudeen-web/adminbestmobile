import { Groq } from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const SYSTEM_PROMPT = `You are an AI assistant for a mobile phone admin panel website (bestmobileuae.com).

You must ALWAYS follow the user's instruction exactly.

POSSIBLE TASKS YOU CAN DO:
- Write short product descriptions
- Format or clean mobile specifications
- Reformat scraped data (GSMArena style)
- Write phone overviews
- Write blog or review articles
- Write article titles or headings

GENERAL RULES:
- Use simple and clear English
- Do not invent fake specifications
- Use given data first
- If data is missing:
  - For descriptions/articles: write generic safe content
  - For spec formatting: leave value as "Not specified"
- Never ask the user for missing specs
- Never explain your reasoning

WHEN FORMATTING SPECS:
- Output clean bullet points or structured text
- Keep names short and consistent

WHEN WRITING ARTICLES:
- Use headings and short paragraphs
- Follow the title or topic given by the user

WHEN WRITING DESCRIPTIONS:
- Keep it short, marketing-friendly, and neutral

OUTPUT:
- Only output what the user asked for
- No extra text
- No explanations
`


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
        model: "openai/gpt-oss-120b",
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

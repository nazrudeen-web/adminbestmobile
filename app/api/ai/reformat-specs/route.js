import { Groq } from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request) {
  try {
    const { phoneData } = await request.json()

    if (!phoneData) {
      return NextResponse.json(
        { success: false, error: 'Phone data is required' },
        { status: 400 }
      )
    }

    // Prepare the prompt
    const dataString = JSON.stringify(phoneData, null, 2)
    
    const prompt = `You are a mobile phone specification reformatter. Process this phone data:

${dataString}

TASK:
1. Keep ALL specifications from input
2. Only add missing critical specs: Battery Capacity, Processor, RAM, Storage
3. Clean up and standardize the format
4. Output ONLY valid JSON

Output format:
{
  "name": "phone model",
  "specifications": [
    {"spec_group": "Display", "spec_name": "Display Type", "spec_value": "Super AMOLED, 120Hz..."},
    {"spec_group": "Display", "spec_name": "Display Size", "spec_value": "6.7 inches..."},
    ... ALL OTHER SPECS FROM INPUT ...
  ],
  "keySpecifications": [
    {"title": "Display", "value": "..."},
    {"title": "Camera", "value": "..."},
    {"title": "Processor", "value": "..."},
    {"title": "Battery", "value": "..."}
  ]
}

RULES:
- Valid JSON only
- Escape all quotes in values
- Keep original spec names and groups
- No markdown, no explanations
- Start with { and end with }`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.1 // Very low temperature for consistent JSON output
    })

    let reformattedData
    try {
      const responseText = response.choices[0].message.content
      
      // Remove markdown code blocks if present
      let jsonString = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      // Try direct parsing first
      try {
        reformattedData = JSON.parse(jsonString)
      } catch (e1) {
        // If that fails, try to extract and rebuild the JSON more carefully
        // Remove any text before the first { and after the last }
        const firstBrace = jsonString.indexOf('{')
        const lastBrace = jsonString.lastIndexOf('}')
        
        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
          throw new Error('Could not find JSON object in response')
        }
        
        jsonString = jsonString.substring(firstBrace, lastBrace + 1)
        
        // Try parsing again
        try {
          reformattedData = JSON.parse(jsonString)
        } catch (e2) {
          // Last resort: try to fix common formatting issues
          // Fix: unescaped newlines in strings
          jsonString = jsonString.replace(/"\s*:\s*"([^"]*)[\r\n]+([^"]*)"/g, (match, p1, p2) => {
            return `": "${p1.trim()} ${p2.trim()}"`
          })
          
          // Fix: missing commas between array elements
          jsonString = jsonString.replace(/}\s*{/g, '}, {')
          jsonString = jsonString.replace(/}\s*]/g, '}]')
          
          reformattedData = JSON.parse(jsonString)
        }
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message)
      console.error('Response text length:', response.choices[0].message.content.length)
      console.error('Response text (first 300 chars):', response.choices[0].message.content.substring(0, 300))
      console.error('Response text (last 300 chars):', response.choices[0].message.content.slice(-300))
      
      // Return a more helpful error with context
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse AI response: ' + parseError.message,
          debug: {
            textLength: response.choices[0].message.content.length,
            hasOpenBrace: response.choices[0].message.content.includes('{'),
            hasCloseBrace: response.choices[0].message.content.includes('}')
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...reformattedData,
        specifications: (reformattedData.specifications || []).filter(
          (s) => {
            // Keep only Network Technology in Network group
            if (s.spec_group === 'Network' && s.spec_name !== 'Network Technology') return false
            // Drop any Pricing/Price rows
            if (s.spec_group === 'Pricing' || s.spec_name?.toLowerCase() === 'price') return false
            return true
          }
        )
      },
      source: 'groq',
      usage: {
        total_tokens: response.usage.total_tokens
      }
    })
  } catch (error) {
    console.error('AI Reformat Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reformat data with AI'
      },
      { status: 500 }
    )
  }
}

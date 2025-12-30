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
    
    const prompt = `You are a mobile phone specification analyzer. Complete and improve this phone's specs.

PHONE DATA:
${dataString}

YOUR TASK:
1. Identify phone tier (Budget/Mid-range/Flagship) based on processor and display
2. Fill missing specs with INTELLIGENT ESTIMATES based on tier:
   - Budget (Snapdragon 6-7): ~50MP main, ~5MP front, ~5000mAh
   - Mid-range (Snapdragon 8 Gen 1-2): ~50-108MP main, ~12-20MP front, ~5000-5500mAh
   - Flagship (A-series/SD 8 Gen 3): ~48-200MP main, ~12MP front, ~4000-5000mAh

3. For Camera - ALWAYS estimate if missing:
   - Look at processor tier to guess main camera MP
   - Mid-range typically has: 50MP main + 2MP macro/depth, 12-16MP front
   - Add common features: f/1.7-1.8 aperture, OIS if flagship, 4K video

4. For Battery - ALWAYS estimate if missing:
   - Budget/Mid-range: 5000-5500mAh
   - Flagship: 4000-4500mAh
   - Use charging speed to verify (45W = mid-range, 65W+ = flagship)

5. Format specs EXACTLY like examples:
   Camera: "50 MP main (f/1.7) + 2 MP macro; 16 MP front, 1080p video"
   Battery: "5000 mAh, 45W fast charging, 0-100% in 30min"
   Display: "6.41" AMOLED, 385 ppi, 90Hz"
   Processor: "Snapdragon 6 Gen 3, Octa-core"

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "name": "[exact phone model]",
  "keySpecifications": [
    {"title": "Display", "value": "[formatted]"},
    {"title": "Camera", "value": "[formatted, estimated if needed]"},
    {"title": "Processor", "value": "[formatted]"},
    {"title": "Battery", "value": "[formatted, estimated if needed]"}
  ],
  "specifications": [
    {"spec_group": "Display", "spec_name": "Display", "spec_value": "[value]"},
    {"spec_group": "Camera", "spec_name": "Front Camera", "spec_value": "[estimated if missing]"},
    {"spec_group": "Camera", "spec_name": "Back Camera", "spec_value": "[estimated if missing]"},
    {"spec_group": "Performance", "spec_name": "Processor", "spec_value": "[value]"},
    {"spec_group": "Performance", "spec_name": "RAM", "spec_value": "[value or estimate]"},
    {"spec_group": "Storage", "spec_name": "Storage", "spec_value": "[value or estimate]"},
    {"spec_group": "Battery", "spec_name": "Battery Capacity", "spec_value": "[value or estimate]"},
    {"spec_group": "Battery", "spec_name": "Charging", "spec_value": "[value]"}
  ],
  "notes": "Camera/Battery estimated based on [processor/tier]. User should verify."
}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.3 // Lower temperature for more consistent formatting
    })

    let reformattedData
    try {
      const responseText = response.choices[0].message.content
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      reformattedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reformattedData,
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

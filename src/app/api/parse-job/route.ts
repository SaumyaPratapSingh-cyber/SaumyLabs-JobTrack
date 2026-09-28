import { NextRequest, NextResponse } from 'next/server'

// The fastest and most reliable free models on OpenRouter
const MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemini-2.5-flash-exp:free', 
  'huggingface/zephyr-7b-beta:free'
]

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide more text to parse.' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    const prompt = `You are an expert job application data extractor.
Extract information from the text below and return ONLY a valid JSON object with these exact keys:
- company_name (string, required): Name of the company
- role (string, required): Job title or role applied for
- job_id (string): The job ID, requisition number, or reference number, if mentioned
- date_applied (string): Date in YYYY-MM-DD format. Use "${today}" if it says today or is unclear. Empty string if not mentioned.
- status (string): One of exactly: "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn". Default to "Applied".
- salary_info (string): Salary or CTC info, or empty string if not mentioned
- location (string): City or location, or empty string if not mentioned
- job_url (string): URL if mentioned, or empty string
- notes (string): Any other useful info, or empty string

Return ONLY the JSON object, no explanation, no markdown. Do not include \`\`\`json blocks.`

    let lastError: any = null
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is missing in environment variables.' }, { status: 500 })
    }

    for (const modelName of MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: text }
            ],
            response_format: { type: "json_object" }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OpenRouter error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        const rawText = data.choices[0].message.content.trim()
        
        // Clean up markdown just in case the model ignored the system prompt
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim()

        const parsed = JSON.parse(cleaned)

        // Clean up empty strings
        Object.keys(parsed).forEach((key) => {
          if (parsed[key] === '') parsed[key] = undefined
        })

        console.log(`✅ Parsed successfully using model: ${modelName}`)
        return NextResponse.json(parsed)

      } catch (err: any) {
        console.warn(`❌ Model ${modelName} failed: ${err?.message}`)
        lastError = err
        // Only continue to next model on specific rate limit or model-down errors
        if (!err?.message?.includes('429') && !err?.message?.includes('502') && !err?.message?.includes('503')) {
          break
        }
      }
    }

    throw lastError
  } catch (error: any) {
    console.error('All models failed:', error?.message || error)
    return NextResponse.json(
      { error: `AI parsing failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}

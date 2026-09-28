import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Try models in order until one works
const MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
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

Return ONLY the JSON object, no explanation, no markdown.

Text:
${text}`

    let lastError: any = null

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        })

        const result = await model.generateContent(prompt)
        const rawText = result.response.text().trim()
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim()

        const parsed = JSON.parse(cleaned)

        Object.keys(parsed).forEach((key) => {
          if (parsed[key] === '') parsed[key] = undefined
        })

        console.log(`? Parsed successfully using model: ${modelName}`)
        return NextResponse.json(parsed)
      } catch (err: any) {
        console.warn(`?? Model ${modelName} failed: ${err?.message}`)
        lastError = err
        // Only continue to next model on 503/404/429 errors
        if (!err?.message?.includes('503') && !err?.message?.includes('404') && !err?.message?.includes('429')) {
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

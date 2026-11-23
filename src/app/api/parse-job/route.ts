import { NextRequest, NextResponse } from 'next/server'
import dns from 'node:dns'

// Force IPv4 resolution to prevent IPv6 NAT64 timeouts and "fetch failed" in Node.js
try {
  dns.setDefaultResultOrder('ipv4first')
} catch {
  // Ignore in environments where not supported
}

const GROQ_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
]

function cleanParsedData(raw: any, today: string) {
  if (!raw || typeof raw !== 'object') return null
  const cleaned: any = { ...raw }

  // Clean empty strings and whitespace
  Object.keys(cleaned).forEach((key) => {
    if (typeof cleaned[key] === 'string') {
      cleaned[key] = cleaned[key].trim()
      if (cleaned[key] === '' || cleaned[key].toLowerCase() === 'n/a' || cleaned[key].toLowerCase() === 'none') {
        cleaned[key] = undefined
      }
    }
  })

  // Ensure mandatory fields
  if (!cleaned.company_name) cleaned.company_name = 'Company'
  if (!cleaned.role) cleaned.role = 'Applied Role'
  if (!cleaned.status) cleaned.status = 'Applied'
  if (!cleaned.date_applied) cleaned.date_applied = today

  return cleaned
}

// Fallback rule-based heuristic extractor if all AI endpoints are unreachable
function fallbackHeuristicExtractor(text: string, today: string) {
  // 1. URL
  const urlMatch = text.match(/https?:\/\/[^\s<>"'{}|\\^`\]]+/i)
  const job_url = urlMatch ? urlMatch[0].replace(/[.,;)]+$/, '') : undefined

  // 2. Job ID
  const idMatch = text.match(/(?:job\s*(?:id|#|code|ref|req(?:uisition)?)|req(?:uisition)?\s*(?:id|#)?|reference\s*(?:no|#|id)?)\s*[:#-]?\s*([a-zA-Z0-9_-]{3,30})/i)
  const job_id = idMatch ? idMatch[1] : undefined

  // 3. Salary / CTC
  const salMatch =
    text.match(/(?:₹|rs\.?|inr|\$|€|£)\s*[\d,]+(?:\.\d+)?\s*(?:lpa|k|m|per\s*(?:annum|year|month)|cr)?/i) ||
    text.match(/\b\d+(?:\.\d+)?\s*(?:lpa|k\b|ctc)/i)
  const salary_info = salMatch ? salMatch[0] : undefined

  // 4. Role
  const roleMatch =
    text.match(/(?:position|role|title|applied for|applying for)\s*(?:of|as|:)?\s*([A-Za-z0-9\s/&.-]{3,50}?)(?:\s+(?:at|in|on|with|\.|\n|$))/i) ||
    text.match(/\b(Software Engineer|Frontend Developer|Backend Developer|Full Stack Developer|Data Scientist|Product Manager|UI\/UX Designer|DevOps Engineer|QA Engineer|Machine Learning Engineer|Cloud Architect|Project Manager|Business Analyst)\b/i)
  const role = roleMatch ? (roleMatch[1] || roleMatch[0]).trim() : 'Applied Role'

  // 5. Company Name
  const compMatch =
    text.match(/(?:at|company|with|joining|team at)\s+([A-Z][a-zA-Z0-9&.\s]{1,30}?)(?:\s+(?:for|as|on|team|\.|\n|,))/i) ||
    text.match(/welcome to\s+([A-Z][a-zA-Z0-9&.\s]{1,30})/i) ||
    text.match(/thank you for applying to\s+([A-Z][a-zA-Z0-9&.\s]{1,30})/i)
  let company_name = compMatch ? compMatch[1].trim() : 'Company'
  // Remove trailing date words if accidentally captured
  company_name = company_name.replace(/\s+(on|for|in|at)\s+.*$/i, '').trim()

  // 6. Location
  const locMatch = text.match(/(?:location|based in|office in)\s*[:#-]?\s*([A-Za-z\s,.-]{3,35})/i) ||
                   text.match(/\b(Remote|Hybrid|Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Pune|Noida|Gurgaon|London|New York|San Francisco)\b/i)
  const location = locMatch ? (locMatch[1] || locMatch[0]).trim() : undefined

  return {
    company_name,
    role,
    job_id,
    date_applied: today,
    status: 'Applied' as const,
    salary_info,
    location,
    job_url,
    notes: text.slice(0, 160).replace(/\s+/g, ' ').trim(),
  }
}

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
- status (string): One of exactly: "Applied", "Shortlisted", "Assessment", "Interviewing", "Offer", "Rejected", "Withdrawn". Default to "Applied".
- salary_info (string): Salary or CTC info, or empty string if not mentioned
- location (string): City or location, or empty string if not mentioned
- job_url (string): URL if mentioned, or empty string
- notes (string): Any other useful info, or empty string

Return ONLY the JSON object, no explanation, no markdown. Do not include \`\`\`json blocks.`

    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    // ── TIER 1: GROQ API ─────────────────────────────────────────────────────────
    if (groqKey) {
      for (const modelName of GROQ_MODELS) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 9000)

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${groqKey}`,
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
          clearTimeout(timeoutId)

          if (!response.ok) {
            const errText = await response.text()
            console.warn(`Groq model ${modelName} returned status ${response.status}: ${errText}`)
            continue
          }

          const data = await response.json()
          const rawText = data?.choices?.[0]?.message?.content?.trim()
          if (!rawText) continue

          const cleaned = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim()

          const parsed = JSON.parse(cleaned)
          const result = cleanParsedData(parsed, today)
          if (result) {
            console.log(`✅ Parsed successfully via Groq (${modelName})`)
            return NextResponse.json(result)
          }
        } catch (err: any) {
          console.warn(`Groq model ${modelName} error: ${err?.message || err}`)
          // Continue to next model on any error
        }
      }
    }

    // ── TIER 2: GOOGLE GEMINI FLASH API ──────────────────────────────────────────
    if (geminiKey) {
      try {
        console.log('Falling back to Google Gemini 2.5 Flash...')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 9000)

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(geminiUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${prompt}\n\nJob Application Text:\n${text}` }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (rawText) {
            const cleaned = rawText
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim()

            const parsed = JSON.parse(cleaned)
            const result = cleanParsedData(parsed, today)
            if (result) {
              console.log('✅ Parsed successfully via Gemini 2.5 Flash')
              return NextResponse.json(result)
            }
          }
        }
      } catch (err: any) {
        console.warn(`Gemini fallback failed: ${err?.message || err}`)
      }
    }

    // ── TIER 3: INTELLIGENT RULE-BASED FALLBACK ─────────────────────────────────
    // If all external AI network calls fail or rate-limit, extract using heuristics
    console.log('Falling back to Smart Heuristic Extractor')
    const heuristicResult = fallbackHeuristicExtractor(text, today)
    return NextResponse.json(heuristicResult)

  } catch (error: any) {
    console.error('All extraction tiers completed with exception:', error?.message || error)
    // Even on total exception, extract heuristically so the user is never stuck
    const today = new Date().toISOString().split('T')[0]
    return NextResponse.json(fallbackHeuristicExtractor('', today))
  }
}

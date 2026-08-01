// Basic in-memory rate limiter.
// Note: this resets whenever the serverless function cold-starts and is
// per-instance, not shared across regions/instances. It's a reasonable
// first line of defense against casual abuse, but for strict/production
// rate limiting across a distributed serverless deployment, use a shared
// store like Upstash Redis (Vercel KV) instead.
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10     // max requests per IP per window

const requestLog = new Map() // ip -> array of timestamps

function isRateLimited(ip) {
    const now = Date.now()
    const timestamps = requestLog.get(ip) || []

    // drop timestamps outside the current window
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)

    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        requestLog.set(ip, recent)
        return true
    }

    recent.push(now)
    requestLog.set(ip, recent)
    return false
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for']
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    return req.socket?.remoteAddress || 'unknown'
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const ip = getClientIp(req)
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests, please slow down.' })
    }

    let body = req.body
    if (typeof body === 'string') {
        body = JSON.parse(body)
    }

    const { text, mode } = body

    if (!text || text.length > 500) {
        return res.status(400).json({ error: 'Text too long or empty' })
    }

    // validate mode is only one of two expected values
    if (mode !== 'toEnglish' && mode !== 'toLinkedIn') {
        return res.status(400).json({ error: 'Invalid mode' })
    }

    //Sanitize inputs
    const sanitized = text
        .replace(/[<>{}\/\\]/g, '')
        .replace(/https?:\/\/[^\s]*/g, '')
        .trim()
        .slice(0, 500)

    // replace text with sanitized version going forward
    if (!sanitized) {
        return res.status(400).json({ error: 'No valid text provided' })
    }

    console.log('body received:', text, mode)

    const prompt = mode === 'toEnglish'
        ? `Translate this LinkedIn jargon into blunt honest English. Be funny and ruthless. Keep it to 1-2 sentences max: "${sanitized}"`
        : `Rewrite this as a LinkedIn post. Be over-the-top, use buzzwords, add unnecessary life lessons, maybe a humblebrag. Use emojis liberally throughout like a real LinkedIn post would. Always finish with a complete sentence and a hashtag. 3-5 sentences max: "${sanitized}"`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300
            })
        })

        const data = await response.json()

        if (!response.ok || !data.choices || !data.choices[0]) {
            console.error('Groq error:', response.status, JSON.stringify(data))
            return res.status(502).json({ error: 'Translation service error' })
        }

        const result = data.choices[0].message.content.trim().replace(/^"|"$/g, '')
        res.status(200).json({ result })
    } catch (err) {
        console.error('Fetch to Groq failed:', err)
        res.status(500).json({ error: 'Failed to reach translation service' })
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
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

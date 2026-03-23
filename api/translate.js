export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    let body = req.body
    if (typeof body === 'string') {
        body = JSON.parse(body)
    }

    const { text, mode } = body
    console.log('body received:', text, mode)

    if (!text) {
        return res.status(400).json({ error: 'No Text Provided' }) 
    }

    const prompt = mode === 'toEnglish'
        ? `Translate this LinkedIn jargon into blunt honest English. Be funny and ruthless. Keep it to 1-2 sentences max: "${text}"`
        : `Rewrite this as a LinkedIn post. Be over-the-top, use buzzwords, add unnecessary life lessons, maybe a humblebrag. Use emojis liberally throughout like a real LinkedIn post would. Always finish with a complete sentence and a hashtag. 3-5 sentences max: "${text}"`
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
    console.log('Groq response:', JSON.stringify(data))  
    console.log('Groq status:', response.status)  // ← add this too
    const result = data.choices[0].message.content.trim().replace(/^"|"$/g, '')
    res.status(200).json({ result })
}
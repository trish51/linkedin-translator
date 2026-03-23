export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { text, mode } = req.body

    if (!text) {
        return res.status(400).json({ error: 'No Text Provided' })  // ← fix typo: statrus → status
    }

    const prompt = mode === 'toEnglish'
        ? `Translate this LinkedIn jargon into blunt honest English. Be funny and ruthless. Keep it to 1-2 sentences max: "${text}"`
        : `Rewrite this as a LinkedIn post. Be over-the-top, use buzzwords, add unnecessary life lessons, maybe a humblebrag. 3-5 sentences max: "${text}"`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
        })
    })  // ← fetch closes here

    const data = await response.json()
    console.log('Groq response:', JSON.stringify(data))  // ← debug line here
    const result = data.choices[0].message.content.trim()
    res.status(200).json({ result })
}
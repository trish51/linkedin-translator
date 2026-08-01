# LinkedIn Translator

A tongue-in-cheek translator that converts LinkedIn corporate jargon into blunt, honest English — and back again. Type in something like "humbled and honoured" and get "I am bragging," or flip the switch and turn "I got fired" into "I'm excited to embrace a new chapter 🚀."

## How it works

The app tries a local dictionary lookup first. If your input matches a known phrase, you get an instant canned response with no API call. If there's no match, it falls back to an AI-generated translation via the Groq API (using Llama 3.3 70B).

## Project structure

```
.
├── index.html          # Page markup
├── style.css           # Styling (light/dark mode via prefers-color-scheme)
├── script.js           # Frontend logic: dictionary lookup, mode toggling, API calls
├── api/
│   └── translate.js    # Vercel serverless function that calls the Groq API
├── vercel.json          # Vercel config
└── package.json
```

## Modes

- **LinkedIn → English** (`toEnglish`): translates corporate buzzwords into what people actually mean.
- **English → LinkedIn** (`toLinkedIn`): translates plain speech into over-the-top LinkedIn-post style, complete with emojis and hashtags.

Use the ↔ button to swap between modes.

## Running locally

This is a static frontend + a single Vercel serverless function, so the easiest way to run it locally is with the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

This serves `index.html`/`script.js`/`style.css` as static files and runs `api/translate.js` as a serverless function at `/api/translate`.

## Environment variables

The API route requires a Groq API key:

```
GROQ_API_KEY=your_key_here
```

Set this in your Vercel project's **Settings → Environment Variables** (and in a local `.env` file if using `vercel dev`). You'll need to redeploy after adding or changing it.

## Deployment

Deployed on Vercel. Pushing to the connected branch triggers an automatic deployment. The `api/translate.js` file is automatically picked up as a serverless function — no extra Vercel config needed beyond what's in `vercel.json`.

## API

**POST** `/api/translate`

Request body:
```json
{
  "text": "thought leader",
  "mode": "toEnglish"
}
```

`mode` must be either `"toEnglish"` or `"toLinkedIn"`.

Response:
```json
{
  "result": "person with a LinkedIn account"
}
```

Input is sanitized server-side (HTML-unsafe characters and URLs stripped, capped at 500 characters) before being sent to Groq.

### Rate limiting

`/api/translate` limits each client to **10 requests per minute per IP**. Requests over the limit get a `429` response:

```json
{
  "error": "Too many requests, please slow down."
}
```

This is implemented as a simple in-memory counter inside the serverless function, keyed by the client's IP (from `x-forwarded-for`). It's a lightweight first line of defense against casual abuse of the Groq key, but has a caveat worth knowing: **the counter resets on cold starts and isn't shared across concurrent function instances or regions**, so it won't hold up as a strict limit under real load or a distributed attack. For production-grade rate limiting, swap this out for a shared store like Vercel KV / Upstash Redis.

## Notes / ideas for later

- Expand the local dictionaries in `script.js` with more phrases to reduce API calls.
- Move rate limiting to a shared store (Vercel KV / Upstash Redis) if traffic grows.
- Consider caching common AI-generated translations.

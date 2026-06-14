import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { getClientIp, rateLimit } from '../api/_lib/rateLimit.js';
import { CHAT_SYSTEM_PROMPT } from '../api/_lib/chatPrompt.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY environment variable is not set!');
} else {
  console.log('✅ Gemini API key is configured');
}

const MODEL = 'gemini-2.0-flash';
const MAX_OUTPUT_TOKENS = 384;

function chunkText(chunk) {
  if (chunk?.text) return chunk.text;
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!parts?.length) return '';
  return parts.map((p) => p.text || '').join('');
}

app.post('/api/chat', async (req, res) => {
  const ip = getClientIp(req);
  if (!rateLimit(`chat:${ip}`, 20, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env' });
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const conversation = messages
      .filter((m) => m?.role === 'user' || m?.role === 'assistant')
      .slice(-20);

    const contents = conversation.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(msg.content ?? '').slice(0, 2000) }],
    }));

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.6,
        systemInstruction: CHAT_SYSTEM_PROMPT,
      },
    });

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.status(200);

    for await (const chunk of stream) {
      const t = chunkText(chunk);
      if (t) res.write(`${JSON.stringify({ t })}\n`);
    }
    res.write(`${JSON.stringify({ done: true })}\n`);
    res.end();
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    const msg = error?.message || String(error);
    if (!res.headersSent) {
      if (msg.includes('quota')) {
        res.status(429).json({
          error: 'API quota exceeded. Please try again later or contact Jeremy directly.',
        });
      } else if (msg.includes('API key') || msg.includes('API_KEY')) {
        res.status(401).json({
          error: 'Invalid API key. Please check your Gemini API key configuration.',
        });
      } else {
        res.status(500).json({ error: msg });
      }
    } else {
      res.write(`${JSON.stringify({ error: msg })}\n`);
      res.end();
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.post('/api/blog', async (req, res) => {
  const blogHandler = (await import('../api/blog.js')).default;
  return blogHandler(req, res);
});

app.listen(port, () => {
  console.log(`Development server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Gemini API Key configured: ${apiKey ? 'Yes' : 'No'}`);
  console.log('API endpoints available:');
  console.log('  - POST /api/chat');
  console.log('  - GET /api/health');
  console.log('  - POST /api/blog');
});

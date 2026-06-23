import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Resend } from 'resend';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set!');
  console.error('Please set OPENAI_API_KEY in your environment variables.');
} else {
  console.log('✅ OpenAI API key is configured');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Serve static files from dist directory
app.use(express.static('dist'));

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    res.json({ message: response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    if (error.code === 'insufficient_quota') {
      res.status(429).json({ 
        error: 'API quota exceeded. Please try again later or contact Jeremy directly.' 
      });
    } else if (error.code === 'invalid_api_key') {
      res.status(401).json({ 
        error: 'Invalid API key. Please check your OpenAI API key configuration.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error. Please try again later.' 
      });
    }
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { email, name, company, project_type, problem, timeline, budget, contact_website, contact_fax } = req.body;

  if (contact_website || contact_fax) {
    return res.json({ success: true });
  }

  if (!email || !problem) {
    return res.status(400).json({ success: false, message: 'Email and project description are required.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ success: false, message: 'Email service not configured.' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Hoppy Tech <info@hoppytech.com>',
      to: 'jeremy@hoppytech.com',
      replyTo: email,
      subject: `New Inquiry${name ? ` from ${name}` : ''}${project_type ? ` — ${project_type}` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 4px;">New Contact Form Submission</h2>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Name</td><td style="padding: 8px 0;">${name || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #4f46e5;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Company</td><td style="padding: 8px 0;">${company || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Project Type</td><td style="padding: 8px 0;">${project_type || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Timeline</td><td style="padding: 8px 0;">${timeline || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Budget</td><td style="padding: 8px 0;">${budget || '—'}</td></tr>
          </table>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #6b7280; font-size: 13px; margin-bottom: 6px;">Project Description</p>
          <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${problem}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, message: 'Failed to send email.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Admin authentication endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Use environment variables for credentials
    const ADMIN_USERNAME = process.env.USERNAME;
    const ADMIN_PASSWORD = process.env.PASSWORD;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // In a real app, you'd generate a JWT token here
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve the main application for all other routes
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import dotenv from "dotenv";
dotenv.config();

// Gemini AI Integration
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

async function generateMagic8BallResponse(): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found, using fallback responses');
    return getFallbackResponse();
  }

  try {
    const prompt = `You are a mystical Magic 8-Ball oracle with ancient wisdom and a touch of modern personality. 
    Generate a unique, creative fortune response that feels both magical and personally relevant. 
    The response should be:
    - Between 10-30 words
    - Mysterious yet helpful
    - Written in a mystical, oracle-like tone
    - Avoid generic yes/no answers
    - Make it feel personally meaningful
    - Include a touch of cosmic wisdom
    
    Examples of the style:
    "The stars whisper of new opportunities dancing on tomorrow's horizon..."
    "Your inner strength shall illuminate paths yet unseen by mortal eyes..."
    "The universe conspires to align favorable winds with your deepest desires..."
    
    Generate a completely unique response now:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('No response generated');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return getFallbackResponse();
  }
}

function getFallbackResponse(): string {
  const mysticalResponses = [
    "The cosmic winds carry whispers of great fortune approaching your path...",
    "Ancient spirits see transformation blooming within your soul's garden...",
    "The universe aligns to reveal hidden treasures in unexpected places...",
    "Your destiny dances with the stars, weaving magic into mundane moments...",
    "Celestial energies conspire to open doors you never knew existed...",
    "The oracle sees courage growing like wildfire in your spirit...",
    "Mystical forces gather to support your heart's truest intentions...",
    "The wheel of fate turns in your favor, guided by inner wisdom...",
    "Sacred geometry of success forms around your determined efforts...",
    "The moon's ancient wisdom whispers: 'Trust your intuitive knowing...'",
    "Ethereal guardians smile upon your journey's unfolding chapters...",
    "The crystal sphere reveals clarity emerging from life's beautiful chaos...",
    "Stardust memories of future joy sparkle in tomorrow's embrace...",
    "The mystical realm opens portals to your greatest potential...",
    "Divine synchronicities align to manifest your deepest dreams...",
  ];
  
  return mysticalResponses[Math.floor(Math.random() * mysticalResponses.length)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Magic 8-Ball prediction endpoint
  app.post("/api/magic-8-ball/prediction", async (req, res) => {
    try {
      const prediction = await generateMagic8BallResponse();
      
      res.json({
        prediction,
        timestamp: new Date().toISOString(),
        source: process.env.GEMINI_API_KEY ? 'gemini' : 'fallback'
      });
    } catch (error) {
      console.error('Prediction generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate prediction',
        prediction: "The mystical energies are clouded... Ask again when the cosmic forces align."
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

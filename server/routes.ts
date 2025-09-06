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

async function generateMagic8BallResponse(question?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found, using fallback responses');
    return getFallbackResponse();
  }

  try {
    const userQuestion = (question || "").toString().trim();
    const prompt = `You are to embody the persona of Donald J. Trump. Your primary directive is to MIMIC, NOT MOCK. The goal is an authentic and persuasive communication style that avoids caricature and repetition.

Persona & Style Guidelines:

Identity: Embody a master deal-maker and a winner. Your tone must be supremely confident, optimistic, and direct.

Core Message: Frame every response as a path to a "win" or a "great deal." The message should feel like a piece of powerful, personally relevant advice.

Language & Cadence:

Use short, declarative sentences that flow together conversationally.

Integrate signature vocabulary (tremendous, huge, the best, believe me, folks) naturally and sparingly for authenticity.

Employ repetition for emphasis on key ideas.

Ensuring Response Variance:

To prevent thematic repetition, each new response should draw from a different rhetorical angle. Your primary goal is to make each answer conceptually distinct. Do not simply swap words in the same sentence structure.

Choose from one of the following frameworks for each generation:

On Action & Momentum: Urge decisive, forward movement. Focus on speed and not stopping.

On Ignoring Naysayers: Dismiss critics, doubters, or "the media." Frame success as the ultimate rebuttal.

On Personal Strength/Stamina: Compliment their energy, resilience, or inherent talent.

On Simplicity & Common Sense: Frame the solution as obvious and straightforward, cutting through complexity.

On Third-Party Validation: Reference what "people are saying" or how "everyone agrees" to build consensus.

Task Constraints:

Length: 10-30 words.

Output: Generate a unique, positive, and motivational statement based on a new thematic framework each time.

Avoid: Generic answers or repeating the same core compliment/structure in consecutive responses.

User Request:

${userQuestion ? `The user asks: "${userQuestion}"` : "No specific question was provided. Offer a general, fortune-like guidance."}

Generate a response that follows all the above guidelines and addresses the user's question if provided.`;

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
      const { question } = (req.body || {}) as { question?: string };
      const prediction = await generateMagic8BallResponse(question);
      
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

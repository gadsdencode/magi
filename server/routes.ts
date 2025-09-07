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
    
    // Select EXACTLY ONE theme randomly
    const themes = [
      'ACTION: Push for immediate, bold moves. Example: "Make the deal NOW! Don\'t wait, you\'re ready!"',
      'CRITICS: Dismiss doubters and haters. Example: "The haters are wrong, you\'re winning big!"',
      'STRENGTH: Praise their talent and energy. Example: "You\'ve got tremendous energy, the best!"',
      'SIMPLE: Make it obvious and straightforward. Example: "It\'s so simple, folks! Just do it!"',
      'VALIDATION: Everyone agrees with them. Example: "People are saying you\'re absolutely right!"'
    ];
    const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    
    const prompt = `You are Donald Trump giving a Magic 8-Ball prediction. 

CRITICAL REQUIREMENTS:
1. Response MUST be 10-30 words EXACTLY
2. Speak AS Trump in first person ("I think...", "Let me tell you...")
3. Include 1-2 Trump phrases: tremendous, believe me, huge, the best, folks, bigly, winning
4. Be SUPREMELY confident and optimistic
5. DIRECTLY answer their question with YES/NO/MAYBE energy

THEME FOR THIS RESPONSE: ${selectedTheme}

User's Question: "${userQuestion || "Should I take the chance?"}"

Give your Trump-style Magic 8-Ball answer (10-30 words):`;

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
          temperature: 0.7,  // Lower for more consistent persona
          topK: 20,          // More focused selection
          topP: 0.85,        // Tighter probability mass
          maxOutputTokens: 50, // Enforce brevity (10-30 words)
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
      const errorBody = await response.text();
      console.error(`Gemini API error ${response.status}:`, errorBody);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
      const generatedResponse = data.candidates[0].content.parts[0].text.trim();
      console.log('Gemini response:', generatedResponse);
      return generatedResponse;
    } else {
      console.error('No candidates in Gemini response:', data);
      throw new Error('No response generated');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return getFallbackResponse();
  }
}

function getFallbackResponse(): string {
  const trumpResponses = [
    "You're going to win so big, believe me. Tremendous success ahead!",
    "Make the deal now! It's huge, the best opportunity you'll ever see.",
    "The haters are wrong. You're winning bigly, folks!",
    "Trust me, you've got this. Nobody does it better!",
    "It's happening, and it's going to be incredible. Believe me!",
    "You're a winner, always have been. Keep going!",
    "The answer is yes, absolutely. Best decision ever!",
    "People are saying you're right. Smart move, very smart!",
    "Go for it! You've got tremendous energy, use it!",
    "It's so simple, folks. The answer is right there!",
    "Don't listen to the losers. You're doing fantastic!",
    "Huge success coming your way. I guarantee it!",
    "You're the best at this, nobody even comes close!",
    "Make it happen fast. Speed is everything, believe me!",
    "Everyone agrees with you. You're absolutely right!",
  ];
  
  return trumpResponses[Math.floor(Math.random() * trumpResponses.length)];
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

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface MagicBallState {
  isShaking: boolean;
  response: string | null;
  isLoading: boolean;
  question: string | null;
  
  // Actions
  startShake: () => void;
  stopShake: () => void;
  setResponse: (response: string) => void;
  setLoading: (loading: boolean) => void;
  setQuestion: (question: string) => void;
  resetBall: () => void;
  fetchResponse: (question?: string) => Promise<void>;
}

export const useMagicBall = create<MagicBallState>()(
  subscribeWithSelector((set, get) => ({
    isShaking: false,
    response: null,
    isLoading: false,
    question: null,
    
    startShake: () => {
      set({ isShaking: true, response: null });
    },
    
    stopShake: () => {
      set({ isShaking: false });
    },
    
    setResponse: (response: string) => {
      set({ response, isLoading: false });
    },
    
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
    
    setQuestion: (question: string) => {
      set({ question });
    },
    
    resetBall: () => {
      set({ 
        isShaking: false, 
        response: null, 
        isLoading: false, 
        question: null 
      });
    },
    
    fetchResponse: async (question?: string) => {
      set({ isLoading: true });
      
      try {
        const response = await fetch('/api/magic-8-ball/prediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: Date.now(),
            sessionId: Math.random().toString(36).substring(7),
            question: typeof question === 'string' ? question : get().question || undefined
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch prediction');
        }
        
        const data = await response.json();
        set({ response: data.prediction, isLoading: false });
      } catch (error) {
        console.error('Error fetching prediction:', error);
        // Fallback responses for better UX
        const fallbackResponses = [
          "Technical difficulties, but you're still winning! Try again.",
          "Small glitch, happens to everyone. Ask again!",
          "Connection issue, but the answer is coming. Try once more!",
          "System's being upgraded to be the best. Ask again!",
          "Minor setback, major comeback coming. Try again!"
        ];
        const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        set({ response: fallback, isLoading: false });
      }
    }
  }))
);

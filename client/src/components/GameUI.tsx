import { useState } from 'react';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Volume2, VolumeX, RotateCcw, HelpCircle, SendHorizontal } from 'lucide-react';

export default function GameUI() {
  const { isLoading, resetBall, fetchResponse, setQuestion, question, isShaking } = useMagicBall();
  const { isMuted, toggleMute } = useAudio();
  const [localQuestion, setLocalQuestion] = useState<string>(question ?? '');

  const submitQuestion = async () => {
    const q = localQuestion.trim();
    if (!q || isLoading || isShaking) return;
    setQuestion(q);
    await fetchResponse(q);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <Card className="bg-black/30 backdrop-blur-sm border-cyan-500/30 glow-cyan">
          <CardContent className="p-3">
            <h1 className="text-xl font-bold font-orbitron bg-gradient-to-r from-cyan-400 via-blue-300 to-red-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(0,217,255,0.35)]">
              Magic 8-Ball Oracle
            </h1>
          </CardContent>
        </Card>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="bg-black/30 backdrop-blur-sm border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={resetBall}
            className="bg-black/30 backdrop-blur-sm border-cyan-500/30 hover:bg-red-500/20 text-cyan-400"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Input / Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-xl pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Type your question for the Oracle..."
              value={localQuestion}
              onChange={(e) => setLocalQuestion(e.target.value)}
              onKeyDown={(e) => {
                // Allow spacebar to insert a normal space in the input
                if (e.key === ' ') {
                  e.stopPropagation();
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitQuestion();
                }
              }}
              className="bg-black/30 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-300/40"
              disabled={isLoading}
            />
          </div>
          <Button
            variant="outline"
            onClick={submitQuestion}
            disabled={isLoading || !localQuestion.trim()}
            className="bg-black/30 backdrop-blur-sm border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400"
          >
            <SendHorizontal className="h-4 w-4 mr-1" /> Ask
          </Button>
        </div>
        <p className="mt-2 text-center text-gray-400 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
          {isLoading 
            ? 'The cosmos are aligning...'
            : 'Click the Oracle, press SPACE, or type a question and press Enter.'
          }
        </p>
      </div>

      {/* Mystical background effects */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-70"></div>
      </div>
    </div>
  );
}
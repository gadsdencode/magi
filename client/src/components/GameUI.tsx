import { useState, useEffect } from 'react';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import { Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { useIsMobile } from '../hooks/use-is-mobile';

export default function GameUI() {
  const { response, isLoading, isShaking, resetBall } = useMagicBall();
  const { isMuted, toggleMute } = useAudio();
  const [showInstructions, setShowInstructions] = useState(true);
  const isMobile = useIsMobile();

  // Hide instructions after first interaction
  useEffect(() => {
    if (isShaking || response) {
      setShowInstructions(false);
    }
  }, [isShaking, response]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI Bar */}
      <div className={
        `absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto`
      }>
        <Card className="bg-card/50 backdrop-blur-md border-cyan-500/30 glow-cyan pulse-glow">
          <CardContent className="p-3">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-300 to-red-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(0,217,255,0.35)]">
              Magic 8-Ball Oracle
            </CardTitle>
          </CardContent>
        </Card>
        
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-2'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="bg-card/30 backdrop-blur-md border-cyan-500/20 hover:bg-cyan-500/30 hover:glow-cyan text-cyan-400 transition-all duration-300"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={resetBall}
            className="bg-card/30 backdrop-blur-md border-red-500/20 hover:bg-red-500/30 hover:glow-red text-cyan-400 transition-all duration-300"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Card className="bg-card/60 backdrop-blur-md border-cyan-500/30 max-w-md pulse-glow instruction-card-glow">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-cyan-400 mb-2">
                Ask the Oracle
              </h2>
              <p className="text-foreground/80 mb-4">
                Think of a question and click the Magic 8-Ball or press SPACE to reveal your fate...
              </p>
              <div className="text-sm text-muted-foreground">
                <p>🖱️ Click the ball</p>
                <p>⌨️ Press SPACE or ENTER</p>
                <p>🔄 Press R to reset</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Response Display moved into the ball window for authenticity */}

      {/* Shake indicator */}
      {isShaking && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="text-4xl animate-bounce">
            ✨
          </div>
        </div>
      )}

      {/* Mystical background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-70"></div>
      </div>
    </div>
  );
}

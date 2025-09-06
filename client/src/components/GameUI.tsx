import { useState, useEffect } from 'react';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';

export default function GameUI() {
  const { response, isLoading, isShaking, resetBall } = useMagicBall();
  const { isMuted, toggleMute } = useAudio();
  const [showInstructions, setShowInstructions] = useState(true);

  // Hide instructions after first interaction
  useEffect(() => {
    if (isShaking || response) {
      setShowInstructions(false);
    }
  }, [isShaking, response]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <Card className="bg-black/20 backdrop-blur-md border-cyan-500/30">
          <CardContent className="p-3">
            <h1 className="text-xl font-bold text-cyan-400 font-orbitron">
              Magic 8-Ball Oracle
            </h1>
          </CardContent>
        </Card>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="bg-black/20 backdrop-blur-md border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={resetBall}
            className="bg-black/20 backdrop-blur-md border-cyan-500/30 hover:bg-red-500/20 text-cyan-400"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <Card className="bg-black/40 backdrop-blur-md border-cyan-500/30 max-w-md">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-cyan-400 mb-2">
                Ask the Oracle
              </h2>
              <p className="text-gray-300 mb-4">
                Think of a question and click the Magic 8-Ball or press SPACE to reveal your fate...
              </p>
              <div className="text-sm text-gray-400">
                <p>🖱️ Click the ball</p>
                <p>⌨️ Press SPACE or ENTER</p>
                <p>🔄 Press R to reset</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Response Display */}
      {(response || isLoading) && !showInstructions && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <Card className="bg-black/40 backdrop-blur-md border-cyan-500/30 max-w-lg">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-red-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
                    Consulting the Oracle...
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">
                    The Oracle Speaks:
                  </h3>
                  <p className="text-gray-100 text-base leading-relaxed">
                    {response}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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

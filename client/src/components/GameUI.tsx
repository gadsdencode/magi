import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

export default function GameUI() {
  const { isLoading, resetBall } = useMagicBall();
  const { isMuted, toggleMute } = useAudio();

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

      {/* Bottom Instructions / Status */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <p className="text-center text-gray-400 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
            {isLoading 
              ? 'The cosmos are aligning...' 
              : 'Click the Oracle or press SPACE to ask a question.'
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
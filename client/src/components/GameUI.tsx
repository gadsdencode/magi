import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Volume2, VolumeX, RotateCcw, SendHorizontal } from 'lucide-react';

export default function GameUI() {
  const { isLoading, resetBall, fetchResponse, setQuestion, question, isShaking } = useMagicBall();
  const { isMuted, toggleMute } = useAudio();
  const [localQuestion, setLocalQuestion] = useState<string>(question ?? '');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect virtual keyboard via VisualViewport and input focus
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    const threshold = 140; // px height change to assume keyboard
    const onResize = () => {
      if (!vv) return;
      const heightLoss = window.innerHeight - vv.height;
      setIsKeyboardOpen(heightLoss > threshold);
    };
    if (vv) {
      vv.addEventListener('resize', onResize);
      vv.addEventListener('scroll', onResize);
      onResize();
    }
    const onOrientation = () => onResize();
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', onResize);
        vv.removeEventListener('scroll', onResize);
      }
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, []);

  const submitQuestion = async () => {
    const q = localQuestion.trim();
    if (!q || isLoading || isShaking) return;
    setQuestion(q);
    await fetchResponse(q);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI Bar */}
      <motion.div
        className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <h1 className="text-4xl font-bold text-white tracking-wide drop-shadow-2xl">
            Magic 47-Ball
          </h1>
        </motion.div>
        
        <motion.div className="flex gap-2" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={resetBall}
            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom Input / Instructions */}
      <motion.div
        className={`${isKeyboardOpen
          ? 'fixed bottom-0 inset-x-0 mx-auto w-full max-w-[100vw] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] z-50'
          : 'absolute bottom-20 sm:bottom-12 md:bottom-10 inset-x-0 mx-auto w-full max-w-[92vw] sm:max-w-2xl md:max-w-3xl px-4'} pointer-events-auto`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.6 }}
      >
        {!isKeyboardOpen && (
          <p className="text-white/70 mb-6 text-lg text-center">
            Ask a question and the magic 47-ball shall answer
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Magic 47-ball awaits your question..."
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
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 w-full"
              disabled={isLoading}
              onFocus={() => setIsKeyboardOpen(true)}
              onBlur={() => setIsKeyboardOpen(false)}
            />
          </div>
          <Button
            variant="outline"
            onClick={submitQuestion}
            disabled={isLoading || !localQuestion.trim()}
            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white sm:w-auto w-full"
          >
            <SendHorizontal className="h-4 w-4 mr-1" /> Ask
          </Button>
        </div>
        
        <motion.p
          className="mt-4 text-center text-white/50 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {isLoading 
            ? 'We have the best predictions, don\'t we folks?'
            : 'People are saying this thing is gonna be yuge - you have to try it!'
          }
        </motion.p>
      </motion.div>
    </div>
  );
}
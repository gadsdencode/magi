import { KeyboardControls } from '@react-three/drei';
import GameUI from './components/GameUI';
import Magic8Ball from './components/MagicBall';
import { Toaster } from 'sonner';

const keyboardMap = [
  { name: 'shake', keys: ['Space'] },
  { name: 'reset', keys: ['KeyR'] },
];

export default function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative">
        <div className="flex items-center justify-center">
          <Magic8Ball size={320} />
        </div>
        
        <GameUI />
        <Toaster position="top-center" richColors />
      </div>
    </KeyboardControls>
  );
}
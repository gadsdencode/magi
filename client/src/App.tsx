import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import MagicBall from "./components/MagicBall";
import Particles from "./components/Particles";
import GameUI from "./components/GameUI";
import Lights from "./components/Lights";
import { useMagicBall } from "./lib/stores/useMagicBall";
import { useAudio } from "./lib/stores/useAudio";

// Define control keys for the game
const controls = [
  { name: "shake", keys: ["Space", "Enter"] },
  { name: "reset", keys: ["KeyR"] },
];

function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const { isShaking } = useMagicBall();
  const { setHitSound, setSuccessSound } = useAudio();

  // Load audio files
  useEffect(() => {
    const hitAudio = new Audio('/sounds/shake.mp3');
    const successAudio = new Audio('/sounds/success.mp3');
    
    setHitSound(hitAudio);
    setSuccessSound(successAudio);
  }, [setHitSound, setSuccessSound]);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F4C75 100%)' }}>
      {showCanvas && (
        <KeyboardControls map={controls}>
          <Canvas
            shadows
            camera={{
              position: [0, 2, 8],
              fov: 45,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "high-performance",
              alpha: false
            }}
          >
            <color attach="background" args={["#1A1A2E"]} />
            
            {/* Lighting */}
            <Lights />

            <Suspense fallback={null}>
              {/* 3D Magic Ball */}
              <MagicBall />
              
              {/* Mystical Particles */}
              <Particles isActive={isShaking} />
            </Suspense>
          </Canvas>
          
          {/* Game UI Overlay */}
          <GameUI />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;

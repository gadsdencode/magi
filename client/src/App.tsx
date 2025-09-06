import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, ContactShadows } from "@react-three/drei";
import MagicBall from "./components/MagicBall";
import GameUI from "./components/GameUI";
import Lights from "./components/Lights";
import Particles from "./components/Particles";
import { useMagicBall } from "./lib/stores/useMagicBall";

// Define control keys for the game
const controls = [
  { name: "shake", keys: ["Space", "Enter"] },
  { name: "reset", keys: ["KeyR"] },
];

function App() {
  const { isShaking, isLoading, response } = useMagicBall();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: 'transparent'
    }}>
      <KeyboardControls map={controls}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 8], fov: 45, near: 0.1, far: 100 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
          dpr={[1, 2]}
        >
          {/* Depth and cohesion */}
          <fog attach="fog" args={["#0F1B2D", 12, 22]} />

          {/* Lights immediately available (outside suspense) */}
          <Lights />

          <Suspense fallback={null}>
            {/* Only show halo during shake/loading to reduce background motion */}
            <Particles isActive={isShaking || isLoading} />
            <MagicBall />
            <ContactShadows
              position={[0, -1.6, 0]}
              opacity={0.4}
              scale={12}
              blur={2.5}
              far={3.5}
            />
          </Suspense>
        </Canvas>

        <GameUI />
      </KeyboardControls>
    </div>
  );
}

export default App;

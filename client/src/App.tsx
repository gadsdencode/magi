import { Canvas } from "@react-three/fiber";
import React, { Suspense, useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sphere, Text, useKeyboardControls, KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import "@fontsource/inter";

// Define control keys for the game
const controls = [
  { name: "shake", keys: ["Space", "Enter"] },
  { name: "reset", keys: ["KeyR"] },
];

// Simple Magic Ball Component
function MagicBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [subscribe, get] = useKeyboardControls();
  const [isShaking, setIsShaking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [velocity, setVelocity] = useState(new THREE.Vector3());
  const [angularVelocity, setAngularVelocity] = useState(new THREE.Vector3());

  // Handle shake
  const handleShake = async () => {
    if (isShaking) return;
    
    setIsShaking(true);
    setResponse(null);
    
    // Add physics
    const newVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );
    const newAngularVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    );
    
    setVelocity(newVelocity);
    setAngularVelocity(newAngularVelocity);
    
    // Get response after 2 seconds
    setTimeout(async () => {
      try {
        const response = await fetch('/api/magic-8-ball/prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: Date.now() }),
        });
        
        const data = await response.json();
        setResponse(data.prediction);
      } catch (error) {
        setResponse("The spirits are silent... try again.");
      }
      
      setIsShaking(false);
      setVelocity(new THREE.Vector3());
      setAngularVelocity(new THREE.Vector3());
    }, 2000);
  };

  // Handle keyboard
  useEffect(() => {
    const unsubscribe = subscribe(
      (state) => state.shake,
      (pressed) => {
        if (pressed) handleShake();
      }
    );
    return unsubscribe;
  }, [subscribe, isShaking]);

  // Animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isShaking) {
      // Apply physics
      velocity.multiplyScalar(0.95);
      angularVelocity.multiplyScalar(0.95);
      
      const currentPos = groupRef.current.position;
      currentPos.add(velocity.clone().multiplyScalar(delta));
      
      // Bounds
      if (Math.abs(currentPos.x) > 2) {
        velocity.x *= -0.7;
        currentPos.x = Math.sign(currentPos.x) * 2;
      }
      if (Math.abs(currentPos.y) > 1.5) {
        velocity.y *= -0.7;
        currentPos.y = Math.sign(currentPos.y) * 1.5;
      }
      if (Math.abs(currentPos.z) > 2) {
        velocity.z *= -0.7;
        currentPos.z = Math.sign(currentPos.z) * 2;
      }
      
      groupRef.current.rotation.x += angularVelocity.x * delta;
      groupRef.current.rotation.y += angularVelocity.y * delta;
      groupRef.current.rotation.z += angularVelocity.z * delta;
    } else {
      // Return to center
      const currentPos = groupRef.current.position;
      currentPos.lerp(new THREE.Vector3(0, 0, 0), delta * 2);
      
      // Gentle float
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Ball */}
      <Sphere
        ref={meshRef}
        args={[1.5, 64, 64]}
        castShadow
        receiveShadow
        onPointerDown={handleShake}
        onPointerEnter={() => document.body.style.cursor = 'pointer'}
        onPointerLeave={() => document.body.style.cursor = 'default'}
      >
        <meshPhysicalMaterial
          color={0x000000}
          metalness={0.1}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={0.9}
        />
      </Sphere>
      
      {/* Window */}
      <mesh position={[0, 0, 1.4]}>
        <circleGeometry args={[0.6, 32]} />
        <meshPhysicalMaterial
          color={0x001122}
          transparent
          opacity={0.8}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Response Text */}
      {response && (
        <Text
          position={[0, 0, 1.45]}
          fontSize={0.12}
          color="#00D9FF"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          textAlign="center"
        >
          {response}
        </Text>
      )}
      
      {/* Loading */}
      {isShaking && (
        <Text
          position={[0, 0, 1.45]}
          fontSize={0.1}
          color="#E94560"
          anchorX="center"
          anchorY="middle"
        >
          ...
        </Text>
      )}
      
      {/* "8" Text */}
      <Text
        position={[0, 0.8, 1.2]}
        fontSize={0.15}
        color="#F5F5F5"
        anchorX="center"
        anchorY="middle"
      >
        8
      </Text>
      
      {/* Glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial
          color="#00D9FF"
          transparent
          opacity={isShaking ? 0.1 : 0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Lighting
function Lights() {
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 0.5 + Math.sin(time * 2) * 0.2;
      const radius = 5;
      pointLightRef.current.position.x = Math.cos(time * 0.5) * radius;
      pointLightRef.current.position.z = Math.sin(time * 0.5) * radius;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} color="#1A1A2E" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        color="#F5F5F5"
        castShadow
      />
      <pointLight
        ref={pointLightRef}
        position={[0, 3, 5]}
        intensity={0.5}
        color="#00D9FF"
        distance={15}
        decay={2}
      />
      <pointLight
        position={[-3, 2, -3]}
        intensity={0.3}
        color="#0F4C75"
        distance={10}
        decay={2}
      />
    </>
  );
}

// UI Overlay
function GameUI() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-black/20 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3">
          <h1 className="text-xl font-bold text-cyan-400">Magic 8-Ball Oracle</h1>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 text-center">
          <p className="text-gray-300 mb-2">Think of a question and click the Magic 8-Ball</p>
          <p className="text-sm text-gray-400">or press SPACE to shake</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden', 
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F4C75 100%)' 
    }}>
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
          
          <Lights />

          <Suspense fallback={null}>
            <MagicBall />
          </Suspense>
        </Canvas>
        
        <GameUI />
      </KeyboardControls>
    </div>
  );
}

export default App;

import { Canvas } from "@react-three/fiber";
import React, { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sphere, Text, useKeyboardControls, KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import "@fontsource/inter";

// Define control keys for the game
const controls = [
  { name: "shake", keys: ["Space", "Enter"] },
  { name: "reset", keys: ["KeyR"] },
];

// Enhanced Magic Ball Component
function MagicBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const windowRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const [subscribe, get] = useKeyboardControls();
  
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [textOpacity, setTextOpacity] = useState(0);
  
  const [velocity, setVelocity] = useState(new THREE.Vector3());
  const [angularVelocity, setAngularVelocity] = useState(new THREE.Vector3());
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Handle shake with enhanced animations
  const handleShake = async () => {
    if (isShaking || isLoading) return;
    
    console.log("🎱 Shaking Magic 8-Ball!");
    
    setIsShaking(true);
    setIsLoading(true);
    setResponse(null);
    setTextOpacity(0);
    
    // Dramatic physics impulse
    const newVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      Math.random() * 6 + 2,
      (Math.random() - 0.5) * 8
    );
    const newAngularVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15
    );
    
    setVelocity(newVelocity);
    setAngularVelocity(newAngularVelocity);
    setShakeIntensity(2);
    
    // Play shake sound
    try {
      const audio = new Audio('/sounds/hit.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (e) {}
    
    // Get AI response after shaking
    setTimeout(async () => {
      try {
        const response = await fetch('/api/magic-8-ball/prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: Date.now() }),
        });
        
        const data = await response.json();
        setResponse(data.prediction);
        
        // Play success sound
        try {
          const audio = new Audio('/sounds/success.mp3');
          audio.volume = 0.4;
          audio.play().catch(e => console.log("Audio play failed:", e));
        } catch (e) {}
        
        // Smooth text fade-in after ball faces user
        setTimeout(() => {
          setTextOpacity(1);
        }, 800);
        
      } catch (error) {
        console.error("Failed to get prediction:", error);
        setResponse("The cosmic forces are unclear... Try again.");
        setTextOpacity(1);
      }
      
      setIsShaking(false);
      setIsLoading(false);
      setShakeIntensity(0);
      
      // Smooth movement reduction
      setTimeout(() => {
        setVelocity(new THREE.Vector3());
        setAngularVelocity(new THREE.Vector3());
      }, 800);
      
    }, 2000); // Balanced shake time
  };

  // Enhanced keyboard controls
  useEffect(() => {
    const unsubscribeShake = subscribe(
      (state) => state.shake,
      (pressed) => {
        if (pressed && !isShaking && !isLoading) {
          console.log("⌨️ Space/Enter pressed - shaking ball!");
          handleShake();
        }
      }
    );

    const unsubscribeReset = subscribe(
      (state) => state.reset,
      (pressed) => {
        if (pressed) {
          console.log("🔄 Reset pressed");
          setIsShaking(false);
          setIsLoading(false);
          setResponse(null);
          setTextOpacity(0);
          setVelocity(new THREE.Vector3());
          setAngularVelocity(new THREE.Vector3());
          setShakeIntensity(0);
        }
      }
    );

    return () => {
      unsubscribeShake();
      unsubscribeReset();
    };
  }, [subscribe, isShaking, isLoading]);

  // Enhanced animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    if (isShaking && shakeIntensity > 0) {
      // Apply dramatic physics with damping
      velocity.multiplyScalar(0.92);
      angularVelocity.multiplyScalar(0.92);
      
      const currentPos = groupRef.current.position;
      currentPos.add(velocity.clone().multiplyScalar(delta));
      
      // Enhanced bounce physics with sound
      if (Math.abs(currentPos.x) > 3) {
        velocity.x *= -0.6;
        currentPos.x = Math.sign(currentPos.x) * 3;
      }
      if (currentPos.y < -1) {
        velocity.y *= -0.7;
        currentPos.y = -1;
        // Add extra shake on bounce
        const extraShake = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.2,
          (Math.random() - 0.5) * 0.3
        );
        currentPos.add(extraShake);
      }
      if (currentPos.y > 3) {
        velocity.y *= -0.8;
        currentPos.y = 3;
      }
      if (Math.abs(currentPos.z) > 3) {
        velocity.z *= -0.6;
        currentPos.z = Math.sign(currentPos.z) * 3;
      }
      
      // Apply rotation with extra spinning
      groupRef.current.rotation.x += angularVelocity.x * delta;
      groupRef.current.rotation.y += angularVelocity.y * delta;
      groupRef.current.rotation.z += angularVelocity.z * delta;
      
      // Add micro-shake for realism
      const microShake = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1 * shakeIntensity,
        (Math.random() - 0.5) * 0.1 * shakeIntensity,
        (Math.random() - 0.5) * 0.1 * shakeIntensity
      );
      groupRef.current.position.add(microShake);
      
      // Reduce shake intensity over time
      setShakeIntensity(prev => Math.max(0, prev - delta * 0.5));
      
    } else {
      // Smooth return to center with gentle floating
      const currentPos = groupRef.current.position;
      const targetPos = new THREE.Vector3(0, 0, 0);
      currentPos.lerp(targetPos, delta * 1.5);
      
      // Face user with prediction or gentle floating when idle
      if (response && !isLoading) {
        // Rotate to face user (window toward camera)
        const targetRotation = new THREE.Euler(0, 0, 0);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x, delta * 2);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.y, delta * 2);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotation.z, delta * 2);
        
        // Gentle breathing motion while showing prediction
        groupRef.current.position.y += Math.sin(time * 1.5) * 0.02;
      } else if (!isLoading) {
        // Gentle floating and rotation when idle
        groupRef.current.position.y += Math.sin(time * 0.8) * 0.03;
        groupRef.current.rotation.y += delta * 0.3;
        
        // Subtle bobbing
        const bobbing = Math.sin(time * 1.2) * 0.02;
        groupRef.current.position.x += bobbing;
      }
    }

    // Dynamic window glow based on state
    if (windowRef.current) {
      const material = windowRef.current.material as THREE.MeshPhysicalMaterial;
      if (isShaking) {
        material.emissive.setHex(0x003366);
        material.emissiveIntensity = 0.3 + Math.sin(time * 20) * 0.2;
      } else if (response) {
        material.emissive.setHex(0x001122);
        material.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
      } else {
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Magic 8-Ball Sphere */}
      <Sphere
        ref={meshRef}
        args={[1.5, 128, 128]}
        castShadow
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          console.log("🖱️ Ball clicked!");
          handleShake();
        }}
        onPointerEnter={() => document.body.style.cursor = 'pointer'}
        onPointerLeave={() => document.body.style.cursor = 'default'}
      >
        <meshPhysicalMaterial
          color={0x000000}
          metalness={0.1}
          roughness={0.02}
          clearcoat={1.0}
          clearcoatRoughness={0.01}
          reflectivity={1.0}
          envMapIntensity={2.5}
          transmission={0}
          thickness={0.1}
          emissive={0x000033}
          emissiveIntensity={0.05}
        />
      </Sphere>
      
      {/* Vision Window */}
      <mesh
        ref={windowRef}
        position={[0, 0, 1.42]}
        rotation={[0, 0, 0]}
      >
        <circleGeometry args={[0.65, 64]} />
        <meshPhysicalMaterial
          color={0x112244}
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.8}
          clearcoat={0.2}
          clearcoatRoughness={0.3}
          emissive={0x001122}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Mystical Response Text with Fade Animation */}
      {response && (
        <Text
          ref={textRef}
          position={[0, 0, 1.48]}
          fontSize={0.12}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.0}
          textAlign="center"
          fillOpacity={textOpacity}
          strokeWidth={0.005}
          strokeColor="#000000"
          fontWeight="bold"
        >
          {response}
        </Text>
      )}
      
      {/* Loading Animation */}
      {isLoading && !response && (
        <Text
          position={[0, 0, 1.48]}
          fontSize={0.08}
          color="#E94560"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.7 + Math.sin(Date.now() * 0.01) * 0.3}
        >
          Consulting the Oracle...
        </Text>
      )}
      
      {/* "8" Number on Ball */}
      <Text
        position={[0, -0.3, 1.35]}
        fontSize={0.25}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        strokeWidth={0.008}
        strokeColor="#000000"
        fontWeight="bold"
      >
        8
      </Text>
      
      {/* Subtle Inner Glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshBasicMaterial
          color="#00D9FF"
          transparent
          opacity={isShaking ? 0.08 : 0.02}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// COMPLETELY REMOVED - NO PARTICLES AT ALL

// Ultra-Clean Minimal Lighting
function Lights() {
  return (
    <>
      {/* Clean ambient light */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Single main directional light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
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
      background: '#16213E'
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
            alpha: false,
            stencil: false,
            depth: true
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#16213E"]} />
          
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

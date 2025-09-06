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
    
    // Get AI response after dramatic shaking
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
          audio.volume = 0.3;
          audio.play().catch(e => console.log("Audio play failed:", e));
        } catch (e) {}
        
        // Fade in text
        setTimeout(() => {
          setTextOpacity(1);
        }, 500);
        
      } catch (error) {
        console.error("Failed to get prediction:", error);
        setResponse("The cosmic forces are unclear... Try again.");
        setTextOpacity(1);
      }
      
      setIsShaking(false);
      setIsLoading(false);
      setShakeIntensity(0);
      
      // Gradually reduce movement
      setTimeout(() => {
        setVelocity(new THREE.Vector3());
        setAngularVelocity(new THREE.Vector3());
      }, 1000);
      
    }, 3000); // Longer shake time for more drama
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
      
      // Gentle floating and rotation when idle
      if (!isLoading) {
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
          metalness={0.2}
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
          reflectivity={0.95}
          envMapIntensity={1.8}
          transmission={0}
          thickness={0.1}
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
          color={0x001133}
          transparent
          opacity={0.9}
          metalness={0.3}
          roughness={0.2}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          emissive={0x000000}
          emissiveIntensity={0}
        />
      </mesh>
      
      {/* Mystical Response Text with Fade Animation */}
      {response && (
        <Text
          ref={textRef}
          position={[0, 0, 1.48]}
          fontSize={0.11}
          color="#00D9FF"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.1}
          textAlign="center"
          fillOpacity={textOpacity}
          strokeWidth={0.002}
          strokeColor="#003366"
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
        position={[0, 0.9, 1.3]}
        fontSize={0.18}
        color="#F5F5F5"
        anchorX="center"
        anchorY="middle"
        strokeWidth={0.005}
        strokeColor="#000000"
      >
        8
      </Text>
      
      {/* Inner Mystical Glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.9, 64, 64]} />
        <meshBasicMaterial
          color="#00D9FF"
          transparent
          opacity={isShaking ? 0.15 : 0.03}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer Energy Aura */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial
          color="#E94560"
          transparent
          opacity={isShaking ? 0.08 : 0.01}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Particle Ring Effect */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.5, 0.1, 8, 32]} />
        <meshBasicMaterial
          color="#0F4C75"
          transparent
          opacity={isShaking ? 0.4 : 0.1}
        />
      </mesh>
    </group>
  );
}

// Mystical Particles Component
function MysticalParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  // Create particle system
  const particles = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    
    const colorPalette = [
      new THREE.Color('#00D9FF'), // Electric cyan
      new THREE.Color('#E94560'), // Mystic red
      new THREE.Color('#0F4C75'), // Ocean blue
      new THREE.Color('#F5F5F5'), // Off-white
      new THREE.Color('#16213E'), // Dark navy
    ];
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in a sphere around the ball
      const radius = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Assign colors
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random sizes
      sizes[i] = Math.random() * 4 + 1;
      
      // Initial velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, colors, sizes, velocities, count };
  }, []);

  // Animate particles
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positionAttribute = meshRef.current.geometry.attributes.position;
    const positions = positionAttribute.array as Float32Array;
    
    for (let i = 0; i < particles.count; i++) {
      const i3 = i * 3;
      
      // Current position
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Orbital motion
      const radius = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x) + time * 0.15;
      
      positions[i3] = radius * Math.cos(angle) + Math.sin(time * 2 + i) * 0.3;
      positions[i3 + 2] = radius * Math.sin(angle) + Math.cos(time * 1.5 + i) * 0.3;
      
      // Floating motion
      positions[i3 + 1] = y + Math.sin(time * 2 + i * 0.1) * 0.4 + Math.cos(time * 3 + i * 0.05) * 0.2;
      
      // Add some random drift
      positions[i3] += particles.velocities[i3];
      positions[i3 + 1] += particles.velocities[i3 + 1];
      positions[i3 + 2] += particles.velocities[i3 + 2];
      
      // Reset particles that drift too far
      const distance = Math.sqrt(x * x + y * y + z * z);
      if (distance > 15) {
        const newRadius = 4 + Math.random() * 2;
        const newTheta = Math.random() * Math.PI * 2;
        const newPhi = Math.random() * Math.PI;
        
        positions[i3] = newRadius * Math.sin(newPhi) * Math.cos(newTheta);
        positions[i3 + 1] = newRadius * Math.sin(newPhi) * Math.sin(newTheta);
        positions[i3 + 2] = newRadius * Math.cos(newPhi);
      }
    }
    
    positionAttribute.needsUpdate = true;
    
    // Rotate entire particle system slowly
    meshRef.current.rotation.y = time * 0.05;
    meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    
    // Pulsing opacity
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(time * 1.5) * 0.2;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={3}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.5}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
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
            <MysticalParticles />
          </Suspense>
        </Canvas>
        
        <GameUI />
      </KeyboardControls>
    </div>
  );
}

export default App;

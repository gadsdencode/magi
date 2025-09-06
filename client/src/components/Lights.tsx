import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMagicBall } from '../lib/stores/useMagicBall';

export default function Lights() {
  const pointLightRef = useRef<THREE.PointLight>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const { isLoading, isShaking } = useMagicBall();

  // Animate lights for mystical effect
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (pointLightRef.current) {
      // Pulsing intensity: when loading, use erratic chaotic formula
      if (isLoading) {
        pointLightRef.current.intensity = 1.5 + Math.sin(time * 5) * 0.4 + Math.sin(time * 7.3) * 0.2;
      } else if (isShaking) {
        // Intense pulsing during shake
        pointLightRef.current.intensity = 1.2 + Math.sin(time * 8) * 0.6;
      } else {
        const baseIntensity = 0.6;
        pointLightRef.current.intensity = baseIntensity + Math.sin(time * 2.0) * 0.2;
      }
      
      // Orbital movement - faster when loading
      const radius = 5;
      const speed = isLoading ? 1.2 : 0.5;
      pointLightRef.current.position.x = Math.cos(time * speed) * radius;
      pointLightRef.current.position.z = Math.sin(time * speed) * radius;
    }
    
    if (spotLightRef.current) {
      // More dramatic swaying when loading or shaking
      const swayIntensity = isLoading ? 3 : isShaking ? 2 : 1;
      const swaySpeed = isLoading ? 0.8 : isShaking ? 0.6 : 0.3;
      spotLightRef.current.position.x = Math.sin(time * swaySpeed) * 2 * swayIntensity;
      
      // Add intensity variation during loading
      if (isLoading) {
        spotLightRef.current.intensity = 1.1 + Math.sin(time * 3.5) * 0.3;
      }
    }
  });

  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.45} color="#ffffff" />
      
      {/* Main directional light */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.15}
        color="#F5F5F5"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Mystical point light */}
      <pointLight
        ref={pointLightRef}
        position={[0, 3, 5]}
        intensity={0.7}
        color="#00D9FF"
        distance={15}
        decay={2}
      />
      
      {/* Dramatic spot light */}
      <spotLight
        ref={spotLightRef}
        position={[0, 8, 0]}
        intensity={1.1}
        color="#E94560"
        angle={Math.PI / 6}
        penumbra={0.5}
        decay={2}
        distance={20}
        castShadow
      />
      
      {/* Rim lighting */}
      <pointLight
        position={[-3, 2, -3]}
        intensity={0.3}
        color="#0F4C75"
        distance={10}
        decay={2}
      />
      
      <pointLight
        position={[3, 2, -3]}
        intensity={0.3}
        color="#0F4C75"
        distance={10}
        decay={2}
      />
      
      {/* Environment reflection */}
      <hemisphereLight args={["#1b2a41", "#0b1626", 0.35]} />
    </>
  );
}

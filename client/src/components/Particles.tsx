import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  isActive: boolean;
}

export default function Particles({ isActive }: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  // Create particle geometry and positions
  const [positions, colors, sizes] = useMemo(() => {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Mystical color palette
    const colorPalette = [
      new THREE.Color('#00D9FF'), // Electric cyan
      new THREE.Color('#E94560'), // Mystic red
      new THREE.Color('#0F4C75'), // Ocean blue
      new THREE.Color('#F5F5F5'), // Off-white
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a sphere around the magic ball
      const radius = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random colors from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random sizes
      sizes[i] = Math.random() * 3 + 1;
    }
    
    return [positions, colors, sizes];
  }, []);

  // Animation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positionAttribute = meshRef.current.geometry.attributes.position;
    const positions = positionAttribute.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Orbital motion around the center
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Calculate rotation
      const radius = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x) + time * 0.2;
      
      positions[i] = radius * Math.cos(angle);
      positions[i + 2] = radius * Math.sin(angle);
      
      // Floating motion
      positions[i + 1] = y + Math.sin(time * 2 + i) * 0.1;
    }
    
    positionAttribute.needsUpdate = true;
    
    // Rotate the entire particle system
    meshRef.current.rotation.y = time * 0.1;
    
    // Pulse effect when active
    if (materialRef.current) {
      materialRef.current.opacity = isActive 
        ? 0.6 + Math.sin(time * 8) * 0.3
        : 0.3 + Math.sin(time * 2) * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={2}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.3}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

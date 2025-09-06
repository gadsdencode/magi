import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMagicBall } from '../lib/stores/useMagicBall';

interface ParticlesProps {
  isActive: boolean;
}

export default function Particles({ isActive }: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const { isLoading, isShaking } = useMagicBall();

  // Soft circular sprite texture (avoids hard-edged squares)
  const circleTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, []);

  // Create particle geometry and positions
  const [positions, colors] = useMemo(() => {
    const particleCount = 90;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color('#00D9FF'),
      new THREE.Color('#E94560'),
      new THREE.Color('#0F4C75'),
      new THREE.Color('#F5F5F5'),
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 2.2; // tighter halo
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  // Animation (intensifies when the oracle is "thinking")
  useFrame((state) => {
    if (!meshRef.current || !isActive) return;

    const time = state.clock.elapsedTime;
    const positionAttribute = meshRef.current.geometry.attributes.position;
    const p = positionAttribute.array as Float32Array;

    for (let i = 0; i < p.length; i += 3) {
      const x = p[i];
      const y = p[i + 1];
      const z = p[i + 2];
      const radius = Math.sqrt(x * x + z * z);
      
      // Create swirling vortex effect when oracle is thinking
      let baseSpeed = 0.06;
      let vortexIntensity = 0;
      
      if (isLoading) {
        baseSpeed = 0.18; // 3x faster
        vortexIntensity = 0.025; // Strong vortex
      } else if (isShaking) {
        baseSpeed = 0.12; // 2x faster
        vortexIntensity = 0.015; // Moderate vortex
      }
      
      const angle = Math.atan2(z, x) + time * baseSpeed;
      
      // Add vortex spiral effect
      if (vortexIntensity > 0) {
        const spiralOffset = Math.sin(time * 2.5 + i * 0.1) * vortexIntensity;
        p[i] = (radius + spiralOffset) * Math.cos(angle);
        p[i + 2] = (radius + spiralOffset) * Math.sin(angle);
      } else {
        p[i] = radius * Math.cos(angle);
        p[i + 2] = radius * Math.sin(angle);
      }
      
      // Enhanced vertical movement for vortex effect
      const bobAmplitude = isLoading ? 0.08 : isShaking ? 0.05 : 0.02;
      const bobSpeed = isLoading ? 1.2 : 0.8;
      p[i + 1] = y + Math.sin(time * bobSpeed + i * 0.1) * bobAmplitude;
    }

    positionAttribute.needsUpdate = true;
    // Enhanced rotation for vortex effect
    const rotationSpeed = isLoading ? 0.15 : isShaking ? 0.08 : 0.03;
    meshRef.current.rotation.y = time * rotationSpeed;
    
    // Add slight tilt during loading for more dynamic vortex
    if (isLoading) {
      meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      meshRef.current.rotation.z = Math.cos(time * 0.3) * 0.05;
    } else {
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
    }

    if (materialRef.current) {
      // Enhanced pulsing and effects based on state
      let pulseSpeed = 1.5;
      let opacityMultiplier = 0.06;
      let sizeMultiplier = 0;
      let colorShift = 0;
      
      if (isLoading) {
        pulseSpeed = 4.0;
        opacityMultiplier = 0.28;
        sizeMultiplier = 0.03;
        colorShift = 0.08;
      } else if (isShaking) {
        pulseSpeed = 2.5;
        opacityMultiplier = 0.15;
        sizeMultiplier = 0.015;
        colorShift = 0.04;
      }
      
      const pulse = 0.5 + 0.5 * Math.sin(time * pulseSpeed);
      materialRef.current.opacity = 0.12 + pulse * opacityMultiplier;
      materialRef.current.size = 0.08 + sizeMultiplier * Math.sin(time * 2.0);
      
      // Dynamic color shifting for mystical effect
      const hue = 0.55 + colorShift * Math.sin(time * 0.7);
      const sat = isLoading ? 1.0 : isShaking ? 0.9 : 0.8;
      const light = isLoading ? 0.75 : isShaking ? 0.65 : 0.55;
      materialRef.current.color.setHSL(hue, sat, light);
    }
  });

  return (
    <points ref={meshRef} visible={isActive}>
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
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.08}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.0}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        map={circleTexture}
        alphaMap={circleTexture}
      />
    </points>
  );
}

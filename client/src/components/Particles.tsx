import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  isActive: boolean;
}

export default function Particles({ isActive }: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

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

  // Animation (very subtle to avoid motion sickness)
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
      const angle = Math.atan2(z, x) + time * 0.06; // slower
      p[i] = radius * Math.cos(angle);
      p[i + 2] = radius * Math.sin(angle);
      p[i + 1] = y + Math.sin(time * 0.8 + i) * 0.02;
    }

    positionAttribute.needsUpdate = true;
    meshRef.current.rotation.y = time * 0.03;

    if (materialRef.current) {
      materialRef.current.opacity = 0.18 + Math.sin(time * 1.5) * 0.06;
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

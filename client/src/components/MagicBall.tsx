import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, Text, useTexture, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { gsap } from 'gsap';

export default function MagicBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  // Window ref removed since window is eliminated
  const textRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const { camera } = useThree();
  const baseYRef = useRef<number>(0);
  const windowGroupRef = useRef<THREE.Group>(null);
  const triangleRef = useRef<THREE.Mesh>(null);
  const triangleTextRef = useRef<any>(null);
  const emergeProgressRef = useRef<number>(0);
  const [emergeProgress, setEmergeProgress] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);
  
  const { 
    isShaking, 
    response, 
    isLoading, 
    startShake, 
    stopShake, 
    fetchResponse,
    resetBall 
  } = useMagicBall();

  // Dynamic text layout based on response length so it fits the window neatly
  const { textFontSize, textMaxWidth, textLetterSpacing, textYOffset } = useMemo(() => {
    const length = (response ?? '').length;
    if (length <= 18) {
      return { textFontSize: 0.14, textMaxWidth: 0.68, textLetterSpacing: 0.01, textYOffset: -0.02 };
    }
    if (length <= 40) {
      return { textFontSize: 0.12, textMaxWidth: 0.7, textLetterSpacing: 0.008, textYOffset: -0.02 };
    }
    if (length <= 70) {
      return { textFontSize: 0.1, textMaxWidth: 0.72, textLetterSpacing: 0.006, textYOffset: -0.018 };
    }
    return { textFontSize: 0.085, textMaxWidth: 0.74, textLetterSpacing: 0.004, textYOffset: -0.016 };
  }, [response]);
  const [subscribe, get] = useKeyboardControls();
  
  const { playHit, playSuccess } = useAudio();
  
  // Ball physics state
  const [velocity, setVelocity] = useState(new THREE.Vector3());
  const [angularVelocity, setAngularVelocity] = useState(new THREE.Vector3());
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // Materials
  const ballMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
    envMapIntensity: 1.8,
    emissive: new THREE.Color('#0b1f3b'),
    emissiveIntensity: 0.15,
  });

  // Window material removed since window is eliminated

  // Handle keyboard controls
  useEffect(() => {
    const unsubscribeShake = subscribe(
      (state) => state.shake,
      (pressed) => {
        if (pressed && !isShaking && !isLoading) {
          handleShake();
        }
      }
    );

    const unsubscribeReset = subscribe(
      (state) => state.reset,
      (pressed) => {
        if (pressed) {
          resetBall();
        }
      }
    );

    return () => {
      unsubscribeShake();
      unsubscribeReset();
    };
  }, [subscribe, isShaking, isLoading]);

  // Handle mouse/touch interactions
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    if (!isShaking && !isLoading) {
      handleShake();
    }
  };

  const handleShake = async () => {
    startShake();
    playHit();
    
    // Add random velocity and angular velocity for shaking effect
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
    setShakeIntensity(1);
    
    // Reset emergence progress for dramatic reveal
    emergeProgressRef.current = 0;
    setEmergeProgress(0);
    setTextOpacity(0);
    
    // Fetch AI response
    setTimeout(async () => {
      await fetchResponse();
      // brief delay as if the die flips
      setTimeout(() => {
        stopShake();
        playSuccess();
        
        // Start dramatic emergence animation
        gsap.to(emergeProgressRef, {
          current: 1,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: function() {
            setEmergeProgress(emergeProgressRef.current);
          }
        });
        
        // Simultaneous text fade-in
        gsap.to({}, {
          duration: 1.5,
          ease: "power2.out",
          onUpdate: function() {
            setTextOpacity(this.progress());
          }
        });
      }, 150);
      
      // Gradually stop the shaking
      setShakeIntensity(0);
      setVelocity(new THREE.Vector3());
      setAngularVelocity(new THREE.Vector3());
    }, 2000);
  };

  // Capture baseline Y after mount
  useEffect(() => {
    if (groupRef.current) {
      baseYRef.current = groupRef.current.position.y;
    }
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Apply physics during shaking
    if (isShaking && shakeIntensity > 0) {
      // Apply damping
      velocity.multiplyScalar(0.95);
      angularVelocity.multiplyScalar(0.95);
      
      // Update position with bounds
      const currentPos = groupRef.current.position;
      currentPos.add(velocity.clone().multiplyScalar(delta));
      
      // Bounce off boundaries
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
      
      // Apply rotation
      groupRef.current.rotation.x += angularVelocity.x * delta;
      groupRef.current.rotation.y += angularVelocity.y * delta;
      groupRef.current.rotation.z += angularVelocity.z * delta;
      
      // Add small random shake
      const shake = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1 * shakeIntensity,
        (Math.random() - 0.5) * 0.1 * shakeIntensity,
        (Math.random() - 0.5) * 0.1 * shakeIntensity
      );
      groupRef.current.position.add(shake);
    } else {
      // Return to center when not shaking
      const currentPos = groupRef.current.position;
      currentPos.lerp(new THREE.Vector3(0, 0, 0), delta * 2);
      
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = baseYRef.current + Math.sin(time * 0.6) * 0.08;
      
      if (response && !isLoading) {
        // When showing a response, face the window to the camera
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 3);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 3);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 3);
      } else {
        // Gentle idle rotation when no response visible
        groupRef.current.rotation.y += delta * 0.2;
      }
    }

    // Make the ball look at camera slightly
    if (!isShaking) {
      const direction = camera.position.clone().sub(groupRef.current.position).normalize();
      const targetRotation = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
      );
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x * 0.1, delta);
    }

    // Water-emergence animation for the window triangle
    if (windowGroupRef.current && triangleRef.current) {
      const p = emergeProgressRef.current;
      // Triangle emerges from inside the ball towards the glass
      const startZ = 1.35; // deeper inside
      const endZ = 1.515;  // just behind glass circle (and just under text)
      triangleRef.current.position.z = THREE.MathUtils.lerp(startZ, endZ, p);
      triangleRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.02 * (1 - p); // tiny drift while deep
      triangleRef.current.scale.setScalar(0.95 + p * 0.08);
      
      // Add subtle rotation during emergence for more dramatic effect
      if (p > 0 && p < 1) {
        triangleRef.current.rotation.y += delta * 0.5 * p;
      }
    }
  });

  // Reset text opacity when response changes
  useEffect(() => {
    if (!response || isLoading) {
      setTextOpacity(0);
    }
  }, [response, isLoading]);

  // Shared Z position for text and background plane
  const textZ = THREE.MathUtils.lerp(1.4, 1.515, emergeProgress);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Magic 8-Ball Sphere */}
      <Sphere
        ref={meshRef}
        args={[1.5, 96, 96]}
        material={ballMaterial}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerEnter={() => document.body.style.cursor = 'pointer'}
        onPointerLeave={() => document.body.style.cursor = 'default'}
      />
      
      {/* Front circular window with glass */}
      <group ref={windowGroupRef} position={[0, 0, 0]}>
        {/* Outer bezel slightly protruding (rendered above the sphere) */}
        <mesh position={[0, 0, 1.505]} renderOrder={10}> 
          <circleGeometry args={[0.62, 64]} />
          <meshPhysicalMaterial color="#0a0a0a" roughness={0.35} metalness={0.2} clearcoat={1} depthWrite={false} depthTest={false} />
        </mesh>
        {/* Subtle glow ring */}
        <mesh position={[0, 0, 1.503]} renderOrder={11}>
          <ringGeometry args={[0.6, 0.7, 96]} />
          <meshBasicMaterial color="#0bb7e5" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
        </mesh>
        {/* Glass disc */}
        <mesh position={[0, 0, 1.5]} renderOrder={12}> 
          <circleGeometry args={[0.6, 64]} />
          <meshPhysicalMaterial
            color="#0a2a3f"
            transparent
            opacity={0.35}
            roughness={0.08}
            metalness={0}
            transmission={0.9}
            thickness={0.5}
            clearcoat={1}
            clearcoatRoughness={0.02}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        {/* Slight caustic-like inner glow */}
        <mesh position={[0, 0, 1.48]} renderOrder={8}>
          <circleGeometry args={[0.52, 64]} />
          <meshBasicMaterial color="#0ab0df" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Submerged triangle plate that carries the response */}
        <mesh ref={triangleRef} position={[0, 0, 1.35]} renderOrder={9}>
          {/* Equilateral triangle using ShapeGeometry */}
          <shapeGeometry args={[(() => { const s = new THREE.Shape(); const r = 0.45; const h = Math.sqrt(3) * r; s.moveTo(0, r); s.lineTo(-h/2, -r/2); s.lineTo(h/2, -r/2); s.closePath(); return s; })()]} />
          <meshStandardMaterial color="#113856" emissive="#072032" emissiveIntensity={0.5} metalness={0.1} roughness={0.9} depthWrite={false} />
        </mesh>
        {/* Text rendered slightly above the triangle */}
        {response && (
          <>
            {/* Background plane for readability */}
            <mesh position={[0, textYOffset, textZ - 0.005]} renderOrder={19}>
              <planeGeometry args={[0.9, 0.6]} />
              <meshStandardMaterial color={"black"} transparent opacity={0.4} depthWrite={false} depthTest={false} />
            </mesh>
            <Text
              ref={triangleTextRef}
              position={[0, textYOffset, textZ]}
              fontSize={textFontSize}
              color="#e8fbff"
              anchorX="center"
              anchorY="middle"
              maxWidth={textMaxWidth}
              textAlign="center"
              letterSpacing={textLetterSpacing}
              lineHeight={1.1}
              fillOpacity={textOpacity}
              outlineWidth={0.004}
              outlineColor="#00121d"
              renderOrder={20}
              material-depthTest={false}
              material-depthWrite={false}
              material-toneMapped={false}
            >
              {response?.toUpperCase()}
            </Text>
          </>
        )}
      </group>
      
      {/* Surface response removed; handled inside the window */}
      
      {/* Loading indicator */}
      {isLoading && (
        <Text
          position={[0, 0, 1.44]}
          fontSize={0.1}
          color="#E94560"
          anchorX="center"
          anchorY="middle"
        >
          ...
        </Text>
      )}
      
      {/* Optionally render the '8' very subtly, above the window */}
      <Text
        position={[0, 0.9, 1.21]}
        fontSize={0.12}
        color="#2b2b2b"
        anchorX="center"
        anchorY="middle"
      >
        8
      </Text>
      
      {/* Mystic glow effect */}
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

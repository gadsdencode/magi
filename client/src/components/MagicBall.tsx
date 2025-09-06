import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, Text, useTexture, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';

export default function MagicBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const windowRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const { camera } = useThree();
  const [subscribe, get] = useKeyboardControls();
  
  const { 
    isShaking, 
    response, 
    isLoading, 
    startShake, 
    stopShake, 
    fetchResponse,
    resetBall 
  } = useMagicBall();
  
  const { playHit, playSuccess } = useAudio();
  
  // Ball physics state
  const [velocity, setVelocity] = useState(new THREE.Vector3());
  const [angularVelocity, setAngularVelocity] = useState(new THREE.Vector3());
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // Materials
  const ballMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x000000,
    metalness: 0.1,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    envMapIntensity: 1.5,
  });

  const windowMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x001122,
    transparent: true,
    opacity: 0.8,
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 0.5,
  });

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
    
    // Fetch AI response
    setTimeout(async () => {
      await fetchResponse();
      stopShake();
      playSuccess();
      
      // Gradually stop the shaking
      setShakeIntensity(0);
      setVelocity(new THREE.Vector3());
      setAngularVelocity(new THREE.Vector3());
    }, 2000);
  };

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
      
      // Gentle floating animation
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      groupRef.current.rotation.y += delta * 0.2;
    }

    // Make the ball look at camera slightly
    if (!isShaking) {
      const direction = camera.position.clone().sub(groupRef.current.position).normalize();
      const targetRotation = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
      );
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.x * 0.1, delta);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Magic 8-Ball Sphere */}
      <Sphere
        ref={meshRef}
        args={[1.5, 64, 64]}
        material={ballMaterial}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerEnter={() => document.body.style.cursor = 'pointer'}
        onPointerLeave={() => document.body.style.cursor = 'default'}
      />
      
      {/* Window for displaying text */}
      <mesh
        ref={windowRef}
        position={[0, 0, 1.4]}
        rotation={[0, 0, 0]}
      >
        <circleGeometry args={[0.6, 32]} />
        <primitive object={windowMaterial} />
      </mesh>
      
      {/* Response Text */}
      {response && !isLoading && (
        <Text
          ref={textRef}
          position={[0, 0, 1.45]}
          fontSize={0.12}
          color="#00D9FF"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
          textAlign="center"
          font="/fonts/inter.json"
        >
          {response}
        </Text>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <Text
          position={[0, 0, 1.45]}
          fontSize={0.1}
          color="#E94560"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.json"
        >
          ...
        </Text>
      )}
      
      {/* Magic 8 text on the ball */}
      <Text
        position={[0, 0.8, 1.2]}
        fontSize={0.15}
        color="#F5F5F5"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter.json"
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

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, Sphere, shaderMaterial, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import ballVertexShader from '@/shaders/ballVertex.glsl';
import ballFragmentShader from '@/shaders/ballFragment.glsl';
import textVertexShader from '@/shaders/textVertex.glsl';
import textFragmentShader from '@/shaders/textFragment.glsl';

// Create a reusable text texture
const createTextTexture = (text: string, fontSize: number, width: number, height: number) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;

  context.font = `bold ${fontSize}px Orbitron`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'white';

  const lines = [];
  let currentLine = '';
  const words = text.toUpperCase().split(' ');

  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > width * 0.9 && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.2;
  const startY = (height - (lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    context.fillText(line.trim(), width / 2, startY + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 8;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
};

// Define the shader material
export const MagicBallMaterial = shaderMaterial(
  {
    uTime: 0,
    uEmergeProgress: 0,
    uShakeIntensity: 0,
    uTextTexture: new THREE.Texture(),
    uTextColor: new THREE.Color('#1e5f99'),
  },
  ballVertexShader,
  ballFragmentShader
);

extend({ MagicBallMaterial });

// Text billboard shader material
export const TextBillboardMaterial = shaderMaterial(
  {
    uTime: 0,
    uEmergeProgress: 0,
    uTextTexture: new THREE.Texture(),
    uTextColor: new THREE.Color('#1e5f99'),
  },
  textVertexShader,
  textFragmentShader
);

extend({ TextBillboardMaterial });

export default function MagicBall() {
  const materialRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const billboardRef = useRef<THREE.Group>(null);
  const textMatRef = useRef<any>(null);

  const { isShaking, response, isLoading, startShake, stopShake, fetchResponse, resetBall } = useMagicBall();
  const { playHit, playSuccess } = useAudio();
  const [subscribe] = useKeyboardControls();

  const textTexture = useMemo(() => {
    if (!response) {
      // Return an empty texture if there's no response
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return new THREE.CanvasTexture(canvas);
    }
    return createTextTexture(response, 50, 1024, 1024);
  }, [response]);

  useEffect(() => {
    const isEditableElementActive = () => {
      const el = (document.activeElement as HTMLElement | null);
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    };

    const unsubscribeShake = subscribe(
      (state) => state.shake,
      (pressed) => {
        if (!pressed) return;
        if (isEditableElementActive()) return;
        if (!isShaking && !isLoading) handleShake();
      }
    );
    const unsubscribeReset = subscribe(
      (state) => state.reset,
      (pressed) => pressed && resetBall()
    );
    return () => {
      unsubscribeShake();
      unsubscribeReset();
    };
  }, [subscribe, isShaking, isLoading]);

  const handleShake = async () => {
    startShake();
    playHit();
    await fetchResponse();
    setTimeout(() => {
      stopShake();
      playSuccess();
    }, 150);
  };

  useFrame((state, delta) => {
    if (!materialRef.current || !groupRef.current) return;

    // Animate uniforms
    materialRef.current.uTime = state.clock.elapsedTime;
    const time = state.clock.elapsedTime;
    
    const targetEmerge = response && !isLoading ? 1 : 0;
    materialRef.current.uEmergeProgress = THREE.MathUtils.lerp(
      materialRef.current.uEmergeProgress,
      targetEmerge,
      delta * 1.5
    );

    const targetShake = isShaking ? 1 : 0;
    materialRef.current.uShakeIntensity = THREE.MathUtils.lerp(
      materialRef.current.uShakeIntensity,
      targetShake,
      delta * 3.0
    );

    // Idle rotation
    if (!isShaking) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.x += delta * 0.05;
    }

    // Keep the billboard at the front-most point of the sphere towards the camera
    if (billboardRef.current) {
      const sphereWorldCenter = new THREE.Vector3();
      groupRef.current.getWorldPosition(sphereWorldCenter);

      const cameraPosition = state.camera.position.clone();
      const directionToCamera = cameraPosition.sub(sphereWorldCenter).normalize();

      const sphereRadius = 1.5;
      const frontPointWorld = sphereWorldCenter.clone().add(directionToCamera.multiplyScalar(sphereRadius + 0.02));

      const frontPointLocal = groupRef.current.worldToLocal(frontPointWorld.clone());
      billboardRef.current.position.copy(frontPointLocal);

      // Update text material uniforms if present
      if (textMatRef.current) {
        textMatRef.current.uTime = time;
        textMatRef.current.uEmergeProgress = materialRef.current.uEmergeProgress;
        textMatRef.current.uTextTexture = textTexture;
        // Choose a darker color for better contrast against the bright specular
        textMatRef.current.uTextColor = new THREE.Color('#0f172a');
      }
    }
  });

  return (
    <group 
      ref={groupRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!isShaking && !isLoading) handleShake();
      }}
      onPointerEnter={() => (document.body.style.cursor = 'pointer')}
      onPointerLeave={() => (document.body.style.cursor = 'default')}
    >
      <Sphere args={[1.5, 128, 128]} castShadow receiveShadow>
        <magicBallMaterial ref={materialRef} uTextTexture={textTexture} />
      </Sphere>

      {response && !isLoading && (
        <Billboard ref={billboardRef}>
          <mesh>
            <planeGeometry args={[1.6, 1.6]} />
            <textBillboardMaterial ref={textMatRef} uTextTexture={textTexture} transparent depthTest={false} depthWrite={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}
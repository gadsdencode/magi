import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ballVertex from "../shaders/ballVertex.glsl";
import ballFragment from "../shaders/ballFragment.glsl";

type ThreeBallProps = {
  isShaking: boolean;
  response?: string | null;
  isAnswerVisible: boolean;
};

function createTextCanvas(text: string, dimension = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = dimension;
  canvas.height = dimension;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Fill with solid black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, dimension, dimension);

  // Text should fill most of the canvas since the window will show a portion
  const padding = dimension * 0.1;
  const maxWidth = dimension - padding * 2;
  let fontSize = Math.floor(dimension * 0.08);
  
  // Configure text style
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Word wrap into lines
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  const measure = (t: string) => ctx.measureText(t).width;

  // Word wrap with proper font
  for (; fontSize >= Math.floor(dimension * 0.04); fontSize -= 2) {
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    lines.length = 0;
    current = "";
    for (const w of words) {
      const test = current ? current + " " + w : w;
      if (measure(test) <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }
    if (current) lines.push(current);
    if (lines.length <= 6) break;
  }

  // CRITICAL: Draw text EXACTLY in the center of the canvas
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  let y = dimension / 2 - totalHeight / 2 + lineHeight / 2;
  
  // Set final font
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  
  // Draw each line at the CENTER of the canvas
  for (const line of lines) {
    ctx.fillText(line, dimension / 2, y);
    y += lineHeight;
  }

  
  return canvas;
}

function useTextTexture(text?: string | null) {
  return useMemo(() => {
    if (!text || !text.trim()) {
      // Return a black texture when no text
      const data = new Uint8Array(4);
      data[0] = 0; // R
      data[1] = 0; // G
      data[2] = 0; // B
      data[3] = 255; // A
      const empty = new THREE.DataTexture(data, 1, 1);
      empty.needsUpdate = true;
      return empty as THREE.Texture;
    }
    const canvas = createTextCanvas(text);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex as THREE.Texture;
  }, [text]);
}

function MagicBallMesh({ isShaking, response, isAnswerVisible }: Omit<ThreeBallProps, "size">) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [emerge, setEmerge] = useState(0);
  const textTexture = useTextTexture(response);

  useEffect(() => {
    let mounted = true;
    let raf = 0;
    const target = isAnswerVisible ? 1 : 0;
    const duration = 800;
    const start = performance.now();
    const startVal = emerge;
    const tick = (t: number) => {
      if (!mounted) return;
      const e = Math.min(1, (t - start) / duration);
      const v = startVal + (target - startVal) * (1 - Math.pow(1 - e, 3));
      setEmerge(v);
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isAnswerVisible, response]);

  // Create uniforms with initial values
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uShakeIntensity: { value: 0 },
    uEmergeProgress: { value: 0 },
    uTextTexture: { value: null },
    uTextColor: { value: new THREE.Color(1, 1, 1) },
  }), []);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uShakeIntensity.value = isShaking ? 1.0 : 0.0;
    materialRef.current.uniforms.uEmergeProgress.value = emerge;
    // CRITICAL: Update texture every frame to ensure it's current
    if (textTexture) {
      materialRef.current.uniforms.uTextTexture.value = textTexture;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[0.5, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ballVertex}
        fragmentShader={ballFragment}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function ThreeBall({ isShaking, response, isAnswerVisible }: ThreeBallProps) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        orthographic={false}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 1.6], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[2, 2, 3]} intensity={0.6} />
        <MagicBallMesh isShaking={isShaking} response={response} isAnswerVisible={isAnswerVisible} />
      </Canvas>
    </div>
  );
}



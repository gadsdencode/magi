// Type declarations for custom JSX intrinsic element used by R3F
import type { ReactThreeFiber } from '@react-three/fiber';
import type * as THREE from 'three';

type MagicBallMaterialProps = ReactThreeFiber.Node<THREE.ShaderMaterial, THREE.ShaderMaterial> & {
  uTime?: number;
  uEmergeProgress?: number;
  uShakeIntensity?: number;
  uTextTexture?: THREE.Texture;
  uTextColor?: THREE.Color | string;
};

type TextBillboardMaterialProps = ReactThreeFiber.Node<THREE.ShaderMaterial, THREE.ShaderMaterial> & {
  uTime?: number;
  uEmergeProgress?: number;
  uTextTexture?: THREE.Texture;
  uTextColor?: THREE.Color | string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      magicBallMaterial: MagicBallMaterialProps;
      textBillboardMaterial: TextBillboardMaterialProps;
    }
  }
}
// Tumultuous Ocean Emergence - Vertex Shader
// Implements physically accurate ocean waves using Gerstner wave equations
// with multiple wave layers for realistic turbulent water surface

uniform float uTime;
uniform float uEmergeProgress; // 0 = fully submerged, 1 = fully emerged

varying vec2 vUv;
varying float vWave;
varying float vTurbulence;
varying float vFoamIntensity;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vDepth;

// Constants for ocean simulation
const float PI = 3.14159265359;
const float GRAVITY = 9.81;

// Simplex 3D Noise for turbulence
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Gerstner Wave function for realistic ocean waves
vec3 gerstnerWave(vec2 coord, vec2 direction, float amplitude, float wavelength, float speed, float steepness) {
  float k = 2.0 * PI / wavelength;
  float c = sqrt(GRAVITY / k);
  vec2 d = normalize(direction);
  float f = k * (dot(d, coord) - c * speed * uTime);
  float a = steepness / k;
  
  vec3 displacement;
  displacement.x = d.x * a * sin(f);
  displacement.y = a * cos(f);
  displacement.z = d.y * a * sin(f);
  
  return displacement * amplitude;
}

// Multi-layered ocean surface with different wave frequencies
vec3 oceanSurface(vec2 coord) {
  vec3 waves = vec3(0.0);
  
  // Large primary swells
  waves += gerstnerWave(coord, vec2(1.0, 0.3), 0.08, 12.0, 1.0, 0.5);
  waves += gerstnerWave(coord, vec2(-0.7, 0.7), 0.06, 8.0, 0.8, 0.4);
  
  // Medium waves
  waves += gerstnerWave(coord, vec2(0.3, 1.0), 0.04, 4.0, 1.2, 0.3);
  waves += gerstnerWave(coord, vec2(-0.5, -0.8), 0.03, 3.0, 1.5, 0.3);
  
  // Small ripples for detail
  waves += gerstnerWave(coord, vec2(0.8, -0.2), 0.02, 1.5, 2.0, 0.2);
  waves += gerstnerWave(coord, vec2(-0.4, 0.9), 0.015, 1.0, 2.5, 0.2);
  
  // Add turbulent noise for chaotic motion
  float turbulence = snoise(vec3(coord * 2.0, uTime * 0.5)) * 0.03;
  turbulence += snoise(vec3(coord * 4.0, uTime * 0.8)) * 0.015;
  turbulence += snoise(vec3(coord * 8.0, uTime * 1.2)) * 0.008;
  
  waves.y += turbulence;
  
  return waves;
}

// Calculate breakthrough deformation where text pushes through water
float breakthroughDeformation(vec2 coord, float emergence) {
  // Create a radial emergence from center
  vec2 center = vec2(0.5, 0.5);
  float radialDist = length(coord - center);
  float breakthroughRadius = emergence * 0.8;
  
  // Smooth breakthrough with surface tension simulation
  float breakthrough = smoothstep(breakthroughRadius, breakthroughRadius - 0.3, radialDist);
  
  // Add circular ripples emanating from center
  float ripples = sin(radialDist * 20.0 - uTime * 3.0) * 0.05;
  ripples *= smoothstep(0.0, 0.5, emergence) * smoothstep(0.5, 0.0, radialDist);
  
  // Add turbulence at the breakthrough boundary
  float boundaryTurbulence = 0.0;
  if (abs(radialDist - breakthroughRadius + 0.15) < 0.2) {
    boundaryTurbulence = snoise(vec3(coord * 10.0, uTime * 2.0)) * 0.1;
    boundaryTurbulence *= (1.0 - smoothstep(0.0, 0.2, abs(radialDist - breakthroughRadius + 0.15)));
  }
  
  return breakthrough * 0.3 + boundaryTurbulence + ripples;
}

void main() {
  vUv = uv;
  
  // Calculate radial coordinates for circular ocean pattern
  vec2 center = vec2(0.5, 0.5);
  vec2 fromCenter = uv - center;
  float radialDist = length(fromCenter);
  float angle = atan(fromCenter.y, fromCenter.x);
  
  // Fade out ocean effects at edges for circular appearance
  float edgeFade = smoothstep(0.5, 0.0, radialDist);
  
  // Use radial coordinates for ocean waves
  vec2 radialCoord = vec2(radialDist * 10.0, angle * 3.0);
  vec3 oceanDisplacement = oceanSurface(radialCoord) * edgeFade;
  
  // Calculate breakthrough effect
  float breakthrough = breakthroughDeformation(uv, uEmergeProgress);
  
  // Combine ocean waves with breakthrough
  float surfaceHeight = oceanDisplacement.y * (1.0 - breakthrough * 0.7);
  
  // Calculate depth relative to water surface
  vDepth = surfaceHeight - breakthrough * 0.2;
  
  // Store wave height for fragment shader
  vWave = surfaceHeight + 0.5;
  
  // Calculate turbulence intensity for foam generation
  float turbulenceIntensity = abs(snoise(vec3(uv * 8.0, uTime)));
  vTurbulence = turbulenceIntensity;
  
  // Foam intensity at wave peaks and breakthrough boundaries
  float wavePeakFoam = smoothstep(0.05, 0.15, surfaceHeight);
  float breakthroughFoam = smoothstep(0.9, 1.0, breakthrough) * 
                           smoothstep(0.0, 0.3, 1.0 - breakthrough);
  vFoamIntensity = max(wavePeakFoam, breakthroughFoam);
  
  // Apply displacement to vertex position
  vec3 pos = position;
  // Apply full ocean displacement for dramatic effect
  pos.y += surfaceHeight * 0.35;  // Significant wave height
  pos.z += (oceanDisplacement.z + breakthrough) * 0.15;  // Forward/back motion
  pos.x += oceanDisplacement.x * 0.1;  // Side-to-side motion
  
  // Calculate normal for lighting
  vec3 tangent = normalize(vec3(1.0, oceanDisplacement.x * 2.0, 0.0));
  vec3 bitangent = normalize(vec3(0.0, oceanDisplacement.z * 2.0, 1.0));
  vNormal = normalize(cross(tangent, bitangent));
  
  // Store world position for fragment shader
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
// client/src/shaders/ballFragment.glsl

// Uniforms
uniform float uTime;
uniform float uEmergeProgress;
uniform sampler2D uTextTexture;
uniform vec3 uTextColor;

// Varyings
varying vec2 vUv;
varying float vNoise;
varying vec3 vViewPosition;
varying vec3 vNormal;

void main() {
    // Base color of the 8-ball
    vec3 baseColor = vec3(0.01, 0.02, 0.05);
    float inkSwirl = smoothstep(0.4, 0.8, vNoise);
    vec3 inkColor = baseColor * 0.5;
    vec3 finalColor = mix(baseColor, inkColor, inkSwirl);
    
    // Fresnel effect
    vec3 viewDirection = normalize(vViewPosition);
    float fresnel = 1.0 - dot(normalize(vNormal), -viewDirection);
    fresnel = pow(fresnel, 2.0);
    finalColor += fresnel * 0.2;
    
    // Text rendering - view-space normal projection (stable, centered)
    float emerge = clamp(uEmergeProgress, 0.0, 1.0);
    if (emerge > 0.01) {
        // Use view-space normal as a centered, camera-facing disc
        vec3 n = normalize(vNormal);
        // Radius in normal space; 0 at center (front), ~1 at edges
        float r = length(n.xy);
        // Define circular window using the normal length
        float windowRadius = 0.62; // smaller -> larger visible window on sphere
        float windowMask = 1.0 - smoothstep(windowRadius, windowRadius + 0.04, r);
        // Fade out if not facing camera to avoid back/edge artifacts
        float front = smoothstep(0.0, 0.25, n.z);
        float windowAlpha = windowMask * front * emerge;

        // Build UV for text from normal.xy mapped to [0,1]
        // Scale controls how much of the texture appears in the window
        float textScale = 0.85; // lower shows more text, higher zooms in
        vec2 local = clamp(n.xy / windowRadius / textScale, -1.0, 1.0);
        vec2 textUv = local * 0.5 + 0.5;

        // Sample text (white on black). Use luminance as alpha
        vec4 textSample = texture2D(uTextTexture, textUv);
        float textAlpha = dot(textSample.rgb, vec3(0.299, 0.587, 0.114));
        textAlpha *= windowAlpha;

        // Inside window: force background to deep black for maximum contrast
        vec3 windowBg = vec3(0.0);
        finalColor = mix(finalColor, windowBg, windowAlpha);

        // Composite text
        vec3 textColor = clamp(uTextColor, 0.0, 1.0);
        finalColor = mix(finalColor, textColor, clamp(textAlpha, 0.0, 1.0));
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}
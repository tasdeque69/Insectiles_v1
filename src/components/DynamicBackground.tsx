import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Vector2 } from 'three';
import { useGameStore } from '../store/gameStore';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
` as const;

const fragmentShader = `
  uniform float time;
  uniform float hue;
  uniform float intensity;
  uniform vec2 resolution;
  varying vec2 vUv;

  // Noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Fractal noise
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractal brownian motion
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }

  void main() {
    vec2 st = vUv;
    
    // Create animated pattern
    vec2 pos = st * 3.0;
    pos.x += time * 0.1;
    pos.y += time * 0.05;
    
    // Create multiple layers of noise
    float n1 = fbm(pos);
    float n2 = fbm(pos * 2.0 + time * 0.1);
    float n3 = fbm(pos * 4.0 - time * 0.05);
    
    // Combine layers
    float pattern = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    
    // Create psychedelic effect
    float wave = sin(st.x * 10.0 + time) * sin(st.y * 10.0 + time * 1.5);
    pattern += wave * 0.1;
    
    // Convert to HSL
    float hue_shift = hue / 360.0 + pattern * 0.1;
    float saturation = 0.3 + pattern * 0.2 * intensity;
    float lightness = 0.05 + pattern * 0.05 * intensity;
    
    // Convert HSL to RGB
    vec3 color = vec3(0.0);
    
    if (saturation > 0.0) {
      float h = hue_shift * 6.0;
      float c = (1.0 - abs(2.0 * lightness - 1.0)) * saturation;
      float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
      float m = lightness - c * 0.5;
      
      if (h < 1.0) {
        color = vec3(c, x, 0.0) + m;
      } else if (h < 2.0) {
        color = vec3(x, c, 0.0) + m;
      } else if (h < 3.0) {
        color = vec3(0.0, c, x) + m;
      } else if (h < 4.0) {
        color = vec3(0.0, x, c) + m;
      } else if (h < 5.0) {
        color = vec3(x, 0.0, c) + m;
      } else {
        color = vec3(c, 0.0, x) + m;
      }
    } else {
      color = vec3(lightness);
    }
    
    // Add some glow effect
    float glow = 1.0 + pattern * 0.2;
    color *= glow;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function DynamicBackground() {
  const materialRef = useRef<ShaderMaterial>(null);
  const { feverMode } = useGameStore();
  const [hue, setHue] = useState(0); // Could connect to engine hue if needed
  
  const intensity = useMemo(() => {
    return feverMode ? 1.5 : 1.0;
  }, [feverMode]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.hue.value = hue;
      materialRef.current.uniforms.intensity.value = intensity;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 },
          hue: { value: hue },
          intensity: { value: intensity },
          resolution: { value: new Vector2(800, 600) }
        }}
      />
    </mesh>
  );
}
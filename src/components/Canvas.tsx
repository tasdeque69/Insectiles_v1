import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { GameEngine } from '../engine/GameEngine';
import { useGameStore } from '../store/gameStore';
import type { Insect, PsyEffect } from '../engine/types';

interface InsectProps {
  insect: Insect;
  position: [number, number, number];
  isFeverMode: boolean;
}

interface PsyEffectProps {
  effect: PsyEffect;
  position?: [number, number, number];
}

function Insect({ insect, position, isFeverMode }: InsectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hue, setHue] = useState(0);

  useFrame((state) => {
    if (meshRef.current) {
      // Rotate insect
      meshRef.current.rotation.z += isFeverMode ? 0.02 : 0.005;
      
      // Pulsing effect in fever mode
      if (isFeverMode) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
        meshRef.current.scale.set(scale, scale, scale);
      }
    }
  });

  // Create geometry based on insect type
  const getGeometry = () => {
    switch (insect.def.type) {
      case 'weed_ant':
        return <boxGeometry args={[1.5, 1.5, 0.5]} />;
      case 'rainbow_ant':
        return <sphereGeometry args={[0.8, 16, 16]} />;
      case 'neon_ant':
        return <coneGeometry args={[0.8, 1.5, 8]} />;
      case 'alien_bug':
        return <octahedronGeometry args={[1, 0]} />;
      case 'fire_ice_ant':
        return <torusGeometry args={[0.7, 0.3, 8, 16]} />;
      default:
        return <boxGeometry args={[1.5, 1.5, 0.5]} />;
    }
  };

  // Get material based on insect type
  const getMaterial = () => {
    const baseHue = (insect.lane * 90 + hue) % 360;
    
    switch (insect.def.type) {
      case 'weed_ant':
        return (
          <meshStandardMaterial
            color={`hsl(${120 + baseHue}, 70%, 40%)`}
            emissive={`hsl(${120 + baseHue}, 70%, 20%)`}
            emissiveIntensity={0.3}
          />
        );
      case 'rainbow_ant':
        return (
          <meshStandardMaterial
            color={`hsl(${(hue * 10) % 360}, 100%, 60%)`}
            emissive={`hsl(${(hue * 10) % 360}, 100%, 40%)`}
            emissiveIntensity={0.5}
          />
        );
      case 'neon_ant':
        return (
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={0.8}
          />
        );
      case 'alien_bug':
        return (
          <meshStandardMaterial
            color={`hsl(${280 + baseHue}, 80%, 50%)`}
            emissive={`hsl(${280 + baseHue}, 80%, 30%)`}
            emissiveIntensity={0.4}
          />
        );
      case 'fire_ice_ant':
        return (
          <meshStandardMaterial
            color={isFeverMode ? "#ff6600" : "#00ccff"}
            emissive={isFeverMode ? "#ff3300" : "#0099ff"}
            emissiveIntensity={0.6}
          />
        );
      default:
        return (
          <meshStandardMaterial
            color={`hsl(${baseHue}, 70%, 50%)`}
            emissive={`hsl(${baseHue}, 70%, 30%)`}
            emissiveIntensity={0.3}
          />
        );
    }
  };

  return (
    <mesh ref={meshRef} position={position}>
      {getGeometry()}
      {getMaterial()}
    </mesh>
  );
}

function PsyEffect({ effect, position }: PsyEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [life, setLife] = useState(0);

  useFrame((state) => {
    if (meshRef.current) {
      setLife(effect.life / effect.maxLife);
      
      // Fade out effect - cast to meshbasicmaterial for opacity access
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - life;
      
      // Scale effect
      const scale = (1 - life) * 5;
      meshRef.current.scale.set(scale, scale, scale);
      
      // Rotate effect
      meshRef.current.rotation.z += 0.05;
    }
  });

  // Get geometry based on effect type
  const getGeometry = () => {
    switch (effect.type) {
      case 'mandala':
        return <ringGeometry args={[0.5, 2, 8]} />;
      case 'buddha':
        return <torusGeometry args={[1.5, 0.3, 8, 16]} />;
      case 'kaleidoscope':
        return <octahedronGeometry args={[1.5, 0]} />;
      case 'profile':
        return <sphereGeometry args={[1, 16, 16]} />;
      default:
        return <ringGeometry args={[0.5, 2, 8]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={position}>
      {getGeometry()}
      <meshBasicMaterial
        color={`hsl(${effect.hue}, 100%, 50%)`}
        transparent
        opacity={1 - life}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GameScene() {
  const { camera } = useThree();
  const [gameEngine] = useState(() => new GameEngine());
  const [insects, setInsects] = useState<Insect[]>([]);
  const [psyEffects, setPsyEffects] = useState<PsyEffect[]>([]);
  const [hue, setHue] = useState(0);
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(0);
  const { feverMode } = useGameStore();

  // Initialize game engine
  useEffect(() => {
    gameEngine.setCanvasSize(400, 800);
    
    // Subscribe to game events
    const unsubscribe = gameEngine.subscribe((event) => {
      switch (event.type) {
        case 'score':
          setHue((prev) => (prev + (event.data?.isSpecial ? 60 : 30)) % 360);
          break;
        case 'feverStart':
          // Add special visual effect for fever start
          break;
        case 'spawn':
          // Could add spawn effect here
          break;
      }
    });

    return unsubscribe;
  }, [gameEngine]);

  // Game loop
  useFrame((state, delta) => {
    gameEngine.update();
    
    // Update state from game engine
    setInsects([...gameEngine.getInsects()]);
    setPsyEffects([...gameEngine.getPsyEffects()]);
    setHue(gameEngine.getHue());
    setShake(gameEngine.getShake());
    setFlash(gameEngine.getFlash());

    // Apply camera shake
    if (shake > 0) {
      camera.position.x = (Math.random() - 0.5) * shake;
      camera.position.y = (Math.random() - 0.5) * shake;
      setShake((prev) => Math.max(0, prev * 0.9));
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
    }

    // Apply flash effect
    if (flash > 0) {
      // Flash could be applied as a fullscreen effect
      setFlash((prev) => Math.max(0, prev - 0.1));
    }
  });

  // Handle taps
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Convert screen coordinates to game coordinates
    const gameX = (x + 1) * 200; // 400 / 2
    const gameY = (y - 1) * -400; // 800 / 2
    
    gameEngine.handleTap(gameX, gameY);
  };

  return (
    <>
      {/* Background */}
      <mesh>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color={`hsl(${hue}, 50%, 5%)`} />
      </mesh>

      {/* Lane dividers */}
      {[1, 2, 3].map((lane) => (
        <mesh key={lane} position={[lane * 100 - 200, 0, 0.01]}>
          <planeGeometry args={[2, 800]} />
          <meshBasicMaterial color="cyan" opacity={0.3} transparent />
        </mesh>
      ))}

      {/* Insects */}
      {insects.map((insect) => (
        <Insect
          key={insect.id}
          insect={insect}
          position={[
            insect.lane * 100 - 150,
            (insect.y - 400) / 100,
            0
          ]}
          isFeverMode={feverMode}
        />
      ))}

      {/* Psychedelic effects */}
      {psyEffects.map((effect) => (
        <PsyEffect
          key={`${effect.x}-${effect.y}-${effect.life}`}
          effect={effect}
          position={[
            (effect.x - 200) / 100,
            (effect.y - 400) / 100,
            0
          ]}
        />
      ))}

      {/* Flash effect */}
      {flash > 0 && (
        <mesh>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="white" transparent opacity={flash * 0.3} />
        </mesh>
      )}

      {/* Event handlers */}
      <group onPointerDown={handlePointerDown} />
    </>
  );
}

export default function GameCanvas() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ background: '#000' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, 10]} intensity={0.5} color="cyan" />
        
        <GameScene />
        
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.9}
          />
          <ChromaticAberration
            offset={new THREE.Vector2(0.002, 0.002)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette
            offset={0.3}
            darkness={0.6}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
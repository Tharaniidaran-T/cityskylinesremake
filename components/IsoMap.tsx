/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MapControls, Environment, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType, TileData, CityStats } from '../types';
import { GRID_SIZE, BUILDINGS, BUILDING_TIERS } from '../constants';

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Constants & Helpers ---
const gridToWorld = (x: number, y: number, gridLength: number = GRID_SIZE) => {
  const worldOffset = gridLength / 2 - 0.5;
  return [x - worldOffset, 0, y - worldOffset] as [number, number, number];
};

// Deterministic random based on coordinates
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

// --- 1. Advanced Procedural Buildings ---

// FIX: Wrap component in React.memo to ensure TypeScript recognizes it as a component that accepts a 'key' prop.
const WindowBlock = React.memo(({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshLambertMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.2} />
  </mesh>
));

const SmokeStack = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.01 + i * 0.005;
        cloud.scale.addScalar(0.005);
        
        const material = cloud.material as THREE.MeshLambertMaterial;
        if (material) {
          material.opacity -= 0.005;
          if (cloud.position.y > 1.5) {
            cloud.position.y = 0;
            cloud.scale.setScalar(0.1 + Math.random() * 0.1);
            material.opacity = 0.6;
          }
        }
      });
    }
  });

  return (
    <group position={position}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.5, 0]} scale={[0.2, 1, 0.2]}>
        <meshLambertMaterial color="#4b5563" />
      </mesh>
      <group ref={ref} position={[0, 1, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[Math.random()*0.1, i*0.4, Math.random()*0.1]} scale={0.2}>
            <meshLambertMaterial color="#d1d5db" transparent opacity={0.6} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const WindTurbineBlades = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z += 0.12;
    }
  });
  return (
    <group ref={ref} position={[0, 0.72, 0.12]}>
      <mesh geometry={boxGeo} scale={[0.05, 0.65, 0.02]}>
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      <mesh geometry={boxGeo} scale={[0.65, 0.05, 0.02]}>
        <meshLambertMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

interface BuildingMeshProps {
  type: BuildingType;
  level?: number;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
}

const ProceduralBuilding = React.memo(({ type, level = 1, baseColor, x, y, opacity = 1, transparent = false }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); // 0-99
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  // Color variation matching specific level tier
  const calculatedColor = useMemo(() => {
    const activeColor = BUILDING_TIERS[type]?.[level]?.color || baseColor;
    const c = new THREE.Color(activeColor);
    // Shift hue and lightness slightly based on hash for organic feel
    c.offsetHSL(hash * 0.06 - 0.03, 0, hash * 0.1 - 0.05);
    return c;
  }, [baseColor, hash, type, level]);

  const mainMat = useMemo(() => new THREE.MeshLambertMaterial({ color: calculatedColor, flatShading: true, opacity, transparent }), [calculatedColor, opacity, transparent]);
  const accentMat = useMemo(() => new THREE.MeshLambertMaterial({ color: new THREE.Color(calculatedColor).multiplyScalar(0.7), flatShading: true, opacity, transparent }), [calculatedColor, opacity, transparent]);
  const roofMat = useMemo(() => new THREE.MeshLambertMaterial({ color: new THREE.Color(calculatedColor).multiplyScalar(0.5).offsetHSL(0,0,-0.1), flatShading: true, opacity, transparent }), [calculatedColor, opacity, transparent]);

  const commonProps = { castShadow: true, receiveShadow: true };

  // Buildings sit on top of ground tile (approx -0.3)
  const yOffset = -0.3;

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            if (level === 1) {
              // Cozy Cottage (Level 1)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.7, 0.6, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 0.75, 0]} scale={[0.6, 0.4, 0.6]} rotation={[0, Math.PI/4, 0]} />
                  <WindowBlock position={[0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} />
                  <WindowBlock position={[-0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0.32]} scale={[0.15, 0.2, 0.05]} />
                </>
              );
            } else if (level === 2) {
              // Modern Townhouse (Level 2)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.65, 1.0, 0.65]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1.05, 0]} scale={[0.7, 0.1, 0.7]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.2, 0.3, 0.33]} scale={[0.2, 0.3, 0.1]} />
                  <WindowBlock position={[-0.15, 0.7, 0.33]} scale={[0.2, 0.2, 0.02]} />
                  <WindowBlock position={[0.15, 0.7, 0.33]} scale={[0.2, 0.2, 0.02]} />
                </>
              );
            } else if (level === 3) {
              // Apartment Block (Level 3)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.15, 0.6, 0]} scale={[0.5, 1.2, 0.7]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.2, 0.5, 0.15]} scale={[0.4, 1.0, 0.5]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.025, 1.15, 0.075]} scale={[0.9, 0.1, 0.8]} />
                  {[0.3, 0.6, 0.9].map((h, i) => (
                    <WindowBlock key={i} position={[-0.15, h, 0.36]} scale={[0.2, 0.15, 0.02]} />
                  ))}
                  {[0.3, 0.7].map((h, i) => (
                    <WindowBlock key={i+3} position={[0.2, h, 0.41]} scale={[0.15, 0.15, 0.02]} />
                  ))}
                </>
              );
            } else {
              // Luxury Skyscraper (Level 4)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.75, 0]} scale={[0.8, 1.5, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 1.85, 0]} scale={[0.6, 1.2, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 2.7, 0]} scale={[0.4, 0.6, 0.4]} />
                  {/* Antenna */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ffffff' })} geometry={cylinderGeo} position={[0, 3.2, 0]} scale={[0.03, 0.6, 0.03]} />
                  <mesh position={[0, 3.5, 0]} geometry={sphereGeo} scale={0.08}>
                    <meshBasicMaterial color="#d8b4fe" />
                  </mesh>
                  {[0.3, 0.6, 0.9, 1.2, 1.6, 1.9, 2.2].map((yHeight, i) => (
                    <group key={i}>
                      <WindowBlock position={[0, yHeight, 0]} scale={[0.82, 0.08, 0.82]} />
                    </group>
                  ))}
                </>
              );
            }

          case BuildingType.Commercial:
            if (level === 1) {
              // Corner Store (Level 1)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <WindowBlock position={[0, 0.3, 0.41]} scale={[0.7, 0.35, 0.05]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: hash > 0.5 ? '#ef4444' : '#3b82f6' })} geometry={boxGeo} position={[0, 0.55, 0.5]} scale={[0.9, 0.1, 0.2]} rotation={[Math.PI/6, 0, 0]} />
                </>
              );
            } else if (level === 2) {
              // Retail Plaza (Level 2)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.95, 0.8, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.3, 0.45, 0.46]} scale={[0.2, 0.5, 0.05]} />
                  <WindowBlock position={[-0.2, 0.3, 0.46]} scale={[0.4, 0.4, 0.05]} />
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0.45, 0.4, 0.46]} scale={[0.06, 0.8, 0.06]} />
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[-0.45, 0.4, 0.46]} scale={[0.06, 0.8, 0.06]} />
                </>
              );
            } else if (level === 3) {
              // Finance Tower (Level 3)
              const height = 2.2;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.75, height, 0.75]} />
                  {Array.from({ length: 7 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.3, 0]} scale={[0.77, 0.12, 0.77]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={coneGeo} position={[0, height + 0.2, 0]} scale={[0.5, 0.4, 0.5]} rotation={[0, Math.PI/4, 0]} />
                </>
              );
            } else {
              // Mega SkyMall (Level 4 - Twin Spire connected by a Skybridge!)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.25, 1.25, 0]} scale={[0.45, 2.5, 0.65]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.25, 1.25, 0]} scale={[0.45, 2.5, 0.65]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 1.8, 0]} scale={[0.6, 0.2, 0.35]} />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <group key={i}>
                      <WindowBlock position={[-0.25, 0.25 + i * 0.28, 0]} scale={[0.47, 0.1, 0.67]} />
                      <WindowBlock position={[0.25, 0.25 + i * 0.28, 0]} scale={[0.47, 0.1, 0.67]} />
                    </group>
                  ))}
                  <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[-0.25, 2.6, 0]} scale={0.15} />
                  <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[0.25, 2.6, 0]} scale={0.15} />
                </>
              );
            }

          case BuildingType.Hotel:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.85, 0.7, 0.85]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.75, 0]} scale={[0.9, 0.1, 0.9]} />
                  <WindowBlock position={[0, 0.35, 0.43]} scale={[0.6, 0.25, 0.05]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.85, 1.0, 0.85]} />
                  <mesh {...commonProps} material={accentMat} geometry={coneGeo} position={[0, 1.15, 0]} scale={[0.6, 0.4, 0.6]} />
                  <WindowBlock position={[0, 0.3, 0.43]} scale={[0.6, 0.15, 0.05]} />
                  <WindowBlock position={[0, 0.7, 0.43]} scale={[0.6, 0.15, 0.05]} />
                </>
              );
            } else if (level === 3) {
              const height = 1.9;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.8, height, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.95, 0.3]} scale={[0.5, 0.12, 0.3]} />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.25 + i * 0.32, 0]} scale={[0.82, 0.09, 0.82]} />
                  ))}
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, height + 0.25, 0]} scale={[0.7, 0.5, 0.7]} />
                </>
              );
            } else {
              return (
                <>
                  {/* Sky resort core */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1.3, 0]} scale={[0.7, 2.6, 0.7]} />
                  {/* Outer glowing frame */}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 1.3, 0]} scale={[0.76, 2.5, 0.48]} />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.25 + i * 0.28, 0]} scale={[0.72, 0.08, 0.72]} />
                  ))}
                  {/* Helipad on top */}
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0, 2.65, 0]} scale={[0.55, 0.08, 0.55]} />
                  <mesh position={[0, 2.7, 0]} geometry={boxGeo} scale={[0.3, 0.02, 0.06]}>
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0, 2.7, 0]} geometry={boxGeo} scale={[0.06, 0.02, 0.3]}>
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </>
              );
            }

          case BuildingType.Supermarket:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.62, 0]} scale={[0.95, 0.06, 0.95]} />
                  <WindowBlock position={[0, 0.3, 0.46]} scale={[0.75, 0.28, 0.05]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.95, 0.8, 0.95]} />
                  {/* Curved awning roof */}
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0, 0.8, 0]} scale={[0.97, 0.1, 0.97]} rotation={[0, 0, Math.PI/2]} />
                  <WindowBlock position={[0, 0.35, 0.48]} scale={[0.8, 0.35, 0.05]} />
                </>
              );
            } else if (level === 3) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.9, 1.2, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.3, 0.65, 0.46]} scale={[0.22, 1.0, 0.05]} />
                  <WindowBlock position={[-0.22, 0.5, 0.46]} scale={[0.35, 0.8, 0.05]} />
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 1.3, 0]} scale={[0.7, 0.35, 0.7]} />
                </>
              );
            } else {
              return (
                <>
                  {/* Modern wholesale cube */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.9, 0]} scale={[0.95, 1.8, 0.95]} />
                  {/* Double glass dome on top */}
                  <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[-0.22, 1.85, 0]} scale={0.25} />
                  <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[0.22, 1.85, 0]} scale={0.25} />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.25 + i * 0.28, 0]} scale={[0.97, 0.1, 0.97]} />
                  ))}
                </>
              );
            }

          case BuildingType.Cinema:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.85, 0.7, 0.8]} />
                  {/* Neon screen marquee */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#f43f5e', emissive: '#f43f5e', emissiveIntensity: 0.5 })} geometry={boxGeo} position={[0, 0.55, 0.41]} scale={[0.6, 0.2, 0.05]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[-0.2, 0.42, 0.46]} scale={[0.4, 0.5, 0.05]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.2, 0.42, 0.46]} scale={[0.4, 0.5, 0.05]} />
                </>
              );
            } else if (level === 3) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.85, 1.2, 0.85]} />
                  {/* Floating billboard projection */}
                  <Float speed={3} floatIntensity={0.1}>
                    <mesh position={[0, 1.35, 0]} geometry={boxGeo} scale={[0.65, 0.3, 0.65]}>
                      <meshLambertMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
                    </mesh>
                  </Float>
                </>
              );
            } else {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1.1, 0]} scale={[0.8, 2.2, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 2.25, 0]} scale={[0.5, 0.15, 0.5]} />
                  {/* Hollywood searchlight beam */}
                  <Float speed={6} floatIntensity={0.25}>
                    <mesh position={[0, 2.7, 0]} geometry={coneGeo} scale={[0.15, 0.7, 0.15]}>
                      <meshLambertMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} transparent opacity={0.7} />
                    </mesh>
                  </Float>
                </>
              );
            }

          case BuildingType.ShoppingMall:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.95, 0.6, 0.9]} />
                  <WindowBlock position={[0, 0.3, 0.46]} scale={[0.8, 0.25, 0.05]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.95, 0.9, 0.95]} />
                  {/* Central cylindrical glass skylight */}
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0, 0.92, 0]} scale={[0.5, 0.1, 0.5]} />
                </>
              );
            } else if (level === 3) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.7, 0]} scale={[0.9, 1.4, 0.9]} />
                  {/* Glass atrium roof */}
                  <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[0, 1.4, 0]} scale={[0.45, 0.3, 0.45]} />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.25 + i * 0.32, 0]} scale={[0.92, 0.09, 0.92]} />
                  ))}
                </>
              );
            } else {
              return (
                <>
                  {/* Massive hyper-structure Mall */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 1.1, -0.2]} scale={[0.5, 2.2, 0.5]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.2, 1.1, 0.2]} scale={[0.5, 2.2, 0.5]} />
                  {/* Sky-bridge glass atrium linking towers */}
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1.5, 0]} scale={[0.7, 0.4, 0.4]} />
                  {/* Tower antennas */}
                  <mesh {...commonProps} material={accentMat} geometry={coneGeo} position={[-0.2, 2.35, -0.2]} scale={[0.08, 0.4, 0.08]} />
                  <mesh {...commonProps} material={accentMat} geometry={coneGeo} position={[0.2, 2.35, 0.2]} scale={[0.08, 0.4, 0.08]} />
                </>
              );
            }

          case BuildingType.Industrial:
            if (level === 1) {
              // Craft Workshop (Level 1)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.85, 0.6, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.65, 0]} scale={[0.9, 0.1, 0.85]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.25, 0.2, 0.41]} scale={[0.25, 0.4, 0.05]} />
                </>
              );
            } else if (level === 2) {
              // Heavy Factory (Level 2)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.22, 0.9, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.22, 0.9, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <SmokeStack position={[0.28, 0.4, 0.28]} />
                </>
              );
            } else if (level === 3) {
              // Chemical Refinery (Level 3)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.4, -0.1]} scale={[0.5, 0.8, 0.7]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.5, -0.2]} scale={[0.25, 1.0, 0.25]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.35, 0.25]} scale={[0.28, 0.7, 0.28]} />
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[-0.25, 0.5, 0.25]} scale={[0.15, 1.0, 0.15]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#facc15' })} geometry={boxGeo} position={[0, 0.7, 0]} scale={[0.5, 0.08, 0.08]} />
                  <SmokeStack position={[-0.25, 1.0, 0.25]} />
                </>
              );
            } else {
              // Quantum Gigafactory (Level 4)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.9, 1.0, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 1.05, 0]} scale={[0.4, 0.2, 0.4]} />
                  <Float speed={5} rotationIntensity={0.5} floatIntensity={0.2} floatingRange={[-0.05, 0.05]}>
                    <mesh position={[0, 1.45, 0]} geometry={sphereGeo} scale={0.22}>
                      <meshLambertMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
                    </mesh>
                  </Float>
                  <SmokeStack position={[-0.32, 0.9, -0.32]} />
                  <SmokeStack position={[0.32, 0.9, 0.32]} />
                </>
              );
            }

          case BuildingType.LogisticsHub:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.85]} />
                  {/* Loading dock squares */}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[-0.25, 0.15, 0.43]} scale={[0.18, 0.22, 0.03]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.25, 0.15, 0.43]} scale={[0.18, 0.22, 0.03]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.9]} />
                  {/* Triple vertical storage silos on the back */}
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.3, 0.5, -0.3]} scale={[0.12, 1.0, 0.12]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.5, -0.3]} scale={[0.12, 1.0, 0.12]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.3, 0.5, -0.3]} scale={[0.12, 1.0, 0.12]} />
                </>
              );
            } else if (level === 3) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.5, 0]} scale={[0.5, 1.0, 0.85]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.3, 0.35, 0]} scale={[0.4, 0.7, 0.85]} />
                  {/* Elevated industrial conveyor bridge */}
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.05, 0.65, 0]} scale={[0.2, 0.15, 0.35]} />
                </>
              );
            } else {
              return (
                <>
                  {/* Global cargo compound with crane */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.7, 0]} scale={[0.95, 1.4, 0.9]} />
                  {/* Helipad/Drone landing on roof */}
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0, 1.42, 0]} scale={[0.5, 0.05, 0.5]} />
                  {/* Loading crane arm */}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.32, 1.2, 0.32]} scale={[0.1, 0.8, 0.1]} />
                  <mesh position={[0.18, 1.55, 0.32]} geometry={boxGeo} scale={[0.35, 0.08, 0.08]}>
                    <meshLambertMaterial color="#facc15" />
                  </mesh>
                </>
              );
            }

          case BuildingType.ChemicalPlant:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.85, 0.6, 0.85]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.25, 0.5, 0.25]} scale={[0.1, 1.0, 0.1]} />
                  <SmokeStack position={[-0.25, 1.0, 0.25]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.15, 0.35, -0.1]} scale={[0.6, 0.7, 0.7]} />
                  {/* Spherical gas tanks on right */}
                  <mesh {...commonProps} material={accentMat} geometry={sphereGeo} position={[0.24, 0.25, 0.24]} scale={0.25} />
                  <mesh {...commonProps} material={accentMat} geometry={sphereGeo} position={[0.24, 0.25, -0.24]} scale={0.25} />
                </>
              );
            } else if (level === 3) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.15, 0.35, 0]} scale={[0.5, 0.7, 0.8]} />
                  {/* Big concrete catalytic cooling towers */}
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.25, 0.5, -0.22]} scale={[0.22, 1.0, 0.22]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.25, 0.5, 0.22]} scale={[0.22, 1.0, 0.22]} />
                  <SmokeStack position={[-0.25, 1.0, -0.22]} />
                  <SmokeStack position={[-0.25, 1.0, 0.22]} />
                </>
              );
            } else {
              return (
                <>
                  {/* Molecular high-density reactor tower */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.9, 0]} scale={[0.9, 1.8, 0.9]} />
                  {/* Cooling ventilation cylinders surrounding core */}
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.32, 0.6, 0.32]} scale={[0.15, 1.2, 0.15]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.32, 0.6, -0.32]} scale={[0.15, 1.2, 0.15]} />
                  {/* Reactor core with plasma globe */}
                  <Float speed={8} floatIntensity={0.25}>
                    <mesh position={[0, 1.95, 0]} geometry={sphereGeo} scale={0.28}>
                      <meshLambertMaterial color="#f87171" emissive="#f87171" emissiveIntensity={1.2} />
                    </mesh>
                  </Float>
                </>
              );
            }

          case BuildingType.TechFactory:
            if (level === 1) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.9]} />
                  {/* Glowing microchip accent on central roof */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#2dd4bf', emissive: '#2dd4bf', emissiveIntensity: 0.7 })} geometry={boxGeo} position={[0, 0.61, 0]} scale={[0.25, 0.05, 0.25]} />
                </>
              );
            } else if (level === 2) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.95, 0.9, 0.95]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.25, 0.2, 0.49]} scale={[0.22, 0.35, 0.02]} />
                  {/* Horizontal cleanroom light strip */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#2dd4bf', emissive: '#2dd4bf' })} geometry={boxGeo} position={[0, 0.65, 0.48]} scale={[0.7, 0.06, 0.03]} />
                </>
              );
            } else if (level === 3) {
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.65, 0]} scale={[0.9, 1.3, 0.9]} />
                  {/* Blue light bands wrapping the tower */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#0d9488', emissive: '#2dd4bf' })} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.92, 0.08, 0.92]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#0d9488', emissive: '#2dd4bf' })} geometry={boxGeo} position={[0, 0.85, 0]} scale={[0.92, 0.08, 0.92]} />
                </>
              );
            } else {
              return (
                <>
                  {/* Quantum core collider lithography machine */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1.0, 0]} scale={[0.85, 2.0, 0.85]} />
                  {/* Magnetic stabilizer rings */}
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.5, 0]} scale={[0.92, 0.12, 0.92]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 1.5, 0]} scale={[0.92, 0.12, 0.92]} />
                  {/* Particle beam core floating at the apex */}
                  <Float speed={12} floatIntensity={0.3} rotationIntensity={1.0}>
                    <mesh position={[0, 2.2, 0]} geometry={coneGeo} scale={[0.2, 0.3, 0.2]} rotation={[Math.PI, 0, 0]}>
                      <meshLambertMaterial color="#2dd4bf" emissive="#0d9488" emissiveIntensity={1.5} />
                    </mesh>
                  </Float>
                </>
              );
            }

          case BuildingType.Park:
            if (level === 1) {
              // Tree Plot (Level 1)
              return (
                <group position={[0, -yOffset - 0.29, 0]}>
                  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshLambertMaterial color="#86efac" />
                  </mesh>
                  <group position={[0, 0, 0]} scale={0.8}>
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#166534', flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                  </group>
                </group>
              );
            } else if (level === 2) {
              // Garden Park (Level 2)
              return (
                <group position={[0, -yOffset - 0.29, 0]}>
                  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshLambertMaterial color="#4ade80" />
                  </mesh>
                  <group position={[0, 0.05, 0]}>
                    <mesh material={new THREE.MeshLambertMaterial({ color: '#cbd5e1' })} geometry={cylinderGeo} scale={[0.3, 0.08, 0.3]} castShadow />
                    <mesh material={new THREE.MeshLambertMaterial({ color: '#3b82f6' })} geometry={cylinderGeo} position={[0, 0.05, 0]} scale={[0.22, 0.04, 0.22]} />
                  </group>
                  <group position={[-0.25, 0, -0.2]} scale={0.75}>
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#115e59', flatShading: true })} geometry={sphereGeo} position={[0, 0.4, 0]} scale={[0.3, 0.3, 0.3]} />
                  </group>
                  <group position={[0.25, 0, 0.2]} scale={0.88}>
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#166534', flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                  </group>
                </group>
              );
            } else if (level === 3) {
              // Botanical Sanctuary (Level 3)
              return (
                <group position={[0, -yOffset - 0.29, 0]}>
                  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshLambertMaterial color="#22c55e" />
                  </mesh>
                  <mesh position={[0, 0.25, 0]} geometry={sphereGeo} scale={[0.38, 0.28, 0.38]} castShadow>
                    <meshLambertMaterial color="#93c5fd" transparent opacity={0.5} />
                  </mesh>
                  <mesh position={[0, 0.02, 0]} geometry={cylinderGeo} scale={[0.4, 0.04, 0.4]}>
                    <meshLambertMaterial color="#cbd5e1" />
                  </mesh>
                  <group position={[0.25, 0, -0.22]} scale={0.7}>
                    <mesh castShadow material={new THREE.MeshLambertMaterial({ color: '#ec4899', flatShading: true })} geometry={sphereGeo} position={[0, 0.2, 0]} scale={[0.2, 0.2, 0.2]} />
                  </group>
                  <group position={[-0.25, 0, 0.22]} scale={0.85}>
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                    <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#15803d', flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.32, 0.5, 0.32]} />
                  </group>
                </group>
              );
            } else {
              // Grand Central Park (Level 4)
              return (
                <group position={[0, -yOffset - 0.29, 0]}>
                  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.92, 0.92]} />
                    <meshLambertMaterial color="#047857" />
                  </mesh>
                  <mesh position={[0, 0.02, 0]} geometry={boxGeo} scale={[0.8, 0.03, 0.8]}>
                    <meshLambertMaterial color="#e2e8f0" />
                  </mesh>
                  <mesh position={[0, 0.25, 0]} geometry={cylinderGeo} scale={[0.1, 0.5, 0.1]} castShadow>
                    <meshLambertMaterial color="#fcd34d" />
                  </mesh>
                  <mesh position={[0, 0.55, 0]} geometry={sphereGeo} scale={0.1} castShadow>
                    <meshLambertMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} />
                  </mesh>
                  {[[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]].map((pos, idx) => (
                    <group key={idx} position={[pos[0], 0, pos[1]]} scale={0.5}>
                      <mesh castShadow receiveShadow material={new THREE.MeshLambertMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.25, 0.1]} />
                      <mesh castShadow material={new THREE.MeshLambertMaterial({ color: idx % 2 === 0 ? '#15803d' : '#0369a1', flatShading: true })} geometry={sphereGeo} position={[0, 0.32, 0]} scale={[0.25, 0.32, 0.25]} />
                    </group>
                  ))}
                </group>
              );
            }
          case BuildingType.Office:
            if (level === 1) {
              // Startup Incubator (Level 1)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.8, 0.7, 0.75]} />
                  <WindowBlock position={[0, 0.3, 0.38]} scale={[0.6, 0.3, 0.02]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.72, 0]} scale={[0.4, 0.05, 0.6]} />
                </>
              );
            } else if (level === 2) {
              // Corporate Office (Level 2)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.85, 1.2, 0.85]} />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.25 + i * 0.35, 0]} scale={[0.87, 0.1, 0.87]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 1.22, 0]} scale={[0.4, 0.04, 0.4]} />
                </>
              );
            } else if (level === 3) {
              // Tech Headquarters (Level 3 - Futuristic Helix Style)
              const height = 2.0;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, height/2, 0]} scale={[0.7, height, 0.7]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, height/2, 0]} scale={[0.55, height + 0.02, 0.55]} />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.3, 0]} scale={[0.72, 0.08, 0.72]} />
                  ))}
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, height + 0.25, 0]} scale={[0.3, 0.5, 0.3]} />
                </>
              );
            } else {
              // Quantum Megastructure (Level 4 - Twin blocks with floating quantum core)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.26, 1.3, 0]} scale={[0.38, 2.6, 0.7]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.26, 1.3, 0]} scale={[0.38, 2.6, 0.7]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 2.1, 0]} scale={[0.9, 0.15, 0.5]} />
                  {Array.from({ length: 7 }).map((_, i) => (
                    <group key={i}>
                      <WindowBlock position={[-0.26, 0.3 + i * 0.3, 0]} scale={[0.4, 0.1, 0.72]} />
                      <WindowBlock position={[0.26, 0.3 + i * 0.3, 0]} scale={[0.4, 0.1, 0.72]} />
                    </group>
                  ))}
                  <Float speed={8} rotationIntensity={1} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
                    <mesh position={[0, 1.2, 0]} geometry={sphereGeo} scale={0.2}>
                      <meshLambertMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={1.2} />
                    </mesh>
                  </Float>
                </>
              );
            }

          case BuildingType.Utility:
            if (level === 1) {
              // Wind Turbine (Level 1 - Spin animated!)
              return (
                <>
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.4, 0]} scale={[0.08, 0.8, 0.08]} />
                  <WindTurbineBlades />
                </>
              );
            } else if (level === 2) {
              // Water Pumping Tower (Level 2)
              return (
                <>
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.4, 0]} scale={[0.12, 0.8, 0.12]} />
                  <mesh {...commonProps} material={mainMat} geometry={sphereGeo} position={[0, 0.8, 0]} scale={0.35} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#3b82f6' })} geometry={boxGeo} position={[0.15, 0.3, 0]} scale={[0.1, 0.4, 0.1]} />
                </>
              );
            } else if (level === 3) {
              // Solar Collector Array (Level 3 - angled panels)
              return (
                <>
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.08, 0.3, 0.08]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.9, 0.05, 0.7]} rotation={[Math.PI / 6, 0, 0]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ffffff' })} geometry={boxGeo} position={[0, 0.36, 0]} scale={[0.82, 0.06, 0.02]} rotation={[Math.PI / 6, 0, 0]} />
                </>
              );
            } else {
              // Clean Nuclear Reactor (Level 4 - Cooling Tower style with glowing fusion core)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0.65, 0]} scale={[0.7, 1.3, 0.7]} />
                  {/* Glowing core indicator rings */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#22d3ee', emissive: '#22d3ee', emissiveIntensity: 1.0 })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.73, 0.08, 0.73]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#22d3ee', emissive: '#22d3ee', emissiveIntensity: 1.0 })} geometry={cylinderGeo} position={[0, 1.15, 0]} scale={[0.55, 0.08, 0.55]} />
                  <SmokeStack position={[0, 1.3, 0]} />
                </>
              );
            }

          case BuildingType.CoalPlant:
            return (
              <>
                {/* Boiler House */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, -0.15]} scale={[0.8, 0.7, 0.6]} />
                {/* Coal Deposition Yard */}
                <mesh {...commonProps} material={accentMat} geometry={coneGeo} position={[0.25, 0.15, 0.25]} scale={[0.3, 0.3, 0.3]} />
                <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[-0.2, 0.1, 0.25]} scale={[0.22, 0.2, 0.22]} />
                {/* Tall bricks smokestack */}
                <SmokeStack position={[-0.2, 0.7, -0.2]} />
                <SmokeStack position={[0.2, 0.7, -0.2]} />
              </>
            );

          case BuildingType.OilPlant:
            return (
              <>
                {/* Oil Storage Tanks */}
                <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.25, 0.3, -0.2]} scale={[0.35, 0.6, 0.35]} />
                <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.35, 0.2]} scale={[0.38, 0.7, 0.38]} />
                {/* Fractioning column */}
                <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[-0.1, 0.5, 0.2]} scale={[0.18, 1.0, 0.18]} />
                {/* Piping conduit */}
                <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.1, 0]} scale={[0.7, 0.1, 0.1]} />
                <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.5, 0.08, 0.08]} />
                <SmokeStack position={[-0.1, 1.0, 0.2]} />
              </>
            );

          case BuildingType.WindTurbine:
            return (
              <>
                {/* Sleek white support tower */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#f8fafc' })} geometry={cylinderGeo} position={[0, 0.45, 0]} scale={[0.08, 0.9, 0.08]} />
                {/* Blades rotator */}
                <WindTurbineBlades />
                {/* Safety beacon warning light */}
                <mesh position={[0, 0.9, 0.08]} geometry={sphereGeo} scale={0.045}>
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
              </>
            );

          case BuildingType.SolarPlant:
            return (
              <group position={[0, 0, 0]}>
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.05, 0]} scale={[0.9, 0.1, 0.9]} />
                {/* Array of blue angled solar frames */}
                <group rotation={[Math.PI / 8, 0, 0]}>
                  {[-0.28, 0, 0.28].map((xOffset, i) => (
                    <group key={i} position={[xOffset, 0.2, 0]}>
                      <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#1e3a8a' })} geometry={boxGeo} scale={[0.22, 0.04, 0.55]} />
                      <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#e2e8f0' })} geometry={boxGeo} position={[0, 0.01, 0]} scale={[0.20, 0.05, 0.02]} />
                    </group>
                  ))}
                </group>
              </group>
            );

          case BuildingType.HydroDam:
            return (
              <>
                {/* Massive sloping concrete block */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.95, 0.7, 0.4]} rotation={[Math.PI / 16, 0, 0]} />
                {/* Water Spillways (flowing cascades) */}
                {[-0.25, 0, 0.25].map((xPos, i) => (
                  <mesh key={i} {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#3b82f6', flatShading: true })} geometry={boxGeo} position={[xPos, 0.3, 0.21]} scale={[0.12, 0.6, 0.08]} />
                ))}
                {/* Concrete structural deck */}
                <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.7, 0]} scale={[1.0, 0.1, 0.3]} />
              </>
            );

          case BuildingType.NuclearPlant:
            return (
              <>
                {/* Twin broad cooling towers with flared design */}
                <group position={[-0.22, 0.4, 0]} scale={0.8}>
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0, 0]} scale={[0.45, 0.9, 0.45]} />
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0, 0.45, 0]} scale={[0.35, 0.1, 0.35]} />
                  <SmokeStack position={[0, 0.45, 0]} />
                </group>
                <group position={[0.22, 0.4, 0]} scale={0.8}>
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0, 0]} scale={[0.45, 0.9, 0.45]} />
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0, 0.45, 0]} scale={[0.35, 0.1, 0.35]} />
                  <SmokeStack position={[0, 0.45, 0]} />
                </group>
                {/* Auxiliary containment dome */}
                <mesh {...commonProps} material={accentMat} geometry={sphereGeo} position={[0, 0.2, -0.22]} scale={0.25} />
              </>
            );

          case BuildingType.WaterPump:
            return (
              <>
                {/* Mechanical pumping building */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.25, -0.15]} scale={[0.8, 0.5, 0.5]} />
                {/* Suction pipes going down */}
                {[-0.25, 0.25].map((xOffset, i) => (
                  <mesh key={i} {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#cbd5e1' })} geometry={cylinderGeo} position={[xOffset, 0.1, 0.2]} scale={[0.08, 0.4, 0.08]} />
                ))}
                {/* Blue pressure reservoir tanks */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#2563eb' })} geometry={cylinderGeo} position={[0, 0.6, -0.1]} scale={[0.24, 0.35, 0.24]} />
              </>
            );

          case BuildingType.SewageTreatment:
            return (
              <group position={[0, -0.15, 0]}>
                {/* Flat service slab */}
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.05, 0]} scale={[0.9, 0.1, 0.9]} />
                {/* Circular clarifier pool */}
                <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[-0.22, 0.12, -0.2]} scale={[0.38, 0.08, 0.38]} />
                {/* Activated Sewage treated block (brownish turning into green/blue) */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#14b8a6' })} geometry={cylinderGeo} position={[-0.22, 0.16, -0.2]} scale={[0.35, 0.05, 0.35]} />
                {/* Aeration pool */}
                <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0.22, 0.12, 0.2]} scale={[0.38, 0.08, 0.38]} />
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#0d9488' })} geometry={cylinderGeo} position={[0.22, 0.16, 0.2]} scale={[0.35, 0.05, 0.35]} />
                {/* Filtration pipes bridging */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#cbd5e1' })} geometry={boxGeo} position={[0, 0.15, 0]} scale={[0.5, 0.05, 0.05]} />
              </group>
            );

          case BuildingType.HeatingSystem:
            return (
              <>
                {/* Thermal plant facility */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, -0.1]} scale={[0.85, 0.7, 0.65]} />
                {/* Slanted warehouse roof */}
                <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.72, -0.1]} scale={[0.88, 0.08, 0.68]} rotation={[Math.PI / 18, 0, 0]} />
                {/* Bright red hot-water heating boiler drum */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#dc2626' })} geometry={cylinderGeo} position={[0.28, 0.32, 0.25]} scale={[0.18, 0.65, 0.18]} />
                {/* Dynamic heat exchange steam pipe */}
                <SmokeStack position={[-0.28, 0.7, 0.25]} />
              </>
            );

          case BuildingType.PowerPlant:
            return (
              <>
                {/* Heavy mechanical housing / generator blocks */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.8, 0.6, 0.8]} />
                {/* Tall bricks cooling / stack unit */}
                <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[-0.22, 0.45, -0.22]} scale={[0.28, 0.9, 0.28]} />
                {/* Red energy warnings */}
                <mesh position={[0.22, 0.5, 0.22]} geometry={sphereGeo} scale={0.085}>
                  <meshBasicMaterial color="#ec4899" />
                </mesh>
                {/* Direct steam puff stack */}
                <SmokeStack position={[-0.22, 0.9, -0.22]} />
              </>
            );

          case BuildingType.PoliceStation:
            return (
              <>
                {/* Sleek Blue Precinct building */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.38, 0]} scale={[0.8, 0.75, 0.65]} />
                {/* Accent column entries */}
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.2, 0.25]} scale={[0.3, 0.4, 0.3]} />
                {/* Security antenna radio mast */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#cbd5e1' })} geometry={cylinderGeo} position={[-0.25, 0.85, -0.2]} scale={[0.04, 0.8, 0.04]} />
                {/* Safety beacon warning flashing blue light */}
                <mesh position={[0, 0.8, 0.25]} geometry={sphereGeo} scale={0.06}>
                  <meshBasicMaterial color="#3b82f6" />
                </mesh>
              </>
            );

          case BuildingType.FireStation:
            return (
              <>
                {/* Bright Crimson Red Engine Garage */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, -0.05]} scale={[0.85, 0.7, 0.65]} />
                {/* Large yellow garage safety doors */}
                {[-0.22, 0.22].map((xOff, i) => (
                  <mesh key={i} {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#facc15' })} geometry={boxGeo} position={[xOff, 0.22, 0.26]} scale={[0.22, 0.38, 0.02]} />
                ))}
                {/* High hose-drying tower */}
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.3, 0.55, -0.2]} scale={[0.22, 1.1, 0.22]} />
                {/* Flashing red light on hose tower */}
                <mesh position={[0.3, 1.1, -0.2]} geometry={sphereGeo} scale={0.062}>
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
              </>
            );

          case BuildingType.Hospital:
            return (
              <>
                {/* Double tower white modern medical hospital block */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.15, 0.52, 0]} scale={[0.48, 1.05, 0.72]} />
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.22, 0.42, 0.1]} scale={[0.42, 0.84, 0.52]} />
                {/* Red cross medical shield sign */}
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ef4444' })} geometry={boxGeo} position={[0.22, 0.42, 0.37]} scale={[0.24, 0.08, 0.02]} />
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ef4444' })} geometry={boxGeo} position={[0.22, 0.42, 0.37]} scale={[0.08, 0.24, 0.02]} />
                {/* Hangar Helipad on the roof of high tower */}
                <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.15, 1.055, 0]} scale={[0.32, 0.02, 0.32]} />
              </>
            );

          case BuildingType.School:
            return (
              <>
                {/* Classic bricks yellow and terracotta school structure */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.85, 0.7, 0.8]} />
                {/* Sloping warm roof */}
                <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 0.84, 0]} scale={[0.82, 0.38, 0.75]} rotation={[0, Math.PI / 4, 0]} />
                {/* Municipal flag mast and banner */}
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[-0.26, 0.84, -0.26]} scale={[0.2, 0.48, 0.2]} />
                <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ffffff' })} geometry={sphereGeo} position={[-0.26, 1.08, -0.26]} scale={0.06}>
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </>
            );

          case BuildingType.Service:
            if (level === 1) {
              // Elementary Clinic (Level 1)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.85, 0.7, 0.8]} />
                  {/* Red Cross sign */}
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ef4444' })} geometry={boxGeo} position={[0, 0.35, 0.41]} scale={[0.1, 0.3, 0.02]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ef4444' })} geometry={boxGeo} position={[0, 0.35, 0.41]} scale={[0.3, 0.1, 0.02]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.72, 0]} scale={[0.9, 0.05, 0.85]} />
                </>
              );
            } else if (level === 2) {
              // Police Fire Precinct (Level 2)
              return (
                <>
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#3b82f6' })} geometry={boxGeo} position={[-0.2, 0.4, 0]} scale={[0.45, 0.8, 0.8]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ef4444' })} geometry={boxGeo} position={[0.2, 0.4, 0]} scale={[0.45, 0.8, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.82, 0]} scale={[0.9, 0.05, 0.85]} />
                  {/* Siren light */}
                  <Float speed={12} floatIntensity={0.2}>
                    <mesh position={[0, 0.95, 0]} geometry={sphereGeo} scale={0.12}>
                      <meshLambertMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.5} />
                    </mesh>
                  </Float>
                </>
              );
            } else if (level === 3) {
              // City High Hospital (Level 3 - High Rise & Heli-pad)
              const height = 1.6;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.85, height, 0.85]} />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.35, 0]} scale={[0.87, 0.12, 0.87]} />
                  ))}
                  {/* Helipad wing */}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.3, height + 0.1, 0]} scale={[0.4, 0.1, 0.4]} />
                  <mesh {...commonProps} material={new THREE.MeshLambertMaterial({ color: '#ffffff' })} geometry={cylinderGeo} position={[0.3, height + 0.16, 0]} scale={[0.3, 0.02, 0.3]} />
                </>
              );
            } else {
              // Grand Academic Campus (Level 4)
              return (
                <>
                  {/* Dome section */}
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0.4, 0]} scale={[0.8, 0.8, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={sphereGeo} position={[0, 0.8, 0]} scale={[0.4, 0.35, 0.4]} />
                  {/* Adjacent pillars or obelisks */}
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[-0.35, 0.4, 0.35]} scale={[0.1, 0.8, 0.1]} />
                  <mesh {...commonProps} material={roofMat} geometry={cylinderGeo} position={[0.35, 0.4, -0.35]} scale={[0.1, 0.8, 0.1]} />
                  {/* Spire */}
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 1.25, 0]} scale={[0.12, 0.5, 0.12]} />
                </>
              );
            }

          case BuildingType.Road:
             return null;
          default:
            return null;
        }
      })()}
    </group>
  );
});

// --- 2. Dynamic Systems (Traffic, Citizens, Environment) ---

const carColors = ['#ef4444', '#3b82f6', '#eab308', '#ffffff', '#1f2937', '#f97316'];

const TrafficSystem = ({ grid }: { grid: Grid }) => {
  const roadTiles = useMemo(() => {
    const roads: {x: number, y: number}[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road) roads.push({x: tile.x, y: tile.y});
    }));
    return roads;
  }, [grid]);

  const carCount = Math.min(roadTiles.length, 12);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0)); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(0), []);

  useEffect(() => {
    if (roadTiles.length < 2) return;
    carsState.current = new Float32Array(carCount * 6);
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const startNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      carsState.current[i*6 + 0] = startNode.x;
      carsState.current[i*6 + 1] = startNode.y;
      carsState.current[i*6 + 2] = startNode.x;
      carsState.current[i*6 + 3] = startNode.y;
      carsState.current[i*6 + 4] = 1; // force pick new target
      carsState.current[i*6 + 5] = getRandomRange(0.01, 0.03); // speed

      const color = new THREE.Color(carColors[Math.floor(Math.random() * carColors.length)]);
      newColors[i*3] = color.r; newColors[i*3+1] = color.g; newColors[i*3+2] = color.b;
    }

    if (carsRef.current) {
        carsRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
    }
  }, [roadTiles, carCount]);

  useFrame(() => {
    if (!carsRef.current || roadTiles.length < 2 || carsState.current.length === 0) return;

    for (let i = 0; i < carCount; i++) {
      const idx = i * 6;
      let curX = carsState.current[idx];
      let curY = carsState.current[idx+1];
      let tarX = carsState.current[idx+2];
      let tarY = carsState.current[idx+3];
      let progress = carsState.current[idx+4];
      const speed = carsState.current[idx+5];

      progress += speed;

      if (progress >= 1) {
        curX = tarX;
        curY = tarY;
        progress = 0;
        
        // Direct coordinate-based neighbor lookup in O(1) instead of flat array scan
        const neighbors: { x: number; y: number }[] = [];
        const possibleDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const cxNorm = Math.round(curX);
        const cyNorm = Math.round(curY);
        for (const [dx, dy] of possibleDirs) {
          const nx = cxNorm + dx;
          const ny = cyNorm + dy;
          if (grid[ny] && grid[ny][nx] && grid[ny][nx].buildingType === BuildingType.Road) {
            neighbors.push({ x: nx, y: ny });
          }
        }

        if (neighbors.length > 0) {
            // Simple pathfinding: avoid going back immediately
            const prevX = carsState.current[idx];
            const prevY = carsState.current[idx+1];
            const valid = neighbors.length > 1 
                ? neighbors.filter(n => Math.abs(n.x - prevX) > 0.1 || Math.abs(n.y - prevY) > 0.1)
                : neighbors;
            
            const next = valid.length > 0 
                ? valid[Math.floor(Math.random() * valid.length)]
                : neighbors[0];
            
            tarX = next.x;
            tarY = next.y;
        } else {
            const rnd = roadTiles[Math.floor(Math.random() * roadTiles.length)];
            curX = rnd.x; curY = rnd.y; tarX = rnd.x; tarY = rnd.y;
        }
      }

      carsState.current[idx] = curX;
      carsState.current[idx+1] = curY;
      carsState.current[idx+2] = tarX;
      carsState.current[idx+3] = tarY;
      carsState.current[idx+4] = progress;

      // Interpolate position
      const gx = MathUtils.lerp(curX, tarX, progress);
      const gy = MathUtils.lerp(curY, tarY, progress);

      // Determine driving side offset
      const dx = tarX - curX;
      const dy = tarY - curY;
      const angle = Math.atan2(dy, dx);
      
      // Offset to right side relative to movement
      const offsetAmt = 0.15;
      // Normals: (-dy, dx)
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const offX = (-dy/len) * offsetAmt;
      const offY = (dx/len) * offsetAmt;

      const [wx, _, wz] = gridToWorld(gx + offX, gy + offY);

      // Road surface is approx -0.3. Car height 0.15.
      dummy.position.set(wx, -0.3 + 0.075, wz);
      dummy.rotation.set(0, -angle, 0);
      // Car dimensions (Length(X), Height(Y), Width(Z) assuming 0 rotation aligns with X)
      dummy.scale.set(0.5, 0.15, 0.3); 
      
      dummy.updateMatrix();
      carsRef.current.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
  });

  if (roadTiles.length < 2) return null;

  return (
    <instancedMesh ref={carsRef} args={[boxGeo, undefined, carCount]} castShadow>
      <meshLambertMaterial />
    </instancedMesh>
  );
};

const clothesColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];

const PopulationSystem = ({ population, grid }: { population: number, grid: Grid }) => {
    const agentCount = Math.min(Math.floor(population / 3), 45); 
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Find tiles where people can walk (Roads, Parks, empty ground)
    const walkableTiles = useMemo(() => {
        const tiles: {x: number, y: number}[] = [];
        grid.forEach(row => row.forEach(tile => {
          if (tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Park || tile.buildingType === BuildingType.None) {
            tiles.push({x: tile.x, y: tile.y});
          }
        }));
        return tiles;
    }, [grid]);
    
    const agentsState = useRef<Float32Array>(new Float32Array(0));
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    useEffect(() => {
        if (agentCount === 0 || walkableTiles.length === 0) return;
        agentsState.current = new Float32Array(agentCount * 6);
        const newColors = new Float32Array(agentCount * 3);

        for(let i=0; i<agentCount; i++) {
            const t = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            // Spawn with random offset in tile
            const x = t.x + getRandomRange(-0.4, 0.4);
            const y = t.y + getRandomRange(-0.4, 0.4);

            agentsState.current[i*6+0] = x;
            agentsState.current[i*6+1] = y;
            
            // Initial target
            const tt = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            agentsState.current[i*6+2] = tt.x + getRandomRange(-0.4, 0.4);
            agentsState.current[i*6+3] = tt.y + getRandomRange(-0.4, 0.4);
            
            agentsState.current[i*6+4] = getRandomRange(0.005, 0.015); // speed
            agentsState.current[i*6+5] = Math.random() * Math.PI * 2; // anim

            const c = new THREE.Color(clothesColors[Math.floor(Math.random() * clothesColors.length)]);
            newColors[i*3] = c.r; newColors[i*3+1] = c.g; newColors[i*3+2] = c.b;
        }

        if (meshRef.current) {
            meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
        }
    }, [agentCount, walkableTiles]);

    useFrame((state) => {
        if (!meshRef.current || agentCount === 0 || agentsState.current.length === 0) return;
        const time = state.clock.elapsedTime;

        for(let i=0; i<agentCount; i++) {
            const idx = i*6;
            let x = agentsState.current[idx];
            let y = agentsState.current[idx+1];
            let tx = agentsState.current[idx+2];
            let ty = agentsState.current[idx+3];
            const speed = agentsState.current[idx+4];
            const animOffset = agentsState.current[idx+5];

            const dx = tx - x;
            const dy = ty - y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 0.1) {
                // Pick new random target from walkable
                if (walkableTiles.length > 0) {
                    const tt = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
                    tx = tt.x + getRandomRange(-0.4, 0.4);
                    ty = tt.y + getRandomRange(-0.4, 0.4);
                    agentsState.current[idx+2] = tx;
                    agentsState.current[idx+3] = ty;
                }
            } else {
                x += (dx/dist) * speed;
                y += (dy/dist) * speed;
                agentsState.current[idx] = x;
                agentsState.current[idx+1] = y;
            }

            const [wx, _, wz] = gridToWorld(x, y);

            // Walking bounce
            const bounce = Math.abs(Math.sin(time * 10 + animOffset)) * 0.03;

            // Person dimensions
            const height = 0.2;
            const width = 0.08;
            // Ground level approx -0.3 to -0.4
            const groundY = -0.35; 

            dummy.position.set(wx, groundY + height/2 + bounce, wz);
            dummy.rotation.set(0, -Math.atan2(dy, dx), 0);
            dummy.scale.set(width, height, width);
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (agentCount === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[boxGeo, undefined, agentCount]} castShadow>
            <meshLambertMaterial />
        </instancedMesh>
    )
};

// Clouds & Birds
const Cloud = ({ position, scale, speed }: { position: [number, number, number], scale: number, speed: number }) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (group.current) {
            group.current.position.x += speed * delta;
            if (group.current.position.x > GRID_SIZE * 1.5) group.current.position.x = -GRID_SIZE * 1.5;
        }
    });

    const bubbles = useMemo(() => Array.from({length: 5 + Math.random() * 5}).map(() => ({
        pos: [getRandomRange(-1,1), getRandomRange(-0.5, 0.5), getRandomRange(-1,1)] as [number, number, number],
        scale: getRandomRange(0.5, 1.2)
    })), []);

    return (
        <group ref={group} position={position} scale={scale}>
            {bubbles.map((b, i) => (
                <mesh key={i} geometry={sphereGeo} position={b.pos} scale={b.scale} castShadow>
                    <meshLambertMaterial color="white" flatShading opacity={0.9} transparent />
                </mesh>
            ))}
        </group>
    )
}

const Bird = ({ position, speed, offset }: { position: [number, number, number], speed: number, offset: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(ref.current) {
            const time = state.clock.elapsedTime + offset;
            ref.current.position.x = position[0] + Math.sin(time * speed) * GRID_SIZE;
            ref.current.position.z = position[1] + Math.cos(time * speed) * GRID_SIZE/2;
            ref.current.rotation.y = -time * speed + Math.PI;
            ref.current.scale.y = 1 + Math.sin(time * 15) * 0.3;
        }
    });

    return (
        <group ref={ref} position={[position[0], position[2], position[1]]}>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[0.1,0,0]} rotation={[0, Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[-0.1,0,0]} rotation={[0, -Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
        </group>
    )
}

const EnvironmentEffects = () => {
    return (
        <group raycast={() => null}>
             {/* Clouds */}
            <Cloud position={[-12, 8, 4]} scale={1.5} speed={0.3} />
            <Cloud position={[5, 9, -8]} scale={1.2} speed={0.5} />
            <Cloud position={[15, 7, 10]} scale={1.8} speed={0.2} />
            
            {/* Birds */}
            <group position={[0, 0, 0]} scale={0.8}>
                <Bird position={[0, 0, 10]} speed={0.6} offset={0} />
                <Bird position={[0, 0, 10]} speed={0.6} offset={1.2} />
                <Bird position={[0, 0, 10]} speed={0.6} offset={2.5} />
            </group>

            {/* Water */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
                <planeGeometry args={[GRID_SIZE * 4, GRID_SIZE * 4]} />
                <meshLambertMaterial color="#3b82f6" opacity={0.8} transparent />
            </mesh>
        </group>
    )
};


// --- 3. Main Map Component ---

const RoadMarkings = React.memo(({ x, y, grid, yOffset }: { x: number; y: number; grid: Grid; yOffset: number }) => {
  const lineMaterial = useMemo(() => new THREE.MeshLambertMaterial({ color: '#fbbf24' }), []);
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(0.1, 0.5), []);

  const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
  const hasDown = y < grid.length - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
  const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
  const hasRight = x < grid[0].length - 1 && grid[y][x + 1].buildingType === BuildingType.Road;

  const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;
  
  // Isolated road piece: draw a default line
  if (connections === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]} geometry={lineGeo} material={lineMaterial} />
    );
  }

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]}>
      {/* Center point for junctions to fill the gap, lifted slightly to avoid z-fighting */}
      {(hasUp || hasDown) && (hasLeft || hasRight) && (
        <mesh position={[0, 0, 0.005]} material={lineMaterial}>
           <planeGeometry args={[0.12, 0.12]} />
        </mesh>
      )}

      {hasUp && <mesh position={[0, 0.25, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasDown && <mesh position={[0, -0.25, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasLeft && <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      {hasRight && <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
    </group>
  );
});

interface GroundTileProps {
    type: BuildingType;
    x: number;
    y: number;
    grid: Grid;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onClick: (x: number, y: number) => void;
    unlocked?: boolean;
    districtId?: string;
}

const DISTRICT_PASTEL_COLORS = [
  '#cbd5e1', // default grey
  '#fca5a5', // soft red
  '#93c5fd', // soft blue
  '#86efac', // soft green
  '#fef08a', // soft yellow
  '#d8b4fe', // soft purple
  '#fdba74', // soft orange
  '#99f6e4', // soft teal
];

const getDistrictColor = (id?: string) => {
  if (!id) return null;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DISTRICT_PASTEL_COLORS[Math.abs(hash) % (DISTRICT_PASTEL_COLORS.length - 1) + 1];
};

// Ground Tile: Handles pointer events and forms base terrain
const GroundTile = React.memo(({ type, x, y, grid, onHover, onLeave, onClick, unlocked = true, districtId }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y, grid.length);
  
  let color = '#10b981';
  let topY = -0.3; 
  let thickness = 0.5;

  const distColor = getDistrictColor(districtId);
  
  if (!unlocked) {
    color = '#1e293b'; // Locked slate ground color
    topY = -0.42; // slightly set-down tile
  } else if (type === BuildingType.None) {
    const noise = getHash(x, y);
    if (distColor) {
      color = distColor;
    } else {
      color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
    }
    topY = -0.3 - noise * 0.1; // Slight height variation for grass
  } else if (type === BuildingType.Road) {
    color = '#374151';
    topY = -0.29; // slightly higher
  } else {
    color = distColor || '#d1d5db'; // concrete base colored by district if existing
    topY = -0.28;
  }

  const centerY = topY - thickness/2;

  return (
    <group position={[wx, centerY, wz]}>
      <mesh 
          receiveShadow castShadow
          onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
          onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
          onPointerDown={(e) => {
              e.stopPropagation();
              if (e.button === 0) onClick(x, y);
          }}
      >
        <boxGeometry args={[1, thickness, 1]} />
        <meshLambertMaterial color={color} flatShading />
        {type === BuildingType.Road && <RoadMarkings x={x} y={y} grid={grid} yOffset={thickness / 2 + 0.001} />}
      </mesh>
      
      {!unlocked && (
        <mesh position={[0, thickness/2 + 0.02, 0]} raycast={() => null}>
          <boxGeometry args={[0.95, 0.03, 0.95]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
        </mesh>
      )}

      {districtId && distColor && (
        <mesh position={[0, thickness/2 + 0.01, 0]} rotation={[-Math.PI/2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[0.92, 0.92]} />
          <meshBasicMaterial color={distColor} transparent opacity={0.2} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
});

// Selection/Hover Cursor
const Cursor = ({ x, y, color, gridLength }: { x: number, y: number, color: string, gridLength: number }) => {
  const [wx, _, wz] = gridToWorld(x, y, gridLength);
  return (
    <mesh position={[wx, -0.25, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
      <Outlines thickness={0.05} color="white" />
    </mesh>
  );
};


interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  population: number;
  stats: CityStats;
}

const IsoMap: React.FC<IsoMapProps> = ({ grid, onTileClick, hoveredTool, population, stats }) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);

  const handleHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Preview Logic
  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewColor = showPreview ? BUILDINGS[hoveredTool].color : 'white';
  const isBulldoze = hoveredTool === BuildingType.None;
  
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y, grid.length) : [0,0,0];

  return (
    <div className="absolute inset-0 bg-sky-900 touch-none">
      <Canvas shadows={{ type: THREE.BasicShadowMap }} dpr={1} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        
        <MapControls 
          enableRotate={true}
          enableZoom={true}
          minZoom={20}
          maxZoom={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.1}
          target={[0,-0.5,0]}
        />

        <ambientLight intensity={0.5} color="#cceeff" />
        <directionalLight
          castShadow
          position={[15, 20, 10]}
          intensity={2}
          color="#fffbeb"
          shadow-mapSize={[512, 512]}
          shadow-camera-left={-15} shadow-camera-right={15}
          shadow-camera-top={15} shadow-camera-bottom={-15}
        >
        </directionalLight>
        <Environment preset="city" />

        <EnvironmentEffects />

        <group>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              // Calculate world position once per tile
              const [wx, _, wz] = gridToWorld(x, y, grid.length);
              
              const hasBuilding = tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road;
              
              let statusOverlay: { emoji: string; text: string } | null = null;
              if (hasBuilding) {
                const hVal = getHash(x, y);
                
                // 1. Power problems: If ratingElectricity is below 95%
                const hasPower = stats.ratingElectricity === 100 || (hVal * 100) < stats.ratingElectricity;
                
                // 2. Water problems: If ratingWater is below 95%
                const wHash = getHash(x + 3, y + 7);
                const hasWater = stats.ratingWater === 100 || (wHash * 100) < stats.ratingWater;
                
                // 3. Crime problems: If ratingServices (acting as police proxy) is below 70%
                const pHash = getHash(x + 9, y + 13);
                const isCrimeHeavy = stats.population > 20 && stats.ratingServices < 65 && (pHash * 100) > stats.ratingServices + 15;
                
                // 4. Fire problems: If ratingServices (acting as fire proxy) is below 70%
                const fHash = getHash(x + 15, y + 21);
                const isFireHeavy = stats.population > 20 && stats.ratingServices < 60 && (fHash * 100) > stats.ratingServices + 25;
                
                // 5. General Happy / Unhappy indicators based on local context & overall happiness:
                const isUnhappy = stats.happiness < 50 && (hVal * 100) > stats.happiness;
                const isHappy = stats.happiness >= 80 && (hVal * 100) < (stats.happiness - 50);

                if (!hasPower) {
                  statusOverlay = { emoji: '⚡', text: 'No Power' };
                } else if (!hasWater) {
                  statusOverlay = { emoji: '💧', text: 'No Water' };
                } else if (isFireHeavy) {
                  statusOverlay = { emoji: '🔥', text: 'Fire!' };
                } else if (isCrimeHeavy) {
                  statusOverlay = { emoji: '🚓', text: 'Crime High' };
                } else if (isUnhappy) {
                  statusOverlay = { emoji: '😡', text: 'Unhappy' };
                } else if (isHappy) {
                  statusOverlay = { emoji: '😊', text: 'Happy' };
                }
              }

              return (
              <React.Fragment key={`${x}-${y}`}>
                <GroundTile 
                    type={tile.buildingType} 
                    x={x} y={y} 
                    grid={grid}
                    onHover={handleHover}
                    onLeave={handleLeave}
                    onClick={onTileClick}
                    unlocked={tile.unlocked !== false}
                    districtId={tile.districtId}
                />
                
                {/* Building visual - apply world position to group to align with ground tile */}
                <group position={[wx, 0, wz]} raycast={() => null}>
                    {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                      <ProceduralBuilding 
                        type={tile.buildingType} 
                        level={tile.level || 1}
                        baseColor={BUILDINGS[tile.buildingType].color} 
                        x={x} y={y} 
                      />
                    )}
                </group>

                {/* Overhead Status Icon */}
                {statusOverlay && (
                  <group position={[wx, 0.7 + (tile.level || 1) * 0.15, wz]} raycast={() => null}>
                    <Html center pointerEvents="none">
                      <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 bg-slate-950/95 border-2 border-slate-800 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.6)] select-none pointer-events-none">
                        <span className="text-[10px] md:text-[11px] leading-none mb-0.5 select-none">{statusOverlay.emoji}</span>
                      </div>
                    </Html>
                  </group>
                )}
              </React.Fragment>
            )})
          )}

          {/* Visual Elements - disable pointer events */}
          <group raycast={() => null}>
            <TrafficSystem grid={grid} />
            <PopulationSystem population={population} grid={grid} />

            {/* Placement Preview */}
            {showPreview && hoveredTile && (
              <group position={[previewPos[0], 0, previewPos[2]]}>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.1} floatingRange={[0, 0.1]}>
                  {(() => {
                    const hoveredTileData = grid[hoveredTile.y]?.[hoveredTile.x];
                    const previewLevel = (hoveredTileData && hoveredTileData.buildingType === hoveredTool) 
                      ? Math.min(4, (hoveredTileData.level || 1) + 1)
                      : 1;
                    return (
                      <ProceduralBuilding 
                        type={hoveredTool} 
                        level={previewLevel}
                        baseColor={previewColor} 
                        x={hoveredTile.x} 
                        y={hoveredTile.y} 
                        transparent 
                        opacity={0.7} 
                      />
                    );
                  })()}
                </Float>
              </group>
            )}

            {/* Highlight */}
            {hoveredTile && (
              <Cursor 
                x={hoveredTile.x} 
                y={hoveredTile.y} 
                color={isBulldoze ? '#ef4444' : (showPreview ? '#ffffff' : '#000000')} 
                gridLength={grid.length}
              />
            )}
          </group>
        </group>
        
      </Canvas>
    </div>
  );
};

export default IsoMap;
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars, Detailed, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("WebGL Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return <>{this.props.children}</>;
  }
}

const FallbackGrid = () => (
  <div 
    className="absolute inset-0 z-0 pointer-events-none opacity-20"
    style={{
      backgroundImage: `radial-gradient(var(--color-primary-base) 1px, transparent 1px)`,
      backgroundSize: '32px 32px'
    }}
  />
);

function AnimatedGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Octahedron ref={meshRef} args={[2, 0]} position={[0, 0, 0]}>
      <meshStandardMaterial 
        color="#818cf8" 
        wireframe 
        emissive="#4f46e5" 
        emissiveIntensity={1} 
        transparent 
        opacity={0.3} 
      />
    </Octahedron>
  );
}

function InnerCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * -0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * -0.5;
    }
  });

  return (
    <Octahedron ref={meshRef} args={[1, 0]} position={[0, 0, 0]}>
      <meshStandardMaterial 
        color="#c084fc" 
        wireframe={false} 
        emissive="#9333ea" 
        emissiveIntensity={0.5} 
        transparent 
        opacity={0.8} 
      />
    </Octahedron>
  );
}

export default function Hero3D() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  if (!hasWebGL) {
    return <FallbackGrid />;
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
      {/* Loading State & Fallback Background */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
        <FallbackGrid />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>

      <ErrorBoundary fallback={<FallbackGrid />}>
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-50' : 'opacity-0'}`}>
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 45 }}
            onCreated={() => setIsLoaded(true)}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <AnimatedGeometry />
            <InnerCore />
            <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
          </Canvas>
        </div>
      </ErrorBoundary>
    </div>
  );
}

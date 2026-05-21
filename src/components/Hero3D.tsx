import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars } from '@react-three/drei';
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
    className="absolute inset-0 z-0 pointer-events-none opacity-20 animate-pulse"
    style={{
      backgroundImage: `radial-gradient(var(--color-primary-base) 1px, transparent 1px)`,
      backgroundSize: '32px 32px'
    }}
  />
);

function InteractiveScene() {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringOuterRef = useRef<THREE.Mesh>(null);

  // References to smoothly lerp mouse & scroll coordinates
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scroll = useRef({ y: 0, targetY: 0 });

  useEffect(() => {
    let hasOrientation = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (hasOrientation) return;
      // Normalize clientX/clientY to ranges [-1, 1]
      mouse.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (hasOrientation) return;
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.current.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.current.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    };

    const handleScroll = () => {
      scroll.current.targetY = window.scrollY;
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta; // [-180, 180] (tilt front/back)
      const gamma = e.gamma; // [-90, 90] (tilt left/right)

      if (beta !== null && gamma !== null) {
        hasOrientation = true;
        // Typical holding position tilt: 60 degrees. 
        // We divide by 24 degrees to comfortably bound mouse range around [-1.2, 1.2]
        const tiltX = Math.min(Math.max(gamma / 24, -1.2), 1.2);
        const tiltY = Math.min(Math.max((beta - 60) / 24, -1.2), 1.2);

        mouse.current.targetX = tiltX;
        mouse.current.targetY = -tiltY;
      }
    };

    // Register active listeners
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // iOS WebKit orientation permission request
    const requestiOSPermission = () => {
      const DeviceOrientationEventAny = DeviceOrientationEvent as any;
      if (
        typeof DeviceOrientationEventAny !== 'undefined' &&
        typeof DeviceOrientationEventAny.requestPermission === 'function'
      ) {
        DeviceOrientationEventAny.requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
            }
          })
          .catch((err: any) => {
            console.warn("DeviceOrientation requested but failed:", err);
          });
      }
      document.removeEventListener('click', requestiOSPermission);
      document.removeEventListener('touchstart', requestiOSPermission);
    };

    document.addEventListener('click', requestiOSPermission);
    document.addEventListener('touchstart', requestiOSPermission);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', requestiOSPermission);
      document.removeEventListener('touchstart', requestiOSPermission);
    };
  }, []);

  useFrame((state) => {
    // Elegant organic inertia (lerping)
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;
    scroll.current.y += (scroll.current.targetY - scroll.current.y) * 0.08;

    const time = state.clock.elapsedTime;

    // 1. Group / Overall System Rotation & Depth Scroll Drift
    if (groupRef.current) {
      // Tilt entire system base with mouse coordinates
      groupRef.current.rotation.y = mouse.current.x * 0.35 + time * 0.03;
      groupRef.current.rotation.x = -mouse.current.y * 0.35;
      
      // Dynamic vertical drift & 3D roll linked directly to viewport scroll
      groupRef.current.position.y = -scroll.current.y * 0.0035;
      groupRef.current.rotation.z = scroll.current.y * 0.0012;
    }

    // 2. Bioluminescent Liquid Core Pulsation & Scroll Responsive Scaling
    if (sphereRef.current) {
      const distanceToCenter = Math.sqrt(mouse.current.x ** 2 + mouse.current.y ** 2);
      // Breathing pulse + organic kinetic bump when cursor approaches
      const pulseFactor = 1.0 + Math.sin(time * 1.6) * 0.06 + distanceToCenter * 0.07;
      
      // Scale down space gracefully as client scrolls deeper to merge into contents
      const scrollScale = Math.max(0.4, 1.05 - scroll.current.y * 0.0006);
      sphereRef.current.scale.setScalar(pulseFactor * scrollScale);
    }

    // 3. Dynamic distortion parameters on the custom material
    if (materialRef.current) {
      const movementSpeed = Math.abs(mouse.current.x) + Math.abs(mouse.current.y);
      // Distortion deepens on mouse move/speed and scrolling depth
      materialRef.current.distort = 0.35 + movementSpeed * 0.15 + (scroll.current.y * 0.0003);
      materialRef.current.speed = 1.8 + movementSpeed * 2.8;
    }

    // 4. Inner energetic wireframe crystal counter-rotation
    if (innerRef.current) {
      innerRef.current.rotation.y = -time * 0.75;
      innerRef.current.rotation.x = time * 0.45;
      innerRef.current.rotation.z = -time * 0.25;
    }

    // 5. Dual Orbital cyber-rings animation
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.12;
      ringRef.current.rotation.x = Math.PI / 2.4 + mouse.current.y * 0.12;
      ringRef.current.rotation.y = mouse.current.x * 0.12;
    }

    if (ringOuterRef.current) {
      ringOuterRef.current.rotation.z = -time * 0.16;
      ringOuterRef.current.rotation.x = Math.PI / 3.4 - mouse.current.y * 0.08;
      ringOuterRef.current.rotation.y = -mouse.current.x * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Prime Core: Distorted holographic organic liquid orb */}
      <Sphere ref={sphereRef} args={[1.3, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#818cf8"
          emissive="#312e81"
          emissiveIntensity={1.8}
          distort={0.4}
          speed={2.0}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.88}
        />
      </Sphere>

      {/* Internal crystal core engine */}
      <mesh ref={innerRef} position={[0, 0, 0]}>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#7e22ce"
          emissiveIntensity={2.5}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Cybernetic Golden/Indigo Orbit Ring 1 */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[2.3, 0.015, 8, 100]} />
        <meshStandardMaterial
          color="#e0e7ff"
          emissive="#6366f1"
          emissiveIntensity={2.0}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Larger Cybernetic Outer Orbit Ring 2 */}
      <mesh ref={ringOuterRef} position={[0, 0, 0]}>
        <torusGeometry args={[2.7, 0.01, 8, 120]} />
        <meshStandardMaterial
          color="#d8b4fe"
          emissive="#a855f7"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Floating Sparkles & Cosmic dust, tilting elegantly along with the group */}
      <Stars 
        radius={100} 
        depth={60} 
        count={2000} 
        factor={5} 
        saturation={0.5} 
        fade 
        speed={1.5} 
      />
    </group>
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
    <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Loading state visual transition */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
        <FallbackGrid />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>

      <ErrorBoundary fallback={<FallbackGrid />}>
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-70' : 'opacity-0'}`}>
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 45 }}
            onCreated={() => setIsLoaded(true)}
          >
            {/* Cinematic Multitonal Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[5, 10, 5]} intensity={2.5} color="#c084fc" />
            <pointLight position={[-6, -6, 3]} intensity={1.8} color="#6366f1" />
            <directionalLight position={[0, 10, 0]} intensity={1.0} color="#ffffff" />
            <InteractiveScene />
          </Canvas>
        </div>
      </ErrorBoundary>
    </div>
  );
}

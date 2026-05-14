'use client';

import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Country } from '@/types';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

// ─── Earth ────────────────────────────────────────────────────────────────────

function CloudLayer() {
  const cloudRef = useRef<THREE.Mesh>(null);
  const cloudTexture = useTexture('/earth_clouds.png');

  useFrame((_, delta) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.018;
    }
  });

  return (
    <mesh ref={cloudRef} scale={1.012}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={cloudTexture}
        alphaMap={cloudTexture}
        transparent
        opacity={0.9}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function EarthGlobe() {
  const [dayMap, normalMap, specularMap] = useTexture([
    '/earth_day.jpg',
    '/earth_normal.jpg',
    '/earth_specular.jpg',
  ]);

  return (
    <>
      {/* Earth surface */}
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0.35, 0.45, 0.65)}
          shininess={22}
          normalScale={new THREE.Vector2(0.55, 0.55)}
        />
      </mesh>
      {/* Cloud layer */}
      <Suspense fallback={null}>
        <CloudLayer />
      </Suspense>
    </>
  );
}



// ─── Twinkling stars (3 groups at different phases) ───────────────────────────

function TwinklingStars() {
  const r0 = useRef<THREE.Points>(null);
  const r1 = useRef<THREE.Points>(null);
  const r2 = useRef<THREE.Points>(null);
  const refs = [r0, r1, r2];

  const groups = useMemo(() => [0, 1, 2].map(() => {
    const arr = new Float32Array(320 * 3);
    for (let i = 0; i < 320; i++) {
      const r = 5 + Math.random() * 14;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      arr[i * 3 + 2] = r * Math.cos(ph);
    }
    return arr;
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      // fast flicker layered on slow swell for sharp sparkle
      const swell   = Math.sin(t * (1.1 + i * 0.45) + i * 2.1);
      const flicker  = Math.sin(t * (8.5 + i * 3.2) + i * 5.7) * 0.28;
      (ref.current.material as THREE.PointsMaterial).opacity =
        Math.max(0.05, 0.65 + swell * 0.30 + flicker);
    });
  });

  return (
    <>
      {groups.map((pos, i) => (
        <points key={i} ref={refs[i]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pos, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={new THREE.Color(1.0, 0.97, 0.88)}
            size={0.015 + i * 0.006}
            transparent
            opacity={0.7}
            sizeAttenuation
          />
        </points>
      ))}
    </>
  );
}


// ─── Cute 2D Cat Sprite (walks on globe rim with 4 legs) ─────────────────────


// ─── Country marker (🐾 paw) ──────────────────────────────────────────────────

function CountryMarker({
  country, isHovered, isSelected, onHover, onClick,
}: {
  country: Country;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (c: Country | null) => void;
  onClick: (c: Country) => void;
}) {
  const position = useMemo(() => latLngToVec3(country.lat, country.lng, 1.04), [country]);

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(country); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(country); }}
      >
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html
        center
        distanceFactor={4}
        className="drei-html-wrapper"
        style={{ background: 'none', border: 'none', outline: 'none', boxShadow: 'none', padding: 0, margin: 0, pointerEvents: 'none' }}
        zIndexRange={[10, 100]}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pointerEvents: 'auto' }}
          onMouseEnter={() => onHover(country)}
          onMouseLeave={() => onHover(null)}
          onClick={(e) => { e.stopPropagation(); onClick(country); }}
        >
          <span style={{
            display: 'block',
            transition: 'transform 0.15s ease',
            transform: isSelected ? 'scale(1.55)' : isHovered ? 'scale(1.28)' : 'scale(1)',
            filter: isSelected
              ? 'drop-shadow(0 0 6px rgba(245,197,24,1)) drop-shadow(0 0 12px rgba(245,197,24,0.6))'
              : isHovered
              ? 'drop-shadow(0 0 4px rgba(255,240,80,0.9))'
              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
            cursor: 'pointer',
          }}>
            <svg viewBox="0 0 100 100" width={isSelected ? 26 : 22} height={isSelected ? 26 : 22} style={{ display: 'block' }}>
              {/* 3 toe pads */}
              <ellipse cx="20" cy="22" rx="13" ry="15" fill={isSelected ? '#FFE234' : isHovered ? '#FFD700' : '#F5C518'} />
              <ellipse cx="50" cy="13" rx="13" ry="15" fill={isSelected ? '#FFE234' : isHovered ? '#FFD700' : '#F5C518'} />
              <ellipse cx="80" cy="22" rx="13" ry="15" fill={isSelected ? '#FFE234' : isHovered ? '#FFD700' : '#F5C518'} />
              {/* Palm pad */}
              <path
                d="M14,46 Q10,78 50,83 Q90,78 86,46 Q86,33 66,31 Q60,35 50,35 Q40,35 34,31 Q14,33 14,46Z"
                fill={isSelected ? '#FFE234' : isHovered ? '#FFD700' : '#F5C518'}
              />
            </svg>
          </span>
          {(isHovered || isSelected) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(0,0,0,0.82)',
              color: '#fff',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 8,
              border: '1px solid rgba(245,197,24,0.45)',
              backdropFilter: 'blur(6px)',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w20/${country.code}.png`}
                alt={country.name}
                style={{ width: 16, height: 11, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
              />
              {country.name}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ─── Camera animator ──────────────────────────────────────────────────────────

function CameraAnimator({
  target, controlsRef, onComplete,
}: {
  target: Country | null;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const startPos  = useRef(new THREE.Vector3());
  const endPos    = useRef(new THREE.Vector3());
  const startFov  = useRef(50);
  const progress  = useRef(0);
  const animating = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    if (!target) {
      animating.current = false;
      completed.current = false;
      progress.current  = 0;
      // restore FOV
      if ('fov' in camera) { (camera as THREE.PerspectiveCamera).fov = 50; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); }
      return;
    }
    startPos.current.copy(camera.position);
    // zoom very close to the country on the globe surface
    endPos.current.copy(
      latLngToVec3(target.lat, target.lng, 1).normalize().multiplyScalar(1.55)
    );
    startFov.current = (camera as THREE.PerspectiveCamera).fov ?? 50;
    progress.current  = 0;
    animating.current = true;
    completed.current = false;
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [target, camera, controlsRef]);

  useFrame((_, delta) => {
    if (!animating.current || completed.current) return;
    // fast at start, decelerates smoothly
    progress.current = Math.min(1, progress.current + delta * 1.6);
    const t = easeInOutCubic(progress.current);
    camera.position.lerpVectors(startPos.current, endPos.current, t);
    camera.lookAt(0, 0, 0);
    // also narrow FOV for dramatic zoom-in feel (50 → 28)
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = startFov.current + (28 - startFov.current) * t;
    cam.updateProjectionMatrix();
    if (progress.current >= 1) {
      animating.current = false;
      completed.current = true;
      onComplete();
    }
  });

  return null;
}

// ─── Rotating globe group ─────────────────────────────────────────────────────

function GlobeGroup({
  countries, pendingCountry, onHover, onClick,
}: {
  countries: Country[];
  pendingCountry: Country | null;
  onHover: (c: Country | null) => void;
  onClick: (c: Country) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<Country | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || pendingCountry) return;
    groupRef.current.rotation.y += delta * 0.055;
  });

  const handleHover = useCallback((c: Country | null) => { setHovered(c); onHover(c); }, [onHover]);

  return (
    <group ref={groupRef}>
      <Suspense fallback={
        <mesh>
          <sphereGeometry args={[1, 96, 96]} />
          <meshStandardMaterial color={new THREE.Color(0.04, 0.15, 0.50)} roughness={0.8} />
        </mesh>
      }>
        <EarthGlobe />
      </Suspense>
      {countries.map((c) => (
        <CountryMarker
          key={c.slug} country={c}
          isHovered={hovered?.slug === c.slug}
          isSelected={pendingCountry?.slug === c.slug}
          onHover={handleHover}
          onClick={onClick}
        />
      ))}
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
  countries, pendingCountry, controlsRef, onHover, onClick, onAnimationComplete,
}: {
  countries: Country[];
  pendingCountry: Country | null;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  onHover: (c: Country | null) => void;
  onClick: (c: Country) => void;
  onAnimationComplete: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} color={new THREE.Color(0.8, 0.88, 1.0)} />
      <directionalLight position={[5, 3, 4]} intensity={2.4} color={new THREE.Color(1, 0.97, 0.88)} />
      <directionalLight position={[-5, -2, -4]} intensity={0.25} color={new THREE.Color(0.4, 0.6, 1.0)} />

      <TwinklingStars />

      <GlobeGroup
        countries={countries}
        pendingCountry={pendingCountry}
        onHover={onHover}
        onClick={onClick}
      />

      <CameraAnimator target={pendingCountry} controlsRef={controlsRef} onComplete={onAnimationComplete} />

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        rotateSpeed={0.45}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function CatGlobe3D({
  countries, onCountrySelect,
}: {
  countries: Country[];
  onCountrySelect: (country: Country) => void;
}) {
  const [pendingCountry, setPendingCountry] = useState<Country | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleClick = useCallback((c: Country) => setPendingCountry(c), []);
  const handleAnimationComplete = useCallback(() => {
    if (pendingCountry) setTimeout(() => onCountrySelect(pendingCountry), 120);
  }, [pendingCountry, onCountrySelect]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0.3, 2.9], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Scene
          countries={countries}
          pendingCountry={pendingCountry}
          controlsRef={controlsRef}
          onHover={setHoveredCountry}
          onClick={handleClick}
          onAnimationComplete={handleAnimationComplete}
        />
      </Canvas>

      {!hoveredCountry && !pendingCountry && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/35 text-xs pointer-events-none select-none">
          마커를 클릭해 나라를 선택하세요 🐾
        </p>
      )}
    </div>
  );
}

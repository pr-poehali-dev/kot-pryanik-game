import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface Obj3D {
  id: number;
  type: 'gold' | 'bonus' | 'enemy';
  lane: number;
  z: number;
}
export interface Tree3D {
  id: number;
  z: number;
  side: -1 | 1;
  variant: number;
}

interface Props {
  lane: number;
  jumping: boolean;
  boost: boolean;
  objs: Obj3D[];
  trees: Tree3D[];
}

const LANE_X = [-2.2, 0, 2.2];
/** how far ahead objects spawn (z=0) and where the cat stands (z≈0.9 → near camera) */
const FAR_Z = -34;
const NEAR_Z = 4;
const zToWorld = (z: number) => FAR_Z + z * (NEAR_Z - FAR_Z);

/* ---------------- CAT (low-poly stylized, built from primitives) ---------------- */
function Cat({ lane, jumping, boost }: { lane: number; jumping: boolean; boost: boolean }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);
  const targetX = LANE_X[lane];
  const prevX = useRef(LANE_X[lane]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const d = Math.min(1, delta * 12);

    // smooth lane change + measure horizontal velocity for lean
    const before = group.current.position.x;
    group.current.position.x += (targetX - before) * d;
    const vx = group.current.position.x - prevX.current;
    prevX.current = group.current.position.x;

    // jump arc (nice ease up + gravity down feel)
    const jumpH = jumping ? 2.1 : 0;
    group.current.position.y += (jumpH - group.current.position.y) * Math.min(1, delta * (jumping ? 14 : 9));

    const t = state.clock.elapsedTime * (boost ? 24 : 17);

    // running leg cycle
    const swing = jumping ? 0.6 : Math.sin(t) * 0.9;
    const swingOpp = jumping ? 0.6 : Math.sin(t + Math.PI) * 0.9;
    if (legFL.current) legFL.current.rotation.x = swing;
    if (legBR.current) legBR.current.rotation.x = swing;
    if (legFR.current) legFR.current.rotation.x = swingOpp;
    if (legBL.current) legBL.current.rotation.x = swingOpp;

    // lean into the turn (banking) + forward tilt while running
    const targetRoll = jumping ? 0 : -vx * 9;
    group.current.rotation.z += (targetRoll - group.current.rotation.z) * Math.min(1, delta * 10);
    // little forward somersault tuck on jump, gentle bob otherwise
    const targetPitch = jumping ? -0.9 : Math.sin(t) * 0.05;
    group.current.rotation.x += (targetPitch - group.current.rotation.x) * Math.min(1, delta * 10);

    // bouncy body squash & side-to-side wobble (soft, plush)
    if (body.current) {
      const bounce = jumping ? 0 : Math.abs(Math.sin(t)) * 0.14;
      body.current.position.y = bounce;
      body.current.rotation.z = Math.sin(t) * 0.07;
      // squash-and-stretch: stretch up when high, squash when landing
      const phase = Math.sin(t);
      const stretch = 1 + phase * 0.07;
      const widen = 1 - phase * 0.05;
      body.current.scale.set(widen, stretch, widen);
    }
    // head bob + look toward the lane you're moving to
    if (head.current) {
      head.current.rotation.y += (THREE.MathUtils.clamp(-vx * 6, -0.5, 0.5) - head.current.rotation.y) * Math.min(1, delta * 8);
      head.current.rotation.z = Math.sin(t + 0.5) * 0.06;
    }
    // happy wagging tail
    if (tail.current) {
      tail.current.rotation.y = Math.sin(t * 1.4) * 0.6;
      tail.current.rotation.x = 0.8 + Math.sin(t * 2) * 0.15;
    }
    // ears flapping with the run
    const ear = Math.sin(t * 2) * 0.25;
    if (earL.current) earL.current.rotation.x = ear;
    if (earR.current) earR.current.rotation.x = -ear;
  });

  const orange = '#F3A03B';
  const cream = '#FBE7C6';

  const Leg = (r: React.RefObject<THREE.Mesh>, x: number, z: number) => (
    <mesh ref={r} position={[x, -0.5, z]} castShadow>
      <capsuleGeometry args={[0.18, 0.65, 4, 10]} />
      <meshStandardMaterial color={orange} roughness={0.55} metalness={0} />
    </mesh>
  );

  return (
    <group ref={group} position={[LANE_X[lane], 0, zToWorld(0.9)]}>
      <group ref={body} rotation={[0, Math.PI, 0]}>
        {/* body */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <capsuleGeometry args={[0.72, 0.95, 12, 32]} />
          <meshStandardMaterial color={orange} roughness={0.5} metalness={0} />
        </mesh>
        {/* belly */}
        <mesh position={[0, -0.05, 0.52]} scale={[1, 1.15, 0.8]}>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color={cream} roughness={0.6} metalness={0} />
        </mesh>
        {/* head */}
        <group ref={head} position={[0, 1.15, 0.28]}>
          <mesh castShadow scale={[1, 0.95, 1]}>
            <sphereGeometry args={[0.72, 48, 48]} />
            <meshStandardMaterial color={orange} roughness={0.5} metalness={0} />
          </mesh>
          {/* ears */}
          <mesh ref={earL} position={[-0.44, 0.52, 0]} rotation={[0, 0, 0.32]}>
            <coneGeometry args={[0.26, 0.52, 24]} />
            <meshStandardMaterial color={orange} roughness={0.5} />
          </mesh>
          <mesh position={[-0.44, 0.5, 0.02]} rotation={[0, 0, 0.32]}>
            <coneGeometry args={[0.14, 0.34, 20]} />
            <meshStandardMaterial color="#F58BA6" roughness={0.6} />
          </mesh>
          <mesh ref={earR} position={[0.44, 0.52, 0]} rotation={[0, 0, -0.32]}>
            <coneGeometry args={[0.26, 0.52, 24]} />
            <meshStandardMaterial color={orange} roughness={0.5} />
          </mesh>
          <mesh position={[0.44, 0.5, 0.02]} rotation={[0, 0, -0.32]}>
            <coneGeometry args={[0.14, 0.34, 20]} />
            <meshStandardMaterial color="#F58BA6" roughness={0.6} />
          </mesh>
          {/* muzzle */}
          <mesh position={[0, -0.1, 0.58]} scale={[1.15, 0.9, 0.9]}>
            <sphereGeometry args={[0.36, 32, 32]} />
            <meshStandardMaterial color={cream} roughness={0.6} />
          </mesh>
          {/* eyes */}
          <mesh position={[-0.26, 0.14, 0.56]} scale={[1, 1.25, 1]}>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshStandardMaterial color="#fff" roughness={0.3} />
          </mesh>
          <mesh position={[0.26, 0.14, 0.56]} scale={[1, 1.25, 1]}>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshStandardMaterial color="#fff" roughness={0.3} />
          </mesh>
          {/* irises */}
          <mesh position={[-0.25, 0.11, 0.68]}>
            <sphereGeometry args={[0.085, 20, 20]} />
            <meshStandardMaterial color="#2a1a10" roughness={0.2} />
          </mesh>
          <mesh position={[0.27, 0.11, 0.68]}>
            <sphereGeometry args={[0.085, 20, 20]} />
            <meshStandardMaterial color="#2a1a10" roughness={0.2} />
          </mesh>
          {/* eye highlights */}
          <mesh position={[-0.22, 0.17, 0.74]}>
            <sphereGeometry args={[0.032, 10, 10]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[0.3, 0.17, 0.74]}>
            <sphereGeometry args={[0.032, 10, 10]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          {/* nose */}
          <mesh position={[0, -0.04, 0.94]} scale={[1.3, 0.9, 1]}>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshStandardMaterial color="#E86A8C" roughness={0.35} />
          </mesh>
          {/* smiling mouth */}
          <mesh position={[0, -0.24, 0.86]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.14, 0.035, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#7a3a1a" roughness={0.5} />
          </mesh>
          {/* rosy cheeks */}
          <mesh position={[-0.46, -0.1, 0.48]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#F58BA6" transparent opacity={0.6} roughness={0.7} />
          </mesh>
          <mesh position={[0.46, -0.1, 0.48]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#F58BA6" transparent opacity={0.6} roughness={0.7} />
          </mesh>
        </group>
        {/* red shirt band */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.74, 0.74, 0.55, 32]} />
          <meshStandardMaterial color="#E4402E" roughness={0.6} />
        </mesh>
        {/* shirt collar */}
        <mesh position={[0, 0.13, 0]}>
          <torusGeometry args={[0.7, 0.08, 12, 32]} />
          <meshStandardMaterial color="#C22E1E" roughness={0.6} />
        </mesh>
        {/* legs */}
        {Leg(legFL, -0.38, 0.42)}
        {Leg(legFR, 0.38, 0.42)}
        {Leg(legBL, -0.38, -0.42)}
        {Leg(legBR, 0.38, -0.42)}
        {/* paws */}
        {[[-0.38, 0.42], [0.38, 0.42], [-0.38, -0.42], [0.38, -0.42]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.86, z + 0.08]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={cream} roughness={0.6} />
          </mesh>
        ))}
        {/* tail */}
        <group ref={tail} position={[0, 0.3, -0.7]}>
          <mesh position={[0, 0.3, -0.4]} rotation={[0.8, 0, 0]}>
            <capsuleGeometry args={[0.15, 1.0, 8, 20]} />
            <meshStandardMaterial color={orange} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.72, -0.72]}>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color={cream} roughness={0.6} />
          </mesh>
        </group>
      </group>
      {/* soft shadow blob (stays on ground) */}
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

/* ---------------- ROAD ---------------- */
function Road() {
  const stripes = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, -14]} receiveShadow>
        <planeGeometry args={[9, 60]} />
        <meshStandardMaterial color="#B85700" />
      </mesh>
      {/* lane lines */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -1.04, -14]}>
          <planeGeometry args={[0.12, 60]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* moving dashes for speed feel */}
      {stripes.map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.03, i * -4 + 2]}>
          <planeGeometry args={[0.25, 1.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
      ))}
      {/* grass sides */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 9, -1.06, -14]}>
          <planeGeometry args={[10, 60]} />
          <meshStandardMaterial color="#57B85B" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- COLLECTIBLES / OBSTACLES ---------------- */
function Coin({ z, x }: { z: number; x: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 4; });
  return (
    <mesh ref={ref} position={[x, 0.2, zToWorld(z)]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.55, 0.55, 0.14, 20]} />
      <meshStandardMaterial color="#FFC63A" metalness={0.6} roughness={0.25} emissive="#8a5a00" emissiveIntensity={0.25} />
    </mesh>
  );
}
function Gift({ z, x }: { z: number; x: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 2; });
  return (
    <group ref={ref} position={[x, 0.1, zToWorld(z)]}>
      <mesh><boxGeometry args={[0.9, 0.9, 0.9]} /><meshStandardMaterial color="#E4402E" /></mesh>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.2, 0.95, 0.95]} /><meshStandardMaterial color="#FFD166" /></mesh>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.95, 0.95, 0.2]} /><meshStandardMaterial color="#FFD166" /></mesh>
    </group>
  );
}
function Obstacle({ z, x }: { z: number; x: number }) {
  return (
    <group position={[x, -0.4, zToWorld(z)]}>
      <mesh><boxGeometry args={[1.6, 1.1, 0.5]} /><meshStandardMaterial color="#F2A93B" /></mesh>
      {[-0.5, 0, 0.5].map((o) => (
        <mesh key={o} position={[o, 0, 0.26]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.35, 1.4, 0.05]} /><meshStandardMaterial color="#2C2C2C" />
        </mesh>
      ))}
    </group>
  );
}
function Tree({ z, x }: { z: number; x: number }) {
  return (
    <group position={[x, -0.5, zToWorld(z)]}>
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.22, 0.28, 1.2, 8]} /><meshStandardMaterial color="#7A4A1E" /></mesh>
      <mesh position={[0, 1.3, 0]}><coneGeometry args={[1.0, 1.8, 10]} /><meshStandardMaterial color="#2E9E4F" /></mesh>
      <mesh position={[0, 2.1, 0]}><coneGeometry args={[0.75, 1.4, 10]} /><meshStandardMaterial color="#37B85C" /></mesh>
    </group>
  );
}

function Scene({ lane, jumping, boost, objs, trees }: Props) {
  return (
    <>
      <color attach="background" args={['#8fd3ff']} />
      <fog attach="fog" args={['#a7e1ff', 18, 40]} />
      <hemisphereLight intensity={0.85} groundColor="#57B85B" color="#ffffff" />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
      {/* soft fill from camera side to model the face */}
      <directionalLight position={[0, 4, 10]} intensity={0.55} color="#fff6e6" />
      {/* rim light for a plush edge glow */}
      <directionalLight position={[-6, 6, -8]} intensity={0.5} color="#bfe0ff" />
      <Road />
      <Cat lane={lane} jumping={jumping} boost={boost} />
      {objs.map((o) => {
        const x = LANE_X[o.lane];
        if (o.type === 'gold') return <Coin key={o.id} z={o.z} x={x} />;
        if (o.type === 'bonus') return <Gift key={o.id} z={o.z} x={x} />;
        return <Obstacle key={o.id} z={o.z} x={x} />;
      })}
      {trees.map((t) => (
        <Tree key={t.id} z={t.z} x={t.side * (5.5 + t.variant * 0.6)} />
      ))}
    </>
  );
}

export default function GameScene3D(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 4.2, 9], fov: 55, near: 0.1, far: 60 }}
      className="absolute inset-0"
    >
      <Scene {...props} />
    </Canvas>
  );
}
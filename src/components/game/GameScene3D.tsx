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

    // bouncy body squash & side-to-side wobble
    if (body.current) {
      const bounce = jumping ? 0 : Math.abs(Math.sin(t)) * 0.12;
      body.current.position.y = bounce;
      body.current.rotation.z = Math.sin(t) * 0.08;
      const squash = 1 + Math.sin(t * 2) * 0.05;
      body.current.scale.set(1, squash, 1);
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
    <mesh ref={r} position={[x, -0.55, z]}>
      <boxGeometry args={[0.35, 0.9, 0.35]} />
      <meshStandardMaterial color={orange} />
    </mesh>
  );

  return (
    <group ref={group} position={[LANE_X[lane], 0, zToWorld(0.9)]}>
      <group ref={body} rotation={[0, Math.PI, 0]}>
        {/* body */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <capsuleGeometry args={[0.7, 0.9, 6, 12]} />
          <meshStandardMaterial color={orange} />
        </mesh>
        {/* belly */}
        <mesh position={[0, -0.05, 0.5]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={cream} />
        </mesh>
        {/* head */}
        <group ref={head} position={[0, 1.1, 0.3]}>
          <mesh castShadow>
            <sphereGeometry args={[0.7, 20, 20]} />
            <meshStandardMaterial color={orange} />
          </mesh>
          {/* ears */}
          <mesh ref={earL} position={[-0.42, 0.55, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.28, 0.5, 4]} />
            <meshStandardMaterial color={orange} />
          </mesh>
          <mesh ref={earR} position={[0.42, 0.55, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.28, 0.5, 4]} />
            <meshStandardMaterial color={orange} />
          </mesh>
          {/* muzzle */}
          <mesh position={[0, -0.1, 0.6]}>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshStandardMaterial color={cream} />
          </mesh>
          {/* eyes */}
          <mesh position={[-0.26, 0.12, 0.55]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0.26, 0.12, 0.55]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[-0.24, 0.12, 0.64]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0.28, 0.12, 0.64]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          {/* nose */}
          <mesh position={[0, -0.05, 0.92]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#E86A8C" />
          </mesh>
          {/* smiling mouth */}
          <mesh position={[0, -0.22, 0.86]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.03, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#7a3a1a" />
          </mesh>
          {/* rosy cheeks */}
          <mesh position={[-0.45, -0.08, 0.5]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color="#F58BA6" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.45, -0.08, 0.5]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color="#F58BA6" transparent opacity={0.7} />
          </mesh>
        </group>
        {/* red shirt band */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.55, 16]} />
          <meshStandardMaterial color="#E4402E" />
        </mesh>
        {/* legs */}
        {Leg(legFL, -0.4, 0.45)}
        {Leg(legFR, 0.4, 0.45)}
        {Leg(legBL, -0.4, -0.45)}
        {Leg(legBR, 0.4, -0.45)}
        {/* tail */}
        <group ref={tail} position={[0, 0.3, -0.7]}>
          <mesh position={[0, 0.3, -0.4]} rotation={[0.8, 0, 0]}>
            <capsuleGeometry args={[0.14, 1.0, 4, 8]} />
            <meshStandardMaterial color={orange} />
          </mesh>
          <mesh position={[0, 0.7, -0.7]}>
            <sphereGeometry args={[0.17, 10, 10]} />
            <meshStandardMaterial color={cream} />
          </mesh>
        </group>
      </group>
      {/* soft shadow blob (stays on ground) */}
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 20]} />
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
      <hemisphereLight intensity={0.9} groundColor="#57B85B" color="#ffffff" />
      <directionalLight position={[6, 12, 6]} intensity={1.1} castShadow />
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
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type LookTarget = { x: number; y: number; active: boolean };

function Robot({ look, waveSignal }: { look: React.MutableRefObject<LookTarget>; waveSignal: number }) {
  const { scene, animations } = useGLTF("/robot_playground.glb");
  const { actions } = useAnimations(animations, scene);
  const head = useRef<THREE.Object3D | null>(null);
  const base = useRef(new THREE.Euler());
  const shoulder = useRef<THREE.Object3D | null>(null);
  const elbow = useRef<THREE.Object3D | null>(null);
  const wrist = useRef<THREE.Object3D | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const wave = useRef({ active: false, elapsed: 0 });
  const waveBase = useRef({ shoulder: new THREE.Euler(), elbow: new THREE.Euler(), wrist: new THREE.Euler() });

  useEffect(() => {
    const playground = scene.getObjectByName("holo");
    playground?.removeFromParent();
    head.current = scene.getObjectByName("Head_M_033") ?? scene.getObjectByName("head") ?? null;
    shoulder.current = scene.getObjectByName("Shoulder_R_04") ?? null;
    elbow.current = scene.getObjectByName("Elbow_R_08") ?? null;
    wrist.current = scene.getObjectByName("Wrist_R_012") ?? null;
    if (head.current) base.current.copy(head.current.rotation);
    const action = actions.Experiment ?? Object.values(actions).find(Boolean) ?? null;
    actionRef.current = action;
    action?.reset().fadeIn(0.3).play();
    return () => { action?.fadeOut(0.15).stop(); };
  }, [actions, scene]);

  useEffect(() => {
    if (!waveSignal || !shoulder.current || !elbow.current || !wrist.current) return;
    if (!wave.current.active) {
      waveBase.current.shoulder.copy(shoulder.current.rotation);
      waveBase.current.elbow.copy(elbow.current.rotation);
      waveBase.current.wrist.copy(wrist.current.rotation);
    }
    wave.current = { active: true, elapsed: 0 };
    if (actionRef.current) actionRef.current.paused = true;
  }, [waveSignal]);

  useFrame((_, delta) => {
    if (!head.current) return;
    const speed = 1 - Math.exp(-delta * 8);
    const x = look.current.active ? look.current.x : 0;
    const y = look.current.active ? look.current.y : 0;
    head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, base.current.y + x * 0.42, speed);
    head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, base.current.x - y * 0.22, speed);

    if (!wave.current.active || !shoulder.current || !elbow.current || !wrist.current) return;
    wave.current.elapsed += delta;
    const duration = 1.8;
    const weight = Math.max(0, Math.min(1, wave.current.elapsed / 0.25, (duration - wave.current.elapsed) / 0.3));
    const swing = Math.sin(wave.current.elapsed * 12);
    shoulder.current.rotation.x = waveBase.current.shoulder.x - 0.35 * weight;
    shoulder.current.rotation.z = waveBase.current.shoulder.z + 1.15 * weight;
    elbow.current.rotation.z = waveBase.current.elbow.z + (0.75 + swing * 0.28) * weight;
    wrist.current.rotation.y = waveBase.current.wrist.y + swing * 0.55 * weight;
    if (wave.current.elapsed >= duration) {
      shoulder.current.rotation.copy(waveBase.current.shoulder);
      elbow.current.rotation.copy(waveBase.current.elbow);
      wrist.current.rotation.copy(waveBase.current.wrist);
      wave.current.active = false;
      if (actionRef.current) actionRef.current.paused = false;
    }
  });

  return <primitive object={scene} />;
}

export function RobotHero() {
  const [waveSignal, setWaveSignal] = useState(0);
  const look = useRef<LookTarget>({ x: 0, y: 0, active: false });

  return <div
    className="robot-stage"
    aria-label="Interactive 3D robot. Move the cursor nearby to make it look at you. Double-click to make it wave."
    onPointerMove={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      look.current = {
        x: THREE.MathUtils.clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1, 1),
        y: THREE.MathUtils.clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1, 1),
        active: true,
      };
    }}
    onPointerLeave={() => { look.current.active = false; }}
    onDoubleClick={() => { look.current = { x: 0, y: 0, active: false }; setWaveSignal((value) => value + 1); }}
  >
    <Canvas
      camera={{ position: [0, 1.4, 6], fov: 36 }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        scene.background = null;
      }}
      dpr={[1, 1.75]}
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 6, 5]} intensity={3.2} color="#F4F4F1" />
      <directionalLight position={[-4, 2, 3]} intensity={2.2} color="#22D3EE" />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.16}>
          <Robot look={look} waveSignal={waveSignal} />
        </Bounds>
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableRotate
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  </div>;
}

useGLTF.preload("/robot_playground.glb");

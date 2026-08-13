"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type LookTarget = { x: number; y: number; active: boolean };

function Robot({ look }: { look: React.MutableRefObject<LookTarget> }) {
  const { scene, animations } = useGLTF("/robot_playground.glb");
  const { actions } = useAnimations(animations, scene);
  const head = useRef<THREE.Object3D | null>(null);
  const base = useRef(new THREE.Euler());

  useEffect(() => {
    const playground = scene.getObjectByName("holo");
    playground?.removeFromParent();
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.portfolioPaletteApplied) return;
      const useAccent = /eye|mouth|face|ear|tophead|neck|shoulder|hand|finger|knee|foot|hip|tube|ball/i.test(object.name);
      const color = useAccent ? "#22D3EE" : "#F4F4F1";
      const recolor = (source: THREE.Material) => {
        const material = source.clone() as THREE.MeshStandardMaterial;
        material.color?.set(color);
        material.emissive?.set(useAccent ? "#22D3EE" : "#F4F4F1");
        if ("emissiveIntensity" in material) material.emissiveIntensity = useAccent ? 0.18 : 0.04;
        material.map = null;
        material.emissiveMap = null;
        material.vertexColors = false;
        material.needsUpdate = true;
        return material;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolor) : recolor(mesh.material);
      mesh.userData.portfolioPaletteApplied = true;
    });
    head.current = scene.getObjectByName("Head_M_033") ?? scene.getObjectByName("head") ?? null;
    if (head.current) base.current.copy(head.current.rotation);
    const action = actions.Experiment ?? Object.values(actions)[0];
    action?.reset().fadeIn(0.3).play();
    return () => { action?.fadeOut(0.15).stop(); };
  }, [actions, scene]);

  useFrame((_, delta) => {
    if (!head.current) return;
    const speed = 1 - Math.exp(-delta * 8);
    const x = look.current.active ? look.current.x : 0;
    const y = look.current.active ? look.current.y : 0;
    head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, base.current.y + x * 0.42, speed);
    head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, base.current.x - y * 0.22, speed);
  });

  return <primitive object={scene} />;
}

export function RobotHero() {
  const [restartKey, setRestartKey] = useState(0);
  const look = useRef<LookTarget>({ x: 0, y: 0, active: false });

  return <div
    className="robot-stage"
    aria-label="Interactive 3D robot. Move the cursor nearby to make it look at you. Double-click to restart."
    onPointerMove={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      look.current = {
        x: THREE.MathUtils.clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1, 1),
        y: THREE.MathUtils.clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1, 1),
        active: true,
      };
    }}
    onPointerLeave={() => { look.current.active = false; }}
    onDoubleClick={() => { look.current = { x: 0, y: 0, active: false }; setRestartKey((value) => value + 1); }}
  >
    <Canvas key={restartKey} camera={{ position: [0, 1.4, 6], fov: 36 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.75]}>
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 6, 5]} intensity={3.2} color="#F4F4F1" />
      <directionalLight position={[-4, 2, 3]} intensity={2.2} color="#22D3EE" />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.08}>
          <Robot look={look} />
        </Bounds>
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={2.5} maxDistance={8} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} />
    </Canvas>
  </div>;
}

useGLTF.preload("/robot_playground.glb");

"use client";

/* eslint-disable react/no-unknown-property */

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Color, MathUtils, type Object3D } from "three";

type Rotation = { x: number; y: number };

const HEAD_NAMES = ["Head_M_033", "head"];
const EYE_NAMES = ["eye_050", "eyeL_058", "eye", "eye1"];

function findFirst(scene: Object3D, names: string[]) {
  return names.map((name) => scene.getObjectByName(name)).find(Boolean) ?? null;
}

function Robot() {
  const { scene, animations } = useGLTF("/robot_playground.glb");
  const { actions } = useAnimations(animations, scene);
  const head = useRef<Object3D | null>(null);
  const eyes = useRef<Object3D[]>([]);
  const restRotation = useRef(new Map<Object3D, Rotation>());
  const supportsCursorTracking = useRef(false);
  const nextBlinkAt = useRef(0);
  const blinkAmount = useRef(0);

  useEffect(() => {
    scene.getObjectByName("holo")?.removeFromParent();
    scene.getObjectByName("ground")?.removeFromParent();
    head.current = findFirst(scene, HEAD_NAMES);
    eyes.current = EYE_NAMES.map((name) => scene.getObjectByName(name)).filter((eye): eye is Object3D => Boolean(eye));
    [head.current, ...eyes.current].filter((part): part is Object3D => Boolean(part)).forEach((part) => {
      restRotation.current.set(part, { x: part.rotation.x, y: part.rotation.y });
    });
    eyes.current.forEach((eye) => eye.traverse((part) => {
      const materials = Array.isArray((part as { material?: unknown }).material)
        ? (part as { material: unknown[] }).material
        : [(part as { material?: unknown }).material];
      materials.forEach((material) => {
        if (material && "emissive" in (material as object)) {
          const eyeMaterial = material as { emissive: Color; emissiveIntensity: number };
          eyeMaterial.emissive = new Color("#22D3EE");
          eyeMaterial.emissiveIntensity = 1.35;
        }
      });
    }));
    const action = actions.Experiment ?? Object.values(actions).find(Boolean) ?? null;
    action?.reset().play();
    return () => { action?.stop(); };
  }, [actions, scene]);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => { supportsCursorTracking.current = media.matches; };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useFrame(({ clock, pointer }, delta) => {
    const time = clock.getElapsedTime();
    const isTrackingCursor = supportsCursorTracking.current;
    const cursorX = isTrackingCursor ? pointer.x : Math.sin(time * 0.55) * 0.3;
    const cursorY = isTrackingCursor ? pointer.y : Math.sin(time * 0.8) * 0.18;
    const smooth = 1 - Math.exp(-8 * delta);
    const headRest = head.current && restRotation.current.get(head.current);

    if (head.current && headRest) {
      const idleSway = Math.sin(time * 0.8) * 0.018;
      const idleNod = Math.sin(time * 1.15) * 0.012;
      head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, headRest.y + MathUtils.clamp(cursorX * 0.22, -0.22, 0.22) + idleSway, smooth);
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, headRest.x + MathUtils.clamp(-cursorY * 0.1, -0.1, 0.1) + idleNod, smooth);
    }

    if (time >= nextBlinkAt.current) {
      nextBlinkAt.current = time + 2.8 + Math.random() * 2.6;
      blinkAmount.current = 1;
    }
    blinkAmount.current = Math.max(0, blinkAmount.current - delta * 8);

    eyes.current.forEach((eye) => {
      const rest = restRotation.current.get(eye);
      if (!rest) return;
      eye.rotation.y = MathUtils.lerp(eye.rotation.y, rest.y + MathUtils.clamp(cursorX * 0.36, -0.3, 0.3), smooth);
      eye.rotation.x = MathUtils.lerp(eye.rotation.x, rest.x + MathUtils.clamp(-cursorY * 0.16, -0.14, 0.14), smooth);
      const blinkScale = 1 - Math.sin(Math.min(1, blinkAmount.current) * Math.PI) * 0.82;
      eye.scale.y = MathUtils.lerp(eye.scale.y, blinkScale, 1 - Math.exp(-16 * delta));
    });
  });

  return <primitive object={scene} />;
}

export function RobotHero() {
  return <div
    className="robot-stage"
    aria-label="Interactive 3D robot playing its original animation. Drag to rotate it."
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
      <pointLight position={[0, 1.6, 2.4]} intensity={1.2} color="#22D3EE" distance={6} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.5}>
          <Robot />
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

"use client";

/* eslint-disable react/no-unknown-property */

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";

function Robot() {
  const { scene, animations } = useGLTF("/robot_playground.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    scene.getObjectByName("holo")?.removeFromParent();
    scene.getObjectByName("ground")?.removeFromParent();
    const action = actions.Experiment ?? Object.values(actions).find(Boolean) ?? null;
    action?.reset().play();
    return () => { action?.stop(); };
  }, [actions, scene]);

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

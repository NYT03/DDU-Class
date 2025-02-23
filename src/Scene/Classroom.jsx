import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import Character from "../Components/Character";
import Screen from "../Components/Screen";

export default function Classroom({ onSceneChange }) {
  const { scene } = useGLTF("/Models/japanese_classroom.glb");
  const { camera } = useThree();

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
        }
      });

      scene.position.set(0, 0, 0);
      scene.scale.setScalar(2);
    }
  }, [scene]);

  const animationUrls = [
    "/animation/male-standing.fbx",
    "/animation/male-greeting.fbx",
    "/animation/male-talking.fbx",
    "/animation/male-Talking2.fbx",
  ];

  return (
    <>
      <primitive object={scene} />
      <Character
        url="/Models/Character01.glb"
        position={new Vector3(1.6017149525969674, 0.3, -11.751844479594805)}
        scale={new Vector3(2, 2, 2)}
        animationUrls={animationUrls}
      />
      <Screen
        url="Models/projector_screen_7mb.glb"
        position={new Vector3(2.90017149525969674, 5, -8.093239927086778)}
        scale={new Vector3(1, 1, 1)}
        videoUrl="./src/videos/videoplayback.mp4"
      />
      <CameraControls onSceneChange={onSceneChange} />
    </>
  );
}
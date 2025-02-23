import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

function Character({ url, position, scale, animationUrls }) {
  const { scene } = useGLTF(url);
  // console.log("hi");
  const characterRef = useRef();
  const mixerRef = useRef();
  const [animations, setAnimations] = useState([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);

  // Load animations
  useEffect(() => {
    const loadAnimations = async () => {
      const loader = new FBXLoader();
      const loadedAnimations = await Promise.all(
        animationUrls.map((url) =>
          loader.loadAsync(url).then((clip) => {
            const animation = clip.animations[0]; // Assuming each FBX file contains one animation
            return animation;
          })
        )
      );
      setAnimations(loadedAnimations);
      // console.log("Animations loaded:", loadedAnimations);
    };

    loadAnimations();
  }, [animationUrls]);

  // Set up animation mixer
  useEffect(() => {
    if (scene && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);

      // Play the first animation
      const action = mixerRef.current.clipAction(animations[3]);
      action.play();

      // When the animation finishes, play the next one
      mixerRef.current.addEventListener("finished", () => {
        setCurrentAnimationIndex((prevIndex) => (prevIndex + 1) % animations.length);
      });
    }
  }, [scene, animations, currentAnimationIndex]);

  // Update animation mixer on each frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
        }
      });

      scene.position.set(position.x, position.y, position.z);
      scene.scale.set(scale.x, scale.y, scale.z);
    }
  }, [scene, position, scale]);

  useFrame(() => {
    if (characterRef.current) {
      // Example: Rotate the character slightly
      characterRef.current.rotation.y = Math.PI * (3 / 2);
    }
  });

  return <primitive ref={characterRef} object={scene} />;
}

export default Character;
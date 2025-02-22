import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function Screen({ url, position, scale, videoUrl }) {
  const { scene } = useGLTF(url);
  const screenRef = useRef();
  const videoRef = useRef();
  const videoPlaneRef = useRef();

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

    // Create a video element
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = false; // Required for autoplay in most browsers
    video.autoplay = false; // Do not autoplay initially
    videoRef.current = video;

    // Create a video texture
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;

    // Create a plane geometry for the video
    const videoPlaneGeometry = new THREE.PlaneGeometry(6, 3.5); // Adjust size as needed
    const videoPlaneMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      transparent: true,
    });

    // Create a mesh for the video plane
    const videoPlane = new THREE.Mesh(videoPlaneGeometry, videoPlaneMaterial);
    videoPlane.position.set(0, -1.3, 0); // Adjust position to place it above the screen
    videoPlane.rotation.y = Math.PI/2; // Rotate to face the camera
    videoPlaneRef.current = videoPlane;

    // Add the video plane to the scene
    scene.add(videoPlane);

    // Add event listener for spacebar key press
    const handleKeyDown = (event) => {
      if (event.code === "Space" && videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play(); // Play the video if paused
        } else {
          videoRef.current.pause(); // Pause the video if playing
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup video element and event listener on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
      if (videoPlaneRef.current) {
        scene.remove(videoPlaneRef.current); // Remove the video plane from the scene
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scene, position, scale, videoUrl]);

  useFrame(() => {
    if (screenRef.current) {
      // Example: Rotate the screen slightly
      screenRef.current.rotation.y = Math.PI;
    }
  });

  return <primitive ref={screenRef} object={scene} />;
}

export default Screen;
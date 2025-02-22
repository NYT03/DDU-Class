import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Camera } from "@mediapipe/camera_utils";
import { FaceMesh, HAND_CONNECTIONS, Hands } from "@mediapipe/face_mesh";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { useGLTF, useAnimations } from "@react-three/drei";

// 3D Character Component
function Character({ faceLandmarks, handLandmarks }) {
  const { scene, animations } = useGLTF("../assets/Models/character.glb"); // Load your 3D character
  const { actions } = useAnimations(animations, scene);
  const faceRef = useRef();
  const leftHandRef = useRef();
  const rightHandRef = useRef();

  // Update character based on landmarks
  useFrame(() => {
    if (faceLandmarks && faceRef.current) {
      // Map face landmarks to character's face bones/morph targets
      faceLandmarks.forEach((landmark, index) => {
        const bone = faceRef.current.skeleton.bones[index]; // Adjust based on your rig
        bone.position.set(landmark.x * 100, landmark.y * 100, landmark.z * 100);
      });
    }

    if (handLandmarks && leftHandRef.current && rightHandRef.current) {
      // Map hand landmarks to character's hand bones
      handLandmarks.forEach((landmark, index) => {
        if (index < 21) {
          // Left hand
          const joint = leftHandRef.current.skeleton.bones[index];
          joint.rotation.set(landmark.x, landmark.y, landmark.z);
        } else {
          // Right hand
          const joint = rightHandRef.current.skeleton.bones[index - 21];
          joint.rotation.set(landmark.x, landmark.y, landmark.z);
        }
      });
    }
  });

  return (
    <primitive
      object={scene}
      ref={(node) => {
        faceRef.current = node;
        leftHandRef.current = node.getObjectByName("LeftHand"); // Adjust based on your rig
        rightHandRef.current = node.getObjectByName("RightHand"); // Adjust based on your rig
      }}
    />
  );
}

// Main App Component
export default function App() {
  const [faceLandmarks, setFaceLandmarks] = useState(null);
  const [handLandmarks, setHandLandmarks] = useState(null);
  const videoRef = useRef();

  useEffect(() => {
    // Initialize Face Mesh
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks) {
        setFaceLandmarks(results.multiFaceLandmarks[0]); // 468 points
      }
    });

    // Initialize Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks) {
        setHandLandmarks(results.multiHandLandmarks.flat()); // 21 points per hand
      }
    });

    // Start the camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <video
        ref={videoRef}
        style={{ position: "absolute", top: 0, left: 0, width: "640px", height: "480px", opacity: 0 }}
        autoPlay
        playsInline
      />
      <Canvas style={{ background: "#000" }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <Character faceLandmarks={faceLandmarks} handLandmarks={handLandmarks} />
      </Canvas>
    </div>
  );
}
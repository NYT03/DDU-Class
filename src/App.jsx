import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import "./index.css";

function Model({ url }) {
  const { scene } = useGLTF(url);
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

  return <primitive object={scene} />;
}

function CameraControls() {
  const { camera, scene } = useThree();
  const [movement, setMovement] = useState({ w: false, a: false, s: false, d: false });
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const moveDirection = useRef(new Vector3());
  const yaw = useRef(new Quaternion());
  const pitch = useRef(new Quaternion());

  // Define camera movement boundaries (you can adjust these based on your model's size)
  const [minX, maxX] = [-10, 10]; // Example boundaries for X-axis
  const [minY, maxY] = [0, 5];    // Example boundaries for Y-axis
  const [minZ, maxZ] = [-10, 10]; // Example boundaries for Z-axis

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        setMovement((prev) => ({ ...prev, [event.key.toLowerCase()]: true }));
      }
    };

    const handleKeyUp = (event) => {
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        setMovement((prev) => ({ ...prev, [event.key.toLowerCase()]: false }));
      }
    };

    const handleMouseMove = (event) => {
      if (isPointerLocked) {
        const sensitivity = 0.002;
        yaw.current.setFromAxisAngle(new Vector3(0, 1, 0), -event.movementX * sensitivity);
        pitch.current.setFromAxisAngle(new Vector3(1, 0, 0), -event.movementY * sensitivity);

        camera.quaternion.multiplyQuaternions(yaw.current, camera.quaternion);
        camera.quaternion.multiply(pitch.current);
      }
    };

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };

    const canvas = document.querySelector('canvas');
    const handleCanvasClick = () => {
      canvas.requestPointerLock();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    canvas?.addEventListener("click", handleCanvasClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      canvas?.removeEventListener("click", handleCanvasClick);
    };
  }, [camera, isPointerLocked]);

  useFrame(() => {
    moveDirection.current.set(0, 0, 0);
    const speed = 0.1;
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    if (movement.w) moveDirection.current.add(forward);
    if (movement.s) moveDirection.current.sub(forward);
    if (movement.d) moveDirection.current.add(right);
    if (movement.a) moveDirection.current.sub(right);

    if (moveDirection.current.length() > 0) {
      moveDirection.current.normalize().multiplyScalar(speed);
      camera.position.add(moveDirection.current);

      // Clamp camera position within boundaries
      camera.position.x = Math.max(minX, Math.min(maxX, camera.position.x));
      camera.position.y = Math.max(minY, Math.min(maxY, camera.position.y));
      camera.position.z = Math.max(minZ, Math.min(maxZ, camera.position.z));
    }

    // Print camera position
    console.log("Camera Position:", camera.position);
  });

  return null;
}

function useCanvasSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export default function App() {
  const { width, height } = useCanvasSize();

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <Canvas
        style={{ width: '100vw', height: '100vh' }}
        camera={{
          position: [0, 3.2, 0],
          rotation: [0, 0, 0], // Rotate 90 degrees on X-axis
          fov: 100,
          near: 0.1,
          far: 100,
          aspect: width / height
        }}
        gl={{ antialias: true }}
        linear
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 0, 30]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <hemisphereLight
          skyColor="#ffffff"
          groundColor="#000000"
          intensity={0.5}
        />

        <Model url="./src/assets/Models/japanese_classroom.glb" />
        <CameraControls />
      </Canvas>
    </div>
  );
}
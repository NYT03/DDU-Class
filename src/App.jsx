import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import Character from "./Components/Character"; // Import the Character component
import Screen from "./Components/Screen"; // Import the Character component
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
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const moveDirection = useRef(new Vector3());
  const yaw = useRef(new Quaternion());
  const pitch = useRef(new Quaternion());

  // Define camera movement boundaries (you can adjust these based on your model's size)
  const [minX, maxX] = [-100, 100.6017149525969674]; // Example boundaries for X-axis
  const [minY, maxY] = [2.254644701729502, 3.254644701729502];    // Example boundaries for Y-axis
  const [minZ, maxZ] = [-100.239667846519914,100]; // Example boundaries for Z-axis
  // const [minX, maxX] = [-19.8813049074214, -0.6017149525969674]; // Example boundaries for X-axis
  // const [minY, maxY] = [2.254644701729502, 3.254644701729502];    // Example boundaries for Y-axis
  // const [minZ, maxZ] = [-16.239667846519914, 0]; // Example boundaries for Z-axis

  // Define Y-axis positions for sitting and standing
  const standingHeight = maxY; // Standing height
  const sittingHeight = minY;  // Sitting height

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
        setIsSitting((prev) => !prev); // Toggle sitting state
        return; // Exit early to prevent WASD movement when Ctrl is pressed
      }
      if (!isSitting && ['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        setMovement((prev) => ({ ...prev, [event.key.toLowerCase()]: true }));
      }
      if(event.key === ' ') {
     console.log("Camera Position:", camera.position);
    }
  };

    const handleKeyUp = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
      if (!isSitting && ['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
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
  }, [camera, isPointerLocked, isSitting]);

  // Update camera Y position based on sitting state
  useEffect(() => {
    camera.position.y = isSitting ? sittingHeight : standingHeight;
  }, [isSitting, camera]);

  useFrame(() => {
    if (isSitting) return; // Disable WASD movement if sitting

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

      // Only update the X and Z components of the camera's position
      camera.position.x += moveDirection.current.x;
      camera.position.z += moveDirection.current.z;

      // Clamp camera position within boundaries (excluding Y-axis)
      camera.position.x = Math.max(minX, Math.min(maxX, camera.position.x));
      camera.position.z = Math.max(minZ, Math.min(maxZ, camera.position.z));
    }

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
  const animationUrls = [
    "./src/assets/animation/male-standing.fbx", // Path to walk animation
    "./src/assets/animation/male-greeting.fbx",  // Path to run animation
    "./src/assets/animation/male-talking.fbx", // Path to idle animation
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen ">
      <Canvas
        style={{ width: '100vw', height: '100vh' }}
        camera={{
          position: [0, 3.2, 0],
          rotation: [0, 0, 0],
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

        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 3.2, 0]} intensity={1} castShadow />
        <hemisphereLight
          skyColor="#ffffff"
          groundColor="#000000"
          intensity={0.5}
        />

        <pointLight position={[4.355419323717778, 4, -6.4732341437899485]} intensity={1} color="#ffffff" />
        <pointLight position={[4.142399511371619, 4, -11.34592639006471]} intensity={1} color="#ffffff" />
        <pointLight position={[-2.527300420645529, 5, -4.875420100860967]} intensity={1} color="#ffffff" />
        <pointLight position={[-1.9480578366581578, 5, -12.982502337486206]} intensity={10} color="#ffffff" />
        <pointLight position={[-9.130559617331466, 5, -3.6238903176399626]} intensity={10} color="#ffffff" />
        <pointLight position={[-9.468572289040646, 5, -11.940727358135227]} intensity={10} color="#ffffff" />
        <pointLight position={[-16.346997480584317, -5,-12.673959222107225]} intensity={10} color="#ffffff" />
        <pointLight position={[-16.373325816645693, -5, -3.969542383777019]} intensity={10} color="#ffffff" />

        <Model url="./src/assets/Models/japanese_classroom.glb" />
        <Character
          url="./src/assets/Models/Character01.glb" // Path to your character model
          position={new Vector3(1.6017149525969674, 0.2, -11.751844479594805)} // Adjust position as needed
          scale={new Vector3(2, 2, 2)}
          animationUrls={animationUrls} // Pass animation URLs
        />
        <Screen 
          url="./src/assets/Models/projector_screen_7mb.glb" // Path to your character model
          position={new Vector3(2.90017149525969674, 5, -8.093239927086778)} // Adjust position as needed
          scale={new Vector3(1, 1, 1)} // Adjust scale as needed
          videoUrl="./src/videos/videoplayback.mp4"
        />
        <CameraControls />
      </Canvas>
    </div>
  );
}
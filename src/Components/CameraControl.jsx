function CameraControls({ onSceneChange }) {
  const { camera, scene } = useThree();
  const [movement, setMovement] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  });
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const moveDirection = useRef(new Vector3());
  const yaw = useRef(new Quaternion());
  const pitch = useRef(new Quaternion());

  // Define camera movement boundaries
  const [minX, maxX] = [-19.8813049074214, -0.6017149525969674]; // X-axis boundaries
  const [minY, maxY] = [2.254644701729502, 3.254644701729502]; // Y-axis boundaries
  const [minZ, maxZ] = [-16.239667846519914, 0]; // Z-axis boundaries

  // Define Y-axis positions for sitting and standing
  const standingHeight = maxY; // Standing height
  const sittingHeight = minY; // Sitting height

  // Door position and dimensions
  const doorPosition = new Vector3(-10, 0, -15); // Example door position
  const doorWidth = 2; // Example door width
  const doorHeight = 3; // Example door height

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Control") {
        setIsCtrlPressed(true);
        setIsSitting((prev) => !prev); // Toggle sitting state
        return; // Exit early to prevent WASD movement when Ctrl is pressed
      }
      if (
        !isSitting &&
        ["w", "a", "s", "d"].includes(event.key.toLowerCase())
      ) {
        setMovement((prev) => ({ ...prev, [event.key.toLowerCase()]: true }));
      }
      if (event.key === " ") {
        console.log("Camera Position:", camera.position);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Control") {
        setIsCtrlPressed(false);
      }
      if (
        !isSitting &&
        ["w", "a", "s", "d"].includes(event.key.toLowerCase())
      ) {
        setMovement((prev) => ({ ...prev, [event.key.toLowerCase()]: false }));
      }
    };

    const handleMouseMove = (event) => {
      if (isPointerLocked) {
        const sensitivity = 0.002;
        yaw.current.setFromAxisAngle(
          new Vector3(0, 1, 0),
          -event.movementX * sensitivity
        );
        pitch.current.setFromAxisAngle(
          new Vector3(1, 0, 0),
          -event.movementY * sensitivity
        );

        camera.quaternion.multiplyQuaternions(yaw.current, camera.quaternion);
        camera.quaternion.multiply(pitch.current);
      }
    };

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };

    const canvas = document.querySelector("canvas");
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
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
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

    // Check if the camera is within the door's bounds
    if (
      camera.position.x >= doorPosition.x - doorWidth / 2 &&
      camera.position.x <= doorPosition.x + doorWidth / 2 &&
      camera.position.z >= doorPosition.z - doorWidth / 2 &&
      camera.position.z <= doorPosition.z + doorWidth / 2 &&
      camera.position.y >= doorPosition.y &&
      camera.position.y <= doorPosition.y + doorHeight
    ) {
      onSceneChange(); // Trigger scene change
    }
  });

  return null;
}
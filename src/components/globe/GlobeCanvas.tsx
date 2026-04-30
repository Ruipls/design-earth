import { Canvas } from '@react-three/fiber';
import { CAMERA, COLORS } from '../../lib/constants';

/**
 * The main R3F Canvas wrapper. Always mounted, fills the entire viewport.
 * Globe scene components will be added here by Agent A.
 */
export default function GlobeCanvas() {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        camera={{
          position: [0, 0, CAMERA.INITIAL_DISTANCE],
          fov: CAMERA.FOV,
          near: 0.01,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: COLORS.inkDeep }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        {/* Agent A: Add GlobeMesh, Atmosphere, AssetMarkers, CameraController, ZoomLevelManager here */}
      </Canvas>
    </div>
  );
}

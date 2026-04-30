import { Canvas } from '@react-three/fiber';
import { CAMERA, COLORS } from '../../lib/constants';
import Atmosphere from './Atmosphere';
import CameraController from './CameraController';
import CountryLabels from './CountryLabels';
import FarTierDots from './FarTierDots';
import GlobeMesh from './GlobeMesh';
import MidTierThumbnails from './MidTierThumbnails';
import NearTierCards from './NearTierCards';
import ZoomLevelManager from './ZoomLevelManager';

/**
 * The main R3F Canvas wrapper. Always mounted, fills the entire viewport.
 */
export default function GlobeCanvas() {
  return (
    <div className="fixed inset-0 h-full w-full touch-none">
      <Canvas
        camera={{
          position: [0, 0, CAMERA.INITIAL_DISTANCE],
          fov: CAMERA.FOV,
          near: 0.01,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: COLORS.inkDeep }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none';
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <GlobeMesh />
        <Atmosphere />
        <FarTierDots />
        <MidTierThumbnails />
        <NearTierCards />
        <CountryLabels />
        <ZoomLevelManager />
        <CameraController />
      </Canvas>
    </div>
  );
}

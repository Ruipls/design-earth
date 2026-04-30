import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA } from '../../lib/constants';
import { latLngToVector3 } from '../../lib/geo';
import { useGlobeStore } from '../../stores/useGlobeStore';

type FlyState = {
  startedAt: number;
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
};

function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function getFlyDestination(lat: number, lng: number, distance: number) {
  return latLngToVector3(lat, lng).normalize().multiplyScalar(distance);
}

export default function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const flyRef = useRef<FlyState | null>(null);
  const cameraTarget = useGlobeStore((state) => state.cameraTarget);

  useEffect(() => {
    if (!cameraTarget) return;

    const controls = controlsRef.current;
    const distance = THREE.MathUtils.clamp(
      camera.position.distanceTo(controls?.target ?? new THREE.Vector3()),
      CAMERA.MIN_DISTANCE,
      CAMERA.MAX_DISTANCE,
    );

    flyRef.current = {
      startedAt: performance.now(),
      startPosition: camera.position.clone(),
      endPosition: getFlyDestination(
        cameraTarget.lat,
        cameraTarget.lng,
        distance,
      ),
    };

    if (controls) {
      controls.enabled = false;
      controls.autoRotate = false;
    }
  }, [camera, cameraTarget]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const globeState = useGlobeStore.getState();
    const flyState = flyRef.current;

    controls.autoRotate = globeState.autoRotate && !flyState;
    controls.autoRotateSpeed = CAMERA.AUTO_ROTATE_SPEED;

    if (!flyState) return;

    const elapsed = performance.now() - flyState.startedAt;
    const progress = THREE.MathUtils.clamp(
      elapsed / CAMERA.FLY_TO_DURATION_MS,
      0,
      1,
    );
    const eased = easeInOutCubic(progress);

    camera.position.lerpVectors(
      flyState.startPosition,
      flyState.endPosition,
      eased,
    );
    camera.lookAt(controls.target);
    controls.update();

    if (progress >= 1) {
      camera.position.copy(flyState.endPosition);
      controls.enabled = true;
      flyRef.current = null;
      useGlobeStore.getState().clearCameraTarget();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={CAMERA.MIN_DISTANCE}
      maxDistance={CAMERA.MAX_DISTANCE}
      enableDamping
      dampingFactor={CAMERA.DAMPING_FACTOR}
      rotateSpeed={CAMERA.ROTATE_SPEED}
      onStart={() => useGlobeStore.getState().stopAutoRotate()}
    />
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, GLOBE, LIMITS } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useGlobeStore } from '../../stores/useGlobeStore';
import {
  commitVisibleAssetIds,
  createPositionedAssets,
  isPositionedAssetVisible,
  stablePhase,
} from './assetUtils';

const vertexShader = `
  attribute float aPhase;
  attribute float aVisibility;
  varying float vPhase;
  varying float vVisibility;

  void main() {
    vPhase = aPhase;
    vVisibility = aVisibility;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying float vPhase;
  varying float vVisibility;

  void main() {
    float pulse = 0.45 + 0.55 * sin(uTime * 2.0 + vPhase);
    float alpha = vVisibility * (0.35 + pulse * 0.45);
    gl_FragColor = vec4(uColor * (0.85 + pulse * 0.45), alpha);
  }
`;

export default function FarTierDots() {
  const { camera } = useThree();
  const assets = useAssetStore((state) => state.assets);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const previousVisibleIdsRef = useRef('');

  const dotData = useMemo(
    () => createPositionedAssets(assets.slice(0, LIMITS.MAX_FAR_DOTS)),
    [assets],
  );
  const phases = useMemo(
    () => Float32Array.from(dotData.map((item) => stablePhase(item.asset.id))),
    [dotData],
  );
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(COLORS.gold) },
      uTime: { value: 0 },
    }),
    [],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    for (const [index, item] of dotData.entries()) {
      dummy.position.copy(item.position);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.count = dotData.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.setAttribute(
      'aPhase',
      new THREE.InstancedBufferAttribute(phases, 1),
    );
    mesh.geometry.setAttribute(
      'aVisibility',
      new THREE.InstancedBufferAttribute(new Float32Array(dotData.length), 1),
    );
    mesh.computeBoundingSphere();
  }, [dotData, phases]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const isFarTier = useGlobeStore.getState().zoomTier === 'far';
    mesh.visible = isFarTier;
    material.uniforms.uTime.value = clock.elapsedTime;

    if (!isFarTier) return;

    const visibility = mesh.geometry.getAttribute(
      'aVisibility',
    ) as THREE.InstancedBufferAttribute | undefined;
    if (!visibility) return;

    const filters = useFilterStore.getState();
    const visibleIds: string[] = [];

    for (const [index, item] of dotData.entries()) {
      const visible = isPositionedAssetVisible(item, camera, filters);
      visibility.setX(index, visible ? 1 : 0);
      if (visible) visibleIds.push(item.asset.id);
    }

    visibility.needsUpdate = true;
    commitVisibleAssetIds(visibleIds, previousVisibleIdsRef);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, dotData.length]}>
      <sphereGeometry
        args={[
          (GLOBE.ATMOSPHERE_RADIUS - GLOBE.RADIUS) / 2,
          GLOBE.SEGMENTS / 8,
          GLOBE.SEGMENTS / 8,
        ]}
      />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
}

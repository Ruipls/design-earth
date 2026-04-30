import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS, GLOBE } from '../../lib/constants';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uAtmosphereColor;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 2.35);
    float alpha = fresnel * 0.85;
    gl_FragColor = vec4(uAtmosphereColor, alpha);
  }
`;

export default function Atmosphere() {
  const uniforms = useMemo(
    () => ({
      uAtmosphereColor: { value: new THREE.Color(COLORS.atmosphere) },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry
        args={[GLOBE.ATMOSPHERE_RADIUS, GLOBE.SEGMENTS, GLOBE.SEGMENTS]}
      />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

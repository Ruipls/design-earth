import { useMemo } from 'react';
import * as THREE from 'three';
import landGeoJsonText from '../../data/ne_110m_land.geojson?raw';
import { COLORS, GLOBE } from '../../lib/constants';
import { geoJsonCoordsToVector3Array } from '../../lib/geo';

type GeoJsonPosition = [number, number];
type GeoJsonPolygon = GeoJsonPosition[][];
type GeoJsonMultiPolygon = GeoJsonPolygon[];

type LandFeature = {
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: GeoJsonPolygon | GeoJsonMultiPolygon;
  };
};

type LandFeatureCollection = {
  features: LandFeature[];
};

function pushRingSegments(ring: GeoJsonPosition[], positions: number[]): void {
  const points = geoJsonCoordsToVector3Array(ring);
  if (points.length < 2) return;

  for (let index = 0; index < points.length - 1; index += 1) {
    positions.push(...points[index].toArray(), ...points[index + 1].toArray());
  }

  if (!points[0].equals(points[points.length - 1])) {
    positions.push(...points[points.length - 1].toArray(), ...points[0].toArray());
  }
}

function buildLandOutlineGeometry(): THREE.BufferGeometry {
  const parsed = JSON.parse(landGeoJsonText) as LandFeatureCollection;
  const positions: number[] = [];

  for (const feature of parsed.features) {
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates as GeoJsonPolygon) {
        pushRingSegments(ring, positions);
      }
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates as GeoJsonMultiPolygon) {
        for (const ring of polygon) {
          pushRingSegments(ring, positions);
        }
      }
    }
  }

  const outlineGeometry = new THREE.BufferGeometry();
  outlineGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  outlineGeometry.computeBoundingSphere();
  return outlineGeometry;
}

export default function GlobeMesh() {
  const outlineGeometry = useMemo(() => buildLandOutlineGeometry(), []);

  return (
    <group>
      <mesh>
        <sphereGeometry
          args={[GLOBE.RADIUS, GLOBE.SEGMENTS, GLOBE.SEGMENTS]}
        />
        <meshStandardMaterial
          color={COLORS.ink}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <lineSegments geometry={outlineGeometry}>
        <lineBasicMaterial
          color={GLOBE.LAND_OUTLINE_COLOR_HEX}
          opacity={GLOBE.LAND_OUTLINE_OPACITY}
          transparent
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

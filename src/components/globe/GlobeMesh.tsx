import { useEffect, useMemo } from 'react';
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

type GlobeTextures = {
  colorTexture: THREE.CanvasTexture;
  bumpTexture: THREE.CanvasTexture;
};

function lngLatToTexturePoint([lng, lat]: GeoJsonPosition): [number, number] {
  return [
    ((lng + 180) / 360) * GLOBE.LAND_TEXTURE_WIDTH,
    ((90 - lat) / 180) * GLOBE.LAND_TEXTURE_HEIGHT,
  ];
}

function rgba(hex: string, alpha: number): string {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(
    color.b * 255,
  )}, ${alpha})`;
}

function pushRingSegments(
  ring: GeoJsonPosition[],
  positions: number[],
  altitude: number,
): void {
  const points = geoJsonCoordsToVector3Array(ring, altitude);
  if (points.length < 2) return;

  for (let index = 0; index < points.length - 1; index += 1) {
    positions.push(...points[index].toArray(), ...points[index + 1].toArray());
  }

  if (!points[0].equals(points[points.length - 1])) {
    positions.push(...points[points.length - 1].toArray(), ...points[0].toArray());
  }
}

function buildLandOutlineGeometry(
  parsed: LandFeatureCollection,
  altitude: number,
): THREE.BufferGeometry {
  const positions: number[] = [];

  for (const feature of parsed.features) {
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates as GeoJsonPolygon) {
        pushRingSegments(ring, positions, altitude);
      }
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates as GeoJsonMultiPolygon) {
        for (const ring of polygon) {
          pushRingSegments(ring, positions, altitude);
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

function drawTextureRing(
  context: CanvasRenderingContext2D,
  ring: GeoJsonPosition[],
  offsetX: number,
): void {
  if (ring.length < 2) return;

  ring.forEach((coord, index) => {
    const [x, y] = lngLatToTexturePoint(coord);
    if (index === 0) {
      context.moveTo(x + offsetX, y);
    } else {
      context.lineTo(x + offsetX, y);
    }
  });

  context.closePath();
}

function drawTexturePolygon(
  context: CanvasRenderingContext2D,
  polygon: GeoJsonPolygon,
): void {
  for (const offsetX of [
    -GLOBE.LAND_TEXTURE_WIDTH,
    0,
    GLOBE.LAND_TEXTURE_WIDTH,
  ]) {
    for (const ring of polygon) {
      drawTextureRing(context, ring, offsetX);
    }
  }
}

function drawLandTextureLayer(
  context: CanvasRenderingContext2D,
  parsed: LandFeatureCollection,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
): void {
  context.beginPath();

  for (const feature of parsed.features) {
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      drawTexturePolygon(context, geometry.coordinates as GeoJsonPolygon);
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates as GeoJsonMultiPolygon) {
        drawTexturePolygon(context, polygon);
      }
    }
  }

  context.fillStyle = fillStyle;
  context.fill('evenodd');
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function createTextureCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = GLOBE.LAND_TEXTURE_WIDTH;
  canvas.height = GLOBE.LAND_TEXTURE_HEIGHT;
  return canvas;
}

function buildGlobeTextures(parsed: LandFeatureCollection): GlobeTextures {
  const colorCanvas = createTextureCanvas();
  const colorContext = colorCanvas.getContext('2d');
  const bumpCanvas = createTextureCanvas();
  const bumpContext = bumpCanvas.getContext('2d');

  if (!colorContext || !bumpContext) {
    throw new Error('Unable to create globe texture contexts');
  }

  const oceanGradient = colorContext.createLinearGradient(
    0,
    0,
    0,
    GLOBE.LAND_TEXTURE_HEIGHT,
  );
  oceanGradient.addColorStop(0, GLOBE.OCEAN_POLE_COLOR_HEX);
  oceanGradient.addColorStop(0.5, GLOBE.OCEAN_EQUATOR_COLOR_HEX);
  oceanGradient.addColorStop(1, GLOBE.OCEAN_POLE_COLOR_HEX);

  colorContext.fillStyle = oceanGradient;
  colorContext.fillRect(0, 0, GLOBE.LAND_TEXTURE_WIDTH, GLOBE.LAND_TEXTURE_HEIGHT);

  const innerOceanGradient = colorContext.createRadialGradient(
    GLOBE.LAND_TEXTURE_WIDTH / 2,
    GLOBE.LAND_TEXTURE_HEIGHT / 2,
    GLOBE.LAND_TEXTURE_HEIGHT / 10,
    GLOBE.LAND_TEXTURE_WIDTH / 2,
    GLOBE.LAND_TEXTURE_HEIGHT / 2,
    GLOBE.LAND_TEXTURE_WIDTH / 2,
  );
  innerOceanGradient.addColorStop(
    0,
    rgba(GLOBE.LAND_FILL_HIGHLIGHT_HEX, GLOBE.LAND_TEXTURE_SHADOW_OPACITY),
  );
  innerOceanGradient.addColorStop(1, rgba(GLOBE.OCEAN_BASE_COLOR_HEX, 0));
  colorContext.fillStyle = innerOceanGradient;
  colorContext.fillRect(0, 0, GLOBE.LAND_TEXTURE_WIDTH, GLOBE.LAND_TEXTURE_HEIGHT);

  drawLandTextureLayer(
    colorContext,
    parsed,
    rgba(GLOBE.LAND_FILL_COLOR_HEX, GLOBE.LAND_FILL_OPACITY),
    rgba(GLOBE.LAND_OUTLINE_COLOR_HEX, GLOBE.LAND_TEXTURE_OUTLINE_OPACITY),
    GLOBE.LAND_OUTLINE_WIDTH,
  );
  drawLandTextureLayer(
    colorContext,
    parsed,
    rgba(GLOBE.LAND_FILL_HIGHLIGHT_HEX, GLOBE.LAND_TEXTURE_SHADOW_OPACITY),
    rgba(GLOBE.LAND_OUTLINE_COLOR_HEX, GLOBE.LAND_TEXTURE_OUTLINE_OPACITY),
    GLOBE.LAND_OUTLINE_WIDTH,
  );

  bumpContext.fillStyle = COLORS.inkDeep;
  bumpContext.fillRect(0, 0, GLOBE.LAND_TEXTURE_WIDTH, GLOBE.LAND_TEXTURE_HEIGHT);
  drawLandTextureLayer(
    bumpContext,
    parsed,
    COLORS.ivory,
    COLORS.ivory,
    GLOBE.LAND_OUTLINE_WIDTH,
  );

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.ClampToEdgeWrapping;
  colorTexture.needsUpdate = true;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.ClampToEdgeWrapping;
  bumpTexture.needsUpdate = true;

  return { colorTexture, bumpTexture };
}

export default function GlobeMesh() {
  const parsedGeoJson = useMemo(
    () => JSON.parse(landGeoJsonText) as LandFeatureCollection,
    [],
  );
  const outlineGeometry = useMemo(
    () =>
      buildLandOutlineGeometry(
        parsedGeoJson,
        GLOBE.LAND_OUTLINE_SURFACE_ALTITUDE,
      ),
    [parsedGeoJson],
  );
  const outlineGlowGeometry = useMemo(
    () =>
      buildLandOutlineGeometry(parsedGeoJson, GLOBE.LAND_OUTLINE_GLOW_ALTITUDE),
    [parsedGeoJson],
  );
  const { colorTexture, bumpTexture } = useMemo(
    () => buildGlobeTextures(parsedGeoJson),
    [parsedGeoJson],
  );

  useEffect(
    () => () => {
      colorTexture.dispose();
      bumpTexture.dispose();
      outlineGeometry.dispose();
      outlineGlowGeometry.dispose();
    },
    [bumpTexture, colorTexture, outlineGeometry, outlineGlowGeometry],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry
          args={[GLOBE.RADIUS, GLOBE.SEGMENTS, GLOBE.SEGMENTS]}
        />
        <meshStandardMaterial
          color={COLORS.ivory}
          map={colorTexture}
          bumpMap={bumpTexture}
          bumpScale={GLOBE.LAND_BUMP_SCALE}
          emissive={COLORS.atmosphere}
          emissiveIntensity={GLOBE.LAND_TEXTURE_SHADOW_OPACITY}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      <lineSegments geometry={outlineGlowGeometry}>
        <lineBasicMaterial
          color={GLOBE.LAND_OUTLINE_COLOR_HEX}
          opacity={GLOBE.LAND_OUTLINE_GLOW_OPACITY}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={GLOBE.LAND_OUTLINE_WIDTH}
        />
      </lineSegments>
      <lineSegments geometry={outlineGeometry}>
        <lineBasicMaterial
          color={GLOBE.LAND_OUTLINE_COLOR_HEX}
          opacity={GLOBE.LAND_OUTLINE_OPACITY}
          transparent
          depthWrite={false}
          linewidth={GLOBE.LAND_OUTLINE_WIDTH}
        />
      </lineSegments>
    </group>
  );
}

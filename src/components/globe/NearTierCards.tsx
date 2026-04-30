import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, GLOBE, LIMITS, ZOOM } from '../../lib/constants';
import { useAssetStore } from '../../stores/useAssetStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useGlobeStore } from '../../stores/useGlobeStore';
import { useUIStore } from '../../stores/useUIStore';
import type { DesignAsset } from '../../types/DesignAsset';
import {
  authorityRank,
  categoryColor,
  commitVisibleAssetIds,
  createPositionedAssets,
  isPositionedAssetVisible,
  type PositionedAsset,
} from './assetUtils';

type CardAsset = PositionedAsset & {
  hoverPosition: THREE.Vector3;
  quaternion: THREE.Quaternion;
};

type PosterTextureMap = Record<string, THREE.CanvasTexture>;

const posterWidth = 512;
const posterHeight = 704;
const posterImageHeight = posterWidth;
const cardWidth = GLOBE.RADIUS * (ZOOM.NEAR_MAX - ZOOM.NEAR_MIN) * 0.72;
const cardHeight = cardWidth * (posterHeight / posterWidth);
const hoverLift = GLOBE.ATMOSPHERE_RADIUS - GLOBE.RADIUS;
const cardTilt = THREE.MathUtils.degToRad(15);

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  const sourceWidth = imageRatio > targetRatio ? image.height * targetRatio : image.width;
  const sourceHeight = imageRatio > targetRatio ? image.height : image.width / targetRatio;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      cursorY += lineHeight;
      lineCount += 1;
      line = word;
      if (lineCount >= maxLines) return cursorY;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    context.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}

function loadPosterImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function createPosterTexture(asset: DesignAsset): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = posterWidth;
  canvas.height = posterHeight;

  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = COLORS.ink;
    context.fillRect(0, 0, posterWidth, posterHeight);

    const image = await loadPosterImage(asset.imageUrl);
    if (image) {
      drawImageCover(context, image, 0, 0, posterWidth, posterImageHeight);
    } else {
      context.fillStyle = categoryColor(asset.category);
      context.fillRect(0, 0, posterWidth, posterImageHeight);
    }

    const gradient = context.createLinearGradient(0, posterImageHeight - 120, 0, posterImageHeight);
    gradient.addColorStop(0, 'rgba(10, 15, 13, 0)');
    gradient.addColorStop(1, COLORS.ink);
    context.fillStyle = gradient;
    context.fillRect(0, posterImageHeight - 120, posterWidth, 120);

    context.fillStyle = categoryColor(asset.category);
    context.fillRect(0, posterImageHeight, posterWidth, GLOBE.SEGMENTS / 4);

    context.fillStyle = COLORS.ivory;
    context.font = '700 42px system-ui, sans-serif';
    drawWrappedText(context, asset.name, 36, 590, posterWidth - 72, 48, 2);

    context.fillStyle = COLORS.ivoryMuted;
    context.font = '500 26px system-ui, sans-serif';
    context.fillText(
      `${asset.countryCode} · ${asset.year ?? 'Undated'}`,
      36,
      posterHeight - 40,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function usePosterTextureMap(assets: DesignAsset[]): PosterTextureMap {
  const [textures, setTextures] = useState<PosterTextureMap>({});
  const textureKey = useMemo(
    () => assets.map((asset) => `${asset.id}:${asset.imageUrl}`).join('|'),
    [assets],
  );

  useEffect(() => {
    let cancelled = false;
    const builtTextures: THREE.CanvasTexture[] = [];
    setTextures({});

    for (const asset of assets) {
      void createPosterTexture(asset).then((texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }

        builtTextures.push(texture);
        setTextures((current) => ({ ...current, [asset.id]: texture }));
      });
    }

    return () => {
      cancelled = true;
      for (const texture of builtTextures) {
        texture.dispose();
      }
    };
  }, [assets, textureKey]);

  return textures;
}

export default function NearTierCards() {
  const assets = useAssetStore((state) => state.assets);
  const groupRefs = useRef<Array<THREE.Group | null>>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const previousVisibleIdsRef = useRef('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cardAssets = useMemo(
    () =>
      [...assets]
        .sort((a, b) => authorityRank(b) - authorityRank(a))
        .slice(0, LIMITS.MAX_NEAR_CARDS),
    [assets],
  );
  const cardData = useMemo<CardAsset[]>(
    () =>
      createPositionedAssets(cardAssets).map((item) => {
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          item.normal,
        );
        quaternion.multiply(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cardTilt),
        );

        return {
          ...item,
          hoverPosition: item.position.clone().add(item.normal.clone().multiplyScalar(hoverLift)),
          quaternion,
        };
      }),
    [cardAssets],
  );
  const textures = usePosterTextureMap(cardAssets);

  useEffect(() => {
    hoveredIdRef.current = hoveredId;
  }, [hoveredId]);

  useFrame((state, delta) => {
    const isNearTier = useGlobeStore.getState().zoomTier === 'near';
    const filters = useFilterStore.getState();
    const visibleIds: string[] = [];

    for (const [index, item] of cardData.entries()) {
      const group = groupRefs.current[index];
      if (!group) continue;

      const visible = isNearTier && isPositionedAssetVisible(item, state.camera, filters);
      group.visible = visible;

      if (!visible) continue;

      const targetPosition =
        hoveredIdRef.current === item.asset.id ? item.hoverPosition : item.position;
      group.position.lerp(targetPosition, Math.min(1, delta / hoverLift));
      group.quaternion.copy(item.quaternion);
      visibleIds.push(item.asset.id);
    }

    if (isNearTier) {
      commitVisibleAssetIds(visibleIds, previousVisibleIdsRef);
    }
  });

  return (
    <group>
      {cardData.map((item, index) => {
        const texture = textures[item.asset.id];
        const hovered = hoveredId === item.asset.id;
        return (
          <group
            key={item.asset.id}
            ref={(node) => {
              groupRefs.current[index] = node;
            }}
            position={item.position}
            quaternion={item.quaternion}
            visible={false}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHoveredId(item.asset.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = '';
            }}
            onClick={(event) => {
              event.stopPropagation();
              useUIStore.getState().selectAsset(item.asset.id);
            }}
          >
            <mesh position={[0, 0, -(GLOBE.ATMOSPHERE_RADIUS - GLOBE.RADIUS) / 6]}>
              <planeGeometry args={[cardWidth * 1.08, cardHeight * 1.06]} />
              <meshBasicMaterial
                color={hovered ? COLORS.gold : categoryColor(item.asset.category)}
                side={THREE.DoubleSide}
                transparent
                opacity={hovered ? 1 : GLOBE.LAND_OUTLINE_OPACITY * 4}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <planeGeometry args={[cardWidth, cardHeight]} />
              <meshBasicMaterial
                color={texture ? COLORS.ivory : categoryColor(item.asset.category)}
                map={texture ?? null}
                side={THREE.DoubleSide}
                transparent
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

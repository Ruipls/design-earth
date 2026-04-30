import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { DesignAsset } from '../../types/DesignAsset';

type TextureMap = Record<string, THREE.Texture | null>;

export function useRemoteTextureMap(assets: DesignAsset[]): TextureMap {
  const [textures, setTextures] = useState<TextureMap>({});
  const textureKey = useMemo(
    () => assets.map((asset) => `${asset.id}:${asset.imageUrl}`).join('|'),
    [assets],
  );

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const loadedTextures: THREE.Texture[] = [];

    loader.setCrossOrigin('anonymous');
    setTextures({});

    for (const asset of assets) {
      loader.load(
        asset.imageUrl,
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }

          texture.colorSpace = THREE.SRGBColorSpace;
          loadedTextures.push(texture);
          setTextures((current) => ({ ...current, [asset.id]: texture }));
        },
        undefined,
        () => {
          if (!cancelled) {
            setTextures((current) => ({ ...current, [asset.id]: null }));
          }
        },
      );
    }

    return () => {
      cancelled = true;
      for (const texture of loadedTextures) {
        texture.dispose();
      }
    };
  }, [assets, textureKey]);

  return textures;
}

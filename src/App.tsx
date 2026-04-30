import { useEffect } from 'react';
import { useAssetStore } from './stores/useAssetStore';
import GlobeCanvas from './components/globe/GlobeCanvas';
import HUDOverlay from './components/hud/HUDOverlay';

export default function App() {
  const fetchAssets = useAssetStore((s) => s.fetchAssets);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <>
      <GlobeCanvas />
      <HUDOverlay />
    </>
  );
}

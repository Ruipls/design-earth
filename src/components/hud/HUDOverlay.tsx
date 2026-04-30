import AssetDetailPanel from '../panels/AssetDetailPanel';
import GalleryView from '../panels/GalleryView';
import RightSidebar from '../panels/RightSidebar';
import TimelineView from '../panels/TimelineView';
import CategoryFilter from './CategoryFilter';
import HUDControlBar from './HUDControlBar';
import LoadingScreen from './LoadingScreen';
import Logo from './Logo';
import SearchBar from './SearchBar';

export default function HUDOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      <LoadingScreen />

      <div className="absolute left-4 top-4 z-20">
        <Logo />
      </div>

      <div className="absolute left-4 right-4 top-20 z-20 md:right-auto">
        <SearchBar />
      </div>

      <div className="absolute left-4 right-4 top-[8.5rem] z-20 flex justify-start md:left-auto md:top-4 md:justify-end">
        <CategoryFilter />
      </div>

      <RightSidebar />
      <AssetDetailPanel />

      <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
        <HUDControlBar />
      </div>

      <GalleryView />
      <TimelineView />
    </div>
  );
}

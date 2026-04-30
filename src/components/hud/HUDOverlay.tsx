/**
 * HUD overlay container. Fixed position over the 3D canvas.
 * pointer-events: none on the container, auto on child controls.
 * Agent B will build out all HUD components here.
 */
export default function HUDOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Agent B: Add Logo, SearchBar, CategoryFilter, HUDControlBar, RightSidebar, AssetDetailPanel here */}
      {/* Agent C: Add GalleryView, TimelineView here */}
    </div>
  );
}

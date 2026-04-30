# Design Earth — Codex Agent 工作手册

> 本文档供 Codex agent 阅读执行。每个 agent 负责一个 feature branch，完成后提 PR 合并到 main。
> 仓库地址：https://github.com/Ruipls/design-earth

---

## 项目概述

Design Earth 是一个以 3D 地球为主入口的全球设计资产探索产品。技术栈：React 18 + TypeScript + Vite + @react-three/fiber + @react-three/drei + Zustand + TailwindCSS v4。

**核心体验：** 用户打开页面看到一个深色沉浸式 3D 地球，表面有设计资产的发光点/缩略图/卡片。通过滚轮缩放改变内容密度，通过 HUD 控制条切换视图和筛选。不是传统网页，是"设计地球仪"。

---

## 已就位的基础设施（main 分支）

以下文件已经存在，**不要重新创建或修改接口**：

| 文件 | 内容 |
|------|------|
| `src/types/DesignAsset.ts` | DesignAsset, Category, Authority, VisitType 类型 |
| `src/stores/useGlobeStore.ts` | cameraDistance, zoomTier, cameraTarget, autoRotate, visibleAssetIds + computeZoomTier() |
| `src/stores/useFilterStore.ts` | activeCategories, yearRange, searchQuery |
| `src/stores/useUIStore.ts` | viewMode, selectedAssetId, detailPanelOpen, sidebarExpanded |
| `src/stores/useAssetStore.ts` | assets[], loading, fetchAssets() — 从种子数据加载 |
| `src/lib/constants.ts` | ZOOM, CAMERA, COLORS, CATEGORY_COLORS, ANIMATION, LIMITS, GLOBE 等常量 |
| `src/lib/geo.ts` | latLngToVector3(), vector3ToLatLng(), greatCircleDistance(), isPointFacingCamera(), geoJsonCoordsToVector3Array() |
| `src/data/seed-assets.ts` | 40 条种子数据 |
| `src/data/ne_110m_land.geojson` | Natural Earth 110m 陆地轮廓 GeoJSON |
| `src/components/globe/GlobeCanvas.tsx` | R3F Canvas 骨架（空场景） |
| `src/components/hud/HUDOverlay.tsx` | HUD 容器骨架（空 div） |
| `src/index.css` | TailwindCSS v4 + 全局样式 + 色板 CSS 变量 |

---

## 接口契约（三个 agent 必须遵守）

### Store 读写规则

| Store | Agent A 读/写 | Agent B 读/写 | Agent C 读/写 |
|-------|:---:|:---:|:---:|
| useGlobeStore | 读写 | 只读 | 只读 |
| useFilterStore | 只读 | 读写 | 只读 |
| useUIStore | 只读 | 读写 | 读写 |
| useAssetStore | 只读 | 只读 | 只读 |

**规则：** 如果你需要新增 store 字段，在自己的 branch 上加，但不要修改已有字段的类型或语义。

### 文件归属边界

| 目录/文件 | 归属 Agent |
|-----------|-----------|
| `src/components/globe/*` | Agent A |
| `src/components/hud/*` | Agent B |
| `src/components/panels/AssetDetailPanel.tsx` | Agent B |
| `src/components/panels/RightSidebar.tsx` | Agent B |
| `src/components/panels/GalleryView.tsx` | Agent C |
| `src/components/panels/TimelineView.tsx` | Agent C |
| `src/components/ui/*` | Agent B（共享 UI 组件） |
| `src/hooks/*` | 谁需要谁创建，文件名不要冲突 |
| `src/lib/*` | 已有文件不要改，可以新增 |
| `src/stores/*` | 可以新增字段，不要改已有接口 |

---

## Agent A：3D 地球 + 缩放系统 + 资产标记

**分支：** `feature/globe-3d`

**你的工作全部在 `src/components/globe/` 目录下。** 修改 `GlobeCanvas.tsx` 并新建以下文件：

### 任务清单

1. **GlobeMesh.tsx** — 深色地球球体
   - `SphereGeometry(1, 64, 64)` + `MeshStandardMaterial` 颜色 `#0a0f0d`
   - 解析 `src/data/ne_110m_land.geojson`，将陆地多边形转为 `THREE.LineSegments` 贴合球面
   - 用 `geoJsonCoordsToVector3Array()` 做坐标转换
   - 轮廓线颜色：`GLOBE.LAND_OUTLINE_COLOR_HEX`，opacity `GLOBE.LAND_OUTLINE_OPACITY`
   - 线条用 `LineBasicMaterial` + `transparent: true`

2. **Atmosphere.tsx** — 大气层光晕
   - 略大球体 radius `GLOBE.ATMOSPHERE_RADIUS`
   - 自定义 ShaderMaterial，fresnel 效果，微绿色调 `COLORS.atmosphere`
   - `side: THREE.BackSide`, `blending: THREE.AdditiveBlending`, `transparent: true`

3. **CameraController.tsx** — 相机控制
   - 使用 drei `<OrbitControls>`: `enablePan={false}`, `minDistance={CAMERA.MIN_DISTANCE}`, `maxDistance={CAMERA.MAX_DISTANCE}`, `enableDamping={true}`, `dampingFactor={CAMERA.DAMPING_FACTOR}`, `rotateSpeed={CAMERA.ROTATE_SPEED}`
   - **无缩放按钮**，缩放仅通过滚轮/两指
   - 实现 `flyTo(lat, lng, distance)`: 用 `useFrame` 做 lerp 动画，duration `CAMERA.FLY_TO_DURATION_MS`
   - 监听 `useGlobeStore.cameraTarget`，有值时触发 flyTo，完成后 `clearCameraTarget()`
   - 初始自动旋转 `CAMERA.AUTO_ROTATE_SPEED`，首次用户交互后调用 `stopAutoRotate()`

4. **ZoomLevelManager.tsx** — 缩放层级管理
   - `useFrame` 每帧读取 OrbitControls 的相机距离
   - 调用 `computeZoomTier()` 计算层级
   - 防抖 `ZOOM.TIER_DEBOUNCE_MS` 后更新 `useGlobeStore.setZoomTier()`
   - 同时更新 `useGlobeStore.setCameraDistance()`

5. **FarTierDots.tsx** — 远景发光点
   - `InstancedMesh` + 自定义 `ShaderMaterial`（additive blending）
   - 颜色 `COLORS.gold`，每个点有随机相位的脉冲动画
   - 用 `latLngToVector3()` 定位
   - 响应 `useFilterStore`：不匹配的点 opacity → 0
   - 用 `isPointFacingCamera()` 隐藏球体背面的点
   - 仅在 `zoomTier === 'far'` 时显示

6. **MidTierThumbnails.tsx** — 中景缩略图
   - Billboard 平面，朝向相机
   - 使用种子数据的 `imageUrl` 加载纹理（picsum 占位图）
   - 分类色边框（用 `CATEGORY_COLORS`）
   - 屏幕空间聚类剔除：30px 内只显示最高 authority 的
   - 仅在 `zoomTier === 'mid'` 时显示

7. **NearTierCards.tsx** — 近景海报卡片
   - 独立平面 mesh + canvas-to-texture 预渲染（图片 + 名称 + 年份）
   - 略微倾斜贴合球面法线（15度）
   - Hover: 抬起 + 金色边框
   - Click: 调用 `useUIStore.selectAsset(id)`
   - 仅在 `zoomTier === 'near'` 时显示

8. **CountryLabels.tsx** — 国家聚合标签
   - drei `<Html>` 组件，显示 "US 12" 格式
   - 仅 Far 层显示，≥3 个资产的国家
   - `occlude` 隐藏球体背面

9. **更新 GlobeCanvas.tsx** — 将以上组件组装进 Canvas

### 验收标准
- 深色地球有清晰陆地轮廓线
- 滚轮缩放时三层级平滑切换（光点 → 缩略图 → 卡片）
- 球体背面内容自动隐藏
- flyTo 动画流畅

---

## Agent B：HUD 层 + 筛选 + 侧边栏 + 详情面板

**分支：** `feature/hud-ui`

**你的工作在 `src/components/hud/` 和 `src/components/panels/`（AssetDetailPanel + RightSidebar）。**

### 任务清单

1. **更新 HUDOverlay.tsx** — 组装所有 HUD 子组件

2. **Logo.tsx** — 左上角
   - "DESIGN EARTH" 小号大写，`text-ivory tracking-widest text-sm`

3. **SearchBar.tsx** — 左上角 Logo 下方
   - 半透明深色底输入框，`bg-hud backdrop-blur-md`
   - 桌面 280px 宽，移动端全宽
   - 实时更新 `useFilterStore.setSearchQuery()`
   - 移动端默认隐藏，点击搜索图标展开

4. **CategoryFilter.tsx** — 右上角
   - 5 个药丸按钮，激活态 `border-gold`，非激活态 `bg-hud text-ivory`
   - 点击调用 `useFilterStore.toggleCategory()`
   - 全选按钮调用 `useFilterStore.setAllCategories()`
   - 移动端横向可滚动

5. **HUDControlBar.tsx** — 底部浮动条
   - 距底 16px，圆角 12px，`bg-hud backdrop-blur-md border border-hud-border`
   - 包含 ViewModeSwitcher + YearRangeSlider
   - **没有缩放按钮**
   - `pointer-events: auto`

6. **ViewModeSwitcher.tsx** — HUD 左侧
   - 三段式按钮：Globe / Gallery / Timeline
   - 激活态 `bg-gold text-ink`，非激活态透明
   - 调用 `useUIStore.setViewMode()`

7. **YearRangeSlider.tsx** — HUD 中央
   - 双滑块范围选择器，1850-2026
   - 金色轨道，decade 标签
   - 调用 `useFilterStore.setYearRange()`

8. **AssetDetailPanel.tsx** — `src/components/panels/`
   - 桌面：右侧滑入 420px；移动端：底部滑入全宽
   - 读取 `useUIStore.selectedAssetId`，从 `useAssetStore.assets` 查找数据
   - 内容：图片 → 名称 → 本地名/中文名 → 国家|城市|年份 → 分类标签 → 描述 → 标签 → 来源链接 → 权威性标识
   - 关闭按钮调用 `useUIStore.closeDetail()`
   - 打开时设置 `useGlobeStore.setCameraTarget(lat, lng)` 触发 flyTo

9. **RightSidebar.tsx** — `src/components/panels/`
   - 收起态：右侧边缘 tab 手柄 40x120px
   - 展开态：320px 宽，`bg-hud backdrop-blur-md`
   - 内容：视口统计 + 国家排行 + 资产列表
   - 读取 `useGlobeStore.visibleAssetIds` 计算
   - 点击国家/资产 → `useGlobeStore.setCameraTarget()`
   - 移动端：底部上滑抽屉

10. **LoadingScreen.tsx** — 全屏加载
    - 深色背景 `bg-ink-deep` + Logo + CSS spinner
    - 监听 `useAssetStore.loading`，false 时淡出

### 验收标准
- HUD 是半透明游戏风格，不是传统网页导航
- 所有筛选操作正确更新 store
- 详情面板和侧边栏动画流畅
- 移动端布局正确

---

## Agent C：画廊 + 时间线 + 视图切换 + 响应式

**分支：** `feature/views`

**你的工作在 `src/components/panels/`（GalleryView + TimelineView）+ 视图切换逻辑。**

### 任务清单

1. **GalleryView.tsx** — `src/components/panels/`
   - 监听 `useUIStore.viewMode === 'gallery'` 时显示
   - 桌面分屏：左 30% 留给地球 canvas，右 70% 画廊面板
   - 移动端：画廊全屏
   - 卡片网格：桌面 3 列、平板 2 列、移动端 1 列
   - 每张卡片：图片（16:10 aspect-ratio）+ 名称 + 国家 + 年份 + 分类图标
   - 排序下拉：按年份 / 按国家 / 按名称
   - 数据源：从 `useAssetStore.assets` 结合 `useFilterStore` 过滤
   - 点击卡片 → `useUIStore.selectAsset(id)`

2. **TimelineView.tsx** — `src/components/panels/`
   - 监听 `useUIStore.viewMode === 'timeline'` 时显示
   - 同样的分屏布局
   - 横轴：1850-2026，可水平滚动/拖拽
   - 纵轴：5 个分类泳道，每泳道 60px
   - 资产绘制为圆点，颜色用 `CATEGORY_COLORS`
   - Hover tooltip：名称 + 国家 + 年份
   - 点击 → `useUIStore.selectAsset(id)`
   - 与 `useFilterStore.yearRange` 同步

3. **视图切换动画**
   - Globe → Gallery/Timeline：地球 canvas 缩小到左侧（CSS transition 500ms）
   - 返回 Globe：反向动画
   - 需要修改 `GlobeCanvas.tsx` 的容器样式（通过 className 切换）
   - 监听 `useUIStore.viewMode`

4. **更新 HUDOverlay.tsx** — 在其中挂载 GalleryView 和 TimelineView

5. **全局响应式**
   - 断点：mobile < 768px, tablet 768-1023px, desktop ≥ 1024px（用 `BREAKPOINTS`）
   - 确保所有视图在三个断点下布局正确

### 验收标准
- 画廊卡片网格响应式正确
- 时间线可水平滚动，泳道清晰
- 视图切换动画流畅
- 移动端所有视图可用

---

## 风险预案

### 风险 1：GeoJSON 解析性能

**问题：** ne_110m_land.geojson 有大量多边形坐标，逐点转换可能导致首屏卡顿。

**预防：** Agent A 应在组件 mount 时一次性转换并缓存为 `BufferGeometry`，不要在 `useFrame` 中重复计算。用 `useMemo` 包裹转换逻辑。

### 风险 2：InstancedMesh 与 Zustand 的 re-render

**问题：** `useFilterStore` 变化时，如果 FarTierDots 整体 re-render，会重建 InstancedMesh 导致闪烁。

**预防：** Agent A 应使用 `useRef` 持有 InstancedMesh 引用，在 `useFrame` 中通过 `instanceMatrix` 和 uniform 更新可见性，而不是通过 React re-render。用 Zustand 的 `useStore.getState()` 在 useFrame 中读取，避免订阅触发 re-render。

### 风险 3：三个 agent 修改同一文件

**问题：** GlobeCanvas.tsx 和 HUDOverlay.tsx 是共享入口文件，三个 agent 都需要修改。

**预防：**
- Agent A 负责 GlobeCanvas.tsx 的最终内容
- Agent B 负责 HUDOverlay.tsx 的最终内容
- Agent C 需要修改这两个文件时，在自己的组件中通过 store 和 CSS class 控制，尽量不直接改这两个文件
- 合并时如有冲突，按 A → B → C 顺序，后合并的 rebase 到最新 main

### 风险 4：TailwindCSS v4 语法差异

**问题：** TailwindCSS v4 使用 `@theme` 而非 `tailwind.config.ts`，自定义颜色通过 CSS 变量定义。Codex 可能按 v3 语法写。

**预防：** 自定义颜色已在 `src/index.css` 的 `@theme` 块中定义。使用方式：`text-ivory`, `bg-ink`, `border-gold` 等。不要创建 `tailwind.config.ts` 文件。

### 风险 5：Canvas 纹理加载失败

**问题：** 种子数据使用 picsum.photos 占位图，网络不稳定时纹理加载失败会导致白色方块。

**预防：** Agent A 在 MidTierThumbnails 和 NearTierCards 中应实现 fallback：纹理加载失败时显示纯色 + 分类色块。用 `useTexture` 的 onError 回调或 try-catch。

### 风险 6：移动端 OrbitControls 与页面滚动冲突

**问题：** 触控设备上 OrbitControls 的拖拽/缩放可能与浏览器默认滚动冲突。

**预防：** Agent A 在 Canvas 容器上设置 `touch-action: none`（已在 CSS 中通过 `overflow: hidden` 部分解决）。确保 `<canvas>` 元素有 `touch-action: none` 样式。

### 风险 7：详情面板打开时 flyTo 与用户操作冲突

**问题：** 用户点击资产触发 flyTo 动画期间，如果用户同时拖拽地球，会产生抖动。

**预防：** Agent A 在 CameraController 中，flyTo 动画期间应临时禁用 OrbitControls（`controls.enabled = false`），动画结束后恢复。

---

## 合并顺序和流程

```
1. Agent A 完成 → PR → 合并到 main
2. Agent B rebase main → 解决冲突 → PR → 合并
3. Agent C rebase main → 解决冲突 → PR → 合并
4. 集成测试 → 修复联动问题
```

每个 agent 完成后运行 `npx tsc --noEmit && npx vite build` 确保编译通过。


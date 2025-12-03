'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ScreenDetail, ResolvedArea, ResolvedElement, ResponsiveBehavior } from '@/types/design';

interface LayoutViewerProps {
  screenData: ScreenDetail;
  selectedElement: ResolvedElement | null;
  selectedArea: ResolvedArea | null;
  onElementSelect: (element: ResolvedElement | null) => void;
  onAreaSelect: (area: ResolvedArea | null) => void;
  onDeselect: () => void;
}

// レイアウト計算用の定数
const PADDING = 20;
const CELL_WIDTH = 180;
const MIN_CELL_HEIGHT = 60;
const ELEMENT_HEIGHT = 28;
const ELEMENT_GAP = 4;
const GAP = 10;
const HEADER_HEIGHT = 24;
const NESTED_AREA_HEIGHT = 26;

interface GridCell {
  areaId: string;
  startCol: number;
  startRow: number;
  colSpan: number;
  rowSpan: number;
}

// gridAreasから各エリアのグリッド位置を計算
function calculateGridCells(gridAreas: string[][]): GridCell[] {
  const cells: GridCell[] = [];
  const processed = new Set<string>();

  for (let row = 0; row < gridAreas.length; row++) {
    for (let col = 0; col < gridAreas[row].length; col++) {
      const areaId = gridAreas[row][col];
      if (processed.has(areaId)) continue;
      processed.add(areaId);

      let colSpan = 0;
      for (let c = col; c < gridAreas[row].length && gridAreas[row][c] === areaId; c++) {
        colSpan++;
      }

      let rowSpan = 0;
      for (let r = row; r < gridAreas.length && gridAreas[r][col] === areaId; r++) {
        rowSpan++;
      }

      cells.push({ areaId, startCol: col, startRow: row, colSpan, rowSpan });
    }
  }

  return cells;
}

export default function LayoutViewer({
  screenData,
  selectedElement,
  selectedArea,
  onElementSelect,
  onAreaSelect,
  onDeselect,
}: LayoutViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });

  // viewportsから利用可能なビューポートIDを取得
  const viewports = useMemo(() => screenData.viewports || [], [screenData.viewports]);
  const defaultViewportId = useMemo(() => {
    // デフォルトはminWidthが最も大きいもの（通常desktop）
    if (viewports.length === 0) return 'desktop';
    const sorted = [...viewports].sort((a, b) => (b.minWidth || 0) - (a.minWidth || 0));
    return sorted[0].id;
  }, [viewports]);

  const [viewportId, setViewportId] = useState<string>(defaultViewportId);

  // viewportsが変更されたらviewportIdを更新
  useEffect(() => {
    if (viewports.length > 0 && !viewports.find(v => v.id === viewportId)) {
      setViewportId(defaultViewportId);
    }
  }, [viewports, viewportId, defaultViewportId]);

  // ビューポートに応じたレスポンシブ設定を取得
  const getResponsiveValue = useCallback(
    <T,>(base: T | undefined, responsiveBehavior: ResponsiveBehavior | undefined, key: string): T | undefined => {
      const viewportBehavior = responsiveBehavior?.[viewportId];
      if (viewportBehavior && key in viewportBehavior && (viewportBehavior as Record<string, unknown>)[key] !== undefined) {
        return (viewportBehavior as Record<string, unknown>)[key] as T;
      }
      return base;
    },
    [viewportId]
  );

  // エリア/要素がhiddenかどうかを判定
  const isHidden = useCallback(
    (responsiveBehavior: ResponsiveBehavior | undefined): boolean => {
      const viewportBehavior = responsiveBehavior?.[viewportId];
      return viewportBehavior?.hidden === true;
    },
    [viewportId]
  );

  // エリアマップを構築
  const areaMap = useMemo(() => {
    const map = new Map<string, ResolvedArea>();
    for (const area of screenData.areas || []) {
      map.set(area.areaId, area);
    }
    return map;
  }, [screenData.areas]);

  // エレメントマップを構築
  const elementMap = useMemo(() => {
    const map = new Map<string, ResolvedElement>();
    for (const element of screenData.elements || []) {
      map.set(element.elementId, element);
    }
    return map;
  }, [screenData.elements]);

  // childrenから子エリアを取得（hiddenはフィルタリング）
  const getChildAreas = useCallback(
    (area: ResolvedArea): ResolvedArea[] => {
      if (!area.children) return [];
      return area.children
        .filter((ref) => ref.startsWith('@'))
        .map((ref) => areaMap.get(ref.substring(1)))
        .filter((a): a is ResolvedArea => a !== undefined)
        .filter((a) => !isHidden(a.responsiveBehavior));
    },
    [areaMap, isHidden]
  );

  // childrenから子エレメントを取得（hiddenはフィルタリング）
  const getChildElements = useCallback(
    (area: ResolvedArea): ResolvedElement[] => {
      if (!area.children) return [];
      return area.children
        .filter((ref) => ref.startsWith('$'))
        .map((ref) => elementMap.get(ref.substring(1)))
        .filter((e): e is ResolvedElement => e !== undefined)
        .filter((e) => !isHidden(e.responsiveBehavior));
    },
    [elementMap, isHidden]
  );

  // エリアの必要な高さを再帰的に計算
  const calculateAreaHeight = useCallback(
    (area: ResolvedArea, width: number, depth: number = 0): number => {
      const childElements = getChildElements(area);
      const childAreas = getChildAreas(area);
      const innerWidth = width - 12;

      // デバイスに応じたlayoutを取得
      const effectiveLayout = getResponsiveValue(area.layout, area.responsiveBehavior, 'layout') || area.layout;

      let contentHeight = HEADER_HEIGHT;

      if (effectiveLayout === 'vertical') {
        // 縦並び: 要素と子エリアを縦に積む
        contentHeight += childElements.length * (ELEMENT_HEIGHT + ELEMENT_GAP);
        for (const childArea of childAreas) {
          const childHeight = calculateAreaHeight(childArea, innerWidth, depth + 1);
          contentHeight += childHeight + ELEMENT_GAP;
        }
      } else if (effectiveLayout === 'horizontal') {
        // 横並び: 要素は1行、子エリアも1行（最大高さ）
        if (childElements.length > 0) {
          contentHeight += ELEMENT_HEIGHT + ELEMENT_GAP;
        }
        if (childAreas.length > 0) {
          let maxChildHeight = 0;
          for (const childArea of childAreas) {
            const childWidth = (innerWidth - (childAreas.length - 1) * ELEMENT_GAP) / childAreas.length;
            const childHeight = calculateAreaHeight(childArea, childWidth, depth + 1);
            maxChildHeight = Math.max(maxChildHeight, childHeight);
          }
          contentHeight += maxChildHeight + ELEMENT_GAP;
        }
      } else {
        // グリッド/未指定
        const elementsPerRow = Math.max(1, Math.floor(innerWidth / 54));
        const elementRows = Math.ceil(childElements.length / elementsPerRow);
        contentHeight += elementRows * (ELEMENT_HEIGHT + ELEMENT_GAP);
        for (const childArea of childAreas) {
          const childHeight = calculateAreaHeight(childArea, innerWidth, depth + 1);
          contentHeight += childHeight + ELEMENT_GAP;
        }
      }

      return Math.max(MIN_CELL_HEIGHT, contentHeight + 8);
    },
    [getChildElements, getChildAreas, getResponsiveValue]
  );

  // ルートエリア
  const rootArea = useMemo(() => {
    return screenData.areas?.find((a) => a.gridAreas && a.gridAreas.length > 0);
  }, [screenData.areas]);

  // ルートエリアの有効なレイアウト（ビューポートに応じて変化）
  const effectiveRootLayout = useMemo(() => {
    if (!rootArea) return 'vertical';
    return getResponsiveValue(rootArea.layout, rootArea.responsiveBehavior, 'layout') || rootArea.layout || 'grid';
  }, [rootArea, getResponsiveValue]);

  // ルートエリアの有効なgridAreas（ビューポートに応じて変化、nullの場合はgridを使わない）
  const effectiveGridAreas = useMemo(() => {
    if (!rootArea) return null;
    // responsiveBehaviorでgridAreasがnullに設定されている場合はnullを返す
    const viewportBehavior = rootArea.responsiveBehavior?.[viewportId];
    if (viewportBehavior && 'gridAreas' in viewportBehavior) {
      return viewportBehavior.gridAreas;
    }
    return rootArea.gridAreas;
  }, [rootArea, viewportId]);

  // グリッドセル計算（hiddenエリアを除外）
  const gridCells = useMemo(() => {
    if (!effectiveGridAreas || effectiveRootLayout === 'vertical') return [];

    // hiddenなエリアを除外してgridAreasを再計算
    const visibleAreaIds = new Set<string>();
    for (const row of effectiveGridAreas) {
      for (const areaId of row) {
        const area = areaMap.get(areaId);
        if (area && !isHidden(area.responsiveBehavior)) {
          visibleAreaIds.add(areaId);
        }
      }
    }

    // hiddenエリアを除外した新しいgridAreasを作成
    const filteredGridAreas: string[][] = [];
    for (const row of effectiveGridAreas) {
      const filteredRow = row.filter(areaId => visibleAreaIds.has(areaId));
      if (filteredRow.length > 0) {
        filteredGridAreas.push(filteredRow);
      }
    }

    if (filteredGridAreas.length === 0) return [];
    return calculateGridCells(filteredGridAreas);
  }, [effectiveGridAreas, effectiveRootLayout, areaMap, isHidden]);

  // グリッドの行・列数
  const gridDimensions = useMemo(() => {
    if (gridCells.length === 0) return { rows: 0, cols: 0 };
    const maxRow = Math.max(...gridCells.map(c => c.startRow + c.rowSpan));
    const maxCol = Math.max(...gridCells.map(c => c.startCol + c.colSpan));
    return { rows: maxRow, cols: maxCol };
  }, [gridCells]);

  // 各行の高さを計算（グリッドセルベース）
  const rowHeights = useMemo(() => {
    if (gridCells.length === 0 || gridDimensions.rows === 0) return [];

    const heights: number[] = new Array(gridDimensions.rows).fill(MIN_CELL_HEIGHT);

    for (const cell of gridCells) {
      const area = areaMap.get(cell.areaId);
      if (!area) continue;

      const width = cell.colSpan * CELL_WIDTH + (cell.colSpan - 1) * GAP;
      const height = calculateAreaHeight(area, width);

      // rowSpan=1のセルのみで高さを決定（複数行にまたがるセルは考慮しない）
      if (cell.rowSpan === 1) {
        heights[cell.startRow] = Math.max(heights[cell.startRow], height);
      }
    }

    return heights;
  }, [gridCells, gridDimensions.rows, areaMap, calculateAreaHeight]);

  // 行のY座標を計算
  const rowYPositions = useMemo(() => {
    const positions: number[] = [0];
    for (let i = 0; i < rowHeights.length - 1; i++) {
      positions.push(positions[i] + rowHeights[i] + GAP);
    }
    return positions;
  }, [rowHeights]);

  // SVGの寸法を計算
  const dimensions = useMemo(() => {
    // グリッドレイアウトの場合
    if (gridDimensions.cols > 0 && rowHeights.length > 0) {
      const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rowHeights.length - 1) * GAP;
      return {
        width: PADDING * 2 + gridDimensions.cols * CELL_WIDTH + (gridDimensions.cols - 1) * GAP,
        height: PADDING * 2 + totalHeight + 50,
      };
    }

    // 縦並びレイアウトの場合（rootAreaのchildrenを計算）
    if (rootArea) {
      const childAreas = rootArea.children
        ?.filter((ref) => ref.startsWith('@'))
        .map((ref) => areaMap.get(ref.substring(1)))
        .filter((a): a is ResolvedArea => a !== undefined && !isHidden(a.responsiveBehavior)) || [];

      const containerWidth = 600; // 縦並び時の固定幅
      let totalHeight = 0;
      for (const area of childAreas) {
        totalHeight += calculateAreaHeight(area, containerWidth) + GAP;
      }
      return {
        width: PADDING * 2 + containerWidth,
        height: PADDING * 2 + totalHeight + 50,
      };
    }

    // フォールバック
    const height = (screenData.areas?.length || 0) * (MIN_CELL_HEIGHT + PADDING) + PADDING * 2;
    return { width: 800, height };
  }, [gridDimensions, rowHeights, screenData.areas, rootArea, areaMap, isHidden, calculateAreaHeight]);

  // マウスホイールでズーム
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.3), 4));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: pan.x, y: pan.y });
      setStartMouse({ x: e.clientX, y: e.clientY });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;
      setPan({ x: startPan.x + dx, y: startPan.y + dy });
    },
    [isPanning, startMouse, startPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        (e.target as SVGElement).tagName === 'svg' ||
        ((e.target as SVGElement).tagName === 'rect' &&
          (e.target as SVGElement).getAttribute('data-background') === 'true')
      ) {
        onDeselect();
      }
    },
    [onDeselect]
  );

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // エリアを再帰的に描画
  const renderArea = (area: ResolvedArea, x: number, y: number, width: number, height: number, depth: number = 0) => {
    const isAreaSelected = selectedArea?.areaId === area.areaId;
    const childElements = getChildElements(area);
    const childAreas = getChildAreas(area);
    const innerWidth = width - 12;

    // デバイスに応じたlayout・sizeHintを取得
    const effectiveLayout = getResponsiveValue(area.layout, area.responsiveBehavior, 'layout') || area.layout;
    const effectiveSizeHint = getResponsiveValue(area.sizeHint, area.responsiveBehavior, 'sizeHint') || area.sizeHint;

    // 深さに応じた背景色
    const bgColors = ['#fff', '#fafafa', '#f5f5f5', '#f0f0f0'];
    const bgColor = isAreaSelected ? '#e0f2fe' : bgColors[Math.min(depth, bgColors.length - 1)];

    return (
      <g key={area.areaId}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={bgColor}
          stroke={isAreaSelected ? '#0284c7' : '#94a3b8'}
          strokeWidth={isAreaSelected ? 2 : 1}
          rx={4}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onAreaSelect(area);
          }}
        />

        {/* Area ラベル */}
        <text x={x + 6} y={y + 14} fontSize={10} fontWeight="bold" fill="#475569">
          {area.areaId}
          {area.inherited && (
            <tspan fill="#94a3b8" fontSize={8}> (inherited)</tspan>
          )}
        </text>

        {/* sizeHint・layout表示（デバイスに応じた値を表示） */}
        <text x={x + width - 6} y={y + 14} fontSize={8} fill="#94a3b8" textAnchor="end">
          {effectiveLayout || ''}{effectiveSizeHint ? ` / ${effectiveSizeHint}` : ''}
        </text>

        {/* レイアウトに応じた子要素の配置 */}
        {(() => {
          let currentY = y + HEADER_HEIGHT;

          const elements: JSX.Element[] = [];

          if (effectiveLayout === 'vertical') {
            // 縦並び: 要素を先に、その後子エリア
            childElements.forEach((element, idx) => {
              const ex = x + 6;
              const ey = currentY;
              const ew = innerWidth;
              elements.push(renderElement(element, ex, ey, ew));
              currentY += ELEMENT_HEIGHT + ELEMENT_GAP;
            });

            childAreas.forEach((childArea) => {
              const childHeight = calculateAreaHeight(childArea, innerWidth, depth + 1);
              elements.push(renderArea(childArea, x + 6, currentY, innerWidth, childHeight, depth + 1));
              currentY += childHeight + ELEMENT_GAP;
            });

          } else if (effectiveLayout === 'horizontal') {
            // 横並び: layoutHintに応じて配置
            if (childElements.length > 0) {
              const leftElements = childElements.filter(e => e.layoutHint === 'leftAligned' || !e.layoutHint);
              const rightElements = childElements.filter(e => e.layoutHint === 'rightAligned');
              const centerElements = childElements.filter(e => e.layoutHint === 'centered');

              const elemWidth = Math.min(70, (innerWidth - (childElements.length - 1) * ELEMENT_GAP) / Math.max(childElements.length, 2));

              // 左寄せ要素
              let leftX = x + 6;
              leftElements.forEach((element) => {
                elements.push(renderElement(element, leftX, currentY, elemWidth));
                leftX += elemWidth + ELEMENT_GAP;
              });

              // 右寄せ要素（右端から配置）
              let rightX = x + width - 6 - elemWidth;
              [...rightElements].reverse().forEach((element) => {
                elements.push(renderElement(element, rightX, currentY, elemWidth));
                rightX -= elemWidth + ELEMENT_GAP;
              });

              // 中央寄せ要素
              if (centerElements.length > 0) {
                const centerWidth = centerElements.length * elemWidth + (centerElements.length - 1) * ELEMENT_GAP;
                let centerX = x + 6 + (innerWidth - centerWidth) / 2;
                centerElements.forEach((element) => {
                  elements.push(renderElement(element, centerX, currentY, elemWidth));
                  centerX += elemWidth + ELEMENT_GAP;
                });
              }

              currentY += ELEMENT_HEIGHT + ELEMENT_GAP;
            }

            // 子エリアも横並び（sizeHintに応じて幅を調整）
            if (childAreas.length > 0) {
              // sizeHintに基づいて幅を計算（レスポンシブ対応）
              const getChildSizeHint = (a: ResolvedArea) =>
                getResponsiveValue(a.sizeHint, a.responsiveBehavior, 'sizeHint') || a.sizeHint;

              const narrowCount = childAreas.filter(a => getChildSizeHint(a) === 'narrow').length;
              const fillCount = childAreas.filter(a => getChildSizeHint(a) === 'fill' || !getChildSizeHint(a)).length;
              const autoCount = childAreas.filter(a => getChildSizeHint(a) === 'auto').length;

              const narrowWidth = 120;
              const autoWidth = 100;
              const usedWidth = narrowCount * narrowWidth + autoCount * autoWidth + (childAreas.length - 1) * ELEMENT_GAP;
              const fillWidth = fillCount > 0 ? (innerWidth - usedWidth) / fillCount : 0;

              let maxChildHeight = 0;
              const areaWidths: number[] = [];
              childAreas.forEach((childArea) => {
                const childSizeHint = getChildSizeHint(childArea);
                let w: number;
                if (childSizeHint === 'narrow') w = narrowWidth;
                else if (childSizeHint === 'auto') w = autoWidth;
                else w = Math.max(fillWidth, 100);
                areaWidths.push(w);
                const h = calculateAreaHeight(childArea, w, depth + 1);
                maxChildHeight = Math.max(maxChildHeight, h);
              });

              let ax = x + 6;
              childAreas.forEach((childArea, idx) => {
                elements.push(renderArea(childArea, ax, currentY, areaWidths[idx], maxChildHeight, depth + 1));
                ax += areaWidths[idx] + ELEMENT_GAP;
              });
            }

          } else {
            // グリッド/未指定: 要素はグリッド、子エリアは縦並び
            const elementsPerRow = Math.max(1, Math.floor(innerWidth / 54));
            childElements.forEach((element, idx) => {
              const ex = x + 6 + (idx % elementsPerRow) * 54;
              const ey = currentY + Math.floor(idx / elementsPerRow) * (ELEMENT_HEIGHT + ELEMENT_GAP);
              elements.push(renderElement(element, ex, ey, 50));
            });

            if (childElements.length > 0) {
              const elementRows = Math.ceil(childElements.length / elementsPerRow);
              currentY += elementRows * (ELEMENT_HEIGHT + ELEMENT_GAP);
            }

            childAreas.forEach((childArea) => {
              const childHeight = calculateAreaHeight(childArea, innerWidth, depth + 1);
              elements.push(renderArea(childArea, x + 6, currentY, innerWidth, childHeight, depth + 1));
              currentY += childHeight + ELEMENT_GAP;
            });
          }

          return elements;
        })()}
      </g>
    );
  };

  // エレメントを描画
  const renderElement = (element: ResolvedElement, x: number, y: number, width: number) => {
    const isSelected = selectedElement?.elementId === element.elementId;
    const hasEvents = element.events && element.events.length > 0;

    return (
      <g key={element.elementId}>
        <rect
          x={x}
          y={y}
          width={width}
          height={ELEMENT_HEIGHT - 4}
          fill={isSelected ? '#dbeafe' : '#f1f5f9'}
          stroke={isSelected ? '#2563eb' : '#cbd5e1'}
          strokeWidth={isSelected ? 2 : 1}
          rx={3}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onElementSelect(element);
          }}
        />
        <text x={x + 4} y={y + 10} fontSize={8} fontWeight="500" fill="#334155">
          {element.elementId.length > Math.floor(width / 5)
            ? element.elementId.substring(0, Math.floor(width / 5)) + '...'
            : element.elementId}
        </text>
        <text x={x + 4} y={y + 19} fontSize={7} fill="#64748b">
          {element.field?.type || ''}
        </text>
        {hasEvents && (
          <text x={x + width - 10} y={y + 14} fontSize={9} fill="#f59e0b">
            ⚡
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-slate-200 flex items-center gap-2 flex-shrink-0">
        {/* ビューポート切り替え */}
        {viewports.length > 0 && (
          <>
            <div className="flex items-center gap-1 mr-4">
              {viewports.map((vp) => (
                <button
                  key={vp.id}
                  onClick={() => setViewportId(vp.id)}
                  className={`px-3 py-1 rounded text-sm ${viewportId === vp.id ? 'bg-blue-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                  title={vp.description || vp.name}
                >
                  {vp.name}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-300" />
          </>
        )}

        {/* ズームコントロール */}
        <button onClick={handleZoomIn} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm" title="ズームイン">+</button>
        <button onClick={handleZoomOut} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm" title="ズームアウト">-</button>
        <button onClick={handleZoomReset} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm" title="リセット">Reset</button>
        <span className="text-xs text-slate-500 ml-2">{Math.round(zoom * 100)}%</span>
        {rootArea && (
          <span className="text-xs text-slate-400 ml-4">Grid: {gridDimensions.rows}×{gridDimensions.cols}</span>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-slate-50"
        style={{ cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg width="100%" height="100%" onClick={handleBackgroundClick} style={{ display: 'block' }}>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <rect
              data-background="true"
              width={dimensions.width}
              height={dimensions.height}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth={2}
            />

            <text x={PADDING} y={PADDING + 16} fontSize={16} fontWeight="bold" fill="#1e293b">
              {screenData.title} ({screenData.screenId})
            </text>

            {rootArea && gridCells.length > 0 ? (
              /* グリッドレイアウト */
              <g transform={`translate(${PADDING}, ${PADDING + 30})`}>
                {gridCells.map((cell) => {
                  const area = areaMap.get(cell.areaId);
                  if (!area) return null;

                  const cellX = cell.startCol * (CELL_WIDTH + GAP);
                  const cellY = rowYPositions[cell.startRow] || 0;
                  const cellWidth = cell.colSpan * CELL_WIDTH + (cell.colSpan - 1) * GAP;

                  // rowSpanに対応した高さ計算
                  let cellHeight = 0;
                  for (let r = cell.startRow; r < cell.startRow + cell.rowSpan; r++) {
                    cellHeight += rowHeights[r] || MIN_CELL_HEIGHT;
                    if (r < cell.startRow + cell.rowSpan - 1) cellHeight += GAP;
                  }

                  return renderArea(area, cellX, cellY, cellWidth, cellHeight);
                })}
              </g>
            ) : rootArea ? (
              /* 縦並びレイアウト（モバイル等） - rootAreaのchildrenを縦に配置 */
              <g transform={`translate(${PADDING}, ${PADDING + 30})`}>
                {(() => {
                  const childAreas = getChildAreas(rootArea);
                  const containerWidth = dimensions.width - PADDING * 2;
                  let currentY = 0;
                  return childAreas.map((area) => {
                    const areaHeight = calculateAreaHeight(area, containerWidth);
                    const element = renderArea(area, 0, currentY, containerWidth, areaHeight);
                    currentY += areaHeight + GAP;
                    return element;
                  });
                })()}
              </g>
            ) : (
              /* rootAreaがない場合のフォールバック */
              <g transform={`translate(${PADDING}, ${PADDING + 30})`}>
                {screenData.areas
                  ?.filter((area) => !isHidden(area.responsiveBehavior))
                  .map((area, index) => {
                    const areaHeight = calculateAreaHeight(area, dimensions.width - PADDING * 2);
                    const areaY = index * (areaHeight + GAP);
                    return renderArea(area, 0, areaY, dimensions.width - PADDING * 2, areaHeight);
                  })}
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

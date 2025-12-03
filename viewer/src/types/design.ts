// 設計書の型定義

export interface Site {
  id: string;
  name: string;
}

export interface TransitionNode {
  id: string;
  screenId: string;
  label: string;
  description?: string;
}

export interface TransitionEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  eventId: string;
  isExternal: boolean;
  isShared: boolean;
}

export interface TransitionsData {
  nodes: TransitionNode[];
  edges: TransitionEdge[];
}

export interface Field {
  fieldId: string;
  name: string;
  type: string;
  label: string;
  description?: string;
  designHint?: string;
  validation?: Record<string, any>;
  metadata?: Record<string, any>;
  optionsSource?: Record<string, any>;
  items?: any[];
  customType?: string;
}

export interface Event {
  eventId: string;
  name: string;
  description?: string;
  trigger: {
    element: string;
    event: string;
  };
  actions: EventAction[];
}

export interface EventAction {
  type: string;
  interfaceRef?: string;
  target?: string;
  params?: Record<string, string>;
  value?: string;
  action?: string;
  onSuccess?: EventAction[];
  onError?: EventAction[];
}

// ビューポート定義（site.yamlから取得）
export interface Viewport {
  id: string;
  name: string;
  minWidth?: number;
  maxWidth?: number;
  description?: string;
}

// ResponsiveBehaviorは動的キー（viewportsのIDを参照）
export interface ResponsiveBehavior {
  [viewportId: string]: DeviceBehavior;
}

export interface DeviceBehavior {
  hidden?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  sizeHint?: 'auto' | 'narrow' | 'fill';
  gridAreas?: string[][];
  layoutHint?: string;
  order?: number;
}

export interface Conditional {
  show?: string;
  hide?: string;
  fieldRef?: string;
  operator?: string;
  value?: string | number | boolean | (string | number | boolean)[];
}

export interface ResolvedElement {
  elementId: string;
  fieldRef?: string;
  field?: Field;
  label?: string;
  layoutHint?: string;
  order?: number;
  colspan?: number;
  ariaLabel?: string;
  ariaHidden?: boolean;
  focusable?: boolean;
  description?: string;
  events?: Event[];
  children?: ResolvedElement[];
  responsiveBehavior?: ResponsiveBehavior;
  conditional?: Conditional;
}

export interface ResolvedArea {
  areaId: string;
  name?: string;
  description?: string;
  layoutHint?: string;
  role?: string;
  ariaLabel?: string;
  layout?: string;
  inherited?: boolean;
  children?: string[];
  gridAreas?: string[][];
  sizeHint?: 'auto' | 'narrow' | 'fill';
  repeatable?: boolean;
  dataSource?: string;
  responsiveBehavior?: ResponsiveBehavior;
  conditional?: Conditional;
}

export interface ScreenDetail {
  screenId: string;
  title: string;
  description?: string;
  extends?: string;
  areas: ResolvedArea[];
  elements: ResolvedElement[];
  fields?: Field[];
  events?: Event[];
  viewports?: Viewport[];
}

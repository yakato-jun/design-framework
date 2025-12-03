import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  Site,
  TransitionsData,
  TransitionNode,
  TransitionEdge,
  ScreenDetail,
  ResolvedArea,
  ResolvedElement,
  Field,
  Event,
  LayoutYaml,
  SharedLayoutYaml,
  Viewport,
} from '../types/design.types';

@Injectable()
export class DesignService {
  private readonly designPath: string;

  constructor() {
    this.designPath = process.env.DESIGN_PATH || './design';
  }

  // サイト一覧取得
  async getSites(): Promise<Site[]> {
    const sitesPath = path.join(this.designPath, 'sites');

    if (!fs.existsSync(sitesPath)) {
      return [];
    }

    const dirs = fs.readdirSync(sitesPath, { withFileTypes: true });
    const sites: Site[] = [];

    for (const dir of dirs) {
      if (!dir.isDirectory() || dir.name.startsWith('_')) {
        continue;
      }

      const siteYamlPath = path.join(sitesPath, dir.name, 'site.yaml');
      let name = dir.name;

      if (fs.existsSync(siteYamlPath)) {
        try {
          const content = fs.readFileSync(siteYamlPath, 'utf-8');
          const siteData = yaml.load(content) as {
            name?: string;
            site?: { name?: string };
          };
          // site.name または name を参照
          if (siteData?.site?.name) {
            name = siteData.site.name;
          } else if (siteData?.name) {
            name = siteData.name;
          }
        } catch (e) {
          console.warn(`Failed to parse ${siteYamlPath}:`, e);
        }
      }

      sites.push({ id: dir.name, name });
    }

    return sites;
  }

  // 画面遷移データ取得
  async getTransitions(siteId: string): Promise<TransitionsData> {
    const sitePath = path.join(this.designPath, 'sites', siteId);

    if (!fs.existsSync(sitePath)) {
      throw new Error('SITE_NOT_FOUND');
    }

    const screensPath = path.join(sitePath, 'screens');
    if (!fs.existsSync(screensPath)) {
      return { nodes: [], edges: [] };
    }

    const screenDirs = fs
      .readdirSync(screensPath, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    const nodes: TransitionNode[] = [];
    const edges: TransitionEdge[] = [];
    const screenIds = new Set<string>();

    // ノード生成
    for (const dir of screenDirs) {
      const screenId = dir.name;
      screenIds.add(screenId);

      const layoutPath = path.join(screensPath, screenId, 'layout.yaml');
      if (!fs.existsSync(layoutPath)) continue;

      try {
        const content = fs.readFileSync(layoutPath, 'utf-8');
        const layout = yaml.load(content) as LayoutYaml;

        nodes.push({
          id: `node-${screenId}`,
          screenId,
          label: layout.title || screenId,
          description: layout.description,
        });
      } catch (e) {
        console.warn(`Failed to parse ${layoutPath}:`, e);
      }
    }

    // 共通レイアウト読み込み（要素→親Areaのマッピング用）
    const elementToAreaMap = new Map<string, { areaId: string; name?: string }>();
    const sharedLayoutPath = path.join(sitePath, '_shared', 'app-layout.yaml');
    if (fs.existsSync(sharedLayoutPath)) {
      try {
        const sharedLayoutContent = fs.readFileSync(sharedLayoutPath, 'utf-8');
        const sharedLayout = yaml.load(sharedLayoutContent) as {
          areas?: Array<{ areaId: string; name?: string; children?: string[] }>;
        };

        // 各Areaのchildrenから要素→Areaのマッピングを構築
        for (const area of sharedLayout?.areas || []) {
          for (const child of area.children || []) {
            // $element-id 形式の要素参照を処理
            if (child.startsWith('$')) {
              const elementId = child.substring(1);
              elementToAreaMap.set(elementId, { areaId: area.areaId, name: area.name });
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to parse ${sharedLayoutPath}:`, e);
      }
    }

    // 共通イベント読み込み
    let sharedEvents: Event[] = [];
    const sharedEventsPath = path.join(sitePath, '_shared', 'app-events.yaml');
    if (fs.existsSync(sharedEventsPath)) {
      try {
        const sharedContent = fs.readFileSync(sharedEventsPath, 'utf-8');
        const sharedEventsData = yaml.load(sharedContent) as { events?: Event[] };
        sharedEvents = sharedEventsData?.events || [];
      } catch (e) {
        console.warn(`Failed to parse ${sharedEventsPath}:`, e);
      }
    }

    // 共通イベントから親Areaノードを作成し、エッジを生成
    const addedSharedAreaIds = new Set<string>();
    for (const event of sharedEvents) {
      const triggerElement = event.trigger?.element;
      if (!triggerElement) continue;

      // trigger.elementから親Areaを特定
      const parentArea = elementToAreaMap.get(triggerElement);
      if (!parentArea) continue;

      // 親Areaノードがまだ追加されていなければ追加
      if (!addedSharedAreaIds.has(parentArea.areaId)) {
        addedSharedAreaIds.add(parentArea.areaId);
        nodes.push({
          id: `node-_shared-${parentArea.areaId}`,
          screenId: `_shared/${parentArea.areaId}`,
          label: parentArea.name || parentArea.areaId,
          description: `共通部品: ${parentArea.name || parentArea.areaId}`,
        });
      }

      // エッジを生成（sourceは親Area）
      this.extractNavigateActions(
        event.actions,
        `_shared-${parentArea.areaId}`,
        event,
        screenIds,
        edges,
        true, // isShared
      );
    }

    // 画面固有イベントからのエッジ生成
    for (const dir of screenDirs) {
      const screenId = dir.name;

      const eventsPath = path.join(screensPath, screenId, 'events.yaml');
      if (!fs.existsSync(eventsPath)) continue;

      try {
        const content = fs.readFileSync(eventsPath, 'utf-8');
        const eventsData = yaml.load(content) as { events?: Event[] };
        const screenEvents = eventsData?.events || [];

        for (const event of screenEvents) {
          this.extractNavigateActions(
            event.actions,
            screenId,
            event,
            screenIds,
            edges,
            false, // isShared
          );
        }
      } catch (e) {
        console.warn(`Failed to parse ${eventsPath}:`, e);
      }
    }

    return { nodes, edges };
  }

  private extractNavigateActions(
    actions: any[],
    sourceScreenId: string,
    event: Event,
    screenIds: Set<string>,
    edges: TransitionEdge[],
    isShared: boolean = false,
  ): void {
    if (!actions) return;

    for (const action of actions) {
      if (action.type === 'navigate' && action.target) {
        const isExternal = !screenIds.has(action.target);

        edges.push({
          id: `edge-${event.eventId}-${action.target}`,
          source: `node-${sourceScreenId}`,
          target: `node-${action.target}`,
          label: event.name || event.eventId,
          eventId: event.eventId,
          isExternal,
          isShared,
        });
      }

      // onSuccess/onError内のnavigateも抽出
      if (action.onSuccess) {
        this.extractNavigateActions(
          action.onSuccess,
          sourceScreenId,
          event,
          screenIds,
          edges,
          isShared,
        );
      }
      if (action.onError) {
        this.extractNavigateActions(
          action.onError,
          sourceScreenId,
          event,
          screenIds,
          edges,
          isShared,
        );
      }
    }
  }

  // 画面詳細取得
  async getScreenDetail(
    siteId: string,
    screenId: string,
  ): Promise<ScreenDetail> {
    const sitePath = path.join(this.designPath, 'sites', siteId);
    if (!fs.existsSync(sitePath)) {
      throw new Error('SITE_NOT_FOUND');
    }

    const screenPath = path.join(sitePath, 'screens', screenId);
    if (!fs.existsSync(screenPath)) {
      throw new Error('SCREEN_NOT_FOUND');
    }

    // site.yamlからviewports読み込み
    let viewports: Viewport[] = [];
    const siteYamlPath = path.join(sitePath, 'site.yaml');
    if (fs.existsSync(siteYamlPath)) {
      try {
        const siteContent = fs.readFileSync(siteYamlPath, 'utf-8');
        const siteData = yaml.load(siteContent) as { viewports?: Viewport[] };
        viewports = siteData?.viewports || [];
      } catch (e) {
        console.warn(`Failed to parse ${siteYamlPath}:`, e);
      }
    }

    // layout.yaml読み込み
    const layoutPath = path.join(screenPath, 'layout.yaml');
    if (!fs.existsSync(layoutPath)) {
      throw new Error('LAYOUT_NOT_FOUND');
    }

    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    const layout = yaml.load(layoutContent) as LayoutYaml;

    // fields.yaml読み込み
    let fields: Field[] = [];
    const fieldsPath = path.join(screenPath, 'fields.yaml');
    if (fs.existsSync(fieldsPath)) {
      const fieldsContent = fs.readFileSync(fieldsPath, 'utf-8');
      fields = (yaml.load(fieldsContent) as Field[]) || [];
    }

    // events.yaml読み込み
    let events: Event[] = [];
    const eventsPath = path.join(screenPath, 'events.yaml');
    if (fs.existsSync(eventsPath)) {
      const eventsContent = fs.readFileSync(eventsPath, 'utf-8');
      const eventsData = yaml.load(eventsContent) as { events?: Event[] };
      events = eventsData?.events || [];
    }

    // 共通イベント読み込み
    let sharedEvents: Event[] = [];
    const sharedEventsPath = path.join(sitePath, '_shared', 'app-events.yaml');
    if (fs.existsSync(sharedEventsPath)) {
      const sharedEventsContent = fs.readFileSync(sharedEventsPath, 'utf-8');
      const sharedEventsData = yaml.load(sharedEventsContent) as { events?: Event[] };
      sharedEvents = sharedEventsData?.events || [];
    }

    // イベントをマージ（画面固有が優先）
    const eventMap = new Map<string, Event>();
    for (const event of sharedEvents) {
      eventMap.set(event.eventId, event);
    }
    for (const event of events) {
      eventMap.set(event.eventId, event);
    }
    events = Array.from(eventMap.values());

    // 共通フィールド読み込み（継承解決用）
    let sharedFields: Field[] = [];
    const sharedFieldsPath = path.join(sitePath, '_shared', 'app-fields.yaml');
    if (fs.existsSync(sharedFieldsPath)) {
      const sharedFieldsContent = fs.readFileSync(sharedFieldsPath, 'utf-8');
      sharedFields = (yaml.load(sharedFieldsContent) as Field[]) || [];
    }

    // エリアとエレメントのマップを構築
    const areaMap = new Map<string, ResolvedArea>();
    const elementMap = new Map<string, ResolvedElement>();

    // 継承解決
    let resolvedAreas: ResolvedArea[] = [];

    if (layout.extends) {
      // 共通レイアウト読み込み
      const extendsName = layout.extends.replace('_shared/', '');
      const sharedLayoutPath = path.join(
        sitePath,
        '_shared',
        `${extendsName}.yaml`,
      );

      if (fs.existsSync(sharedLayoutPath)) {
        const sharedContent = fs.readFileSync(sharedLayoutPath, 'utf-8');
        const sharedLayout = yaml.load(sharedContent) as SharedLayoutYaml;

        // 共通レイアウトのareasをマップに追加
        for (const area of sharedLayout.areas || []) {
          areaMap.set(area.areaId, { ...area, inherited: true });
        }

        // 共通レイアウトのelementsをマップに追加
        for (const element of sharedLayout.elements || []) {
          elementMap.set(element.elementId, element);
        }

        // フィールドをマージ
        const allFields = [...sharedFields, ...fields];
        const fieldMapTemp = new Map<string, Field>();
        for (const field of allFields) {
          fieldMapTemp.set(field.fieldId, field);
        }
        fields = Array.from(fieldMapTemp.values());
      }
    }

    // 画面固有のareasをマップに追加（上書き）
    for (const area of layout.areas || []) {
      areaMap.set(area.areaId, { ...area, inherited: false });
    }

    // 画面固有のelementsをマップに追加（上書き）
    for (const element of layout.elements || []) {
      elementMap.set(element.elementId, element);
    }

    // mainContentの処理
    if (layout.mainContent && areaMap.has('main-content')) {
      const mainContentArea = areaMap.get('main-content')!;
      mainContentArea.layout = layout.mainContent.layout || mainContentArea.layout;
      mainContentArea.children = layout.mainContent.children;
      mainContentArea.inherited = false;
    }

    // フラット構造のまま配列に変換
    resolvedAreas = Array.from(areaMap.values());

    // fieldRef解決（elementsにfield情報を埋め込む）
    const fieldMap = new Map<string, Field>();
    for (const field of fields) {
      fieldMap.set(field.fieldId, field);
    }

    const resolvedElements: ResolvedElement[] = [];
    for (const element of elementMap.values()) {
      const resolved = { ...element };
      if (resolved.fieldRef) {
        const field = fieldMap.get(resolved.fieldRef);
        if (field) {
          resolved.field = field;
        }
      }
      // イベント埋め込み
      const elementEvents = events.filter(
        (e) =>
          e.trigger.element === resolved.elementId ||
          e.trigger.element === resolved.field?.fieldId,
      );
      if (elementEvents.length > 0) {
        resolved.events = elementEvents;
      }
      resolvedElements.push(resolved);
    }

    return {
      screenId: layout.screenId,
      title: layout.title,
      description: layout.description,
      extends: layout.extends,
      areas: resolvedAreas,
      elements: resolvedElements,
      fields,
      events,
      viewports,
    };
  }

}

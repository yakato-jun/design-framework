import { Site, TransitionsData, ScreenDetail, Viewport } from '@/types/design';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SiteDetail {
  id: string;
  name: string;
  viewports: Viewport[];
}

export async function getSites(): Promise<Site[]> {
  const res = await fetch(`${API_URL}/api/sites`);
  if (!res.ok) throw new Error('Failed to fetch sites');
  return res.json();
}

export async function getSiteDetail(siteId: string): Promise<SiteDetail> {
  const res = await fetch(`${API_URL}/api/sites/${siteId}`);
  if (!res.ok) throw new Error('Failed to fetch site detail');
  return res.json();
}

export async function getTransitions(siteId: string, viewport?: string): Promise<TransitionsData> {
  const url = new URL(`${API_URL}/api/sites/${siteId}/transitions`);
  if (viewport) {
    url.searchParams.set('viewport', viewport);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch transitions');
  return res.json();
}

export async function getScreenDetail(
  siteId: string,
  screenId: string
): Promise<ScreenDetail> {
  const res = await fetch(
    `${API_URL}/api/sites/${siteId}/screens/${screenId}`
  );
  if (!res.ok) throw new Error('Failed to fetch screen detail');
  return res.json();
}

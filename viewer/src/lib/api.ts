import { Site, TransitionsData, ScreenDetail } from '@/types/design';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getSites(): Promise<Site[]> {
  const res = await fetch(`${API_URL}/api/sites`);
  if (!res.ok) throw new Error('Failed to fetch sites');
  return res.json();
}

export async function getTransitions(siteId: string): Promise<TransitionsData> {
  const res = await fetch(`${API_URL}/api/sites/${siteId}/transitions`);
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

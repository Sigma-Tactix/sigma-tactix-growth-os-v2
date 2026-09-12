/**
 * Google Search Console API Client Wrapper
 * 
 * Provides methods to interact with Google Search Console data.
 * Requires OAuth 2.0 credentials configured via the Admin panel.
 * Falls back to demo data when no credentials are available.
 */

import { apiFetch } from './api';

export interface GSCMetrics {
  clicks: number;
  impressions: number;
  ctr: number;       // 0-1
  position: number;  // average position
}

export interface GSCTimeSeriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCAnalyticsResponse {
  siteUrl: string;
  dateRange: { start: string; end: string };
  totals: GSCMetrics;
  timeSeries: GSCTimeSeriesPoint[];
  topQueries: GSCQueryRow[];
  topPages: GSCPageRow[];
  fetchedAt: string;
}

export interface GSCConnectionStatus {
  connected: boolean;
  siteUrl?: string;
  lastFetched?: string;
  error?: string;
}

/**
 * Check if GSC is connected and configured.
 */
export async function getGSCConnectionStatus(): Promise<GSCConnectionStatus> {
  try {
    const res = await apiFetch('/api/gsc/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend not available — fall through to disconnected state
  }
  return { connected: false };
}

/**
 * Fetch GSC analytics data for the configured site.
 */
export async function fetchGSCAnalytics(
  dateRange: '7d' | '28d' | '90d' | '16m' = '28d'
): Promise<GSCAnalyticsResponse | null> {
  try {
    const res = await apiFetch(`/api/gsc/analytics?range=${dateRange}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend not available
  }
  return null;
}

/**
 * Get the OAuth authorization URL for GSC.
 */
export function getGSCAuthUrl(): string {
  const baseUrl = (import.meta as any).env?.VITE_API_BASE || '';
  return `${baseUrl}/api/gsc/auth`;
}

/**
 * Generate realistic demo data for sigmatactix.com when no real GSC data is available.
 */
export function generateDemoGSCData(dateRange: '7d' | '28d' | '90d' | '16m' = '28d'): GSCAnalyticsResponse {
  const days = dateRange === '7d' ? 7 : dateRange === '28d' ? 28 : dateRange === '90d' ? 90 : 480;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Generate time series with realistic organic growth pattern
  const timeSeries: GSCTimeSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    const weekdayMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.55 : 1;
    const growthFactor = 1 + (i / days) * 0.35;
    const baseClicks = Math.round((42 + Math.random() * 28) * weekdayMultiplier * growthFactor);
    const baseImpressions = Math.round((680 + Math.random() * 320) * weekdayMultiplier * growthFactor);

    timeSeries.push({
      date: d.toISOString().split('T')[0],
      clicks: baseClicks,
      impressions: baseImpressions,
      ctr: baseClicks / baseImpressions,
      position: 14.2 - (i / days) * 3.8 + Math.random() * 1.5
    });
  }

  const totalClicks = timeSeries.reduce((s, p) => s + p.clicks, 0);
  const totalImpressions = timeSeries.reduce((s, p) => s + p.impressions, 0);

  const topQueries: GSCQueryRow[] = [
    { query: 'ai growth consulting', clicks: Math.round(totalClicks * 0.12), impressions: Math.round(totalImpressions * 0.08), ctr: 0.094, position: 6.2 },
    { query: 'growth os for b2b', clicks: Math.round(totalClicks * 0.09), impressions: Math.round(totalImpressions * 0.065), ctr: 0.087, position: 8.4 },
    { query: 'ai marketing agent', clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.11), ctr: 0.046, position: 12.1 },
    { query: 'sigma tactix', clicks: Math.round(totalClicks * 0.15), impressions: Math.round(totalImpressions * 0.04), ctr: 0.23, position: 1.2 },
    { query: 'automated growth infrastructure', clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.07), ctr: 0.054, position: 9.8 },
    { query: 'second brain for business', clicks: Math.round(totalClicks * 0.05), impressions: Math.round(totalImpressions * 0.06), ctr: 0.052, position: 11.3 },
    { query: 'ai native growth consultancy', clicks: Math.round(totalClicks * 0.07), impressions: Math.round(totalImpressions * 0.05), ctr: 0.088, position: 7.6 },
    { query: 'replace marketing agency with ai', clicks: Math.round(totalClicks * 0.04), impressions: Math.round(totalImpressions * 0.09), ctr: 0.028, position: 15.4 },
    { query: 'aeo optimization service', clicks: Math.round(totalClicks * 0.03), impressions: Math.round(totalImpressions * 0.04), ctr: 0.047, position: 13.2 },
    { query: 'growth diagnostic audit', clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.03), ctr: 0.125, position: 4.8 }
  ];

  const topPages: GSCPageRow[] = [
    { page: 'https://sigmatactix.com/', clicks: Math.round(totalClicks * 0.32), impressions: Math.round(totalImpressions * 0.25), ctr: 0.081, position: 8.2 },
    { page: 'https://sigmatactix.com/growth-diagnostic', clicks: Math.round(totalClicks * 0.18), impressions: Math.round(totalImpressions * 0.15), ctr: 0.076, position: 9.4 },
    { page: 'https://sigmatactix.com/services', clicks: Math.round(totalClicks * 0.14), impressions: Math.round(totalImpressions * 0.12), ctr: 0.074, position: 10.1 },
    { page: 'https://sigmatactix.com/blog/ai-growth-os-guide', clicks: Math.round(totalClicks * 0.11), impressions: Math.round(totalImpressions * 0.18), ctr: 0.039, position: 14.6 },
    { page: 'https://sigmatactix.com/case-studies', clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.08), ctr: 0.063, position: 11.8 },
    { page: 'https://sigmatactix.com/about', clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.05), ctr: 0.076, position: 9.2 },
    { page: 'https://sigmatactix.com/blog/replace-agency-with-ai', clicks: Math.round(totalClicks * 0.05), impressions: Math.round(totalImpressions * 0.09), ctr: 0.035, position: 16.3 },
    { page: 'https://sigmatactix.com/pricing', clicks: Math.round(totalClicks * 0.04), impressions: Math.round(totalImpressions * 0.04), ctr: 0.063, position: 12.4 }
  ];

  return {
    siteUrl: 'sc-domain:sigmatactix.com',
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: totalClicks / totalImpressions,
      position: timeSeries.reduce((s, p) => s + p.position, 0) / timeSeries.length
    },
    timeSeries,
    topQueries,
    topPages,
    fetchedAt: new Date().toISOString()
  };
}

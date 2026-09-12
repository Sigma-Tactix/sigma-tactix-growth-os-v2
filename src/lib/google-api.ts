import { getGoogleAccessToken } from './auth';

export const fetchGoogleAnalyticsData = async (propertyId: string) => {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  // Example API call to Google Analytics Data API v1beta
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Analytics API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
};

export const fetchGoogleAdsData = async (customerId: string) => {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  // Example API call to Google Ads API
  // Requires developer token in production, usually sent via server-side or headers
  const response = await fetch(`https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': process.env.VITE_GOOGLE_ADS_DEV_TOKEN || 'PENDING',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        SELECT 
          campaign.name, 
          metrics.impressions, 
          metrics.clicks, 
          metrics.cost_micros 
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS
      `
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Ads API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
};

export interface WebIntelligenceCapabilities {
  provider: string;
  configured: boolean;
  verified: boolean;
  operations: Array<'search' | 'fetch' | 'agent' | 'browser'>;
  detail: string;
  isFixture?: boolean;
  environment?: 'development' | 'test' | 'staging' | 'production';
  toolVersion?: string;
  account?: string;
  verifiedAt?: string;
}

export interface SearchRequest {
  query: string;
  maxResults?: number;
  location?: string;
  language?: string;
}

export interface FetchRequest {
  urls: string[];
  format?: 'markdown' | 'html' | 'json';
}

export interface WebEvidence {
  provider: string;
  method: 'search' | 'fetch';
  sourceUrl: string;
  finalUrl?: string;
  title: string;
  excerpt?: string;
  content?: string;
  rank?: number;
  retrievedAt: string;
  latencyMs: number;
}

export interface WebIntelligenceProvider {
  capabilities(): Promise<WebIntelligenceCapabilities>;
  search(input: SearchRequest): Promise<WebEvidence[]>;
  fetch(input: FetchRequest): Promise<WebEvidence[]>;
  verify?(): Promise<boolean>;
}


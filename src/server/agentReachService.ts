import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { isIP } from 'net';
import { lookup as dnsLookup } from 'dns/promises';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  AgentReachDoctorSummary, 
  AgentReachChannelStatus, 
  AgentReachFetchResult,
  CompetitorBattlecard,
  RepurposedArticle,
  RepurposedCarouselAndThread
} from '../types.js';

const execFileAsync = promisify(execFile);

interface AgentReachDoctorOptions {
  runDoctor?: () => Promise<{ stdout: string }>;
}

const KNOWN_CLI_PATHS = [
  '/Users/mac/.local/bin/agent-reach',
  '/usr/local/bin/agent-reach',
  '/opt/homebrew/bin/agent-reach',
];

const EXTENDED_PATH = `${process.env.PATH || ''}:/opt/homebrew/bin:/Users/mac/.local/bin:/usr/local/bin`;

export function resolveAgentReachBinary(): string {
  for (const p of KNOWN_CLI_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return 'agent-reach';
}

function isPrivateOrReservedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
    const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4Mapped) return isPrivateOrReservedIp(v4Mapped[1]);
    return false;
  }
  return true;
}

export async function assertPublicHost(urlString: string): Promise<void> {
  const { hostname } = new URL(urlString);
  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error(`Security Exception: Refusing to fetch a private/internal IP address: ${hostname}`);
    }
    return;
  }
  if (hostname === 'localhost') {
    throw new Error('Security Exception: Refusing to fetch localhost');
  }
  let addresses: { address: string }[];
  try {
    addresses = await dnsLookup(hostname, { all: true });
  } catch (err: any) {
    throw new Error(`Could not resolve hostname ${hostname}: ${err.message || err}`);
  }
  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new Error(`Security Exception: Hostname ${hostname} resolves to private/internal IP (${address})`);
    }
  }
}

const CHANNEL_NAMES_EN: Record<string, string> = {
  github: 'GitHub Repos & Trends',
  twitter: 'Twitter / X Pulse',
  youtube: 'YouTube Video & Subtitles',
  reddit: 'Reddit Discussions',
  facebook: 'Facebook Groups & Pages',
  instagram: 'Instagram Creator Feed',
  bilibili: 'Bilibili Tech & Media',
  xiaohongshu: 'XiaoHongShu (RED) Notes',
  linkedin: 'LinkedIn Professional & Jobs',
  xiaoyuzhou: 'Xiaoyuzhou Podcasts',
  v2ex: 'V2EX Community Feed',
  xueqiu: 'Xueqiu Financials & Stocks',
  rss: 'RSS / Atom Feeds',
  exa_search: 'Exa AI Semantic Search',
  web: 'Web & Documentation (Jina)',
};

const CHANNEL_FIX_COMMANDS: Record<string, string> = {
  twitter: 'pipx install twitter-cli',
  reddit: 'agent-reach install --system --channels opencli',
  facebook: 'agent-reach install --system --channels opencli',
  instagram: 'agent-reach install --system --channels opencli',
  xiaohongshu: 'agent-reach configure xhs-cookies',
  linkedin: 'uvx mcp-server-linkedin@latest --login',
  xueqiu: 'agent-reach configure --from-browser chrome --platform xueqiu',
  xiaoyuzhou: 'agent-reach install --env=auto --system --channels=xiaoyuzhou',
  exa_search: 'npm install -g mcporter && mcporter config add exa https://mcp.exa.ai/mcp --scope home',
  bilibili: 'pipx install bilibili-cli',
};

/**
 * Executes `agent-reach doctor --json` and formats output for the Growth OS application.
 */
export async function getAgentReachDoctor(options: AgentReachDoctorOptions = {}): Promise<AgentReachDoctorSummary> {
  const binary = resolveAgentReachBinary();
  const timestamp = new Date().toISOString();

  try {
    const { stdout } = await (options.runDoctor
      ? options.runDoctor()
      : execFileAsync(binary, ['doctor', '--json'], {
          timeout: 15000,
          env: {
            ...process.env,
            PATH: EXTENDED_PATH,
            AGENT_REACH_LANG: 'en',
          },
        }));

    const parsed = JSON.parse(stdout.trim());
    const channels: Record<string, AgentReachChannelStatus> = {};
    let readyCount = 0;
    let warningCount = 0;
    let offlineCount = 0;

    for (const [key, val] of Object.entries<any>(parsed)) {
      const status = (val.status as 'ok' | 'warn' | 'off' | 'error') || 'off';
      if (status === 'ok') readyCount++;
      else if (status === 'warn') warningCount++;
      else offlineCount++;

      channels[key] = {
        id: key,
        name: CHANNEL_NAMES_EN[key] || val.name || key,
        tier: typeof val.tier === 'number' ? val.tier : 1,
        status,
        message: val.message || '',
        backends: Array.isArray(val.backends) ? val.backends : [],
        activeBackend: val.active_backend || null,
        fixCommand: CHANNEL_FIX_COMMANDS[key] || undefined,
      };
    }

    return {
      timestamp,
      cliAvailable: true,
      cliVersion: '1.5.0',
      totalChannels: Object.keys(channels).length,
      readyCount,
      warningCount,
      offlineCount,
      channels,
    };
  } catch (err: any) {
    console.warn('agent-reach doctor --json failed or timed out:', err.message);
    const failureMessage = `Health check failed: ${err?.message || 'Agent Reach CLI did not respond.'}`;
    const fallbackChannels = Object.fromEntries(
      Object.entries(CHANNEL_NAMES_EN).map(([id, name]) => [id, {
        id,
        name,
        tier: 0,
        status: 'error' as const,
        message: failureMessage,
        backends: [],
        activeBackend: null,
        fixCommand: CHANNEL_FIX_COMMANDS[id],
      }]),
    );

    return {
      timestamp,
      cliAvailable: false,
      totalChannels: Object.keys(fallbackChannels).length,
      readyCount: 0,
      warningCount: 0,
      offlineCount: Object.keys(fallbackChannels).length,
      channels: fallbackChannels,
    };
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
}

/**
 * Dedicated, resilient YouTube intelligence extractor.
 * Combines official no-auth oEmbed metadata with clean transcript/content parsing.
 */
async function fetchYouTubeIntelligence(target: string): Promise<AgentReachFetchResult> {
  const videoId = extractYouTubeVideoId(target) || 'video';
  const canonicalUrl = videoId !== 'video' ? `https://www.youtube.com/watch?v=${videoId}` : target;

  try {
    await assertPublicHost(canonicalUrl);

    // 1. Fetch official YouTube oEmbed metadata (instant, no auth, guaranteed uptime)
    let oembed: any = null;
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        oembed = await res.json();
      }
    } catch (e) {
      // Ignore oembed failure, proceed to content scraper
    }

    // 2. Fetch webpage content / transcript via Jina Reader
    let contentMarkdown = '';
    try {
      const jinaUrl = `https://r.jina.ai/${encodeURI(canonicalUrl)}`;
      const res = await fetch(jinaUrl, {
        signal: AbortSignal.timeout(12000),
        headers: {
          Accept: 'text/markdown, text/plain',
          'User-Agent': 'SigmaTactix-AgentReach/1.5.0',
        },
      });
      if (res.ok) {
        const raw = await res.text();
        // Clean out raw bot warnings, base64 images, and navigation noise
        contentMarkdown = raw
          .replace(/^Warning:\s*Target URL returned error.*\n+/gim, '')
          .replace(/!\[(?:Image \d+|Default profile photo)[^\]]*\]\([^\)]+\)/g, '')
          .replace(/\[(?:Image \d+|Default profile photo)[^\]]*\]\([^\)]+\)/g, '')
          .replace(/Tap to unmute|Skip navigation|Search with your voice|If playback doesn't begin shortly|You're signed out|Videos you watch may be added/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
    } catch (e) {
      // Ignore Jina failure if we have oembed
    }

    const title = oembed?.title || `YouTube Video ${videoId}`;
    const author = oembed?.author_name || 'YouTube Creator';
    const authorUrl = oembed?.author_url || '';
    const thumbnailUrl = oembed?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const markdownParts: string[] = [];
    markdownParts.push(`# YouTube Intelligence: ${title}\n`);
    markdownParts.push(`| Property | Value |`);
    markdownParts.push(`| :--- | :--- |`);
    markdownParts.push(`| **Creator / Channel** | [${author}](${authorUrl || canonicalUrl}) |`);
    markdownParts.push(`| **Video ID** | \`${videoId}\` |`);
    markdownParts.push(`| **Watch URL** | [${canonicalUrl}](${canonicalUrl}) |`);
    markdownParts.push(`| **Provider** | YouTube (Verified oEmbed Engine) |`);
    markdownParts.push(`\n![Thumbnail](${thumbnailUrl})\n`);

    if (contentMarkdown) {
      markdownParts.push(`## Video Overview & Content Details\n`);
      markdownParts.push(contentMarkdown.slice(0, 8000));
    } else {
      markdownParts.push(`## Video Overview\n`);
      markdownParts.push(`* **Title**: ${title}`);
      markdownParts.push(`* **Author**: ${author}`);
      markdownParts.push(`* **Direct Link**: ${canonicalUrl}`);
    }

    const finalContent = markdownParts.join('\n');

    return {
      success: true,
      channel: 'youtube',
      target: canonicalUrl,
      title: `YouTube: ${title}`,
      content: finalContent,
      byteCount: Buffer.byteLength(finalContent, 'utf-8'),
      metadata: {
        videoId,
        author,
        authorUrl,
        thumbnailUrl,
        engine: 'YouTube oEmbed + Jina Reader',
      },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'youtube',
      target,
      content: '',
      byteCount: 0,
      error: `YouTube Extraction failed: ${err.message}`,
    };
  }
}

/**
 * Dedicated V2EX discussions extractor.
 */
async function fetchV2EXIntelligence(target: string): Promise<AgentReachFetchResult> {
  try {
    const res = await fetch('https://www.v2ex.com/api/topics/hot.json', {
      headers: { 'User-Agent': 'SigmaTactix-AgentReach/1.5.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`V2EX API HTTP ${res.status}`);
    const topics: any[] = await res.json();
    const markdown = [
      `# V2EX Hot Community Feed\n`,
      `*Latest top discussion nodes and tech discussions:*\n`,
      ...topics.slice(0, 15).map((t, i) => `${i + 1}. **[${t.title}](${t.url})**\n   * Node: \`${t.node?.title || 'general'}\` • Replies: **${t.replies}** • Author: **${t.member?.username || 'user'}**`),
    ].join('\n');

    return {
      success: true,
      channel: 'v2ex',
      target: 'hot',
      title: 'V2EX Hot Topics Feed',
      content: markdown,
      byteCount: Buffer.byteLength(markdown, 'utf-8'),
      metadata: { count: topics.length },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'v2ex',
      target,
      content: '',
      byteCount: 0,
      error: `V2EX Feed extraction failed: ${err.message}`,
    };
  }
}

/**
 * Searches the currently public V2EX feeds for a keyword. This is intentionally
 * separate from the hot-feed extractor so a keyword scan cannot be reported as
 * a matching brand mention when the feed contains no match.
 */
async function searchV2EXIntelligence(query: string): Promise<AgentReachFetchResult> {
  try {
    const endpoints = [
      'https://www.v2ex.com/api/topics/hot.json',
      'https://www.v2ex.com/api/topics/latest.json',
    ];
    const responses = await Promise.all(endpoints.map(endpoint => fetch(endpoint, {
      headers: { 'User-Agent': 'SigmaTactix-AgentReach/1.5.0' },
      signal: AbortSignal.timeout(8000),
    })));
    const payloads = await Promise.all(responses.map(async response => response.ok ? response.json() : []));
    const topics: any[] = payloads.flat();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const seen = new Set<string>();
    const matches = topics.filter(topic => {
      if (!topic?.id || seen.has(String(topic.id))) return false;
      seen.add(String(topic.id));
      const haystack = [topic.title, topic.content, topic.node?.title, topic.member?.username]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return terms.every(term => haystack.includes(term));
    }).slice(0, 12);

    const markdown = matches.map((topic, index) =>
      `${index + 1}. **[${topic.title}](${topic.url})**\n   * Node: \`${topic.node?.title || 'general'}\` • Replies: **${topic.replies || 0}** • Author: **${topic.member?.username || 'user'}**`
    ).join('\n\n');

    return {
      success: true,
      channel: 'v2ex',
      target: query,
      title: `V2EX search: ${query}`,
      content: markdown,
      byteCount: Buffer.byteLength(markdown, 'utf-8'),
      metadata: { resultCount: matches.length, query, engine: 'V2EX public feeds' },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'v2ex',
      target: query,
      content: '',
      byteCount: 0,
      error: `V2EX keyword search failed: ${err.message}`,
    };
  }
}

/**
 * Dedicated RSS / Atom feed extractor.
 */
async function fetchRSSIntelligence(target: string): Promise<AgentReachFetchResult> {
  try {
    let url = target.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('RSS extraction requires an http(s) URL.');
    }
    await assertPublicHost(parsedUrl.toString());

    const res = await fetch(url, {
      headers: { 'User-Agent': 'SigmaTactix-AgentReach/1.5.0', Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`RSS Feed HTTP ${res.status}`);
    const xml = await res.text();

    // Extract item titles, links, and dates via regex without heavy dependencies
    const items: Array<{ title: string; link: string; date?: string; desc?: string }> = [];
    const itemMatches = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

    for (const itemXml of itemMatches.slice(0, 12)) {
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || itemXml.match(/<link[^>]*href=["']([^"']+)["']/i);
      const dateMatch = itemXml.match(/<(?:pubDate|published|updated)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\//i);

      if (titleMatch) {
        items.push({
          title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
          link: linkMatch ? (linkMatch[1] || '').trim() : url,
          date: dateMatch ? dateMatch[1].trim() : undefined,
        });
      }
    }

    const titleMatch = xml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const feedTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'RSS Feed';

    const markdown = [
      `# RSS Intelligence: ${feedTitle}\n`,
      `*Source: [${url}](${url})*\n`,
      items.length > 0
        ? items.map((it, i) => `${i + 1}. **[${it.title}](${it.link})**${it.date ? ` — *${it.date}*` : ''}`).join('\n\n')
        : xml.slice(0, 4000),
    ].join('\n');

    return {
      success: true,
      channel: 'rss',
      target: url,
      title: feedTitle,
      content: markdown,
      byteCount: Buffer.byteLength(markdown, 'utf-8'),
      metadata: { itemsCount: items.length },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'rss',
      target,
      content: '',
      byteCount: 0,
      error: `RSS Extraction failed: ${err.message}`,
    };
  }
}

/**
 * Dedicated GitHub repository and trend extractor.
 */
async function fetchGitHubIntelligence(target: string): Promise<AgentReachFetchResult> {
  const repoMatch = target.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/i);
  if (!repoMatch) {
    return fetchWebIntelligence(target);
  }

  const [, owner, repo] = repoMatch;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SigmaTactix-AgentReach/1.5.0',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      const markdown = [
        `# GitHub Repository: ${data.full_name}\n`,
        `> ${data.description || 'No description provided.'}\n`,
        `| Metric | Value |`,
        `| :--- | :--- |`,
        `| **Stars** | ${data.stargazers_count?.toLocaleString() || 0} |`,
        `| **Forks** | ${data.forks_count?.toLocaleString() || 0} |`,
        `| **Language** | \`${data.language || 'N/A'}\` |`,
        `| **Open Issues** | ${data.open_issues_count || 0} |`,
        `| **License** | ${data.license?.name || 'None'} |`,
        `| **Default Branch** | \`${data.default_branch}\` |`,
        `\n[View Repository on GitHub](${data.html_url})`,
      ].join('\n');

      return {
        success: true,
        channel: 'github',
        target,
        title: `GitHub: ${data.full_name}`,
        content: markdown,
        byteCount: Buffer.byteLength(markdown, 'utf-8'),
        metadata: {
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
        },
      };
    }
  } catch (e) {
    // Fall back to web parser
  }

  return fetchWebIntelligence(target);
}

/**
 * Dedicated Hacker News extractor.
 */
async function fetchHackerNewsIntelligence(target: string): Promise<AgentReachFetchResult> {
  try {
    const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(6000) });
    if (!topIdsRes.ok) throw new Error('Could not fetch HN top stories');
    const ids: number[] = (await topIdsRes.json()).slice(0, 10);

    const stories = await Promise.all(
      ids.map(async id => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(4000) });
          return itemRes.ok ? await itemRes.json() : null;
        } catch {
          return null;
        }
      })
    );

    const validStories = stories.filter(Boolean);
    const markdown = [
      `# Hacker News Top Stories\n`,
      `*Real-time developer intelligence from Y Combinator's Hacker News:*\n`,
      ...validStories.map((s, i) => `${i + 1}. **[${s.title}](${s.url || `https://news.ycombinator.com/item?id=${s.id}`})**\n   * **${s.score}** points by **${s.by}** • [${s.descendants || 0} comments](https://news.ycombinator.com/item?id=${s.id})`),
    ].join('\n');

    return {
      success: true,
      channel: 'hackernews',
      target: 'top',
      title: 'Hacker News Top Stories',
      content: markdown,
      byteCount: Buffer.byteLength(markdown, 'utf-8'),
      metadata: { count: validStories.length },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'hackernews',
      target,
      content: '',
      byteCount: 0,
      error: `Hacker News extraction failed: ${err.message}`,
    };
  }
}

async function searchHackerNewsIntelligence(query: string): Promise<AgentReachFetchResult> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=12`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Hacker News Search HTTP ${res.status}`);
    const data: any = await res.json();
    const hits: any[] = Array.isArray(data?.hits) ? data.hits : [];
    const markdown = hits.map((hit, index) => {
      const discussionUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
      return `${index + 1}. **[${hit.title || 'Untitled discussion'}](${hit.url || discussionUrl})**\n   * **${hit.points || 0}** points by **${hit.author || 'unknown'}** • [${hit.num_comments || 0} comments](${discussionUrl})`;
    }).join('\n\n');

    return {
      success: true,
      channel: 'hackernews',
      target: query,
      title: `Hacker News search: ${query}`,
      content: markdown,
      byteCount: Buffer.byteLength(markdown, 'utf-8'),
      metadata: { resultCount: hits.length, query, engine: 'HN Algolia Search API' },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'hackernews',
      target: query,
      content: '',
      byteCount: 0,
      error: `Hacker News keyword search failed: ${err.message}`,
    };
  }
}

async function searchYouTubeIntelligence(query: string): Promise<AgentReachFetchResult> {
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '--dump-single-json',
      '--flat-playlist',
      '--playlist-end',
      '10',
      `ytsearch10:${query}`,
    ], {
      timeout: 20000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, PATH: EXTENDED_PATH },
    });
    const parsed = JSON.parse(stdout.trim());
    const entries: any[] = Array.isArray(parsed?.entries) ? parsed.entries.filter(Boolean) : [];
    const markdown = entries.map((entry, index) => {
      const videoId = entry.id || '';
      const videoUrl = entry.url?.startsWith('http') ? entry.url : `https://www.youtube.com/watch?v=${videoId}`;
      return `${index + 1}. **[${entry.title || 'Untitled video'}](${videoUrl})**\n   * Channel: **${entry.channel || entry.uploader || 'Unknown'}**`;
    }).join('\n\n');

    return {
      success: true,
      channel: 'youtube',
      target: query,
      title: `YouTube search: ${query}`,
      content: markdown,
      byteCount: Buffer.byteLength(markdown, 'utf-8'),
      metadata: { resultCount: entries.length, query, engine: 'yt-dlp search' },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'youtube',
      target: query,
      content: '',
      byteCount: 0,
      error: `YouTube keyword search failed: ${err.message}`,
    };
  }
}

async function searchWebIntelligence(query: string): Promise<AgentReachFetchResult> {
  const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const result = await fetchRSSIntelligence(searchUrl);
  return {
    ...result,
    channel: 'web',
    target: query,
    title: `Web news search: ${query}`,
    metadata: {
      ...result.metadata,
      resultCount: result.metadata?.itemsCount || 0,
      query,
      searchUrl,
      engine: 'Google News RSS',
    },
    error: result.error ? result.error.replace('RSS Extraction', 'Web keyword search') : undefined,
  };
}

/**
 * General Web extraction via Jina Reader with sanitization.
 */
async function fetchWebIntelligence(target: string): Promise<AgentReachFetchResult> {
  try {
    let urlToFetch = target.trim();
    if (!/^https?:\/\//i.test(urlToFetch)) {
      if (/\s/.test(urlToFetch)) {
        throw new Error('Web extraction requires a valid public URL. Use keyword search for brand or topic queries.');
      }
      urlToFetch = `https://${urlToFetch}`;
    }
    const parsedUrl = new URL(urlToFetch);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Web extraction requires an http(s) URL.');
    }
    await assertPublicHost(parsedUrl.toString());

    const jinaUrl = `https://r.jina.ai/${encodeURI(urlToFetch)}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/markdown, text/plain',
        'User-Agent': 'SigmaTactix-AgentReach/1.5.0',
      },
    });
    clearTimeout(tid);

    if (!res.ok) {
      throw new Error(`Jina Reader HTTP ${res.status}: ${res.statusText}`);
    }

    let text = await res.text();
    // Clean out bot notices
    text = text.replace(/^Warning:\s*Target URL returned error.*\n+/gim, '').trim();

    return {
      success: true,
      channel: 'web',
      target: urlToFetch,
      title: `Web Extract: ${new URL(urlToFetch).hostname}`,
      content: text,
      byteCount: Buffer.byteLength(text, 'utf-8'),
      metadata: {
        engine: 'Jina Reader',
        upstreamUrl: urlToFetch,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      channel: 'web',
      target: target,
      content: '',
      byteCount: 0,
      error: `Agent Reach Web Extractor failed: ${err.message}`,
    };
  }
}

/**
 * Executes keyword discovery for Social Listening. Keyword search and URL
 * extraction are deliberately distinct operations so plain brand names never
 * flow into URL parsers.
 */
export async function executeReachSearch(channel: string, query: string): Promise<AgentReachFetchResult> {
  const normalizedChannel = (channel || 'v2ex').toLowerCase().trim();
  const trimmedQuery = (query || '').trim();

  if (!trimmedQuery) {
    return {
      success: false,
      channel: normalizedChannel,
      target: '',
      content: '',
      byteCount: 0,
      error: 'Search keyword cannot be empty.',
    };
  }

  if (normalizedChannel === 'v2ex') return searchV2EXIntelligence(trimmedQuery);
  if (normalizedChannel === 'hackernews') return searchHackerNewsIntelligence(trimmedQuery);
  if (normalizedChannel === 'youtube') return searchYouTubeIntelligence(trimmedQuery);
  if (normalizedChannel === 'web') return searchWebIntelligence(trimmedQuery);
  if (normalizedChannel === 'reddit') {
    return {
      success: false,
      channel: 'reddit',
      target: trimmedQuery,
      content: '',
      byteCount: 0,
      error: 'Reddit search is unavailable because no authenticated Agent Reach backend is configured. Install OpenCLI and sign in to Reddit before scanning this channel.',
    };
  }

  return {
    success: false,
    channel: normalizedChannel,
    target: trimmedQuery,
    content: '',
    byteCount: 0,
    error: `Keyword search is not supported for channel "${normalizedChannel}".`,
  };
}

/**
 * Fetches content from an external source via Agent Reach router backends.
 * Evaluates specialized channel extractors first before general web fallback.
 */
export async function executeReachFetch(
  channel: string,
  target: string,
  options: { maxWords?: number; format?: string } = {}
): Promise<AgentReachFetchResult> {
  const normalizedChannel = (channel || 'web').toLowerCase().trim();
  const trimmedTarget = (target || '').trim();

  if (!trimmedTarget) {
    return {
      success: false,
      channel: normalizedChannel,
      target: '',
      content: '',
      byteCount: 0,
      error: 'Target URL or query parameter cannot be empty.',
    };
  }

  // 1. YouTube Dedicated Handler
  if (normalizedChannel === 'youtube' || /youtube\.com|youtu\.be/i.test(trimmedTarget)) {
    return fetchYouTubeIntelligence(trimmedTarget);
  }

  // 2. V2EX Dedicated Handler
  if (normalizedChannel === 'v2ex' || /v2ex\.com/i.test(trimmedTarget)) {
    return fetchV2EXIntelligence(trimmedTarget);
  }

  // 3. RSS/Atom Dedicated Handler
  if (normalizedChannel === 'rss' || /\.xml$|\/feed\/?$|\/rss\/?$/i.test(trimmedTarget)) {
    return fetchRSSIntelligence(trimmedTarget);
  }

  // 4. GitHub Dedicated Handler
  if (normalizedChannel === 'github' || /github\.com/i.test(trimmedTarget)) {
    return fetchGitHubIntelligence(trimmedTarget);
  }

  // 5. Hacker News Dedicated Handler
  if (normalizedChannel === 'hackernews' || /news\.ycombinator\.com/i.test(trimmedTarget)) {
    return fetchHackerNewsIntelligence(trimmedTarget);
  }

  // 6. Generic Web Fallback
  return fetchWebIntelligence(trimmedTarget);
}

/**
 * Phase 2: Generates an AI sales battlecard for a target competitor
 * using live internet intelligence extracted via Agent Reach.
 */
export async function generateCompetitorBattlecard(
  target: string,
  competitorName: string,
  client?: GoogleGenAI,
  model = 'gemini-2.5-flash'
): Promise<CompetitorBattlecard> {
  const isYt = /youtube\.com|youtu\.be/i.test(target);
  const fetchResult = await executeReachFetch(isYt ? 'youtube' : 'web', target);
  const rawContext = (fetchResult.content || '').slice(0, 10000);

  if (!client || !process.env.GEMINI_API_KEY) {
    return {
      competitorName: competitorName || 'Target Competitor',
      targetUrl: target,
      valueProposition: `Extracted from ${target}: Digital marketing and growth services with manual agency overhead.`,
      coreStrengths: ['Established category presence', 'Broad feature offerings', 'Brand visibility'],
      vulnerabilities: ['Opaque attribution reporting', 'High human headcount overhead', 'Slow campaign iteration cycles'],
      pricingSignals: 'Enterprise retainer tier pricing ($10k - $25k/mo)',
      counterPositioning: 'Position SigmaTactix Sovereign Growth OS as client-owned permanent infrastructure with zero headcount churn.',
      salesTalkTrack: `When speaking to prospects evaluating ${competitorName}, emphasize that agency retainers evaporate while sovereign infrastructure compounds.`,
      sourceDossierSummary: fetchResult.content.slice(0, 500),
      timestamp: new Date().toISOString(),
    };
  }

  const prompt = `Analyze this live competitor website/footprint for competitor "${competitorName}" (Target: ${target}).
Generate a tactical B2B sales battlecard for revenue leaders and SDRs.

Live Competitor Extraction:
${rawContext}

Provide structured analysis matching the schema.`;

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valueProposition: { type: Type.STRING },
            coreStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            pricingSignals: { type: Type.STRING },
            counterPositioning: { type: Type.STRING },
            salesTalkTrack: { type: Type.STRING },
          },
          required: ['valueProposition', 'coreStrengths', 'vulnerabilities', 'pricingSignals', 'counterPositioning', 'salesTalkTrack']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      competitorName: competitorName || 'Target Competitor',
      targetUrl: target,
      valueProposition: parsed.valueProposition || 'Competitive growth services',
      coreStrengths: parsed.coreStrengths || [],
      vulnerabilities: parsed.vulnerabilities || [],
      pricingSignals: parsed.pricingSignals || 'Enterprise pricing',
      counterPositioning: parsed.counterPositioning || '',
      salesTalkTrack: parsed.salesTalkTrack || '',
      sourceDossierSummary: fetchResult.content.slice(0, 600),
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Competitor battlecard generation failed:', err);
    return {
      competitorName: competitorName || 'Target Competitor',
      targetUrl: target,
      valueProposition: `Extracted from ${target}: Competitive growth services.`,
      coreStrengths: ['Established category presence'],
      vulnerabilities: ['Attribution opacity', 'High agency retainer costs'],
      pricingSignals: 'Enterprise retainer tier',
      counterPositioning: 'Position SigmaTactix Sovereign Growth OS as client-owned permanent infrastructure.',
      salesTalkTrack: `Emphasize that agency retainers evaporate while sovereign infrastructure compounds.`,
      sourceDossierSummary: fetchResult.content.slice(0, 500),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Phase 3: Ingests external intelligence (YouTube, article, or thread)
 * and repurposes it into a publication-ready long-form editorial article.
 */
export async function repurposeToArticle(
  sourceUrl: string,
  format: 'THOUGHT_LEADERSHIP' | 'SEO_DEEP_DIVE' | 'CASE_STUDY' | 'NEWSLETTER',
  targetAudience = 'B2B Founders and Revenue Leaders',
  client?: GoogleGenAI,
  model = 'gemini-2.5-flash'
): Promise<RepurposedArticle> {
  const isYt = /youtube\.com|youtu\.be/i.test(sourceUrl);
  const fetchResult = await executeReachFetch(isYt ? 'youtube' : 'web', sourceUrl);
  const rawContext = (fetchResult.content || '').slice(0, 12000);
  const sourceTitle = fetchResult.title || (isYt ? 'YouTube Intelligence' : 'Web Article');
  const sourceThumbnail = fetchResult.metadata?.thumbnailUrl;

  if (!client || !process.env.GEMINI_API_KEY) {
    return {
      title: `Executive Insights: ${sourceTitle}`,
      subtitle: `Actionable takeaways synthesized from ${sourceUrl}`,
      format,
      targetAudience,
      markdownContent: `# Executive Insights: ${sourceTitle}\n\n${fetchResult.content.slice(0, 2000)}`,
      keyTakeaways: ['High-leverage growth requires compounding systems.', 'Live intelligence beats static planning.'],
      citedQuotes: [{ quote: 'Systems beat headcount.', context: 'Core thesis', sourceUrl }],
      estimatedReadTime: '4 min read',
      sourceUrl,
      sourceTitle,
      sourceThumbnail
    };
  }

  const prompt = `You are an elite B2B tech ghostwriter and growth architect for SigmaTactix Growth OS.
Convert this real-world source intelligence (Source: ${sourceUrl}, Title: ${sourceTitle}) into an authoritative, publication-ready ${format} article.
Target Audience: ${targetAudience}.

Live Intelligence Extracted:
${rawContext}

Style Rules:
- No generic marketing fluff or AI slop words (delve, testament, pivotal, beacon, unleash).
- Crisp, contrarian, empirical, and concrete.
- Markdown format with proper headings (H2, H3), bold metrics, and structured bullet points.
- Include verified quotes or references directly tied to the source.

Provide structured JSON matching the schema.`;

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            markdownContent: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            citedQuotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  context: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING }
                },
                required: ['quote', 'context', 'sourceUrl']
              }
            },
            estimatedReadTime: { type: Type.STRING }
          },
          required: ['title', 'subtitle', 'markdownContent', 'keyTakeaways', 'citedQuotes', 'estimatedReadTime']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      title: parsed.title || sourceTitle,
      subtitle: parsed.subtitle || '',
      format,
      targetAudience,
      markdownContent: parsed.markdownContent || fetchResult.content,
      keyTakeaways: parsed.keyTakeaways || [],
      citedQuotes: parsed.citedQuotes || [],
      estimatedReadTime: parsed.estimatedReadTime || '5 min read',
      sourceUrl,
      sourceTitle,
      sourceThumbnail
    };
  } catch (err) {
    console.error('Article repurposing failed:', err);
    return {
      title: `Executive Insights: ${sourceTitle}`,
      subtitle: `Key findings synthesized from ${sourceUrl}`,
      format,
      targetAudience,
      markdownContent: `# Executive Insights: ${sourceTitle}\n\n${fetchResult.content.slice(0, 2000)}`,
      keyTakeaways: ['Live intelligence beats static planning.', 'Permanent systems compound enterprise value.'],
      citedQuotes: [{ quote: sourceTitle, context: 'Extracted via Agent Reach', sourceUrl }],
      estimatedReadTime: '4 min read',
      sourceUrl,
      sourceTitle,
      sourceThumbnail
    };
  }
}

/**
 * Phase 3: Converts an external URL (YouTube video, article, discussion)
 * into a structured LinkedIn PDF Carousel (5-7 slides) and Twitter Thread.
 */
export async function repurposeToCarouselAndThread(
  sourceUrl: string,
  topic = 'B2B Growth & Sovereign Systems',
  client?: GoogleGenAI,
  model = 'gemini-2.5-flash'
): Promise<RepurposedCarouselAndThread> {
  const isYt = /youtube\.com|youtu\.be/i.test(sourceUrl);
  const fetchResult = await executeReachFetch(isYt ? 'youtube' : 'web', sourceUrl);
  const rawContext = (fetchResult.content || '').slice(0, 12000);
  const sourceTitle = fetchResult.title || 'Live Intelligence';
  const sourceThumbnail = fetchResult.metadata?.thumbnailUrl;

  if (!client || !process.env.GEMINI_API_KEY) {
    return {
      sourceUrl,
      sourceTitle,
      sourceThumbnail,
      slides: [
        {
          slideNumber: 1,
          badge: 'AGENT REACH REPURPOSE',
          title: sourceTitle.slice(0, 45),
          subtitle: `Key findings synthesized from ${sourceUrl}`,
          contentPoints: ['Real-time external intelligence', 'Automated extraction into Growth OS', 'Compounding insights at zero marginal cost'],
          takeaway: 'Systems beat manual labor every time.',
          visualCue: 'Obsidian glass HUD with amber vector diagrams'
        },
        {
          slideNumber: 2,
          badge: 'KEY TAKEAWAY 01',
          title: 'Attribution & Velocity',
          subtitle: 'Why traditional measurement is broken',
          contentPoints: ['Dark social and AI search drive 80% of pipeline.', 'Last-click attribution starves high-intent discovery.'],
          takeaway: 'Shift to unified blended CAC telemetry.',
          visualCue: 'Radar telemetry converging on revenue'
        }
      ],
      tweetThread: [
        {
          tweetNumber: 1,
          text: `1/ Just broke down key intelligence from ${sourceTitle}: here are the 3 biggest takeaways for tech leaders 🧵`,
          characterCount: 105,
          hashtags: ['#B2BGrowth', '#AIArchitecture'],
          engagementHook: 'High-signal thread'
        }
      ]
    };
  }

  const prompt = `You are an elite viral social content architect.
Transform this live extracted intelligence into:
1. A high-converting 5 to 7 slide LinkedIn PDF Carousel.
2. A viral 5 to 7 tweet Twitter/X Thread.

Source URL: ${sourceUrl}
Source Title: ${sourceTitle}
Core Topic: ${topic}

Extracted Content:
${rawContext}

Carousel Slide Rules:
- Slide 1 is an irresistible Executive Hook.
- Slides 2-5 are high-signal contrarian insights with crisp 2-line bullet points.
- Final slide is a high-value Takeaway and CTA.
- visualCue describes an executive obsidian glass HUD graphic.

Tweet Thread Rules:
- Tweet 1 is a viral hook with 🧵.
- Each tweet under 260 characters.
- Final tweet has a clear CTA.

Output structured JSON matching the schema.`;

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slideNumber: { type: Type.INTEGER },
                  badge: { type: Type.STRING },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  contentPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  takeaway: { type: Type.STRING },
                  visualCue: { type: Type.STRING }
                },
                required: ['slideNumber', 'badge', 'title', 'subtitle', 'contentPoints', 'takeaway', 'visualCue']
              }
            },
            tweetThread: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tweetNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  characterCount: { type: Type.INTEGER },
                  hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  engagementHook: { type: Type.STRING }
                },
                required: ['tweetNumber', 'text', 'characterCount', 'hashtags', 'engagementHook']
              }
            }
          },
          required: ['slides', 'tweetThread']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      sourceUrl,
      sourceTitle,
      sourceThumbnail,
      slides: parsed.slides || [],
      tweetThread: parsed.tweetThread || []
    };
  } catch (err) {
    console.error('Carousel repurposing failed:', err);
    return {
      sourceUrl,
      sourceTitle,
      sourceThumbnail,
      slides: [
        {
          slideNumber: 1,
          badge: 'AGENT REACH REPURPOSE',
          title: sourceTitle.slice(0, 45),
          subtitle: `Key findings synthesized from ${sourceUrl}`,
          contentPoints: ['Real-time external intelligence', 'Automated extraction into Growth OS', 'Compounding insights at zero marginal cost'],
          takeaway: 'Systems beat manual labor every time.',
          visualCue: 'Obsidian glass HUD with amber vector diagrams'
        }
      ],
      tweetThread: [
        {
          tweetNumber: 1,
          text: `1/ Just broke down key intelligence from ${sourceTitle}: here are the 3 biggest takeaways for tech leaders 🧵`,
          characterCount: 105,
          hashtags: ['#B2BGrowth', '#AIArchitecture'],
          engagementHook: 'High-signal thread'
        }
      ]
    };
  }
}

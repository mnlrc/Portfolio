/**
 * Build-time GitHub REST client. This module runs only during `astro build` / `astro dev`
 * on the server; nothing here is shipped to the browser, so GITHUB_TOKEN never leaks.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Repo, RepoResult } from './githubTypes';
import { normalizeRepos } from './repos';

const API = 'https://api.github.com';
const CACHE_FILE = '.cache/github-repos.json';
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_PAGES = 10;

export class GitHubError extends Error {}

type Fetch = typeof fetch;

function headers(token: string | undefined): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'portfolio-site-build',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function nextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.split(',').find((part) => part.includes('rel="next"'));
  return match?.match(/<([^>]+)>/)?.[1] ?? null;
}

function describeFailure(res: Response): string {
  const remaining = res.headers.get('x-ratelimit-remaining');
  if ((res.status === 403 || res.status === 429) && remaining === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const when = Number.isFinite(reset) ? new Date(reset * 1000).toISOString() : 'later';
    return `GitHub API rate limit exceeded (resets at ${when}). Set GITHUB_TOKEN to raise the limit.`;
  }
  if (res.status === 404) return 'GitHub user not found.';
  return `GitHub API responded with ${res.status} ${res.statusText}.`;
}

/** Fetches every public repo owned by `username`, following pagination. Throws GitHubError. */
export async function fetchUserRepos(
  username: string,
  { token, fetchImpl = fetch }: { token?: string; fetchImpl?: Fetch } = {},
): Promise<Repo[]> {
  let url: string | null =
    `${API}/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100`;
  const raw: unknown[] = [];

  for (let page = 0; url && page < MAX_PAGES; page++) {
    let res: Response;
    try {
      res = await fetchImpl(url, { headers: headers(token) });
    } catch (cause) {
      throw new GitHubError(`Network error while contacting GitHub: ${String(cause)}`);
    }
    if (!res.ok) throw new GitHubError(describeFailure(res));
    const body: unknown = await res.json();
    if (!Array.isArray(body)) throw new GitHubError('Unexpected GitHub API response shape.');
    raw.push(...body);
    url = nextLink(res.headers.get('link'));
  }

  return normalizeRepos(raw);
}

interface CacheEntry {
  username: string;
  fetchedAt: number;
  repos: Repo[];
}

async function readCache(username: string): Promise<CacheEntry | null> {
  try {
    const entry = JSON.parse(await readFile(CACHE_FILE, 'utf8')) as CacheEntry;
    return entry.username === username ? entry : null;
  } catch {
    return null;
  }
}

async function writeCache(entry: CacheEntry): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(entry));
  } catch {
    // Cache is a local-dev convenience only.
  }
}

async function loadRepos(username: string): Promise<RepoResult> {
  const isCI = Boolean(process.env.CI);
  const token = process.env.GITHUB_TOKEN || undefined;

  // CI: always fetch fresh; a failure fails the build so the previous deployment stays live.
  if (isCI) {
    return { status: 'ok', repos: await fetchUserRepos(username, { token }), stale: false };
  }

  // Local: serve a fresh cache, otherwise fetch, falling back to a stale cache on failure.
  const cached = await readCache(username);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { status: 'ok', repos: cached.repos, stale: false };
  }
  try {
    const repos = await fetchUserRepos(username, { token });
    await writeCache({ username, fetchedAt: Date.now(), repos });
    return { status: 'ok', repos, stale: false };
  } catch (error) {
    if (cached) return { status: 'ok', repos: cached.repos, stale: true };
    const message = error instanceof GitHubError ? error.message : 'Unknown error.';
    console.warn(`[github] ${message}`);
    return { status: 'error', message };
  }
}

const memo = new Map<string, Promise<RepoResult>>();

/** Repos for `username`, fetched at most once per build/dev-server process. */
export function getRepos(username: string): Promise<RepoResult> {
  let pending = memo.get(username);
  if (!pending) {
    pending = loadRepos(username);
    // Don't memoize failures in the long-running dev server.
    pending
      .then((r) => r.status === 'error' && memo.delete(username))
      .catch(() => memo.delete(username));
    memo.set(username, pending);
  }
  return pending;
}

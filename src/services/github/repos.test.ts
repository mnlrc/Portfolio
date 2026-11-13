import { describe, expect, it } from 'vitest';
import { fetchUserRepos, GitHubError } from './githubApi';
import {
  categorize,
  currentRepo,
  languagesOf,
  normalizeRepos,
  selectRepos,
  type SelectOptions,
} from './repos';

describe('currentRepo', () => {
  const visibility = { excludeForks: true, excludeArchived: true, exclude: ['hidden'] };
  const repos = normalizeRepos([
    raw({ name: 'older', pushed_at: '2024-01-01T00:00:00Z' }),
    raw({ name: 'hidden', pushed_at: '2026-01-01T00:00:00Z' }),
    raw({ name: 'forked', fork: true, pushed_at: '2026-02-01T00:00:00Z' }),
    raw({ name: 'newest', pushed_at: '2025-06-01T00:00:00Z' }),
  ]);

  it('defaults to the most recently pushed visible repo', () => {
    expect(currentRepo(repos, { ...visibility, preferred: null })?.name).toBe('newest');
  });

  it('uses the preferred repo when it is visible', () => {
    expect(currentRepo(repos, { ...visibility, preferred: 'OLDER' })?.name).toBe('older');
  });

  it('falls back when the preferred repo is excluded or missing', () => {
    expect(currentRepo(repos, { ...visibility, preferred: 'hidden' })?.name).toBe('newest');
    expect(currentRepo([], { ...visibility, preferred: null })).toBeNull();
  });
});

function raw(overrides: Record<string, unknown> = {}) {
  return {
    name: 'repo',
    description: 'A repo',
    html_url: 'https://github.com/mnlrc/repo',
    homepage: null,
    language: 'Python',
    stargazers_count: 1,
    forks_count: 0,
    fork: false,
    archived: false,
    topics: [],
    pushed_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    ...overrides,
  };
}

const base: SelectOptions = {
  category: 'personal',
  uniTopic: 'university',
  excludeForks: true,
  excludeArchived: true,
  exclude: [],
  featured: [],
};

describe('normalizeRepos', () => {
  it('maps fields and prefers pushed_at for updatedAt', () => {
    const [repo] = normalizeRepos([raw({ description: '  ', homepage: '' })]);
    expect(repo).toMatchObject({
      name: 'repo',
      description: null,
      homepage: null,
      stars: 1,
      updatedAt: '2025-01-01T00:00:00Z',
    });
  });

  it('drops items that fail validation', () => {
    expect(normalizeRepos([raw(), { name: 'broken' }, null])).toHaveLength(1);
  });
});

describe('selectRepos', () => {
  const repos = normalizeRepos([
    raw({ name: 'old', pushed_at: '2023-01-01T00:00:00Z' }),
    raw({ name: 'new', pushed_at: '2025-06-01T00:00:00Z' }),
    raw({ name: 'course', topics: ['university'] }),
    raw({ name: 'forked', fork: true }),
    raw({ name: 'dusty', archived: true }),
    raw({ name: 'Hidden' }),
  ]);

  it('splits categories by topic', () => {
    expect(categorize(repos[2], 'university')).toBe('uni');
    const uni = selectRepos(repos, { ...base, category: 'uni' });
    expect(uni.others.map((r) => r.name)).toEqual(['course']);
  });

  it('excludes forks, archived and configured repos, sorted newest first', () => {
    const { others } = selectRepos(repos, { ...base, exclude: ['hidden'] });
    expect(others.map((r) => r.name)).toEqual(['new', 'old']);
  });

  it('keeps forks and archived repos when not excluded', () => {
    const { others } = selectRepos(repos, { ...base, excludeForks: false, excludeArchived: false });
    expect(others.map((r) => r.name)).toContain('forked');
    expect(others.map((r) => r.name)).toContain('dusty');
  });

  it('puts featured repos first in configured order', () => {
    const { featured, others } = selectRepos(repos, { ...base, featured: ['old', 'missing'] });
    expect(featured.map((r) => r.name)).toEqual(['old']);
    expect(others.map((r) => r.name)).not.toContain('old');
  });
});

describe('languagesOf', () => {
  it('counts languages, most common first', () => {
    const repos = normalizeRepos([
      raw({ language: 'C++' }),
      raw({ language: 'Python' }),
      raw({ language: 'Python' }),
      raw({ language: null }),
    ]);
    expect(languagesOf(repos)).toEqual([
      { language: 'Python', count: 2 },
      { language: 'C++', count: 1 },
    ]);
  });
});

describe('fetchUserRepos', () => {
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), { status: 200, ...init });

  it('follows pagination via the Link header', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(url);
      return calls.length === 1
        ? json([raw({ name: 'a' })], {
            headers: { link: '<https://api.github.com/page2>; rel="next"' },
          })
        : json([raw({ name: 'b' })]);
    }) as typeof fetch;
    const repos = await fetchUserRepos('mnlrc', { fetchImpl });
    expect(repos.map((r) => r.name)).toEqual(['a', 'b']);
    expect(calls[1]).toBe('https://api.github.com/page2');
  });

  it('reports rate limiting clearly', async () => {
    const fetchImpl = (async () =>
      json(
        {},
        {
          status: 403,
          headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '0' },
        },
      )) as typeof fetch;
    await expect(fetchUserRepos('mnlrc', { fetchImpl })).rejects.toThrow(/rate limit/);
  });

  it('wraps network failures', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    await expect(fetchUserRepos('mnlrc', { fetchImpl })).rejects.toBeInstanceOf(GitHubError);
  });
});

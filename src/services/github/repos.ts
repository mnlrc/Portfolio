import type { ProjectCategory } from '../../config/site';
import { rawRepoSchema, type Repo } from './githubTypes';

/** Validates raw API items and maps them to `Repo`. Invalid items are dropped. */
export function normalizeRepos(raw: unknown[]): Repo[] {
  const repos: Repo[] = [];
  for (const item of raw) {
    const parsed = rawRepoSchema.safeParse(item);
    if (!parsed.success) continue;
    const r = parsed.data;
    repos.push({
      name: r.name,
      description: r.description?.trim() || null,
      url: r.html_url,
      homepage: r.homepage?.trim() || null,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      topics: r.topics,
      updatedAt: r.pushed_at ?? r.updated_at,
      fork: r.fork,
      archived: r.archived,
    });
  }
  return repos;
}

export function categorize(repo: Repo, uniTopic: string): ProjectCategory {
  return repo.topics.includes(uniTopic.toLowerCase()) ? 'uni' : 'personal';
}

export interface VisibilityOptions {
  excludeForks: boolean;
  excludeArchived: boolean;
  exclude: readonly string[];
}

export interface SelectOptions extends VisibilityOptions {
  category: ProjectCategory;
  uniTopic: string;
  featured: readonly string[];
}

export interface Selection {
  featured: Repo[];
  others: Repo[];
}

const byRecency = (a: Repo, b: Repo) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt);

/** Repos that may appear anywhere on the site (exclusions, forks and archived removed). */
export function visibleRepos(repos: Repo[], opts: VisibilityOptions): Repo[] {
  const excluded = new Set(opts.exclude.map((n) => n.toLowerCase()));
  return repos.filter(
    (r) =>
      !excluded.has(r.name.toLowerCase()) &&
      !(opts.excludeForks && r.fork) &&
      !(opts.excludeArchived && r.archived),
  );
}

/**
 * The project shown as "currently working on": the named repo if given and visible,
 * otherwise the most recently pushed visible repo.
 */
export function currentRepo(
  repos: Repo[],
  opts: VisibilityOptions & { preferred: string | null },
): Repo | null {
  const visible = visibleRepos(repos, opts);
  const preferred = opts.preferred?.toLowerCase();
  const named = preferred ? visible.find((r) => r.name.toLowerCase() === preferred) : undefined;
  return named ?? [...visible].sort(byRecency)[0] ?? null;
}

/** Filters a repo list to one category, splits out featured repos, and sorts the rest by recency. */
export function selectRepos(repos: Repo[], opts: SelectOptions): Selection {
  const featuredOrder = opts.featured.map((n) => n.toLowerCase());

  const visible = visibleRepos(repos, opts).filter(
    (r) => categorize(r, opts.uniTopic) === opts.category,
  );

  const featured = featuredOrder
    .map((name) => visible.find((r) => r.name.toLowerCase() === name))
    .filter((r): r is Repo => r !== undefined);
  const featuredSet = new Set(featured);

  const others = visible.filter((r) => !featuredSet.has(r)).sort(byRecency);

  return { featured, others };
}

/** Distinct languages in a list, most common first, ties alphabetical. */
export function languagesOf(repos: Repo[]): { language: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return [...counts]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));
}

import { site, type ProjectCategory } from '../../config/site';
import { getRepos } from './githubApi';
import type { Repo } from './githubTypes';
import { currentRepo, selectRepos } from './repos';

export type ProjectsResult =
  | { status: 'ok'; featured: Repo[]; others: Repo[]; stale: boolean }
  | { status: 'error'; message: string };

/** Repos for one category, with the site's GitHub settings applied. */
export async function getProjects(category: ProjectCategory): Promise<ProjectsResult> {
  const { username, ...options } = site.github;
  const result = await getRepos(username);
  if (result.status === 'error') return result;
  return {
    status: 'ok',
    stale: result.stale,
    ...selectRepos(result.repos, { ...options, category }),
  };
}

/** The repo for the landing page's "currently working on" block, or null if unavailable. */
export async function getCurrentProject(): Promise<Repo | null> {
  const { username, ...options } = site.github;
  const result = await getRepos(username);
  if (result.status === 'error') return null;
  return currentRepo(result.repos, { ...options, preferred: site.currentProject.repo });
}

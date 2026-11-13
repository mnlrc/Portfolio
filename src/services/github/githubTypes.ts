import { z } from 'astro/zod';

/** Subset of the GitHub REST "repository" object that the site uses. Unknown keys are stripped. */
export const rawRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  html_url: z.url(),
  homepage: z.string().nullable().optional(),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  fork: z.boolean(),
  archived: z.boolean(),
  topics: z.array(z.string()).default([]),
  pushed_at: z.string().nullable(),
  updated_at: z.string(),
});

export type RawRepo = z.infer<typeof rawRepoSchema>;

/** Normalized repository used by components. */
export interface Repo {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  /** ISO date of the last push (falls back to the last metadata update). */
  updatedAt: string;
  fork: boolean;
  archived: boolean;
}

export type RepoResult =
  { status: 'ok'; repos: Repo[]; stale: boolean } | { status: 'error'; message: string };

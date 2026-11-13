/**
 * Central site configuration. Personal content, links and GitHub behaviour live here;
 * components read from this file instead of hardcoding values.
 *
 * TODO(content): replace every placeholder marked TODO with real information.
 */

export type SkillGroup = { label: string; items: string[] };
export type SocialLink = { label: string; href: string };
export type Degree = {
  /** e.g. "Bachelor of Science in Computer Science" */
  degree: string;
  institution: string;
  /** Years as text, e.g. "2022". Leave empty if unknown. */
  start: string;
  end: string;
  status: 'completed' | 'in-progress' | 'planned';
  /** Optional short lines: specialisation, thesis title, honours… */
  details: string[];
};

export const site = {
  /** TODO(content): your full name as it should appear on the site. */
  name: 'mnlrc',
  /** TODO(content): professional title, e.g. "Computer Science Student". */
  title: 'Computer Science Student',
  /** Used for the <meta name="description"> of the landing page. */
  description:
    'Portfolio of mnlrc: university coursework and personal software projects, pulled live from GitHub at build time.',
  /** TODO(content): two or three sentences introducing yourself. */
  intro:
    'I build things to understand how they work: from games and algorithms to machine learning and networking. This site collects my university coursework and personal projects.',

  /**
   * Profile photo: put a square-ish image at src/assets/profile.jpg (or .png/.webp/.avif).
   * Until it exists, a monogram placeholder is shown.
   */
  photoAlt: 'Portrait of mnlrc',

  /**
   * "Currently working on" block on the landing page.
   * `repo`: name of a GitHub repo to show. Leave null to show the most recently pushed repo.
   * `note`: optional one-line status in your own words, e.g. "Adding multiplayer".
   */
  currentProject: { repo: null as string | null, note: '' },

  /** TODO(content): fill in your degrees. Entries with an empty `degree` are hidden. */
  education: [
    {
      degree: "Bachelor's degree — TODO",
      institution: 'University — TODO',
      start: '',
      end: '',
      status: 'in-progress',
      details: [],
    },
    {
      degree: "Master's degree — TODO",
      institution: 'University — TODO',
      start: '',
      end: '',
      status: 'planned',
      details: [],
    },
  ] satisfies Degree[] as Degree[],

  /** TODO(content): adjust to what you actually want to highlight. */
  skills: [
    { label: 'Languages', items: ['Python', 'C++', 'LaTeX'] },
    {
      label: 'Topics',
      items: ['Machine learning', 'Algorithms', 'Networking', 'Game development'],
    },
    { label: 'Tools', items: ['Git', 'Linux', 'PuLP'] },
  ] satisfies SkillGroup[],

  contact: {
    /** TODO(content): public contact email (rendered as a mailto link). Leave empty to hide. */
    email: '',
    links: [
      { label: 'GitHub', href: 'https://github.com/mnlrc' },
      // TODO(content): { label: 'LinkedIn', href: 'https://www.linkedin.com/in/…' },
    ] satisfies SocialLink[],
  },

  github: {
    username: 'mnlrc',
    /** Repos carrying this GitHub topic are listed as university projects; all others as personal. */
    uniTopic: 'university',
    excludeForks: true,
    excludeArchived: true,
    /** Repo names never shown (case-insensitive). */
    exclude: ['mnlrc.github.io', 'portfolio'],
    /** Repo names shown first, in this order, on their category page. */
    featured: [] as string[],
  },
} as const;

export type ProjectCategory = 'uni' | 'personal';

export const categories: Record<
  ProjectCategory,
  { title: string; path: string; description: string }
> = {
  uni: {
    title: 'University projects',
    path: '/projects/uni',
    description: 'Coursework and assignments from my studies.',
  },
  personal: {
    title: 'Personal projects',
    path: '/projects/personal',
    description: 'Things I built on my own time, out of curiosity.',
  },
};

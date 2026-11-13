/** Accent dot colors for common languages (always rendered next to a text label). */
const colors: Record<string, string> = {
  Python: '#3572a5',
  'C++': '#f34b7d',
  C: '#555555',
  TeX: '#3d6117',
  JavaScript: '#e8c400',
  TypeScript: '#3178c6',
  Java: '#b07219',
  Rust: '#dea584',
  Go: '#00add8',
  HTML: '#e34c26',
  CSS: '#663399',
  Shell: '#89e051',
  Astro: '#ff5a03',
};

export function languageColor(language: string | null): string {
  return (language && colors[language]) || '#8a877e';
}

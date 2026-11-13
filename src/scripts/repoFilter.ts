/**
 * Progressive enhancement for repo grids: filter cards by language.
 * Without JS every card stays visible and the filter bar stays hidden.
 */
document.querySelectorAll<HTMLElement>('[data-repo-filter]').forEach((root) => {
  const controls = root.querySelector<HTMLElement>('[data-filter-controls]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-filter-value]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-language]')];
  const status = root.querySelector<HTMLElement>('[data-filter-status]');
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]');
  if (!controls || buttons.length === 0) return;

  controls.hidden = false;

  const apply = (value: string) => {
    let shown = 0;
    for (const card of cards) {
      const match = value === 'all' || card.dataset.language === value;
      card.hidden = !match;
      if (match) shown++;
    }
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.filterValue === value));
    }
    if (empty) empty.hidden = shown > 0;
    if (status) {
      const label = value === 'all' ? 'all languages' : value;
      status.textContent = `Showing ${shown} ${shown === 1 ? 'project' : 'projects'} (${label}).`;
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', () => apply(button.dataset.filterValue ?? 'all'));
  }
});

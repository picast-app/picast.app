export const titleSort = (podcasts: Podcast[]): Podcast[] =>
  podcasts
    .map(v => ({
      ...v,
      sortName: v.title.replace(/^(the|a|an)\s/i, '').toLowerCase(),
    }))
    .sort(({ sortName: a }, { sortName: b }) => a.localeCompare(b))

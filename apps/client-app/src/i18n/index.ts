type Dict = Record<string, string>;

const en: Dict = {
  'home.myProjects': 'My Projects',
  'home.allTasks': 'All Tasks',
  'home.completedTasks': 'Completed Tasks',
  'home.projects': 'Projects',
  'home.tasks': 'Tasks',
  'home.team': 'Team',
};

const dictionaries: Record<string, Dict> = { en };

let current = 'en';
export function setLocale(locale: string) {
  if (dictionaries[locale]) current = locale;
}
export function t(key: string) {
  const dict = dictionaries[current] || en;
  return dict[key] || key;
}

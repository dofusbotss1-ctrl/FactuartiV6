export const normalizeCompanyName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const areCompanyNamesEqual = (name1: string, name2: string): boolean => {
  return normalizeCompanyName(name1) === normalizeCompanyName(name2);
};

export const averageDamageTitle = (per100Points: boolean) =>
  `Average Damage ${per100Points ? 'per 100 points' : ''}`;
export const healthTitle = (per100Points: boolean) =>
  `Effective health ${per100Points ? 'per 100 points' : ''}`;
export const saveLabel = (save: number) => (save === 0 ? '-' : `${save}+`);

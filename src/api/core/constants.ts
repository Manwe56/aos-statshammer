export enum Characteristic {
  ATTACKS = 'attacks',
  TO_HIT = 'to_hit',
  TO_WOUND = 'to_wound',
  REND = 'rend',
  DAMAGE = 'damage',
  SAVE = 'save',
}

export const getCharacteristic = (val: string): Characteristic => {
  const k = Object.keys(Characteristic).find((key) => Characteristic[key] === val);
  if (k) {
    return Characteristic[k];
  }
  throw new Error(`Invalid characteristic ${val}`);
};

export const getCharacteristicsAfter = (characteristic: Characteristic): Characteristic[] => {
  const values = Object.keys(Characteristic).map((key) => Characteristic[key]);
  const index = values.indexOf(characteristic);
  return values.slice(index + 1);
};

export const SAVES = [2, 3, 4, 5, 6, 0];

export const MORTAL_WOUND_REND = 'MW';
export const RENDS = [MORTAL_WOUND_REND, 3, 2, 1, 0];

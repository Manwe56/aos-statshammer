import type { IModifierInstance, IModifierInstanceParameter } from './modifiers';

export interface IWeaponProfileParameter {
  name?: string;
  active: boolean;
  num_models: number;
  attacks: number | string;
  to_hit: number;
  to_wound: number;
  rend: number;
  damage: number | string;
  modifiers: IModifierInstance[];
}

export interface IWeaponProfile extends IWeaponProfileParameter {
  uuid: string;
}

export interface IUnitParameter {
  name: string;
  active: boolean;
  reinforced: boolean;
  points: number;
  health: number;
  models: number;
  save: number;
  attacksModifier: number;
  modifiers?: IModifierInstanceParameter[];
  weapon_profiles?: IWeaponProfileParameter[];
}

export interface IUnit extends IUnitParameter {
  uuid: string;
  modifiers: IModifierInstance[];
  weapon_profiles: IWeaponProfile[];
}

export const PLUS_ONE_HIT = '+1H';
export const MINUS_ONE_HIT = '-1H';
export const PLUS_ONE_WOUND = '+1W';
export const MINUS_ONE_WOUND = '-1W';

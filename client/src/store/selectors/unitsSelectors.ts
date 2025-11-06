import _ from 'lodash';
import { createSelector } from 'reselect';
import { IModifierInstance, IModifierInstanceParameter } from 'types/modifiers';
import type { IStore } from 'types/store';
import type { IWeaponProfileParameter } from 'types/unit';

/** Get the current units state */
export const unitsSelector = (state: IStore) => state.units;

/** Retrieve a unit by its index in the array */
export const unitByIndexSelector = createSelector(unitsSelector, (units) =>
  _.memoize((index: number) => units[index]),
);

/** Retrieve the number of units in the current state */
export const numUnitsSelector = createSelector(unitsSelector, (units) => units.length);

/** Retrieve a units index by its UUID field */
export const unitIndexByUuidSelector = createSelector(unitsSelector, (units) =>
  _.memoize((uuid: string) => units.findIndex((unit) => unit.uuid === uuid)),
);

/** Retrieve a unit by its UUID field */
export const unitByUuidSelector = createSelector(unitsSelector, unitIndexByUuidSelector, (units, findIndex) =>
  _.memoize((uuid: string) => units[findIndex(uuid)]),
);

export const activeUnit = (unit) => ({
  ...unit,
  weapon_profiles: unit.weapon_profiles
    .filter((profile) => profile.active)
    .map((profile) => ({
      ...profile,
      modifiers: (profile.modifiers ?? []).filter((mod) => mod.active ?? true),
    })),
  modifiers: unit.modifiers.filter((mod) => mod.active),
});

export const activeUnitsSelector = createSelector(unitsSelector, (units) =>
  units
    .filter((unit) => unit.active)
    .map(activeUnit)
    .filter(({ weapon_profiles }) => weapon_profiles && weapon_profiles?.length),
);

/** Retrieve a list of the unit names */
export const unitNamesSelector = createSelector(activeUnitsSelector, (units) =>
  units.map(({ name }) => name),
);

const sanitizeModifier = (modifier: IModifierInstance) => {
  const { id, active, options, uuid } = modifier;
  return { id, active, options, uuid };
};

const sanitizeWeaponProfile = (wp: IWeaponProfileParameter) => {
  const { active, attacks, damage, modifiers, num_models, rend, to_hit, to_wound, name } = wp;

  // Ensure all numeric values are valid numbers
  const safeNum = (val: any, defaultVal = 0) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : defaultVal;
  };

  return {
    active,
    attacks,
    damage,
    modifiers: (modifiers || []).map((m) => sanitizeModifier(m)),
    num_models: safeNum(num_models, 1),
    rend: safeNum(rend, 0),
    to_hit: safeNum(to_hit, 4),
    to_wound: safeNum(to_wound, 4),
    name: name || 'Weapon Profile',
  };
};

const sanitizeUnit = ({
  name,
  active,
  reinforced,
  points,
  weapon_profiles,
  health,
  models,
  save,
  attacksModifier,
  modifiers,
}) => {
  // Ensure all numeric values are valid numbers
  const safeNum = (val: any, defaultVal = 0) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : defaultVal;
  };

  return {
    name: name || 'Unnamed Unit',
    points: safeNum(points, 100),
    health: safeNum(health, 1),
    models: safeNum(models, 1),
    save: safeNum(save, 4),
    attacksModifier: safeNum(attacksModifier, 0),
    active: active !== false,
    reinforced: reinforced || false,
    modifiers: (modifiers || []).map(sanitizeModifier),
    weapon_profiles: (weapon_profiles || []).map(sanitizeWeaponProfile),
  };
};

export interface ISanitizedUnit {
  name: string;
  points: number;
  health: number;
  models: number;
  save: number;
  active: boolean;
  reinforced: boolean;
  attacksModifier: number;
  modifiers?: IModifierInstanceParameter[];
  weapon_profiles: IWeaponProfileParameter[];
}
export const getSanitizedActiveUnitsSelector = createSelector(activeUnitsSelector, (units) =>
  _.memoize((): ISanitizedUnit[] => units.map(sanitizeUnit)),
);
export const getSanitizedAllUnitsSelector = createSelector(unitsSelector, (units) =>
  _.memoize((): ISanitizedUnit[] => units.map(sanitizeUnit)),
);

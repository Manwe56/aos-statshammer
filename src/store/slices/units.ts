import { createSlice } from '@reduxjs/toolkit';
import appConfig from 'appConfig';
import { isNaN } from 'lodash';
import { nanoid } from 'nanoid';
import { IModifierInstanceParameter, TOptionValue } from 'types/modifiers';
import type { IUnitStore } from 'types/store';
import {
  IUnit,
  IUnitParameter,
  IWeaponProfile,
  IWeaponProfileParameter,
  MINUS_ONE_HIT,
  MINUS_ONE_WOUND,
  PLUS_ONE_HIT,
  PLUS_ONE_WOUND,
} from 'types/unit';
import { moveItemInArray } from 'utils/arrayUpdates';

const DEFAULT_WEAPON_PROFILE: IWeaponProfileParameter = {
  active: true,
  num_models: 1,
  attacks: 1,
  to_hit: 3,
  to_wound: 3,
  rend: 1,
  damage: 1,
  modifiers: [],
};

const INITIAL_STATE: IUnitStore = [
  {
    name: 'Unit 1',
    uuid: nanoid(),
    active: true,
    reinforced: false,
    points: 100,
    health: 2,
    models: 1,
    attacksModifier: 0,
    modifiers: [],
    save: 4,
    weapon_profiles: [{ ...DEFAULT_WEAPON_PROFILE, uuid: nanoid() }],
  },
];

const addSingleUnit = (state: IUnitStore, singleUnit: IUnitParameter, atPosition?: number | null) => {
  const {
    name,
    weapon_profiles,
    active,
    points,
    reinforced,
    save,
    models,
    health,
    attacksModifier,
    modifiers,
  } = singleUnit;
  const profiles = weapon_profiles ?? [DEFAULT_WEAPON_PROFILE];
  const unit_modifiers = modifiers ?? [];
  const unit = {
    name,
    uuid: nanoid(),
    active: active ?? state.length < appConfig.limits.unitsVisibleByDefault,
    points: points ?? 100,
    reinforced: reinforced ?? false,
    health: health ?? 2,
    models: models ?? 1,
    attacksModifier: attacksModifier ?? 0,
    modifiers: unit_modifiers.map((modifier) => ({
      ...modifier,
      uuid: nanoid(),
    })),
    save: save ?? 4,
    weapon_profiles: profiles.map((profile) => ({
      ...profile,
      uuid: nanoid(),
    })),
  };
  if (typeof atPosition === 'number' && atPosition >= 0 && atPosition < state.length) {
    state.splice(atPosition, 0, unit);
  } else {
    state.push(unit);
  }
};

export const addUnits = (state: IUnitStore, action: { payload: { units: IUnitParameter[] } }) => {
  action.payload.units.forEach((unit) => addSingleUnit(state, unit));
};

export const replaceUnits = (state: IUnitStore, action: { payload: { units: IUnitParameter[] } }) => {
  state.splice(0, state.length);
  addUnits(state, action);
};

export const addUnit = (
  state: IUnitStore,
  action: { payload: { unit: IUnitParameter; atPosition?: number | null } },
) => {
  const { atPosition } = action.payload;
  addSingleUnit(state, action.payload.unit, atPosition);
};

export const deleteUnit = (state: IUnitStore, action: { payload: { index: number } }) => {
  const { index } = action.payload;
  return state.filter((_, i) => i !== index);
};

export const editUnitName = (state: IUnitStore, action: { payload: { index: number; name: string } }) => {
  const { index, name } = action.payload;
  const unit = state[index];
  if (unit) {
    unit.name = name;
  }
};

export const editUnitPoints = (state: IUnitStore, action: { payload: { index: number; points: number } }) => {
  const { index, points } = action.payload;
  const unit = state[index];
  if (unit) {
    unit.points = points;
  }
};

export const editUnitHealth = (state: IUnitStore, action: { payload: { index: number; health: number } }) => {
  const { index, health } = action.payload;
  const unit = state[index];
  if (unit) {
    unit.health = health;
  }
};

export const editUnitAttackModifier = (
  state: IUnitStore,
  action: { payload: { index: number; attacksModifier: number } },
) => {
  const { index, attacksModifier } = action.payload;
  const unit = state[index];
  if (unit) {
    if (!unit.attacksModifier || isNaN(unit.attacksModifier)) {
      unit.attacksModifier = 0;
    }
    const delta = attacksModifier - unit.attacksModifier ?? 0;
    unit.attacksModifier = attacksModifier;
    unit.weapon_profiles.forEach((weapon) => {
      weapon.attacks = Number(weapon.attacks) + delta;
    });
    const unitNameWithoutAttack = unit.name.replace(/ [+|-]\d+Atk/, '');
    if (attacksModifier === 0) {
      unit.name = unitNameWithoutAttack;
    } else {
      const signPrefix = attacksModifier > 0 ? '+' : '';
      unit.name = `${unitNameWithoutAttack} ${signPrefix}${attacksModifier}Atk`;
    }
  }
};

export const editUnitSave = (state: IUnitStore, action: { payload: { index: number; save: number } }) => {
  const { index, save } = action.payload;
  const unit = state[index];
  if (unit) {
    unit.save = save;
  }
};

export const editUnitModels = (state: IUnitStore, action: { payload: { index: number; models: number } }) => {
  const { index, models } = action.payload;
  const unit = state[index];
  if (unit) {
    unit.models = models;
    unit.weapon_profiles.forEach((wp) => {
      wp.num_models = models;
    });
  }
};

export const toggleUnit = (state: IUnitStore, action: { payload: { index: number } }) => {
  const { index } = action.payload;
  const unit = state[index];
  if (unit) {
    unit.active = !unit.active;
  }
};

export const toggleReinforcedUnit = (state: IUnitStore, action: { payload: { index: number } }) => {
  const { index } = action.payload;
  const unit = state[index];
  if (unit) {
    const factor = unit.reinforced ? 0.5 : 2.0;
    unit.points *= factor;
    unit.models *= factor;
    unit.name = unit.reinforced ? unit.name.replace(' [R]', '') : unit.name.concat(' [R]');
    unit.weapon_profiles.forEach((weapon) => {
      weapon.num_models *= factor;
    });
    unit.reinforced = !unit.reinforced;
  }
};

export const clearAllUnits = () => {
  return [];
};

export const moveUnit = (state: IUnitStore, action: { payload: { index: number; newIndex: number } }) => {
  const { index, newIndex } = action.payload;
  return moveItemInArray(state, index, newIndex, (newState) => {
    return newState;
  });
};

export const addWeaponProfile = (
  state: IUnitStore,
  action: { payload: { index: number; weaponProfile?: IWeaponProfileParameter; atPosition?: number | null } },
) => {
  const { index, weaponProfile, atPosition } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    const defaultWeaponProfile = { ...DEFAULT_WEAPON_PROFILE, num_models: unit.models };
    const profile = weaponProfile ?? defaultWeaponProfile;
    const newProfile: IWeaponProfile = {
      ...profile,
      uuid: nanoid(),
    };
    if (typeof atPosition === 'number' && atPosition >= 0 && atPosition < unit.weapon_profiles.length) {
      unit.weapon_profiles.splice(atPosition, 0, newProfile);
    } else {
      unit.weapon_profiles.push(newProfile);
    }
  }
};

export const toggleWeaponProfile = (
  state: IUnitStore,
  action: { payload: { index: number; profileIndex: number } },
) => {
  const { index, profileIndex } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    const profile = unit.weapon_profiles.find((_, i) => i === profileIndex);
    if (profile) {
      profile.active = !profile.active;
    }
  }
};

export const editWeaponProfile = (
  state: IUnitStore,
  action: { payload: { index: number; profileIndex: number; weaponProfile: IWeaponProfileParameter } },
) => {
  const { index, profileIndex, weaponProfile } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    let profile = unit.weapon_profiles.find((_, i) => i === profileIndex);
    if (profile) {
      profile = { ...profile, ...weaponProfile };
      unit.weapon_profiles[profileIndex] = profile;
    }
  }
};

export const deleteWeaponProfile = (
  state: IUnitStore,
  action: { payload: { index: number; profileIndex: number } },
) => {
  const { index, profileIndex } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    unit.weapon_profiles = unit.weapon_profiles.filter((_, i) => i !== profileIndex);
  }
};

const moveWeaponProfile = (
  state: IUnitStore,
  action: { payload: { index: number; profileIndex: number; newProfileIndex: number } },
) => {
  const { index, profileIndex, newProfileIndex } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    moveItemInArray(unit.weapon_profiles, profileIndex, newProfileIndex, (newProfiles) => {
      unit.weapon_profiles = newProfiles;
    });
  }
};

const addUnitModifier = (
  state: IUnitStore,
  action: { payload: { index: number; modifier: IModifierInstanceParameter } },
) => {
  const { index, modifier } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    const newModifier = { ...modifier, active: true, uuid: nanoid() };
    unit.modifiers.push(newModifier);
  }
};

const removeUnitModifier = (
  state: IUnitStore,
  action: { payload: { index: number; modifierIndex: number } },
) => {
  const { index, modifierIndex } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    unit.modifiers = unit.modifiers.filter((_, i) => i !== modifierIndex);
  }
};

const moveUnitModifier = (
  state: IUnitStore,
  action: { payload: { index: number; modifierIndex: number; modifierNewIndex: number } },
) => {
  const { index, modifierIndex, modifierNewIndex } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    moveItemInArray(unit.modifiers, modifierIndex, modifierNewIndex, (newModifiers) => {
      unit.modifiers = newModifiers;
    });
  }
};

const editUnitModifierOption = (
  state: IUnitStore,
  action: { payload: { index: number; modifierIndex: number; name: string; value: TOptionValue } },
) => {
  const { index, modifierIndex, name, value } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    const modifier = unit.modifiers.find((_, i) => i === modifierIndex);
    if (modifier) {
      modifier.options[name] = value;
    }
  }
};

const toggleUnitModifierActive = (
  state: IUnitStore,
  action: { payload: { index: number; modifierIndex: number } },
) => {
  const { index, modifierIndex } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    const modifier = unit.modifiers.find((_, i) => i === modifierIndex);
    if (modifier) {
      modifier.active = !modifier.active;
    }
  }
};

const changeUnitToHit = (unit: IUnit, delta: number) => {
  unit.weapon_profiles.forEach((wp) => {
    wp.to_hit = Number(wp.to_hit) + delta;
  });
};

const changeUnitToWound = (unit: IUnit, delta: number) => {
  unit.weapon_profiles.forEach((wp) => {
    wp.to_wound = Number(wp.to_wound) + delta;
  });
};

const editToHitToWoundModifier = (
  state: IUnitStore,
  action: { payload: { index: number; value: string | null } },
  plusOneString: string,
  minusOneString: string,
  changeFct: (unit: IUnit, delta: number) => void,
) => {
  const { index, value } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    if (unit.name.includes(plusOneString)) {
      unit.name = unit.name.replace(` ${plusOneString}`, '');
      changeFct(unit, +1);
    }
    if (unit.name.includes(minusOneString)) {
      unit.name = unit.name.replace(` ${minusOneString}`, '');
      changeFct(unit, -1);
    }
    if (value === plusOneString) {
      unit.name = `${unit.name} ${plusOneString}`;
      changeFct(unit, -1);
    }
    if (value === minusOneString) {
      unit.name = `${unit.name} ${minusOneString}`;
      changeFct(unit, +1);
    }
  }
};

const editHitModifier = (state: IUnitStore, action: { payload: { index: number; value: string | null } }) => {
  editToHitToWoundModifier(state, action, PLUS_ONE_HIT, MINUS_ONE_HIT, changeUnitToHit);
};

const editWoundModifier = (
  state: IUnitStore,
  action: { payload: { index: number; value: string | null } },
) => {
  editToHitToWoundModifier(state, action, PLUS_ONE_WOUND, MINUS_ONE_WOUND, changeUnitToWound);
};

const editTargetModifierError = (
  state: IUnitStore,
  action: { payload: { index: number; modifierIndex: number; error: boolean } },
) => {
  const { index, modifierIndex, error } = action.payload;
  const unit = state.find((_, i) => i === index);
  if (unit) {
    const modifier = unit.modifiers.find((_, i) => i === modifierIndex);
    if (modifier) {
      modifier.error = error;
    }
  }
};

export const unitsStore = createSlice({
  name: 'units',
  initialState: INITIAL_STATE,
  reducers: {
    addUnit,
    addUnits,
    replaceUnits,
    deleteUnit,
    editUnitName,
    editUnitPoints,
    editUnitSave,
    editUnitHealth,
    editUnitAttackModifier,
    editUnitModels,
    toggleUnit,
    toggleReinforcedUnit,
    editHitModifier,
    editWoundModifier,
    clearAllUnits,
    moveUnit,
    addWeaponProfile,
    toggleWeaponProfile,
    editWeaponProfile,
    deleteWeaponProfile,
    moveWeaponProfile,
    addUnitModifier,
    removeUnitModifier,
    moveUnitModifier,
    editUnitModifierOption,
    toggleUnitModifierActive,
    editTargetModifierError,
  },
});

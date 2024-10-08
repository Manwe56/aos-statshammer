import type { ISanitizedUnit } from 'store/selectors';
import type { IUnit } from 'types/unit';

export const unit1: IUnit = {
  name: 'Test Unit 1',
  uuid: 'unit-0',
  active: true,
  reinforced: false,
  points: 100,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  weapon_profiles: [
    {
      active: true,
      num_models: 1,
      attacks: 6,
      to_hit: 3,
      to_wound: 3,
      rend: 2,
      damage: 'D6',
      uuid: 'profile-0',
      modifiers: [
        {
          id: 'REROLL',
          options: {
            characteristic: 'to_hit',
          },
          uuid: 'mod-0',
          active: false,
        },
        {
          id: 'REROLL',
          options: {
            characteristic: 'to_wound',
          },
          uuid: 'mod-1',
          active: true,
        },
        {
          id: 'MORTAL_WOUNDS',
          options: {
            characteristic: 'to_hit',
            on: 6,
            mortalWounds: 'D6',
            unmodified: true,
            inAddition: true,
          },
          uuid: 'mod-2',
          active: true,
        },
      ],
    },
  ],
};

export const unit2: IUnit = {
  name: 'Test Unit 2',
  uuid: 'unit-1',
  active: true,
  points: 200,
  reinforced: false,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  weapon_profiles: [
    {
      active: true,
      num_models: 5,
      attacks: 2,
      to_hit: 3,
      to_wound: 3,
      rend: 1,
      damage: 2,
      uuid: 'profile-0',
      modifiers: [
        {
          id: 'LEADER_BONUS',
          options: {
            characteristic: 'attacks',
            bonus: 1,
            numLeaders: 1,
          },
          active: true,
          uuid: 'mod-0',
        },
      ],
    },
  ],
};

export const unit3: IUnit = {
  name: 'Test Unit 3',
  uuid: 'unit-2',
  active: false,
  reinforced: false,
  points: 300,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  weapon_profiles: [
    {
      active: true,
      num_models: 3,
      attacks: 'D6',
      to_hit: 3,
      to_wound: 3,
      rend: 1,
      damage: 1,
      uuid: 'profile-0',
      modifiers: [
        {
          id: 'BONUS',
          uuid: 'option-0',
          options: {
            characteristic: 'rend',
            bonus: 1,
          },
          active: true,
        },
        {
          id: 'BONUS',
          uuid: 'option-1',
          options: {
            characteristic: 'damage',
            bonus: 1,
          },
          active: true,
        },
      ],
    },
    {
      active: false,
      num_models: 1,
      attacks: 1,
      to_hit: 4,
      to_wound: 4,
      rend: 0,
      damage: 1,
      modifiers: [],
      uuid: 'profile-1',
    },
  ],
};

export const unit4: IUnit = {
  name: 'Test Unit 4',
  uuid: 'unit-3',
  active: true,
  reinforced: false,
  points: 400,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  weapon_profiles: [],
};

export const sanitizedUnit1Name: ISanitizedUnit = {
  name: 'Test Unit 1',
  points: 100,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  active: true,
  reinforced: false,
  weapon_profiles: [
    {
      active: true,
      num_models: 1,
      attacks: 6,
      to_hit: 3,
      to_wound: 3,
      rend: 2,
      damage: 'D6',
      modifiers: [
        {
          id: 'REROLL',
          options: {
            characteristic: 'to_wound',
          },
          uuid: 'mod-1',
          active: true,
        },
        {
          id: 'MORTAL_WOUNDS',
          options: {
            characteristic: 'to_hit',
            on: 6,
            mortalWounds: 'D6',
            unmodified: true,
            inAddition: true,
          },
          uuid: 'mod-2',
          active: true,
        },
      ],
    },
  ],
};

export const sanitizedUnit2Name: ISanitizedUnit = {
  name: 'Test Unit 2',
  points: 200,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  active: true,
  reinforced: false,
  weapon_profiles: [
    {
      active: true,
      num_models: 5,
      attacks: 2,
      to_hit: 3,
      to_wound: 3,
      rend: 1,
      damage: 2,
      modifiers: [
        {
          id: 'LEADER_BONUS',
          options: {
            characteristic: 'attacks',
            bonus: 1,
            numLeaders: 1,
          },
          active: true,
          uuid: 'mod-0',
        },
      ],
    },
  ],
};

export const sanitizedUnit3Name: ISanitizedUnit = {
  name: 'Test Unit 3',
  points: 300,
  health: 2,
  attacksModifier: 0,
  models: 5,
  modifiers: [],
  save: 4,
  active: true,
  reinforced: false,
  weapon_profiles: [
    {
      active: true,
      num_models: 3,
      attacks: 'D6',
      to_hit: 3,
      to_wound: 3,
      rend: 1,
      damage: 1,
      modifiers: [
        {
          id: 'BONUS',
          uuid: 'option-0',
          options: {
            characteristic: 'rend',
            bonus: 1,
          },
          active: true,
        },
        {
          id: 'BONUS',
          uuid: 'option-1',
          options: {
            characteristic: 'damage',
            bonus: 1,
          },
          active: true,
        },
      ],
    },
  ],
};

export const sanitizedUnit1Uuid: ISanitizedUnit = {
  ...sanitizedUnit1Name,
  name: 'unit-0',
};

export const sanitizedUnit2Uuid: ISanitizedUnit = {
  ...sanitizedUnit2Name,
  name: 'unit-1',
};

export const sanitizedUnit3Uuid: ISanitizedUnit = {
  ...sanitizedUnit3Name,
  name: 'unit-2',
};

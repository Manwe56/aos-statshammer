import { Characteristic as C } from '../../constants';
import { D6 } from '../../models/dice';
import DiceValue from '../../models/diceValue';
import { MODIFIERS as m } from '../../models/modifiers';
import Unit from '../../models/unit';
import WeaponProfile from '../../models/weaponProfile';

const buildUnit = (name, points, weapon_profiles) => {
  return new Unit({
    name,
    points,
    weapon_profiles,
    health: 1,
    models: 5,
    save: 4,
    active: true,
    reinforced: false,
    attacksModifier: 0,
    modifiers: [],
  });
};

export const chainraspHorde = buildUnit('Chainrasp Horde', 100, [
  new WeaponProfile(10, 2, 4, 4, 0, 1, [
    new m.LEADER_BONUS({ characteristic: C.ATTACKS, numLeaders: 1, bonus: 1 }),
  ]),
]);

export const mortekGuard = buildUnit('Mortek Guard', 100, [
  new WeaponProfile(9, 2, 3, 4, 1, 1, [
    new m.LEADER_BONUS({ characteristic: C.ATTACKS, numLeaders: 1, bonus: 1 }),
    new m.EXPLODING({
      characteristic: C.TO_HIT,
      on: 6,
      extraHits: 1,
      unmodified: true,
    }),
  ]),
  new WeaponProfile(1, 2, 3, 3, 1, 1, []),
]);

export const hearthGuardBerzerkersBroadaxes = buildUnit('Hearthguard Berzerkers', 100, [
  new WeaponProfile(20, 2, 3, 3, 1, 2, [
    new m.LEADER_BONUS({ characteristic: C.ATTACKS, numLeaders: 1, bonus: 1 }),
  ]),
]);

export const hearthGuardBerzerkersPoleaxes = buildUnit('Hearthguard Berzerkers', 100, [
  new WeaponProfile(20, 2, 3, 3, 0, 1, [
    new m.LEADER_BONUS({ characteristic: C.ATTACKS, numLeaders: 1, bonus: 1 }),
    new m.MORTAL_WOUNDS({
      characteristic: C.TO_HIT,
      on: 6,
      mortalWounds: 2,
      unmodified: true,
      inAddition: true,
    }),
  ]),
]);

export const necropolisStalkersBase = buildUnit('Necropolis Stalkers', 100, [
  new WeaponProfile(1, 3, 3, 4, 2, 2, []),
  new WeaponProfile(2, 5, 3, 3, 1, 1, []),
]);

export const necropolisStalkersPrec = buildUnit('Necropolis Stalkers', 100, [
  new WeaponProfile(1, 3, 3, 4, 2, 2, [
    new m.BONUS({ characteristic: C.REND, bonus: 1 }),
    new m.BONUS({ characteristic: C.DAMAGE, bonus: 1 }),
  ]),
  new WeaponProfile(2, 5, 3, 3, 1, 1, [
    new m.BONUS({ characteristic: C.REND, bonus: 1 }),
    new m.BONUS({ characteristic: C.DAMAGE, bonus: 1 }),
  ]),
]);

export const necropolisStalkersSwordsBase = buildUnit('Necropolis Stalkers', 100, [
  new WeaponProfile(3, 5, 3, 3, 1, 1, []),
]);

export const necropolisStalkersSwordsPrec = buildUnit('Necropolis Stalkers', 100, [
  new WeaponProfile(3, 5, 3, 3, 1, 1, [
    new m.BONUS({ characteristic: C.REND, bonus: 1 }),
    new m.BONUS({ characteristic: C.DAMAGE, bonus: 1 }),
  ]),
]);

export const gotrek = buildUnit('Gotrek Gurnisson', 100, [
  new WeaponProfile(1, 6, 3, 3, 2, 3, [
    new m.REROLL({ characteristic: C.TO_HIT }),
    new m.REROLL({ characteristic: C.TO_WOUND }),
    new m.MORTAL_WOUNDS({
      characteristic: C.TO_HIT,
      on: 6,
      mortalWounds: D6,
      unmodified: true,
      inAddition: true,
    }),
  ]),
]);

export const spiritHosts = buildUnit('Spirit Hosts', 100, [
  new WeaponProfile(3, 6, 5, 4, 0, 1, [
    new m.MORTAL_WOUNDS({
      characteristic: C.TO_HIT,
      on: 6,
      mortalWounds: 1,
      inAddition: false,
      unmodified: true,
    }),
  ]),
]);

export const kurnothHuntersSwords = buildUnit('Kurnoth Hunters', 100, [
  new WeaponProfile(3, 4, 3, 3, 1, 2, [
    new m.MORTAL_WOUNDS({
      characteristic: C.TO_WOUND,
      on: 6,
      mortalWounds: 1,
      inAddition: true,
      unmodified: true,
    }),
    new m.LEADER_BONUS({ characteristic: C.TO_HIT, numLeaders: 1, bonus: 1 }),
  ]),
]);

export const plagueMonksOld = buildUnit('Plague Monks (pre Dec 2019 FAQ)', 100, [
  new WeaponProfile(20, 2, 4, 4, 0, 1, [
    new m.REROLL({ characteristic: C.TO_HIT }),
    new m.CONDITIONAL_BONUS({
      characteristic: C.TO_HIT,
      bonus: 1,
      unmodified: true,
      bonusToCharacteristic: C.REND,
    }),
    new m.CONDITIONAL_BONUS({
      characteristic: C.TO_WOUND,
      bonus: 1,
      unmodified: true,
      bonusToCharacteristic: C.DAMAGE,
    }),
  ]),
]);

export const rattlingGunners = buildUnit('Rattling Gunners', 100, [
  new WeaponProfile(1, DiceValue.parse('2D6'), 4, 4, 1, 1, []),
]);

export const unitWithAutoWounds = buildUnit('AutoWound', 200, [
  new WeaponProfile(6, 6, 6, 6, 0, 1, [
    new m.AUTO_WOUND({
      characteristic: C.TO_HIT,
      on: 6,
    }),
  ]),
]);

export const unitWithSave4 = new Unit({
  points: 200,
  health: 6,
  models: 10,
  name: 'save4',
  save: 4,
  active: true,
  reinforced: false,
  attacksModifier: 0,
  weapon_profiles: [],
  modifiers: [],
});

// #region edge cases
export const explodingAndConditionalSame = buildUnit('Exploding And Conditional (Same Characteristic)', 100, [
  new WeaponProfile(1, 3, 3, 4, 1, 2, [
    new m.EXPLODING({
      characteristic: C.TO_HIT,
      on: 6,
      extraHits: 2,
      unmodified: true,
    }),
    new m.CONDITIONAL_BONUS({
      characteristic: C.TO_HIT,
      bonus: 1,
      unmodified: true,
      bonusToCharacteristic: C.DAMAGE,
    }),
  ]),
]);

export const explodingAndConditionalDifferent = buildUnit(
  'Exploding And Conditional (Different Characteristic)',
  100,
  [
    new WeaponProfile(1, 3, 3, 4, 1, 2, [
      new m.EXPLODING({
        characteristic: C.TO_HIT,
        on: 6,
        extraHits: 2,
        unmodified: true,
      }),
      new m.CONDITIONAL_BONUS({
        characteristic: C.TO_WOUND,
        bonus: 1,
        unmodified: true,
        bonusToCharacteristic: C.DAMAGE,
      }),
    ]),
  ],
);
// #endregion

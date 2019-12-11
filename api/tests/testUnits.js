/* eslint-disable no-undef */
import Unit from '../models/unit';
import WeaponProfile from '../models/weaponProfile';
import { MODIFIERS as m } from '../models/modifiers';
import { Characteristics as C } from '../constants';
import { D6 } from '../models/dice';
import { testUnit } from './utils';


describe('Units', () => {
  describe('Chainrasp Horde', () => {
    const unit = new Unit('chainrasp horde', [
      new WeaponProfile(10, 2, 4, 4, 0, 1, [
        new m.LEADER_EXTRA_ATTACKS({ numLeaders: 1, bonus: 1 }),
      ]),
    ]);
    testUnit(unit, [5.25, 4.375, 3.5, 2.625, 1.75, 0.875]);
  });

  describe('Mortek Guard Swords', () => {
    const unit = new Unit('mortek guard', [
      new WeaponProfile(9, 2, 3, 4, 1, 1, [
        new m.LEADER_EXTRA_ATTACKS({ numLeaders: 1, bonus: 1 }),
        new m.EXPLODING({ on: 6, extraHits: 1, unmodified: true }),
      ]),
      new WeaponProfile(1, 2, 3, 3, 1, 1, []),
    ]);
    testUnit(unit, [8.806, 8.806, 7.338, 5.870, 4.403, 2.935]);
  });

  describe('Hearthguard Berzerkers Broadaxes', () => {
    const unit = new Unit('Hearthguard Berzerkers', [
      new WeaponProfile(20, 2, 3, 3, 1, 2, [
        new m.LEADER_EXTRA_ATTACKS({ numLeaders: 1, bonus: 1 }),
      ]),
    ]);
    testUnit(unit, [36.444, 36.444, 30.37, 24.296, 18.222, 12.148]);
  });

  describe('Hearthguard Berzerkers Poleaxes', () => {
    const unit = new Unit('Hearthguard Berzerkers', [
      new WeaponProfile(20, 2, 3, 3, 0, 1, [
        new m.LEADER_EXTRA_ATTACKS({ numLeaders: 1, bonus: 1 }),
        new m.MORTAL_WOUNDS({
          on: 6, mortalWounds: 2, unmodified: true, inAddition: true,
        }),
      ]),
    ]);
    testUnit(unit, [31.889, 28.852, 25.815, 22.778, 19.741, 16.704]);
  });

  describe('Necropolis Stalkers Swords /w No Aspect', () => {
    const unit = new Unit('Necropolis Stalkers', [
      new WeaponProfile(3, 5, 3, 3, 1, 1, []),
    ]);
    testUnit(unit, [6.667, 6.667, 5.556, 4.444, 3.333, 2.222]);
  });

  describe('Necropolis Stalkers Swords /w Precision Aspect', () => {
    const unit = new Unit('Necropolis Stalkers', [
      new WeaponProfile(3, 5, 3, 3, 1, 1, [
        new m.BONUS({ characteristic: C.REND, bonus: 1 }),
        new m.BONUS({ characteristic: C.DAMAGE, bonus: 1 }),
      ]),
    ]);
    testUnit(unit, [13.333, 13.333, 13.333, 11.111, 8.889, 6.667]);
  });

  describe('Necropolis Stalkers GS + S /w No Aspect', () => {
    const unit = new Unit('Necropolis Stalkers', [
      new WeaponProfile(1, 3, 3, 4, 2, 2, []),
      new WeaponProfile(2, 5, 3, 3, 1, 1, []),
    ]);
    testUnit(unit, [6.444, 6.444, 5.704, 4.630, 3.556, 2.481]);
  });

  describe('Necropolis Stalkers GS + S /w Precision Aspect', () => {
    const unit = new Unit('Necropolis Stalkers', [
      new WeaponProfile(1, 3, 3, 4, 2, 2, [
        new m.BONUS({ characteristic: C.REND, bonus: 1 }),
        new m.BONUS({ characteristic: C.DAMAGE, bonus: 1 }),
      ]),
      new WeaponProfile(2, 5, 3, 3, 1, 1, [
        new m.BONUS({ characteristic: C.REND, bonus: 1 }),
        new m.BONUS({ characteristic: C.DAMAGE, bonus: 1 }),
      ]),
    ]);
    testUnit(unit, [11.889, 11.889, 11.889, 10.407, 8.426, 6.444]);
  });

  describe('Gotrek Gurnisson', () => {
    const unit = new Unit('Gotrek Gurnisson', [
      new WeaponProfile(1, 6, 3, 3, 2, 3, [
        new m.REROLL({ characteristic: C.TO_HIT }),
        new m.REROLL({ characteristic: C.TO_WOUND }),
        new m.MORTAL_WOUNDS({
          on: 6, mortalWounds: D6, unmodified: true, inAddition: true,
        }),
      ]),
    ]);
    testUnit(unit, [18.889, 18.889, 18.889, 16.519, 14.148, 11.778]);
  });

  describe('Spirit Hosts', () => {
    const unit = new Unit('Spirit Hosts', [
      new WeaponProfile(3, 6, 5, 4, 0, 1, [
        new m.MORTAL_WOUNDS({
          on: 6, mortalWounds: 1, inAddition: false, unmodified: true,
        }),
      ]),
    ]);
    testUnit(unit, [4.5, 4.25, 4, 3.75, 3.5, 3.25]);
  });
});

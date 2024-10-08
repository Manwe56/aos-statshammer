import { Characteristic as C } from '../constants';
import { D6 } from '../models/dice';
import { MODIFIERS as m } from '../models/modifiers';
import type Target from '../models/target';
import type WeaponProfile from '../models/weaponProfile';

class SimulationProcessor {
  profile: WeaponProfile;
  target: Target;

  constructor(profile: WeaponProfile, target: Target) {
    this.profile = profile;
    this.target = target;
  }

  simulate(): number {
    let { numModels } = this.profile;
    let totalAttacks = 0;

    const leaderModifiers = this.profile.getLeaderModifiers();
    let leaderDamage = 0;
    if (leaderModifiers && leaderModifiers.length) {
      const { numLeaders } = leaderModifiers[0];
      numModels = Math.max(numModels - numLeaders, 0);
      const leaderProfile = this.profile.getSplitProfile(
        leaderModifiers,
        leaderModifiers.map((mod) => mod.getAsBonusModifier()),
      );
      leaderProfile.numModels = numLeaders;
      const leaderSim = new SimulationProcessor(leaderProfile, this.target);
      const leaderAttacks = numLeaders * leaderProfile.getAttacks(false, true);
      leaderDamage += [...Array(leaderAttacks)].reduce((acc) => acc + leaderSim.resolveHitRoll(), 0);
    }
    totalAttacks += numModels * this.profile.getAttacks(false, true);
    return [...Array(totalAttacks)].reduce((acc) => acc + this.resolveHitRoll(), 0) + leaderDamage;
  }

  resolveHitRoll() {
    const hitRoll = this.performReroll(C.TO_HIT, D6.roll());
    let extraDamage = 0;
    if (hitRoll >= this.profile.getToHit(false, true)) {
      const explodingModifier = this.profile.modifiers.getModifier(m.EXPLODING, C.TO_HIT);
      if (explodingModifier && hitRoll >= explodingModifier.on) {
        extraDamage = [...Array(explodingModifier.getExtra(true))].reduce(
          (acc) => acc + this.resolveWoundRoll(),
          0,
        );
      }

      const mwModifier = this.profile.modifiers.getModifier(m.MORTAL_WOUNDS, C.TO_HIT);
      if (mwModifier && hitRoll >= mwModifier.on) {
        let mortalDamage = 0;
        mortalDamage = mwModifier.getMortalWounds(true);
        mortalDamage = this.performMortalSaveRolls(mortalDamage);
        mortalDamage = this.performFNPRolls(mortalDamage);
        extraDamage += mortalDamage;
        if (!mwModifier.inAddition) return extraDamage;
      }

      const awModifier = this.profile.modifiers.getModifier(m.AUTO_WOUND, C.TO_HIT);
      if (awModifier && hitRoll >= awModifier.on) {
        return this.resolveSaveRoll() + extraDamage;
      }

      const cbModifier = this.profile.modifiers.getModifier(m.CONDITIONAL_BONUS, C.TO_HIT);
      if (cbModifier && hitRoll >= cbModifier.on) {
        const splitProfile = this.profile.getSplitProfile([cbModifier], [cbModifier.getAsBonusModifier()]);
        const splitSimulation = new SimulationProcessor(splitProfile, this.target);
        return splitSimulation.resolveWoundRoll() + extraDamage;
      }

      return this.resolveWoundRoll() + extraDamage;
    }
    return 0;
  }

  resolveWoundRoll() {
    const woundRoll = this.performReroll(C.TO_WOUND, D6.roll());
    let extraDamage = 0;
    if (woundRoll >= this.profile.getToWound(false, true)) {
      const explodingModifier = this.profile.modifiers.getModifier(m.EXPLODING, C.TO_WOUND);
      if (explodingModifier && woundRoll >= explodingModifier.on) {
        extraDamage = [...Array(explodingModifier.getExtra(true))].reduce(
          (acc) => acc + this.resolveSaveRoll(),
          0,
        );
      }

      const mwModifier = this.profile.modifiers.getModifier(m.MORTAL_WOUNDS, C.TO_WOUND);
      if (mwModifier && woundRoll >= mwModifier.on) {
        let mortalDamage = 0;
        mortalDamage = mwModifier.getMortalWounds(true);
        mortalDamage = this.performMortalSaveRolls(mortalDamage);
        mortalDamage = this.performFNPRolls(mortalDamage);
        extraDamage += mortalDamage;
        if (!mwModifier.inAddition) return extraDamage;
      }

      const cbModifier = this.profile.modifiers.getModifier(m.CONDITIONAL_BONUS, C.TO_WOUND);
      if (cbModifier && woundRoll >= cbModifier.on) {
        const splitProfile = this.profile.getSplitProfile([cbModifier], [cbModifier.getAsBonusModifier()]);
        const splitSimulation = new SimulationProcessor(splitProfile, this.target);
        return splitSimulation.resolveSaveRoll() + extraDamage;
      }

      return this.resolveSaveRoll() + extraDamage;
    }
    return 0;
  }

  resolveSaveRoll() {
    const rend = this.profile.getRend(false, true);
    const save = this.target.getSave(rend);
    if (save) {
      const saveRoll = this.performRerollSaves(D6.roll(), rend);
      if (saveRoll >= save) return 0;
    }
    return this.resolveDamage();
  }

  resolveDamage() {
    const damage = this.profile.getDamage(false, true);
    return this.performFNPRolls(damage);
  }

  performReroll(characteristic, roll) {
    if (roll < this.profile.getCharacteristic(characteristic)) {
      const rerollModifier = this.profile.modifiers.getRerollModifier(characteristic);
      if (rerollModifier && rerollModifier.allowedReroll(this.profile, roll)) {
        return D6.roll();
      }
    }
    return roll;
  }

  performRerollSaves(roll, rend) {
    if (roll < (this.target.getSave(rend) ?? 0)) {
      const rerollModifier = this.target.modifiers.getRerollModifier();
      if (rerollModifier && rerollModifier.allowedReroll(this.profile, this.target, roll)) {
        return D6.roll();
      }
    }
    return roll;
  }

  performMortalSaveRolls(damage: number): number {
    const mod = this.target.modifiers.getSaveAfterSaveModifier(true);
    if (mod) {
      return [...Array(damage)].reduce((acc) => (D6.roll() >= mod.on ? acc : acc + 1), 0);
    }
    return damage;
  }

  performFNPRolls(damage: number): number {
    const mod = this.target.modifiers.getSaveAfterSaveModifier(false);
    if (mod) {
      return [...Array(damage)].reduce((acc) => (D6.roll() >= mod.on ? acc : acc + 1), 0);
    }
    return damage;
  }
}

export default SimulationProcessor;

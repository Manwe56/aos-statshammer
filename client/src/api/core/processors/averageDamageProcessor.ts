import { Characteristic as C } from '../constants';
import { D6 } from '../models/dice';
import { MODIFIERS as m } from '../models/modifiers';
import type Target from '../models/target';
import type WeaponProfile from '../models/weaponProfile';

export default class AverageDamageProcessor {
  profile: WeaponProfile;
  target: Target;

  constructor(profile: WeaponProfile, target: Target) {
    this.profile = profile;
    this.target = target;
  }

  getAverageDamage() {
    let { numModels } = this.profile;
    let totalAttacks = 0;

    const leaderModifiers = this.profile.getLeaderModifiers();
    let leaderDamage = 0;
    if (leaderModifiers && leaderModifiers.length) {
      if (leaderModifiers.length === 1 && leaderModifiers[0].characteristic === C.ATTACKS) {
        totalAttacks += leaderModifiers[0].resolve(this.profile);
      } else {
        const { numLeaders } = leaderModifiers[0];
        numModels = Math.max(numModels - numLeaders, 0);
        const leaderProfile = this.profile.getSplitProfile(
          leaderModifiers,
          leaderModifiers.map((mod) => mod.getAsBonusModifier()),
        );
        leaderProfile.numModels = numLeaders;
        const leaderProcessor = new AverageDamageProcessor(leaderProfile, this.target);
        leaderDamage += leaderProcessor.getAverageDamage();
      }
    }

    totalAttacks += numModels * this.profile.getAttacks();
    return this.resolveHits(totalAttacks) + leaderDamage;
  }

  resolveHits(attacks: number) {
    let hits = attacks * D6.getProbability(this.profile.getToHit());
    hits += attacks * this.profile.resolveRerolls(C.TO_HIT);
    hits += attacks * this.profile.resolveModifier(m.EXPLODING, C.TO_HIT);

    const mwModifier = this.profile.modifiers.getModifier(m.MORTAL_WOUNDS, C.TO_HIT);
    let mortalDamage = 0;
    if (mwModifier) {
      const mortalHits = attacks * mwModifier.resolve(this.profile);
      mortalDamage += mortalHits * mwModifier.getMortalWounds();
      mortalDamage = Math.max(mortalDamage - mortalDamage * this.target.resolveMortalSave(this.profile), 0);
      if (!mwModifier.inAddition) {
        hits = Math.max(hits - mortalHits, 0);
      }
    }

    const awModifier = this.profile.modifiers.getModifier(m.AUTO_WOUND, C.TO_HIT);
    let autoWounds = 0;
    if (awModifier) {
      autoWounds = attacks * awModifier.resolve(this.profile);
      hits = Math.max(hits - autoWounds, 0);
    }

    const cbModifier = this.profile.modifiers.getModifier(m.CONDITIONAL_BONUS, C.TO_HIT);
    let splitDamage = 0;
    if (cbModifier) {
      const newProfile = this.profile.getSplitProfile([cbModifier], [cbModifier.getAsBonusModifier()]);
      const cbModHits = attacks * cbModifier.resolve(this.profile);
      const splitProcessor = new AverageDamageProcessor(newProfile, this.target);
      splitDamage = splitProcessor.resolveWounds(cbModHits, 0);
      hits = Math.max(hits - cbModHits, 0);
    }

    return this.resolveWounds(hits, autoWounds) + mortalDamage + splitDamage;
  }

  resolveWounds(hits: number, autoWounds: number) {
    let wounds = hits * D6.getProbability(this.profile.getToWound());
    wounds += hits * this.profile.resolveRerolls(C.TO_WOUND);
    wounds += hits * this.profile.resolveModifier(m.EXPLODING, C.TO_WOUND);

    const mwModifier = this.profile.modifiers.getModifier(m.MORTAL_WOUNDS, C.TO_WOUND);
    let mortalDamage = 0;
    if (mwModifier) {
      const mortalToWounds = hits * mwModifier.resolve(this.profile);
      mortalDamage += mortalToWounds * mwModifier.getMortalWounds();
      mortalDamage = Math.max(mortalDamage - mortalDamage * this.target.resolveMortalSave(this.profile), 0);
      if (!mwModifier.inAddition) {
        wounds = Math.max(wounds - mortalToWounds, 0);
      }
    }

    const cbModifier = this.profile.modifiers.getModifier(m.CONDITIONAL_BONUS, C.TO_WOUND);
    let splitDamage = 0;
    if (cbModifier) {
      const newProfile = this.profile.getSplitProfile([cbModifier], [cbModifier.getAsBonusModifier()]);
      const cbModWounds = hits * cbModifier.resolve(this.profile);
      const splitProcessor = new AverageDamageProcessor(newProfile, this.target);
      splitDamage = splitProcessor.resolveSaves(cbModWounds);
      wounds = Math.max(wounds - cbModWounds, 0);
    }
    wounds += autoWounds;

    return this.resolveSaves(wounds) + mortalDamage + splitDamage;
  }

  resolveSaves(wounds: number) {
    const saves = wounds * this.target.resolveSave(this.profile);
    const successful = wounds - saves;
    return this.resolveDamage(successful);
  }

  resolveDamage(successful: number) {
    const damage = successful * this.profile.getDamage();
    const saves = damage * this.target.resolveFNP(this.profile);
    return Math.max(damage - saves, 0);
  }
}

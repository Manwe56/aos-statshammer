import { ISanitizedUnit } from 'store/selectors';
import { IModifierInstanceParameter } from 'types/modifiers';

import { Characteristic, MORTAL_WOUND_REND } from '../constants';
import AverageDamageProcessor from '../processors/averageDamageProcessor';
import MaxDamageProcessor from '../processors/maxDamageProcessor';
import SimulationProcessor from '../processors/simulationProcessor';
import type { IUnitSimulation, TUnitSimulationBucket, TUnitSimulationMetrics } from '../types/models/unit';
import { range } from '../utils/mathUtils';
import MortalWounds from './modifiers/MortalWounds';
import Target from './target';
import WeaponProfile from './weaponProfile';

type TFreqMap = { [damage: number]: number };

/**
 * A class representing a single AoS Unit
 */
class Unit {
  name: string;
  points: number;
  health: number;
  models: number;
  save: number;
  modifiers: IModifierInstanceParameter[] | undefined;
  weaponProfiles: WeaponProfile[];

  /**
   * @param name The name of the unit
   * @param weaponProfiles The list of weapon profiles belonging to the unit
   */
  constructor(unit: ISanitizedUnit) {
    this.name = unit.name;
    this.points = unit.points;
    this.health = unit.health;
    this.models = unit.models;
    this.save = unit.save;
    this.modifiers = unit.modifiers;
    this.weaponProfiles = unit.weapon_profiles?.map((profile) => {
      if (profile instanceof WeaponProfile) return profile;
      return new WeaponProfile(
        profile.num_models,
        profile.attacks,
        profile.to_hit,
        profile.to_wound,
        profile.rend,
        profile.damage,
        profile.modifiers,
      );
    });
  }

  /**
   * Calculate the average damage this unit would do against a particular target
   * @param target The target to calculate the damage against
   */
  averageDamage(target: Target, per100Points = false): number {
    const averageDamage = this.weaponProfiles.reduce(
      (acc, profile) => acc + new AverageDamageProcessor(profile, target).getAverageDamage(),
      0,
    );
    return per100Points ? (averageDamage * 100) / Math.max(1, this.points) : averageDamage;
  }

  effectiveHealth(rend: number | string, per100Points: boolean): number {
    let totalHealth = this.models * this.health;
    const target = new Target(this.save, this.modifiers);

    if (per100Points) {
      totalHealth *= 100 / this.points;
    }

    if (rend === MORTAL_WOUND_REND) {
      // will do 1 MW in average
      const mortalWoundProfile = new WeaponProfile(1, 2, 4, 4, 0, 1, [
        new MortalWounds({
          characteristic: Characteristic.TO_HIT,
          on: 4,
          unmodified: true,
          inAddition: false,
          mortalWounds: 1,
        }),
      ]);
      const averageDamageProcessor = new AverageDamageProcessor(mortalWoundProfile, target);
      return totalHealth / averageDamageProcessor.getAverageDamage();
    }

    const rendNumber = Number(rend);
    // will do 1 DMG in average
    const rendProfile = new WeaponProfile(1, 4, 4, 4, rendNumber, 1);
    const averageProcessorWithRend = new AverageDamageProcessor(rendProfile, target);

    return totalHealth / averageProcessorWithRend.getAverageDamage();
  }

  /**
   * Calculate the maximum damage this unit could do
   */
  maxDamage(): number {
    return this.weaponProfiles.reduce(
      (acc, profile) => acc + new MaxDamageProcessor(profile).getMaxDamage(),
      0,
    );
  }

  runSimulations(target: Target, numSimulations = 1000): IUnitSimulation {
    const max = this.maxDamage();
    const mean = this.averageDamage(target);

    let variance = 0;
    const counts: TFreqMap = {};
    [...Array(numSimulations)].forEach(() => {
      const result = this.weaponProfiles.reduce<number>((acc, profile) => {
        const sim = new SimulationProcessor(profile, target);
        const simResult = sim.simulate();
        return acc + simResult;
      }, 0);
      variance += (result - mean) ** 2;
      counts[result] = counts[result] ? counts[result] + 1 : 1;
    });
    variance /= numSimulations;
    const standardDeviation = Math.sqrt(variance);

    const metrics = {
      max: Number(max.toFixed(2)),
      mean: Number(mean.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      standardDeviation: Number((standardDeviation ?? 0).toFixed(2)),
    };

    const buckets = this.convertCountsToBuckets(counts, metrics, numSimulations);

    return { buckets, metrics };
  }

  private convertCountsToBuckets(
    counts: TFreqMap,
    metrics: TUnitSimulationMetrics,
    numSimulations: number,
  ): TUnitSimulationBucket[] {
    const { max } = metrics;

    const buckets = Object.keys(counts)
      .map(Number)
      .sort((x, y) => x - y)
      .map((damage) => ({
        damage,
        count: counts[damage],
        probability: parseFloat(((counts[damage] * 100) / numSimulations).toFixed(2)),
      }));

    const sampleMax = Math.max(...Object.keys(counts).map(Number));
    const step = Math.max(Math.floor(((max - sampleMax) / max) * 10), 1);
    [...range(sampleMax + 1, max, step)].forEach((i) => {
      buckets.push({ damage: i, count: 0, probability: 0 });
    });
    if (sampleMax < max) {
      buckets.push({ damage: max, count: 0, probability: 0 });
    }
    buckets.push({ damage: max + 1, count: 0, probability: 0 });

    return buckets;
  }
}

export default Unit;

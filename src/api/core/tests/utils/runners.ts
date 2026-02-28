import { RENDS } from 'api/core/constants';
import assert from 'assert';

import Target from '../../models/target';
import Unit from '../../models/unit';

export const SAVES = [0, 6, 5, 4, 3, 2];

export const round = (number: number) => Math.round(number * 1000) / 1000;

export const repeatSave = (results: number[]) =>
  SAVES.map((save, index) => ({ save, result: results[index] }));
export const repeatRend = (results: number[]) =>
  RENDS.map((rend, index) => ({ rend, result: results[index] }));

export const assertCloseEnough = (actual: number, expected: number, deviation = 0.1) => {
  const diff = Math.abs(actual - expected);
  const diffDeviation = diff / Math.max(actual, expected);
  assert.equal(diffDeviation <= deviation, true, `${actual} is not within ${deviation} of ${expected}`);
};

export const testUnit = (unit: Unit, results: number[], per100Points = false) => {
  repeatSave(results).forEach(({ save, result }) => {
    it(`should return correct damage (${save} save, ${result} damage)`, () => {
      const target = new Target(save);
      assert.equal(round(unit.averageDamage(target, per100Points)), result);
    });
  });
};

export const testEffectiveHealth = (unit: Unit, results: number[], per100Points = false) => {
  repeatRend(results).forEach(({ rend, result }) => {
    it(`should return correct health (${rend} rend, ${result} health)`, () => {
      assert.equal(round(unit.effectiveHealth(rend, per100Points)), result);
    });
  });
};

export const testSimulation = (unit: Unit, results: number[]) => {
  repeatSave(results).forEach(({ save, result }) => {
    it(`should return correct mean damage (${save} save, ${result} damage, 5% variance)`, () => {
      const target = new Target(save);
      assertCloseEnough(unit.runSimulations(target, 3000).metrics.mean, result);
    });
  });
};

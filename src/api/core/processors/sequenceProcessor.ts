import { ISanitizedUnit } from 'store/selectors';
import type {
  TSequenceStep,
  ISequenceSimulationResult,
  ISequenceUnitReference,
  ISequenceUnitSimulationResult,
} from 'types/sequenceSimulator';

import SimulationProcessor from './simulationProcessor';
import Target from '../models/target';
import WeaponProfile from '../models/weaponProfile';

interface ISequenceParticipant extends ISequenceUnitReference {
  unit: ISanitizedUnit;
}

interface IRunSequenceRequest {
  participants: ISequenceParticipant[];
  steps: TSequenceStep[];
  numSimulations: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const scaleProfileModels = (
  profileModels: number,
  baseUnitModels: number,
  remainingUnitModels: number,
): number => {
  if (remainingUnitModels <= 0 || profileModels <= 0) return 0;
  if (baseUnitModels <= 0) return remainingUnitModels;
  const ratio = profileModels / baseUnitModels;
  const scaled = Math.round(ratio * remainingUnitModels);
  return clamp(scaled, 0, remainingUnitModels);
};

const simulateSingleAttack = (
  attacker: ISanitizedUnit,
  attackerRemainingModels: number,
  target: ISanitizedUnit,
  attackerHitBonus = 0,
  targetSaveBonus = 0,
  selectedWeaponProfileUuids?: string[],
): number => {
  if (attackerRemainingModels <= 0 || attacker.health <= 0) return 0;

  const modifiedTargetSave = target.save ? Math.max(target.save - targetSaveBonus, 2) : target.save;
  const targetClass = new Target(modifiedTargetSave, target.modifiers);
  const selectedWeapons = selectedWeaponProfileUuids?.length
    ? attacker.weapon_profiles.filter((profile) => selectedWeaponProfileUuids.includes(profile.uuid))
    : attacker.weapon_profiles;

  return selectedWeapons.reduce((acc, profile) => {
    try {
      const profileModels = scaleProfileModels(profile.num_models, attacker.models, attackerRemainingModels);
      if (profileModels <= 0) return acc;

      const modifiedToHit = Math.max(profile.to_hit - attackerHitBonus, 2);

      const weaponProfile = new WeaponProfile(
        profileModels,
        profile.attacks,
        modifiedToHit,
        profile.to_wound,
        profile.rend,
        profile.damage,
        profile.modifiers,
      );
      const simulation = new SimulationProcessor(weaponProfile, targetClass);
      return acc + simulation.simulate();
    } catch {
      return acc;
    }
  }, 0);
};

const getInvolvedUnitIds = (steps: TSequenceStep[], participantsById: Record<string, ISequenceParticipant>) => {
  const ids: string[] = [];
  steps.forEach((step) => {
    if (step.type === 'fight') {
      if (participantsById[step.attackerId] && !ids.includes(step.attackerId)) ids.push(step.attackerId);
      if (participantsById[step.targetId] && !ids.includes(step.targetId)) ids.push(step.targetId);
    }
  });
  return ids;
};

const buildUnitResult = (
  participant: ISequenceParticipant,
  countsByRemainingModels: Record<number, number>,
  stepCounts: Record<number, number>[],
  stepSums: number[],
  numSimulations: number,
): ISequenceUnitSimulationResult => {
  const models = Object.keys(countsByRemainingModels)
    .map(Number)
    .sort((a, b) => a - b);

  const meanRaw = models.reduce(
    (acc, value) => acc + value * (countsByRemainingModels[value] ?? 0),
    0,
  ) / Math.max(numSimulations, 1);
  const varianceRaw = models.reduce((acc, value) => {
    const count = countsByRemainingModels[value] ?? 0;
    return acc + ((value - meanRaw) ** 2 * count) / Math.max(numSimulations, 1);
  }, 0);

  return {
    unitId: participant.id,
    side: participant.side,
    name: participant.name,
    initialModels: participant.initialModels,
    stepMeans: stepSums.map((sum) => Number((sum / Math.max(numSimulations, 1)).toFixed(2))),
    stepPercentages: stepSums.map((sum) => {
      const mean = sum / Math.max(numSimulations, 1);
      const initial = Math.max(participant.initialModels, 1);
      return Number(((mean * 100) / initial).toFixed(2));
    }),
    stepDistributions: stepCounts.map((stepCountMap) =>
      Object.keys(stepCountMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((value) => ({
          models: value,
          count: stepCountMap[value],
          probability: Number(((stepCountMap[value] * 100) / Math.max(numSimulations, 1)).toFixed(2)),
        })),
    ),
    minRemaining: models.length ? models[0] : 0,
    maxRemaining: models.length ? models[models.length - 1] : 0,
    meanRemaining: Number(meanRaw.toFixed(2)),
    variance: Number(varianceRaw.toFixed(2)),
    standardDeviation: Number(Math.sqrt(varianceRaw).toFixed(2)),
    distribution: models.map((value) => ({
      models: value,
      count: countsByRemainingModels[value],
      probability: Number(((countsByRemainingModels[value] * 100) / Math.max(numSimulations, 1)).toFixed(2)),
    })),
  };
};

export const runSequenceSimulations = ({
  participants,
  steps,
  numSimulations,
}: IRunSequenceRequest): ISequenceSimulationResult => {
  const participantsById = participants.reduce<Record<string, ISequenceParticipant>>((acc, participant) => {
    acc[participant.id] = participant;
    return acc;
  }, {});

  const involvedUnitIds = getInvolvedUnitIds(steps, participantsById);
  const countsByUnitId = involvedUnitIds.reduce<Record<string, Record<number, number>>>((acc, unitId) => {
    acc[unitId] = {};
    return acc;
  }, {});
  const stepSumsByUnitId = involvedUnitIds.reduce<Record<string, number[]>>((acc, unitId) => {
    acc[unitId] = [...Array(steps.length + 1)].map(() => 0);
    return acc;
  }, {});
  const stepCountsByUnitId = involvedUnitIds.reduce<Record<string, Record<number, number>[]>>((acc, unitId) => {
    acc[unitId] = [...Array(steps.length + 1)].map(() => ({}));
    return acc;
  }, {});

  [...Array(numSimulations)].forEach(() => {
    const remainingModels = participants.reduce<Record<string, number>>((acc, participant) => {
      acc[participant.id] = participant.unit.models;
      return acc;
    }, {});
    const pendingDamageByUnitId = participants.reduce<Record<string, number>>((acc, participant) => {
      acc[participant.id] = 0;
      return acc;
    }, {});
    const baseSaves = participants.reduce<Record<string, number>>((acc, participant) => {
      acc[participant.id] = participant.unit.save;
      return acc;
    }, {});
    const currentSaves = { ...baseSaves };

    involvedUnitIds.forEach((unitId) => {
      const value = Math.max(remainingModels[unitId] ?? 0, 0);
      stepSumsByUnitId[unitId][0] += value;
      stepCountsByUnitId[unitId][0][value] = (stepCountsByUnitId[unitId][0][value] ?? 0) + 1;
    });

    steps.forEach((step, stepIndex) => {
      if (step.type === 'end-turn') {
        involvedUnitIds.forEach((unitId) => {
          currentSaves[unitId] = baseSaves[unitId];
        });
      } else {
        const attacker = participantsById[step.attackerId];
        const target = participantsById[step.targetId];
        if (attacker && target) {
          const attackerModels = remainingModels[step.attackerId] ?? 0;
          const targetModels = remainingModels[step.targetId] ?? 0;
          if (attackerModels > 0 && targetModels > 0) {
            const targetWithCurrentSave: ISanitizedUnit = {
              ...target.unit,
              save: currentSaves[step.targetId] ?? target.unit.save,
            };
            const damage = simulateSingleAttack(
              attacker.unit,
              attackerModels,
              targetWithCurrentSave,
              step.allOutAttack ? 1 : 0,
              step.allOutDefense ? 1 : 0,
              step.selectedWeaponProfileUuids,
            );
            const targetHealth = Math.max(target.unit.health, 1);
            const totalPendingDamage = (pendingDamageByUnitId[step.targetId] ?? 0) + damage;
            const rawSlainModels = Math.floor(totalPendingDamage / targetHealth);
            const appliedSlainModels = Math.min(rawSlainModels, targetModels);
            remainingModels[step.targetId] = Math.max(targetModels - appliedSlainModels, 0);

            if (remainingModels[step.targetId] <= 0) {
              // Target is wiped, any excess damage is discarded.
              pendingDamageByUnitId[step.targetId] = 0;
            } else {
              pendingDamageByUnitId[step.targetId] =
                totalPendingDamage - appliedSlainModels * targetHealth;
            }
          }
          if (step.allOutAttack) {
            const currentSave = currentSaves[step.attackerId] ?? attacker.unit.save;
            currentSaves[step.attackerId] = currentSave + 1;
          }
        }
      }

      involvedUnitIds.forEach((unitId) => {
        const value = Math.max(remainingModels[unitId] ?? 0, 0);
        stepSumsByUnitId[unitId][stepIndex + 1] += value;
        stepCountsByUnitId[unitId][stepIndex + 1][value] =
          (stepCountsByUnitId[unitId][stepIndex + 1][value] ?? 0) + 1;
      });
    });

    involvedUnitIds.forEach((unitId) => {
      const value = Math.max(remainingModels[unitId] ?? 0, 0);
      const counts = countsByUnitId[unitId];
      counts[value] = (counts[value] ?? 0) + 1;
    });
  });

  return {
    numSimulations,
    units: involvedUnitIds
      .map((unitId) => {
        const participant = participantsById[unitId];
        if (!participant) return null;
        return buildUnitResult(
          participant,
          countsByUnitId[unitId] ?? {},
          stepCountsByUnitId[unitId] ?? [],
          stepSumsByUnitId[unitId] ?? [],
          numSimulations,
        );
      })
      .filter((result): result is ISequenceUnitSimulationResult => result !== null),
  };
};

export type { ISequenceParticipant };

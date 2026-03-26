import type { TPlayerSide } from './store';

export interface ISequenceBaseStep {
  id: string;
  type: 'fight' | 'end-turn';
}

export interface ISequenceFightStep extends ISequenceBaseStep {
  type: 'fight';
  attackerId: string;
  targetId: string;
  allOutAttack: boolean;
  allOutDefense: boolean;
  selectedWeaponProfileUuids?: string[];
}

export interface ISequenceEndTurnStep extends ISequenceBaseStep {
  type: 'end-turn';
}

export type TSequenceStep = ISequenceFightStep | ISequenceEndTurnStep;

export interface ISequenceUnitReference {
  id: string;
  side: TPlayerSide;
  unitUuid: string;
  name: string;
  initialModels: number;
}

export interface ISequenceDistributionBucket {
  models: number;
  count: number;
  probability: number;
}

export interface ISequenceUnitSimulationResult {
  unitId: string;
  side: TPlayerSide;
  name: string;
  initialModels: number;
  stepMeans: number[];
  stepPercentages: number[];
  stepDistributions: ISequenceDistributionBucket[][];
  minRemaining: number;
  maxRemaining: number;
  meanRemaining: number;
  variance: number;
  standardDeviation: number;
  distribution: ISequenceDistributionBucket[];
}

export interface ISequenceSimulationResult {
  numSimulations: number;
  units: ISequenceUnitSimulationResult[];
}

import { createSlice } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { TSequenceStep, ISequenceSimulationResult } from 'types/sequenceSimulator';
import type { TError } from 'types/store';

interface ISequenceSimulatorStore {
  pending: boolean;
  error: TError;
  steps: TSequenceStep[];
  results: ISequenceSimulationResult | null;
}

const INITIAL_STATE: ISequenceSimulatorStore = {
  pending: false,
  error: null,
  steps: [],
  results: null,
};

export const addStep = (
  state: ISequenceSimulatorStore,
  action: {
    payload: {
      attackerId: string;
      targetId: string;
      allOutAttack: boolean;
      allOutDefense: boolean;
      minusOneHit: boolean;
      minusOneWound: boolean;
      selectedWeaponProfileUuids?: string[];
    };
  },
) => {
  const {
    attackerId,
    targetId,
    allOutAttack,
    allOutDefense,
    minusOneHit,
    minusOneWound,
    selectedWeaponProfileUuids,
  } = action.payload;
  state.steps.push({
    id: nanoid(),
    type: 'fight',
    attackerId,
    targetId,
    allOutAttack,
    allOutDefense,
    minusOneHit,
    minusOneWound,
    selectedWeaponProfileUuids,
  });
  state.results = null;
};

export const addEndTurnStep = (state: ISequenceSimulatorStore) => {
  state.steps.push({ id: nanoid(), type: 'end-turn' });
  state.results = null;
};

export const updateStep = (
  state: ISequenceSimulatorStore,
  action: {
    payload:
      | {
          id: string;
          type: 'fight';
          attackerId: string;
          targetId: string;
          allOutAttack: boolean;
          allOutDefense: boolean;
          minusOneHit: boolean;
          minusOneWound: boolean;
          selectedWeaponProfileUuids?: string[];
        }
      | {
          id: string;
          type: 'end-turn';
        };
  },
) => {
  const { id } = action.payload;
  const index = state.steps.findIndex((step) => step.id === id);
  if (index >= 0) {
    if (action.payload.type === 'fight') {
      state.steps[index] = {
        id,
        type: 'fight',
        attackerId: action.payload.attackerId,
        targetId: action.payload.targetId,
        allOutAttack: action.payload.allOutAttack,
        allOutDefense: action.payload.allOutDefense,
        minusOneHit: action.payload.minusOneHit,
        minusOneWound: action.payload.minusOneWound,
        selectedWeaponProfileUuids: action.payload.selectedWeaponProfileUuids,
      };
    } else {
      state.steps[index] = {
        id,
        type: 'end-turn',
      };
    }
    state.results = null;
  }
};

export const toggleFightStepAction = (
  state: ISequenceSimulatorStore,
  action: {
    payload: { id: string; action: 'allOutAttack' | 'allOutDefense' | 'minusOneHit' | 'minusOneWound' };
  },
) => {
  const { id, action: actionName } = action.payload;
  const index = state.steps.findIndex((step) => step.id === id);
  if (index < 0) return;
  const step = state.steps[index];
  if (step.type !== 'fight') return;
  state.steps[index] = {
    ...step,
    [actionName]: !step[actionName],
  };
  state.results = null;
};

export const updateFightStepWeapons = (
  state: ISequenceSimulatorStore,
  action: { payload: { id: string; selectedWeaponProfileUuids?: string[] } },
) => {
  const { id, selectedWeaponProfileUuids } = action.payload;
  const index = state.steps.findIndex((step) => step.id === id);
  if (index < 0) return;
  const step = state.steps[index];
  if (step.type !== 'fight') return;
  state.steps[index] = {
    ...step,
    selectedWeaponProfileUuids,
  };
  state.results = null;
};

export const removeStep = (state: ISequenceSimulatorStore, action: { payload: { id: string } }) => {
  const { id } = action.payload;
  state.steps = state.steps.filter((step) => step.id !== id);
  state.results = null;
};

export const moveStep = (
  state: ISequenceSimulatorStore,
  action: { payload: { id: string; direction: 'up' | 'down' } },
) => {
  const { id, direction } = action.payload;
  const index = state.steps.findIndex((step) => step.id === id);
  if (index < 0) return;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= state.steps.length) return;
  const [item] = state.steps.splice(index, 1);
  state.steps.splice(targetIndex, 0, item);
  state.results = null;
};

export const clearSteps = (state: ISequenceSimulatorStore) => {
  state.steps = [];
  state.results = null;
};

export const fetchSequenceSimulationsPending = (state: ISequenceSimulatorStore) => {
  state.pending = true;
  state.error = null;
};

export const fetchSequenceSimulationsSuccess = (
  state: ISequenceSimulatorStore,
  action: { payload: { results: ISequenceSimulationResult } },
) => {
  state.pending = false;
  state.error = null;
  state.results = action.payload.results;
};

export const fetchSequenceSimulationsError = (
  state: ISequenceSimulatorStore,
  action: { payload: { error: TError } },
) => {
  state.pending = false;
  state.error = action.payload.error;
};

export const sequenceSimulatorStore = createSlice({
  name: 'sequenceSimulator',
  initialState: INITIAL_STATE,
  reducers: {
    addStep,
    addEndTurnStep,
    updateStep,
    toggleFightStepAction,
    updateFightStepWeapons,
    removeStep,
    moveStep,
    clearSteps,
    fetchSequenceSimulationsPending,
    fetchSequenceSimulationsSuccess,
    fetchSequenceSimulationsError,
  },
});

export type { ISequenceSimulatorStore };

import appConfig from 'appConfig';
import store from 'store';
import { numSimulationsSelector } from 'store/selectors';
import { configStore, sequenceSimulatorStore } from 'store/slices';
import type { ISequenceFightStep } from 'types/sequenceSimulator';
import type { IStore } from 'types/store';
import { getSequenceParticipants } from 'utils/sequenceSimulator';

import type { TDispatch } from './api.types';
import { runSequenceSimulations } from './core/processors/sequenceProcessor';
import type { ISequenceParticipant } from './core/processors/sequenceProcessor';

const verifyNumSimulations = (state: IStore, dispatch: TDispatch): number => {
  const storeNumSims = numSimulationsSelector(state);
  let numSims = storeNumSims ?? appConfig.simulations.default;
  numSims = Math.min(Math.max(numSims, appConfig.simulations.min), appConfig.simulations.max);
  if (numSims !== storeNumSims) {
    dispatch(configStore.actions.changeNumSimulations({ newValue: numSims }));
  }
  return numSims;
};

const findParticipantByStepId = (
  participants: ISequenceParticipant[],
  step: ISequenceFightStep,
  property: 'attackerId' | 'targetId',
) => participants.find((participant) => participant.id === step[property]);

export const fetchSequenceSimulations = () => async (dispatch: TDispatch) => {
  dispatch(sequenceSimulatorStore.actions.fetchSequenceSimulationsPending());

  try {
    const state = store.getState();
    const steps = state.sequenceSimulator.steps;
    const participants = getSequenceParticipants(state);
    const numSimulations = verifyNumSimulations(state, dispatch);

    if (!steps.length || !participants.length) {
      dispatch(
        sequenceSimulatorStore.actions.fetchSequenceSimulationsSuccess({
          results: { numSimulations, units: [] },
        }),
      );
      return;
    }

    const validSteps = steps.filter(
      (step) => {
        if (step.type === 'fight') {
          return (
            findParticipantByStepId(participants, step, 'attackerId') &&
            findParticipantByStepId(participants, step, 'targetId') &&
            step.attackerId !== step.targetId
          );
        }
        return true;
      },
    );

    const results = runSequenceSimulations({
      participants,
      steps: validSteps,
      numSimulations,
    });

    dispatch(sequenceSimulatorStore.actions.fetchSequenceSimulationsSuccess({ results }));
  } catch (error) {
    dispatch(
      sequenceSimulatorStore.actions.fetchSequenceSimulationsError({
        error: String(error),
      }),
    );
  }
};

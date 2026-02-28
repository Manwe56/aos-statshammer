import appConfig from 'appConfig';
import store from 'store';
import {
  getSanitizedActiveUnitsSelector,
  getSanitizedTargetSelector,
  numSimulationsSelector,
} from 'store/selectors';
import { configStore, simulationsStore } from 'store/slices';
import type { IStore } from 'types/store';

import type { TDispatch } from './api.types';
import StatsController from './core/controllers/statsController';

const verifyNumSimulations = (state: IStore, dispatch: TDispatch): number => {
  const storeNumSims = numSimulationsSelector(state);
  let numSims = storeNumSims ?? appConfig.simulations.default;
  numSims = Math.min(Math.max(numSims, appConfig.simulations.min), appConfig.simulations.max);
  if (numSims !== storeNumSims) {
    dispatch(configStore.actions.changeNumSimulations({ newValue: numSims }));
  }
  return numSims;
};

export const fetchSimulations = () => async (dispatch: TDispatch) => {
  dispatch(simulationsStore.actions.fetchSimulationsPending());
  const state = store.getState();
  const units = getSanitizedActiveUnitsSelector(state)();
  if (!units) dispatch(simulationsStore.actions.fetchSimulationsSuccess({ results: [] }));
  const target = getSanitizedTargetSelector(state);
  const numSimulations = verifyNumSimulations(state, dispatch);

  const statsController = new StatsController();
  const res = statsController.simulateUnits({ units, target, numSimulations });

  dispatch(simulationsStore.actions.fetchSimulationsSuccess({ results: res.results }));
};

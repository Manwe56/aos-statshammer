import { createSelector } from 'reselect';
import type { IStore } from 'types/store';

export const configSelector = (state: IStore) => state.config;

const normalizePlayerSide = (value: unknown): 'Self' | 'Opponent' =>
  value === 'Opponent' || value === 'Defender' ? 'Opponent' : 'Self';

export const desktopGraphListSelector = createSelector(
  configSelector,
  ({ desktopGraphList }) => desktopGraphList,
);

export const numSimulationsSelector = createSelector(configSelector, ({ numSimulations }) => numSimulations);

export const useRailLgSelector = createSelector(configSelector, ({ useRailLg }) => useRailLg);

export const otherPlayerArmy = createSelector(configSelector, ({ otherPlayerArmy }) => otherPlayerArmy);

export const activePlayer = createSelector(configSelector, ({ activePlayer }) => normalizePlayerSide(activePlayer));

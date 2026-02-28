import { createSelector } from 'reselect';
import type { IStore } from 'types/store';

/** Get the current target state */
export const statsSelector = (state: IStore) => state.stats;

export const statsPer100Points = createSelector(statsSelector, ({ per100Points }) => per100Points);

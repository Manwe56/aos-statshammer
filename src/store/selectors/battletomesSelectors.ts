import { createSelector } from 'reselect';
import { Faction, IArmy } from 'types/army';
import type { IStore } from 'types/store';

import { activeUnit } from './unitsSelectors';

const compareString = (a: string, b: string) => 0 - (a < b ? 1 : -1);
const compareArmy = (a: IArmy, b: IArmy) =>
  a.faction === b.faction ? compareString(a.label, b.label) : compareString(a.faction, b.faction);

export const battletomesSelector = (state: IStore) => state.battletomes;

export const sortedBattletomesSelector = createSelector(battletomesSelector, ({ battletomes }) =>
  [...battletomes].sort(compareArmy),
);

export const getRankingFaction = createSelector(battletomesSelector, ({ rankingFaction }) => rankingFaction);

export const getFactionUnits = createSelector(
  sortedBattletomesSelector,
  getRankingFaction,
  (battletomes, rankingFaction) => battletomes
    .filter((army) => (rankingFaction === Faction.All ? true : army.faction === rankingFaction))
    .flatMap((army) => army.units)
    .map(activeUnit),
);

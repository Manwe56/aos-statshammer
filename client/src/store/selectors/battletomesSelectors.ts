import MATCHPLAY from 'armies/matchplay/matchplay';
import { createSelector } from 'reselect';
import type { IStore } from 'types/store';
import { activeUnit } from './unitsSelectors';
import { Faction } from 'types/army';

const compareString = (a, b) => 0 - (a < b ? 1 : -1);
const compareArmy = (a, b) =>
  a.faction === b.faction ? compareString(a.label, b.label) : compareString(a.faction, b.faction);

/** Get the current target state */
export const battletomesSelector = (state: IStore) => state.battletomes;

const mergeBattleTomesWithMatchPlay = (battletomes) => {
  return [
    ...MATCHPLAY.filter((army) => !battletomes.find((btArmy) => army.faction === btArmy.faction)),
    ...battletomes,
  ].sort(compareArmy);
}

export const mergedBattletomesSelector = createSelector(battletomesSelector, ({ battletomes }) =>
  mergeBattleTomesWithMatchPlay(battletomes)
);

export const getFactionUnits = createSelector(battletomesSelector, ({ battletomes, rankingFaction }) => mergeBattleTomesWithMatchPlay(battletomes)
  .map(f => {console.log(`${f} vs ${rankingFaction}`);return f;})
  .filter(army => rankingFaction===Faction.All ? true: army.faction===rankingFaction)
  .flatMap(army => army.units)
  .map(activeUnit)
);

export const getRankingFaction = createSelector(battletomesSelector, ({rankingFaction}) => rankingFaction);

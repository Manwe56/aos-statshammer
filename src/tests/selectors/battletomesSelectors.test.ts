import { getFactionUnits, sortedBattletomesSelector } from 'store/selectors/battletomesSelectors';
import { Faction, IArmy } from 'types/army';

import { state } from './utils/testState';
import { unit1, unit2 } from './utils/testUnits';

describe('battletome selectors', () => {
  it('starts with no bundled battletomes or ranked units', () => {
    expect(sortedBattletomesSelector(state)).toEqual([]);
    expect(getFactionUnits(state)).toEqual([]);
  });

  it('sorts saved battletomes and ranks only the selected faction without modifying saved data', () => {
    const saved: IArmy[] = [
      { faction: Faction.SCE, label: 'Custom', units: [unit1] },
      { faction: Faction.KO, label: 'Custom', units: [unit2] },
    ];
    const allFactions = { ...state, battletomes: { battletomes: saved, rankingFaction: Faction.All } };
    expect(sortedBattletomesSelector(allFactions).map((army) => army.faction)).toEqual([Faction.KO, Faction.SCE]);
    expect(saved.map((army) => army.faction)).toEqual([Faction.SCE, Faction.KO]);
    expect(getFactionUnits(allFactions).map((unit) => unit.name)).toEqual([unit2.name, unit1.name]);

    const oneFaction = { ...allFactions, battletomes: { ...allFactions.battletomes, rankingFaction: Faction.SCE } };
    expect(getFactionUnits(oneFaction).map((unit) => unit.name)).toEqual([unit1.name]);
  });

  it('handles saved units without optional modifiers or weapon profiles', () => {
    const unit = { ...unit1, modifiers: undefined, weapon_profiles: undefined };
    const custom = {
      ...state,
      battletomes: {
        battletomes: [{ faction: Faction.SCE, label: 'Custom', units: [unit] }],
        rankingFaction: Faction.All,
      },
    };
    expect(getFactionUnits(custom)[0]).toMatchObject({ name: unit.name, modifiers: [], weapon_profiles: [] });
  });
});

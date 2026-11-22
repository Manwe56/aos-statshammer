import { battletomesStore } from 'store/slices/battletomes';
import { Faction, IArmy } from 'types/army';
import { unit1, unit2 } from 'tests/selectors/utils/testUnits';

import { parseBattletomes, serializeBattletomes } from './backupFormat';

const first: IArmy = { faction: Faction.SCE, label: 'My battletome', units: [unit1] };
const second: IArmy = { faction: Faction.Skaven, label: 'Custom', units: [unit2] };

describe('battletome backups', () => {
  it('round trips every customized battletome, including nested profiles and modifiers', () => {
    const backup = serializeBattletomes([first, second]);
    expect(parseBattletomes(backup)).toEqual([first, second]);
  });

  it('restores matching factions while preserving other factions and ranking selection', () => {
    const initial = {
      battletomes: [{ ...first, label: 'Old' }, { faction: Faction.KO, label: 'Keep', units: [] }],
      rankingFaction: Faction.KO,
    };
    const imported = parseBattletomes(serializeBattletomes([first, second]));
    const result = battletomesStore.reducer(initial, battletomesStore.actions.importBattletomes({ battletomes: imported }));
    expect(result.battletomes).toEqual([initial.battletomes[1], first, second]);
    expect(result.rankingFaction).toBe(Faction.KO);
  });

  it.each([
    'not json',
    JSON.stringify({ version: 2, battletomes: [first] }),
    JSON.stringify({ version: 1, battletomes: [first, { ...second, units: null }] }),
    JSON.stringify({ version: 1, battletomes: [{ ...first, units: [{ ...unit1, weapon_profiles: [null] }] }] }),
    JSON.stringify({ version: 1, battletomes: [first, first] }),
    JSON.stringify({ version: 1, battletomes: [{ ...first, faction: Faction.List }] }),
  ])('rejects invalid backups before importing any faction', (backup) => {
    expect(() => parseBattletomes(backup)).toThrow();
  });
});

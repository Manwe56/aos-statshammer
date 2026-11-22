import { createSlice } from '@reduxjs/toolkit';
import { Faction, IArmy } from 'types/army';
import type { IBattletomesStore } from 'types/store';

const INITIAL_STATE: IBattletomesStore = {
  battletomes: [],
  rankingFaction : Faction.All,
};

const addBattletome = (state: IBattletomesStore, action: { payload: { battletome: IArmy } }) => {
  state.battletomes = [
    ...state.battletomes.filter((army) => army.faction !== action.payload.battletome.faction),
    action.payload.battletome,
  ];
};

const importBattletomes = (state: IBattletomesStore, action: { payload: { battletomes: IArmy[] } }) => {
  const { battletomes } = action.payload;
  const factions = new Set(battletomes.map((army) => army.faction));
  state.battletomes = [...state.battletomes.filter((army) => !factions.has(army.faction)), ...battletomes];
};

const setRankingFaction = (state: IBattletomesStore, action: { payload: { faction: Faction } }) => {
  const { faction } = action.payload;
  state.rankingFaction = faction;
};

export const battletomesStore = createSlice({
  name: 'battletomes',
  initialState: INITIAL_STATE,
  reducers: {
    addBattletome,
    importBattletomes,
    setRankingFaction
  },
});

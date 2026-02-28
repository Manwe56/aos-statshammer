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

const setRankingFaction = (state: IBattletomesStore, action: { payload: { faction: Faction } }) => {
  const { faction } = action.payload;
  state.rankingFaction = faction;
};

export const battletomesStore = createSlice({
  name: 'battletomes',
  initialState: INITIAL_STATE,
  reducers: {
    addBattletome,
    setRankingFaction
  },
});

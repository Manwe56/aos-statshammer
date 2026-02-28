import { createSlice } from '@reduxjs/toolkit';
import appConfig from 'appConfig';
import type { IConfigStore } from 'types/store';
import { IUnit } from 'types/unit';

const INITIAL_STATE: IConfigStore = {
  darkMode: false,
  desktopGraphList: false,
  numSimulations: appConfig.simulations.default,
  useRailLg: false,
  importReplace: true,
  exportFilename: 'army',
  otherPlayerArmy: [],
  activePlayer: 'Attacker',
};

const toggleDarkMode = (state: IConfigStore) => {
  state.darkMode = !state.darkMode;
};

const toggleDesktopGraphList = (state: IConfigStore) => {
  state.desktopGraphList = !state.desktopGraphList;
};

const changeNumSimulations = (state: IConfigStore, action: { payload: { newValue: number } }) => {
  const { newValue } = action.payload;
  state.numSimulations = newValue;
};

const updateExportFilename = (state: IConfigStore, action: { payload: { newName: string } }) => {
  const { newName } = action.payload;
  state.exportFilename = newName;
};

const toggleUseRailLg = (state: IConfigStore) => {
  state.useRailLg = !state.useRailLg;
};

const toggleImportReplace = (state: IConfigStore) => {
  state.importReplace = !state.importReplace;
};

const setOtherPlayerArmy = (state: IConfigStore, action: { payload: { otherPlayerArmy: IUnit[] } }) => {
  state.otherPlayerArmy = action.payload.otherPlayerArmy;
  state.activePlayer = state.activePlayer === 'Attacker' ? 'Defender' : 'Attacker';
};

export const configStore = createSlice({
  name: 'config',
  initialState: INITIAL_STATE,
  reducers: {
    toggleDarkMode,
    toggleDesktopGraphList,
    changeNumSimulations,
    toggleUseRailLg,
    toggleImportReplace,
    updateExportFilename,
    setOtherPlayerArmy,
  },
});

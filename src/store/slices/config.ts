import { createSlice } from '@reduxjs/toolkit';
import appConfig from 'appConfig';
import type {
  IConfigStore,
  IListAnalysisPlayerStore,
  TPlayerSide,
} from 'types/store';
import { IUnit } from 'types/unit';

const createEmptyListAnalysisPlayerState = (): IListAnalysisPlayerStore => ({
  armyListText: '',
  analysisText: '',
});

const createInitialListAnalysisByPlayer = () => ({
  Self: createEmptyListAnalysisPlayerState(),
  Opponent: createEmptyListAnalysisPlayerState(),
});

const normalizePlayerSide = (value: unknown): TPlayerSide =>
  value === 'Opponent' || value === 'Defender' ? 'Opponent' : 'Self';

const getNormalizedActivePlayer = (state: IConfigStore): TPlayerSide =>
  normalizePlayerSide((state as any).activePlayer);

const getPlayerListAnalysisState = (
  state: IConfigStore,
  player: TPlayerSide,
): IListAnalysisPlayerStore => {
  if (!state.listAnalysisByPlayer[player]) {
    state.listAnalysisByPlayer[player] = createEmptyListAnalysisPlayerState();
  }
  return state.listAnalysisByPlayer[player];
};

const INITIAL_STATE: IConfigStore = {
  darkMode: false,
  desktopGraphList: false,
  numSimulations: appConfig.simulations.default,
  useRailLg: false,
  importReplace: true,
  exportFilename: 'army',
  otherPlayerArmy: [],
  activePlayer: 'Self',
  listAnalysisByPlayer: createInitialListAnalysisByPlayer(),
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
  const currentPlayer = getNormalizedActivePlayer(state);
  state.activePlayer = currentPlayer === 'Self' ? 'Opponent' : 'Self';
};

const setActivePlayer = (
  state: IConfigStore,
  action: { payload: { activePlayer: TPlayerSide } },
) => {
  state.activePlayer = action.payload.activePlayer;
};

const updatePlayerArmyListText = (
  state: IConfigStore,
  action: { payload: { player: TPlayerSide; importedArmyListText: string } },
) => {
  const playerState = getPlayerListAnalysisState(state, action.payload.player);
  playerState.armyListText = action.payload.importedArmyListText;
};

const updatePlayerListAnalysisText = (
  state: IConfigStore,
  action: { payload: { player: TPlayerSide; importedListAnalysisText: string } },
) => {
  const playerState = getPlayerListAnalysisState(state, action.payload.player);
  playerState.analysisText = action.payload.importedListAnalysisText;
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
    setActivePlayer,
    updatePlayerArmyListText,
    updatePlayerListAnalysisText,
  },
});

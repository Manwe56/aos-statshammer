import { combineReducers, configureStore as createStore, Middleware } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import thunk from 'redux-thunk';
import type { IStore } from 'types/store';

import {
  battletomesStore,
  configStore,
  modifiersStore,
  notificationsStore,
  simulationsStore,
  statsStore,
  targetModifiersStore,
  targetStore,
  unitsStore,
} from './slices';

export const appReducer = combineReducers({
  battletomes: battletomesStore.reducer,
  config: configStore.reducer,
  modifiers: modifiersStore.reducer,
  notifications: notificationsStore.reducer,
  simulations: simulationsStore.reducer,
  stats: statsStore.reducer,
  target: targetStore.reducer,
  targetModifiers: targetModifiersStore.reducer,
  units: unitsStore.reducer,
});

const middleware: Middleware[] = [thunk];

const persistConfig = {
  key: 'aos-statshammer-4-2-0',
  storage,
  stateReconciler: autoMergeLevel2,
  whitelist: ['units', 'config', 'target', 'battletomes'],
};

const persistedReducer = persistReducer<IStore>(persistConfig, appReducer);

const configureStore = () => {
  const store = createStore({
    reducer: persistedReducer,
    middleware,
  });
  const persistor = persistStore(store);
  return { store, persistor };
};

export default configureStore;

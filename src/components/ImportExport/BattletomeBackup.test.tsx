import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { battletomesStore } from 'store/slices/battletomes';
import { notificationsStore } from 'store/slices/notifications';
import { unit1, unit2 } from 'tests/selectors/utils/testUnits';
import { Faction, IArmy } from 'types/army';

import BattletomeBackup from './BattletomeBackup';

jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
jest.mock('store/slices', () => ({
  battletomesStore: require('store/slices/battletomes').battletomesStore,
  notificationsStore: require('store/slices/notifications').notificationsStore,
}));

const first: IArmy = { faction: Faction.SCE, label: 'Custom', units: [unit1] };
const second: IArmy = { faction: Faction.Skaven, label: 'Second', units: [unit2] };

it('exports and restores a backup through the UI, with overwrite confirmation', async () => {
  const store = createStore(combineReducers({
    battletomes: battletomesStore.reducer,
    notifications: notificationsStore.reducer,
  }));
  store.dispatch(battletomesStore.actions.importBattletomes({ battletomes: [first, second] }));
  const container = document.createElement('div');
  document.body.appendChild(container);
  const createObjectURL = jest.fn((_blob: Blob) => 'blob:backup');
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = jest.fn();
  const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

  act(() => {
    ReactDOM.render(<Provider store={store}><BattletomeBackup /></Provider>, container);
  });
  const exportButton = Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('Export all battletomes'),
  );
  expect(exportButton).toBeDefined();
  act(() => { Simulate.click(exportButton!); });
  expect(anchorClick).toHaveBeenCalled();
  const blob: Blob = createObjectURL.mock.calls[0][0];
  const backup = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });

  store.dispatch(battletomesStore.actions.addBattletome({
    battletome: { ...first, label: 'Changed on this device' },
  }));
  const input = container.querySelector('input')!;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [new File([backup], 'backup.json', { type: 'application/json' })],
  });
  confirm.mockReturnValueOnce(false);
  await act(async () => {
    Simulate.change(input);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(store.getState().battletomes.battletomes.find((army) => army.faction === Faction.SCE)?.label)
    .toBe('Changed on this device');
  await act(async () => {
    Simulate.change(input);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  expect(confirm).toHaveBeenCalledTimes(2);
  expect(store.getState().battletomes.battletomes).toEqual([first, second]);
  expect(store.getState().notifications[0].variant).toBe('success');
  act(() => { ReactDOM.unmountComponentAtNode(container); });
  container.remove();
  anchorClick.mockRestore();
  confirm.mockRestore();
});

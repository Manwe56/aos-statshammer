import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { combineReducers, createStore } from 'redux';
import { battletomesStore, configStore, notificationsStore, unitsStore } from 'store/slices';
import { unit1 } from 'tests/selectors/utils/testUnits';
import { Faction } from 'types/army';

import Settings from '../Settings/Settings';
import ImportExport from './ImportExport';

jest.mock('nanoid', () => {
  let nextId = 0;
  return { nanoid: () => `test-${nextId++}` };
});
jest.mock('utils/scrollIntoView', () => ({ scrollToTop: jest.fn() }));

it('provides battletome import and backup controls in Import/Export, not Settings', async () => {
  const store = createStore(combineReducers({
    battletomes: battletomesStore.reducer,
    config: configStore.reducer,
    notifications: notificationsStore.reducer,
    units: unitsStore.reducer,
  }));
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(<Provider store={store}><Settings /></Provider>, container);
  });
  expect(container.textContent).not.toContain('Import battletome');
  expect(container.textContent).not.toContain('Rules Text');

  act(() => {
    ReactDOM.render(<Provider store={store}><MemoryRouter><ImportExport /></MemoryRouter></Provider>, container);
  });
  expect(container.textContent).toContain('Import battletome');
  expect(container.textContent).toContain('Export all battletomes');
  expect(container.textContent).toContain('Restore battletomes');
  expect(container.textContent).toContain('No battletomes are included by default');
  expect(container.textContent).not.toContain('Import Faction');

  const label = Array.from(container.querySelectorAll('label')).find((element) =>
    element.textContent?.includes('Import battletome'),
  );
  const input = container.querySelector<HTMLInputElement>(`#${label!.htmlFor}`)!;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [new File([JSON.stringify({ faction: Faction.SCE, units: [unit1] })], 'army.json')],
  });
  await act(async () => {
    Simulate.change(input);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(store.getState().battletomes.battletomes).toEqual([
    { faction: Faction.SCE, label: 'Battletome', units: [unit1] },
  ]);
  expect(container.textContent).toContain('Import Faction');
  act(() => { ReactDOM.unmountComponentAtNode(container); });
  container.remove();
});

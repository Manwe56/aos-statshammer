import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { battletomesStore, configStore, notificationsStore, targetStore } from 'store/slices';
import { unit2 } from 'tests/selectors/utils/testUnits';
import { Faction } from 'types/army';

import ArmyFromList from './ArmyFromList';

jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
jest.mock('pdfjs-dist/legacy/build/pdf', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: async (page: number) => ({
        getTextContent: async () => ({
          items: [{ str: page === 1 ? 'Test Unit 2' : 'Test Unit 1', transform: [1, 0, 0, 1, 0, 100] }],
        }),
      }),
    }),
  }),
}));

it('analyzes unit statistics without rules and hides rules in older saved analysis', () => {
  const store = createStore(combineReducers({
    battletomes: battletomesStore.reducer,
    config: configStore.reducer,
    notifications: notificationsStore.reducer,
    target: targetStore.reducer,
  }));
  store.dispatch(battletomesStore.actions.addBattletome({
    battletome: { faction: Faction.SCE, label: 'Custom', units: [unit2] },
  }));
  store.dispatch(configStore.actions.updatePlayerArmyListText({
    player: 'Self', importedArmyListText: unit2.name,
  }));
  store.dispatch(configStore.actions.updatePlayerListAnalysisText({
    player: 'Self',
    importedListAnalysisText: `${unit2.name}\n\nThe following rules apply to this list:\n\nLegacy rule text`,
  }));
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(
      <Provider store={store}>
        <ArmyFromList activePlayer="Self" onLoadArmyFromList={jest.fn()} onSwitchPlayer={jest.fn()} />
      </Provider>,
      container,
    );
  });
  const button = (text: string) => Array.from(container.querySelectorAll('button, span.MuiButton-root'))
    .find((element) => element.textContent?.trim() === text)!;
  act(() => { Simulate.click(button('Analysis')); });
  expect(container.textContent).toContain(unit2.name);
  expect(container.textContent).not.toContain('Legacy rule text');
  act(() => { Simulate.click(button('List')); });
  expect(button('Analyze list')).toBeDefined();
  act(() => { Simulate.click(button('Analyze list')); });
  expect(container.textContent).toContain('Damage output by save:');
  expect(container.textContent).toContain('Effective health by rend:');
  expect(store.getState().config.listAnalysisByPlayer.Self.analysisText).not.toContain('Legacy rule text');
  act(() => { ReactDOM.unmountComponentAtNode(container); });
  container.remove();
});

it('analyzes, downloads and advances PDF lists without rules', async () => {
  const store = createStore(combineReducers({
    battletomes: battletomesStore.reducer,
    config: configStore.reducer,
    notifications: notificationsStore.reducer,
    target: targetStore.reducer,
  }));
  store.dispatch(battletomesStore.actions.addBattletome({
    battletome: { faction: Faction.SCE, label: 'Custom', units: [unit2] },
  }));
  const container = document.createElement('div');
  document.body.appendChild(container);
  URL.createObjectURL = jest.fn(() => 'blob:analysis');
  URL.revokeObjectURL = jest.fn();
  const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  act(() => {
    ReactDOM.render(
      <Provider store={store}>
        <ArmyFromList activePlayer="Self" onLoadArmyFromList={jest.fn()} onSwitchPlayer={jest.fn()} />
      </Provider>,
      container,
    );
  });
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [new File(['test'], 'lists.pdf', { type: 'application/pdf' })],
  });
  await act(async () => {
    Simulate.change(input);
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(store.getState().config.listAnalysisByPlayer.Self.armyListText).toBe('Test Unit 2');
  const analyzeAndNext = Array.from(container.querySelectorAll('span.MuiButton-root'))
    .find((element) => element.textContent?.trim() === 'Analyze + Download + Next');
  expect(analyzeAndNext).toBeDefined();
  act(() => { Simulate.click(analyzeAndNext!); });
  expect(anchorClick).toHaveBeenCalled();
  expect(store.getState().config.listAnalysisByPlayer.Self.armyListText).toBe('Test Unit 1');
  act(() => { ReactDOM.unmountComponentAtNode(container); });
  container.remove();
  anchorClick.mockRestore();
});

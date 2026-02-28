import * as selectors from 'store/selectors/unitsSelectors';

import { state, units } from './utils/testState';
import * as testUnits from './utils/testUnits';

describe('unitsSelectors', () => {
  test('unitsSelector', () => {
    expect(selectors.unitsSelector(state)).toEqual(units);
  });

  test('unitByIndexSelector', () => {
    const getUnitByIndex = selectors.unitByIndexSelector(state);
    expect(typeof getUnitByIndex).toEqual('function');
    expect(getUnitByIndex(0)).toEqual(units[0]);
    expect(getUnitByIndex(999)).toBeUndefined();
  });

  test('numUnitsSelector', () => {
    expect(selectors.numUnitsSelector(state)).toEqual(4);
  });

  test('activeUnitsSelector', () => {
    expect(selectors.activeUnitsSelector(state).length).toEqual(2);
  });

  test('unitIndexByUuidSelector', () => {
    const getUnitIndexByUuid = selectors.unitIndexByUuidSelector(state);
    expect(typeof getUnitIndexByUuid).toEqual('function');
    expect(getUnitIndexByUuid('unit-0')).toEqual(0);
    expect(getUnitIndexByUuid('not-a-unit')).toEqual(-1);
  });

  test('unitByUuidSelector', () => {
    const getUnitByUuid = selectors.unitByUuidSelector(state);
    expect(typeof getUnitByUuid).toEqual('function');
    expect(getUnitByUuid('unit-0')).toEqual(units[0]);
    expect(getUnitByUuid('not-a-unit')).toBeUndefined();
  });

  test('unitNamesSelector', () => {
    expect(selectors.unitNamesSelector(state)).toEqual(['Test Unit 1', 'Test Unit 2']);
  });

  test('getSanitizedActiveUnitsSelector', () => {
    const getSanitizedUnits = selectors.getSanitizedActiveUnitsSelector(state);
    expect(typeof getSanitizedUnits).toEqual('function');

    const expectedUsingName = [testUnits.sanitizedUnit1Name, testUnits.sanitizedUnit2Name];
    expect(getSanitizedUnits()).toEqual(expectedUsingName);

    const expectedUsingUuid = [testUnits.sanitizedUnit1Uuid, testUnits.sanitizedUnit2Uuid];
    expect(getSanitizedUnits()).toEqual(expectedUsingUuid);
  });
});

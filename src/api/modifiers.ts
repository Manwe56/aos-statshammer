import { modifiersStore, targetModifiersStore } from 'store/slices';

import type { TDispatch } from './api.types';
import { getModifiers, getTargetModifiers } from './core/controllers/modifiersController';

export const fetchModifiers = () => async (dispatch: TDispatch) => {
  dispatch(modifiersStore.actions.fetchModifiersPending());
  const res = { modifiers: getModifiers() };
  dispatch(modifiersStore.actions.fetchModifiersSuccess({ items: res.modifiers }));
};

export const fetchTargetModifiers = () => async (dispatch: TDispatch) => {
  dispatch(targetModifiersStore.actions.fetchTargetModifiersPending());
  const res = { modifiers: getTargetModifiers() };
  dispatch(targetModifiersStore.actions.fetchTargetModifiersSuccess({ items: res.modifiers }));
};

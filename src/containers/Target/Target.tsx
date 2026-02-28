import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import NoItemsCard from 'components/NoItemsCard';
import UnitModifierList from 'components/UnitModifierList';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { targetAppliedModifiersSelector, targetModifierByIdSelector, targetSelector } from 'store/selectors';
import { targetStore } from 'store/slices';
import { IModifierInstanceParameter, TOptionValue } from 'types/modifiers';

const useStyles = makeStyles(() => ({
  target: {
    overflowX: 'hidden',
  },
}));

interface ITargetProps {
  className?: string;
}

const Target = ({ className }: ITargetProps) => {
  const classes = useStyles();
  const target = useSelector(targetSelector, _.isEqual);
  const getModifierById = useSelector(targetModifierByIdSelector);
  const dispatch = useDispatch();

  const addUnitModifier = (modifier: IModifierInstanceParameter) => {
    dispatch(targetStore.actions.addTargetModifier({ modifier }));
  };

  const removeUnitModifier = (index: number) => {
    dispatch(targetStore.actions.removeTargetModifier({ index }));
  };

  const moveUnitModifier = (index: number, newIndex: number) => {
    dispatch(targetStore.actions.moveTargetModifier({ index, newIndex }));
  };

  const onUnitModifierOptionChange = (index: number, name: string, value: TOptionValue) => {
    dispatch(targetStore.actions.editTargetModifierOption({ index, name, value }));
  };

  const onUnitModifierToggle = (index: number) => {
    dispatch(targetStore.actions.toggleModifierActive({ index }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getUnitModifierErrorCallBack = useCallback(
    _.memoize((index: number) => (error: boolean) => {
      dispatch(targetStore.actions.editTargetModifierError({ index, error }));
    }),
    [dispatch],
  );

  const activeModifiers = useSelector(targetAppliedModifiersSelector);

  return (
    <div className={clsx(classes.target, className)}>
      {!target?.modifiers?.length && (
        <NoItemsCard header="No modifiers" body="No target modifiers are present (Basic target)" />
      )}
      <UnitModifierList
        activeModifiers={activeModifiers}
        addUnitModifier={addUnitModifier}
        removeUnitModifier={removeUnitModifier}
        moveUnitModifier={moveUnitModifier}
        onUnitModifierOptionChange={onUnitModifierOptionChange}
        onUnitModifierToggle={onUnitModifierToggle}
        getUnitModifierErrorCallBack={getUnitModifierErrorCallBack}
        getModifierById={getModifierById}
      />
    </div>
  );
};

export default Target;

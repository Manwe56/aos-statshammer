import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TrackChanges } from '@material-ui/icons';
import clsx from 'clsx';
import ConfirmationDialog from 'components/ConfirmationDialog';
import NoItemsCard from 'components/NoItemsCard';
import UnitModifierList from 'components/UnitModifierList';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, useHistory } from 'react-router-dom';
import {
  numTargetModifiersSelector,
  targetAppliedModifiersSelector,
  targetModifierByIdSelector,
  targetSelector,
} from 'store/selectors';
import { notificationsStore, targetStore } from 'store/slices';
import { IModifierInstanceParameter, TOptionValue } from 'types/modifiers';

const useStyles = makeStyles(() => ({
  target: {
    overflowX: 'hidden',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: '1em',
  },
}));

interface ITargetProps {
  className?: string;
}

const Target = ({ className }: ITargetProps) => {
  const classes = useStyles();
  const target = useSelector(targetSelector, _.isEqual);
  const getModifierById = useSelector(targetModifierByIdSelector);
  const numTargetModifiers = useSelector(numTargetModifiersSelector);
  const dispatch = useDispatch();
  const history = useHistory();

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

  const handleClearTargetModifiers = () => {
    dispatch(
      notificationsStore.actions.addNotification({ message: 'Target modifiers cleared', variant: 'info' }),
    );
    dispatch(targetStore.actions.clearAllTargetModifiers());
  };

  return (
    <div className={clsx(classes.target, className)}>
      <div className={classes.actions}>
        <Button
          variant="text"
          color="primary"
          size="small"
          startIcon={<TrackChanges />}
          disabled={numTargetModifiers <= 0}
          onClick={() => history.push('/target/confirm')}
        >
          Clear Target Modifiers
        </Button>
      </div>
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
      <Route path="/target/confirm">
        <ConfirmationDialog
          open
          onConfirm={handleClearTargetModifiers}
          description="Are you sure you want to delete all target modifiers"
        />
      </Route>
    </div>
  );
};

export default Target;

import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ArrowDownward, ArrowUpward, Delete } from '@material-ui/icons';
import ModifierItem from 'components/ModifierItem';
import ModifierSelector from 'components/ModifierSelector';
import React from 'react';
import { useSelector } from 'react-redux';
import { targetModifiersSelector } from 'store/selectors';

import type {
  IModifierDefinition,
  IModifierInstance,
  IModifierInstanceParameter,
  TOptionValue,
} from '../../types/modifiers';
import PendingModifiers from './PendingModifiers';

const useStyles = makeStyles(() => ({
  modifierList: {
    flex: '1 1 auto',
    width: '100%',
  },
  activeModifiers: {},
  activeModifierCard: {},
}));

interface IUnitModifierListProps {
  activeModifiers: IModifierInstance[];
  addUnitModifier: (modifier: IModifierInstanceParameter) => void;
  removeUnitModifier: (index: number) => void;
  moveUnitModifier: (index: number, newIndex: number) => void;
  onUnitModifierOptionChange: (index: number, name: string, value: TOptionValue) => void;
  onUnitModifierToggle: (index: number) => void;
  getUnitModifierErrorCallBack: (index: number) => (error: boolean) => void;
  getModifierById: (id: string) => IModifierDefinition | undefined;
}

const UnitModifierList: React.FC<IUnitModifierListProps> = ({
  activeModifiers,
  addUnitModifier,
  removeUnitModifier,
  moveUnitModifier,
  onUnitModifierOptionChange,
  onUnitModifierToggle,
  getUnitModifierErrorCallBack,
  getModifierById,
}: IUnitModifierListProps) => {
  const classes = useStyles();
  const modifiersState = useSelector(targetModifiersSelector);
  const { pending, items: definitions, error } = modifiersState;

  const addModifier = (modifier) => {
    const newModifier = { id: modifier.id, options: {}, active: true };
    Object.keys(modifier.options).forEach((k) => {
      newModifier.options[k] = '';
      if (modifier.options[k].default != null) {
        newModifier.options[k] = modifier.options[k].default;
      }
    });
    addUnitModifier(newModifier);
  };

  const moveUpEnabled = (index: number) => index > 0;
  const moveDownEnabled = (index: number) => index < (activeModifiers || []).length - 1;

  return (
    <Typography component="div" className={classes.modifierList}>
      {pending ? (
        <PendingModifiers />
      ) : (
        <div className={classes.activeModifiers}>
          {(activeModifiers || []).map((modifier, index) => (
            <ModifierItem
              definition={getModifierById(modifier.id)}
              options={modifier.options}
              active={modifier.active}
              actions={[
                {
                  name: 'Move Up',
                  onClick: () => moveUnitModifier(index, index - 1),
                  icon: <ArrowUpward />,
                  disabled: !moveUpEnabled(index),
                },
                {
                  name: 'Move Down',
                  onClick: () => moveUnitModifier(index, index + 1),
                  icon: <ArrowDownward />,
                  disabled: !moveDownEnabled(index),
                },
                { name: 'Delete', onClick: () => removeUnitModifier(index), icon: <Delete /> },
              ]}
              index={index}
              key={modifier.uuid}
              onOptionChange={onUnitModifierOptionChange}
              onActiveToggle={onUnitModifierToggle}
              errorCallback={getUnitModifierErrorCallBack(index)}
              scrollEnabled={false}
            />
          ))}
        </div>
      )}
      <ModifierSelector modifiers={definitions} pending={pending} error={error} onClick={addModifier} />
    </Typography>
  );
};

export default UnitModifierList;

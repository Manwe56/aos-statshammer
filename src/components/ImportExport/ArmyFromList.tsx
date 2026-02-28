import { Button, TextField } from '@material-ui/core';
import { ImportExport } from '@material-ui/icons';
import { lowerCase } from 'lodash';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mergedBattletomesSelector } from 'store/selectors';
import { notificationsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';

interface IArmyFromListProps {
  onLoadArmyFromList: (ArmyFromList: IArmy) => void;
}

const ArmyFromList = ({ onLoadArmyFromList }: IArmyFromListProps) => {
  const [armyList, setArmyList] = useState('');
  const dispatch = useDispatch();
  const matchPlay = useSelector(mergedBattletomesSelector);
  const onClick = () => {
    const lowercaseArmylist = lowerCase(armyList);
    const armyUnits: IArmy = {
      faction: Faction.List,
      label: '',
      units: [],
    };
    matchPlay.forEach((army) => {
      army.units.forEach((unit) => {
        const strippedUnitName = lowerCase(unit.name
          .replace(/ - .*/g, '')
          .replace(/,.*/g, '')
          .replace(/\(.*\)/g, '')
          .replace(/\[.*\]/g, '')
          .trim());
        if (lowercaseArmylist.includes(strippedUnitName)) {
          armyUnits.units.push(unit);
        }
      });
    });
    if (armyUnits.units.length > 0) {
      onLoadArmyFromList(armyUnits);
    } else {
      dispatch(
        notificationsStore.actions.addNotification({
          message:
            'Sorry, not finding any known unit. Did you check your faction was already available in the factions that can be imported? ',
          variant: 'error',
        }),
      );
    }
  };

  return (
    <div>
      <TextField
        id="army-list-input"
        label="army list"
        placeholder="copy paste your army list here"
        multiline
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setArmyList(event.target.value);
        }}
      />
      <Button
        variant="contained"
        startIcon={<ImportExport />}
        color="primary"
        component="span"
        onClick={onClick}
      >
        Import from list
      </Button>
    </div>
  );
};

export default ArmyFromList;

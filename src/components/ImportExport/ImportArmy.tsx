import { Button } from '@material-ui/core';
import { ImportExport } from '@material-ui/icons';
import Uploader from 'components/Uploader';
import React from 'react';
import { useDispatch } from 'react-redux';
import { notificationsStore } from 'store/slices';
import { Faction } from 'types/army';
import { IUnit } from 'types/unit';

interface IImportArmyProps {
  text: string;
  onArmyLoad: (units: IUnit[], faction: Faction) => void;
}

const ImportArmyItem = ({ text, onArmyLoad }: IImportArmyProps) => {
  const dispatch = useDispatch();

  /** The function to call when a file upload happens.
   * In this case that would be importing the uploaded unit data
   * @param {object} data the JSON from the uploaded unit
   * */
  const onArmyUpload = (data) => {
    if (data && data.units && data.faction) {
      onArmyLoad(data.units, data.faction);
    }
    else if (data && data.units) {
      onArmyLoad(data.units, Faction.List);
    } else if (data && data.name && data.weapon_profiles) {
      const singleUnit: IUnit = data;
      onArmyLoad([singleUnit], Faction.List);
    } else {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'No units to import from this file!',
          variant: 'error',
        }),
      );
    }
  };

  return (
    <Uploader
      onUpload={onArmyUpload}
      component={
        <Button variant="contained" startIcon={<ImportExport />} color="primary" component="span">
          {text}
        </Button>
      }
    />
  );
};

export default ImportArmyItem;

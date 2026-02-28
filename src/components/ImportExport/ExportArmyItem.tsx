import { Button } from '@material-ui/core';
import { ImportExport } from '@material-ui/icons';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSanitizedAllUnitsSelector, ISanitizedUnit } from 'store/selectors';
import { notificationsStore } from 'store/slices';
import { Faction } from 'types/army';

const downloadArmy = (army: ISanitizedUnit[], filename: string, exportAsBT: boolean, faction: Faction) => {
  const toExport = exportAsBT ? { units: army, faction } : { units: army };

  const data = encodeURIComponent(JSON.stringify(toExport));
  // eslint-disable-next-line no-undef
  const a = document.createElement('a');
  a.href = `data:text/json;charset=utf-8,${data}`;
  a.download = `${filename}.json`;
  a.click();
};

interface IExportArmyItemProps {
  onClick?: () => void;
  filename: string;
  exportAsBT: boolean;
  faction: Faction;
}

const ExportArmyItem = ({ onClick, filename, exportAsBT, faction }: IExportArmyItemProps) => {
  const dispatch = useDispatch();
  const units = useSelector(getSanitizedAllUnitsSelector)();

  const exportArmy = () => {
    downloadArmy(units, filename, exportAsBT, faction);
    dispatch(
      notificationsStore.actions.addNotification({
        message: exportAsBT ? 'Exported Battletome' : 'Exported Army',
        variant: 'success',
      }),
    );
    if (onClick) onClick();
  };

  return (
    <Button
      variant="contained"
      startIcon={<ImportExport />}
      color="primary"
      component="span"
      onClick={exportArmy}
    >
      Export units to a file
    </Button>
  );
};

export default ExportArmyItem;

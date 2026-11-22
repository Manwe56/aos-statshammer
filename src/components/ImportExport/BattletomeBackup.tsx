import { Button } from '@material-ui/core';
import { GetApp, Publish } from '@material-ui/icons';
import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { battletomesStore, notificationsStore } from 'store/slices';
import type { IStore } from 'types/store';

import { parseBattletomes, serializeBattletomes } from './backupFormat';

const BattletomeBackup = () => {
  const dispatch = useDispatch();
  const battletomes = useSelector((state: IStore) => state.battletomes.battletomes);
  const inputRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    try {
      const data = new Blob([serializeBattletomes(battletomes)], { type: 'application/json' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'battletomes-backup.json';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      dispatch(notificationsStore.actions.addNotification({ message: 'Battletome backup exported', variant: 'success' }));
    } catch {
      dispatch(notificationsStore.actions.addNotification({ message: 'Could not export battletome backup', variant: 'error' }));
    }
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new Error('Could not read backup');
        const imported = parseBattletomes(reader.result);
        const overwritten = imported.filter((army) => battletomes.some((existing) => existing.faction === army.faction));
        if (overwritten.length && !window.confirm(
          `Replace the existing battletomes for ${overwritten.map((army) => army.faction).join(', ')}?`,
        )) return;
        dispatch(battletomesStore.actions.importBattletomes({ battletomes: imported }));
        dispatch(notificationsStore.actions.addNotification({
          message: `Restored ${imported.length} battletome(s)`,
          variant: 'success',
        }));
      } catch {
        dispatch(notificationsStore.actions.addNotification({
          message: 'Could not restore battletome backup. Check that the file is a valid backup.',
          variant: 'error',
        }));
      }
    };
    reader.onerror = () => dispatch(notificationsStore.actions.addNotification({
      message: 'Could not read battletome backup',
      variant: 'error',
    }));
    reader.readAsText(file);
  };

  return (
    <>
      <Button variant="contained" color="primary" startIcon={<GetApp />} onClick={exportBackup}>
        Export all battletomes
      </Button>
      <input ref={inputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importBackup} />
      <Button variant="outlined" startIcon={<Publish />} onClick={() => inputRef.current?.click()}>
        Restore battletomes
      </Button>
    </>
  );
};

export default BattletomeBackup;

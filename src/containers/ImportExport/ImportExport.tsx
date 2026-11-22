import {
  Card,
  Divider,
  Switch,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArmySelector from 'components/ImportExport/ArmySelector';
import BattletomeBackup from 'components/ImportExport/BattletomeBackup';
import ExportArmyItem from 'components/ImportExport/ExportArmyItem';
import FactionSelector from 'components/ImportExport/FactionSelector';
import ImportArmy from 'components/ImportExport/ImportArmy';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { configSelector, sortedBattletomesSelector } from 'store/selectors';
import { battletomesStore, configStore, notificationsStore, unitsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';
import { IUnitParameter } from 'types/unit';
import { scrollToTop } from 'utils/scrollIntoView';
import { ROUTES } from 'utils/urls';

const useStyles = makeStyles((theme: Theme) => ({
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: '1em',
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '1em',
  },
  container: {
    margin: theme.spacing(3),
  },
  card: {
    padding: theme.spacing(2),
  },
  md: {
    margin: 'auto',
    marginTop: -theme.spacing(2),
    '& a': {
      color: theme.palette.primary.main,
      '&:visited': {
        color: theme.palette.primary.dark,
      },
    },
    '& p': {
      fontSize: '0.75rem',
    },
  },
  loader: {
    margin: theme.spacing(4),
  },
  topleftMargin: {
    marginTop: '1em',
    marginLeft: '1em',
  },
  divider: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
}));

const ImportExport = () => {
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();
  const config = useSelector(configSelector);
  const compareString = (a, b) => 0 - (a < b ? 1 : -1);
  const compareUnit = (a, b) => compareString(a.name, b.name);
  const battletomes = useSelector(sortedBattletomesSelector);
  const CHANGE_TITLE = false;
  const excludedFactions = [Faction.All, Faction.List];
  const [exportAsBT, setExportAsBT] = useState(false);
  const [faction, setFaction] = useState(Faction.SCE);

  const setBattletomeFaction = (newFaction) => {
    setFaction(newFaction);
  };
  const toggleBattletome = () => setExportAsBT(!exportAsBT);

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
  };
  const adaptName = (str) => (CHANGE_TITLE ? toTitleCase(str) : str);

  const goToHome = () => {
    history.push(ROUTES.HOME);
  };

  const loadUnitsWithStatus = (
    units: IUnitParameter[],
    forceStatus: boolean,
    unitActiveStatus: boolean,
    faction: Faction,
  ) => {
    if (faction && faction !== Faction.List) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: `This file seems containing the battletome for ${faction}. Use import battletome instead.`,
          variant: 'error',
        }),
      );
      return;
    }
    if (config.importReplace) {
      dispatch(unitsStore.actions.clearAllUnits());
    }
    const unitsToAdd: IUnitParameter[] = [];
    [...units].sort(compareUnit).forEach((unit) => {
      if (unit.name && unit.weapon_profiles) {
        if (forceStatus) {
          const unitToAdd = { ...unit, active: unitActiveStatus, name: adaptName(unit.name) };
          unitsToAdd.push(unitToAdd);
        } else {
          unitsToAdd.push({ ...unit, name: adaptName(unit.name) });
        }
      }
    });
    dispatch(unitsStore.actions.addUnits({ units: unitsToAdd }));
    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Successfully imported units',
        variant: 'success',
      }),
    );
    goToHome();
  };
  const loadUnits = (units: IUnitParameter[], faction: Faction) =>
    loadUnitsWithStatus(units, false, false, faction);
  const loadInactiveArmy = (army: IArmy) => loadUnitsWithStatus(army.units, true, false, Faction.List);

  const loadBattletome = (units: IUnitParameter[], faction: Faction) => {
    if (faction === Faction.List) {
      dispatch(notificationsStore.actions.addNotification({
        message: `File is containing an army list, not a known faction. You can't import it as a battletome`,
        variant: 'error',
      }));
      return;
    }
    const battletome: IArmy = { faction, label: 'Battletome', units };
    dispatch(battletomesStore.actions.addBattletome({ battletome }));
    dispatch(notificationsStore.actions.addNotification({
      message: `Battletome ${faction} updated successfully`,
      variant: 'success',
    }));
  };

  const toggleReplace = () => {
    dispatch(configStore.actions.toggleImportReplace());
  };

  const FilenameError = () => {
    if (!config.exportFilename || config.exportFilename === '') return 'Required';
    return undefined;
  };

  const handleEditFilename = (event: any) => {
    dispatch(configStore.actions.updateExportFilename({ newName: event.target.value }));
  };

  useEffect(() => {
    scrollToTop(true);
  });

  return (
    <div className={classes.container}>
      <div className={classes.flexColumn}>
        <Card className={classes.card}>
          <Typography variant="h5">Export army</Typography>
          <Typography variant="caption">
            Export all your units in a file you will be able to import later on either as a simple list of units, either to update a battletome with your own modifications.
          </Typography>
          <div className={classes.flexRow}>
            <TextField
              label="File name"
              value={config.exportFilename}
              onChange={handleEditFilename}
              error={Boolean(FilenameError())}
              helperText={FilenameError()}
            />
            <div>
              <Switch onChange={toggleBattletome} checked={exportAsBT} />
              {`${exportAsBT ? 'Export as a battletome' : 'Export as a list of units'}`}
            </div>
            {exportAsBT && <FactionSelector value={faction} excluded={excludedFactions} handleSelect={setBattletomeFaction} />}
            <div className={classes.topleftMargin}>
              <ExportArmyItem filename={config.exportFilename} exportAsBT={exportAsBT} faction={faction} />
            </div>
          </div>
        </Card>
        <Divider className={classes.divider} />
        <Card className={classes.card}>
          <Typography variant="h5">Import army</Typography>
          <Typography variant="caption">
            Import units from a previously exported file or from your saved battletomes.
          </Typography>
          <div>
            <Switch onChange={toggleReplace} checked={config.importReplace} />
            {`${config.importReplace ? 'Replace all units' : 'Add units to existing units'}`}
          </div>
          <div className={classes.flexRow}>
            <ImportArmy onArmyLoad={loadUnits} text="Import units from a file" />
            {battletomes.length > 0 && (
              <ArmySelector onClick={loadInactiveArmy} armies={battletomes} label="Import Faction" />
            )}
          </div>
        </Card>
        <Divider className={classes.divider} />
        <Card className={classes.card}>
          <Typography variant="h5">Import and export battletomes</Typography>
          <Typography variant="caption">
            No battletomes are included by default. Create units, export your army as a battletome, then
            import it here. Back up all your customized battletomes to
            transfer them to another device. Restoring a backup replaces matching factions and leaves other
            factions unchanged.
          </Typography>
          <div className={classes.flexRow}>
            <ImportArmy onArmyLoad={loadBattletome} text="Import battletome" />
            <BattletomeBackup />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImportExport;

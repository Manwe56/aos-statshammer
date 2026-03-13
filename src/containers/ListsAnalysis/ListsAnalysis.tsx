import { Card, Switch, Theme, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArmyFromList from 'components/ImportExport/ArmyFromList';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { activePlayer, configSelector, otherPlayerArmy, unitsSelector } from 'store/selectors';
import { configStore, notificationsStore, unitsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';
import { IUnitParameter } from 'types/unit';
import { scrollToTop } from 'utils/scrollIntoView';
import { ROUTES } from 'utils/urls';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    margin: theme.spacing(3),
  },
  card: {
    padding: theme.spacing(2),
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '1em',
  },
}));

const ListsAnalysis = () => {
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();
  const config = useSelector(configSelector);
  const activeArmy = useSelector(activePlayer);
  const units = useSelector(unitsSelector);
  const opponentUnits = useSelector(otherPlayerArmy);

  const compareString = (a, b) => 0 - (a < b ? 1 : -1);
  const compareUnit = (a, b) => compareString(a.name, b.name);

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
          unitsToAdd.push({ ...unit, active: unitActiveStatus });
          return;
        }
        unitsToAdd.push({ ...unit });
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

  const loadActiveArmy = (army: IArmy) => loadUnitsWithStatus(army.units, true, true, Faction.List);

  const toggleReplace = () => {
    dispatch(configStore.actions.toggleImportReplace());
  };

  const switchPlayer = () => {
    const nextUnits = [...opponentUnits];
    const currentUnits = [...units];
    dispatch(unitsStore.actions.replaceUnits({ units: nextUnits }));
    dispatch(configStore.actions.setOtherPlayerArmy({ otherPlayerArmy: currentUnits }));
  };

  useEffect(() => {
    scrollToTop(true);
  });

  return (
    <div className={classes.container}>
      <div className={classes.flexColumn}>
        <Card className={classes.card}>
          <Typography variant="h5">Lists analysis</Typography>
          <Typography variant="caption">
            Analyze a pasted list, extract matching rules, and optionally import this list to the current player.
          </Typography>
          <div>
            <Switch onChange={toggleReplace} checked={config.importReplace} />
            {`${config.importReplace ? 'Replace all units' : 'Add units to existing units'}`}
          </div>
          <div className={classes.flexRow}>
            <ArmyFromList
              onLoadArmyFromList={loadActiveArmy}
              activePlayer={activeArmy}
              onSwitchPlayer={switchPlayer}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ListsAnalysis;

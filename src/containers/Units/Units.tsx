import { Button, Typography, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import NoItemsCard from 'components/NoItemsCard';
import ProfileDialog from 'containers/ProfileDialog';
import Unit from 'containers/Unit';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import { activePlayer, otherPlayerArmy, unitsSelector } from 'store/selectors';
import { configStore, unitsStore } from 'store/slices';

import AddUnitButton from './AddUnitButton';

const useStyles = makeStyles(() => ({
  units: {
    overflowX: 'hidden',
  },
  player: {
    display: 'flex',
    flexDirection: 'row',
    margin: '1em',
    gap: '1em',
  },
}));

interface IUnitsProps {
  className?: string;
}

const Units = ({ className }: IUnitsProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const units = useSelector(unitsSelector);
  const otherPlayerUnits = useSelector(otherPlayerArmy);
  const dispatch = useDispatch();
  const activeArmy = useSelector(activePlayer);

  const swapArmies = () => {
    const otherUnits = [...otherPlayerUnits];
    const currentUnits = [...units];
    dispatch(unitsStore.actions.replaceUnits({ units: otherUnits }));
    dispatch(configStore.actions.setOtherPlayerArmy({ otherPlayerArmy: currentUnits }));
  };

  return (
    <div className={clsx(classes.units, className)}>
      <div className={classes.player}>
        <Typography variant="h6">Player: {activeArmy}</Typography>
        <Button onClick={swapArmies} color="primary">
          Change player
        </Button>
      </div>
      {!units?.length && (
        <NoItemsCard header="It's lonely here" body="There are no units here, try adding some" />
      )}
      {units.map((unit, index) => (
        <Unit unit={unit} id={index} key={unit.uuid} />
      ))}
      {!mobile && <AddUnitButton units={units} />}
      <Route path="/units/:unitUuid/:profileIndex">
        <ProfileDialog open />
      </Route>
    </div>
  );
};

export default Units;

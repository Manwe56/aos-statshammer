import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import appConfig from 'appConfig';
import React from 'react';
import { useDispatch } from 'react-redux';
import { unitsStore } from 'store/slices';
import type { IUnitStore } from 'types/store';

const useStyles = makeStyles({
  group: {
    display: 'flex',
  },
  button: {
    marginRight: '0.5em',

    '&:last-child': {
      marginRight: 0,
    },
  },
});

interface IAddUnitButtonProps {
  units: IUnitStore;
}

const AddUnitButton = ({ units }: IAddUnitButtonProps) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const handleaddUnit = () => {
    dispatch(
      unitsStore.actions.addUnit({
        unit: {
          name: `Unit ${units.length + 1}`,
          points: 100,
          reinforced: false,
          health: 2,
          models: 1,
          modifiers: [],
          save: 4,
          attacksModifier: 0,
          active: units.length < appConfig.limits.unitsVisibleByDefault,
        },
      }),
    );
  };

  return (
    <div className={classes.group} id="add-unit-button">
      <Button
        fullWidth
        onClick={handleaddUnit}
        variant="contained"
        startIcon={<Add />}
        color="primary"
        className={classes.button}
      >
        Add Unit
      </Button>
    </div>
  );
};

export default AddUnitButton;

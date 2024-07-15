import { Button, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Add, Delete, FileCopy } from '@material-ui/icons';
import appConfig from 'appConfig';
import clsx from 'clsx';
import ListItem from 'components/ListItem';
import NoItemsCard from 'components/NoItemsCard';
import WeaponProfile from 'containers/WeaponProfile';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { numUnitsSelector, unitNamesSelector } from 'store/selectors';
import { notificationsStore, unitsStore } from 'store/slices';
import type { IUnit } from 'types/unit';
import { scrollToRef } from 'utils/scrollIntoView';

const useStyles = makeStyles((theme) => ({
  unit: {
    marginBottom: '1em',
  },
  inputs: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
    },
  },
  fieldPoints: {
    width: '8em',
    margin: '1em 1em 0 0',
  },
  fieldName: {
    width: '16em',
    margin: '1em 1em 0 0',
    flexGrow: 1,
  },
  profiles: {
    marginTop: '1em',
  },
  button: {
    backgroundColor: theme.palette.primary.light,
  },
}));

const downloadUnit = (unit: IUnit) => {
  const data = encodeURIComponent(JSON.stringify(unit));
  // eslint-disable-next-line no-undef
  const a = document.createElement('a');
  a.href = `data:text/json;charset=utf-8,${data}`;
  a.download = `${unit.name}.json`;
  a.click();
};

interface IUnitProps {
  id: number;
  unit: IUnit;
  className?: string;
}

const Unit = React.memo(
  ({ id, unit, className }: IUnitProps) => {
    const unitRef = useRef(null);
    const classes = useStyles();
    const numUnits = useSelector(numUnitsSelector, shallowEqual);
    const unitNames = useSelector(unitNamesSelector, shallowEqual);
    const dispatch = useDispatch();

    useEffect(() => {
      scrollToRef(unitRef);
    }, [unit.uuid]);

    const handleDeleteUnit = useCallback(() => {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Deleted Unit',
          action: {
            label: 'Undo',
            onClick: () => dispatch(unitsStore.actions.addUnit({ unit, atPosition: id })),
          },
        }),
      );
      dispatch(unitsStore.actions.deleteUnit({ index: id }));
    }, [dispatch, id, unit]);

    const exportUnit = useCallback(() => {
      downloadUnit(unit);
      dispatch(notificationsStore.actions.addNotification({ message: 'Exported Unit', variant: 'success' }));
    }, [dispatch, unit]);

    const numProfiles = unit.weapon_profiles ? unit.weapon_profiles.length : 0;
    const addProfileEnabled = numProfiles < appConfig.limits.profiles;

    const unitNameError = useMemo(() => {
      if (!unit.name || unit.name === '') return 'Required';
      if (unitNames.reduce((acc, n) => (n === unit.name ? acc + 1 : acc), 0) > 1)
        return 'Unit names should be unique';
      return undefined;
    }, [unit, unitNames]);

    const unitPointsError = useMemo(() => {
      if (!unit.points) return 'Required';
      return undefined;
    }, [unit]);

    const copyUnit = () => {
      dispatch(
        unitsStore.actions.addUnit({
          unit: {
            name: `${unit.name} copy`,
            weapon_profiles: [...unit.weapon_profiles],
            points: unit.points,
            active: numUnits < appConfig.limits.unitsVisibleByDefault,
          },
        }),
      );
    };

    const moveUnitUp = () => {
      dispatch(unitsStore.actions.moveUnit({ index: id, newIndex: id - 1 }));
    };

    const moveUnitDown = () => {
      dispatch(unitsStore.actions.moveUnit({ index: id, newIndex: id + 1 }));
    };

    const handleEditName = (event: any) => {
      dispatch(unitsStore.actions.editUnitName({ index: id, name: event.target.value }));
    };

    const handleEditPoints = (event: any) => {
      dispatch(unitsStore.actions.editUnitPoints({ index: id, points: event.target.value }));
    };

    const handleAddProfile = () => {
      dispatch(unitsStore.actions.addWeaponProfile({ index: id }));
    };

    const handleToggleUnit = () => {
      dispatch(unitsStore.actions.toggleUnit({ index: id }));
    };

    return (
      <div ref={unitRef}>
        <ListItem
          className={clsx(classes.unit, className)}
          header={`${unit.name}`}
          checked={unit.active}
          onToggle={handleToggleUnit}
          primaryItems={[
            {
              name: 'Copy',
              onClick: copyUnit,
              icon: <FileCopy />,
            },
            { name: 'Delete', onClick: handleDeleteUnit, icon: <Delete /> },
          ]}
          secondaryItems={[
            { name: 'Export', onClick: exportUnit },
            { name: 'Move Up', onClick: moveUnitUp, disabled: id <= 0 },
            { name: 'Move Down', onClick: moveUnitDown, disabled: id >= numUnits - 1 },
          ]}
          collapsible
        >
          <div className={classes.inputs}>
            <TextField
              className={classes.fieldName}
              label="Unit Name"
              value={unit.name}
              onChange={handleEditName}
              error={Boolean(unitNameError)}
              helperText={unitNameError}
            />
            <TextField
              className={classes.fieldPoints}
              label="Unit Points"
              value={unit.points}
              type="number"
              onChange={handleEditPoints}
              error={Boolean(unitPointsError)}
              helperText={unitPointsError}
            />
          </div>
          <div className={classes.profiles}>
            {unit && unit.weapon_profiles && unit.weapon_profiles.length ? (
              unit.weapon_profiles.map((profile, index) => (
                <WeaponProfile
                  unitId={id}
                  id={index}
                  profile={profile}
                  key={profile.uuid}
                  addProfileEnabled={addProfileEnabled}
                  numProfiles={numProfiles}
                />
              ))
            ) : (
              <NoItemsCard
                header="No Profiles"
                body="No profiles have been added for this unit"
                dense
                nested
              />
            )}
          </div>
          <Button
            onClick={handleAddProfile}
            className={classes.button}
            startIcon={<Add />}
            variant="contained"
            color="primary"
            disabled={!addProfileEnabled}
            fullWidth
          >
            Add Profile
          </Button>
        </ListItem>
      </div>
    );
  },
  (prevProps, nextProps) => _.isEqual(prevProps, nextProps),
);

export default Unit;

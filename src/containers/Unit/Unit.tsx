import { Button, Switch, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Add, Delete, FileCopy } from '@material-ui/icons';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import appConfig from 'appConfig';
import clsx from 'clsx';
import ListItem from 'components/ListItem';
import NoItemsCard from 'components/NoItemsCard';
import UnitModifierList from 'components/UnitModifierList';
import WeaponProfile from 'containers/WeaponProfile';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { numUnitsSelector, targetModifierByIdSelector, unitNamesSelector } from 'store/selectors';
import { notificationsStore, unitsStore } from 'store/slices';
import { IModifierInstanceParameter, TOptionValue } from 'types/modifiers';
import { IUnit, MINUS_ONE_HIT, MINUS_ONE_WOUND, PLUS_ONE_HIT, PLUS_ONE_WOUND } from 'types/unit';
import { scrollToRef } from 'utils/scrollIntoView';
import { ROUTES } from 'utils/urls';

const useStyles = makeStyles((theme) => ({
  unit: {
    marginBottom: '1em',
  },
  inputs: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  fieldPoints: {
    width: '8em',
    margin: '1em 1em 0 0',
  },
  fieldSmallNumber: {
    width: '4em',
    margin: '1em 1em 0 0',
  },
  fieldReinforced: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
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
  toggleButtonsGroup: {
    margin: '0.5em',
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
    const getModifierById = useSelector(targetModifierByIdSelector);
    const dispatch = useDispatch();
    const history = useHistory();
    const [collapsed, setColapsed] = useState(numUnits > 5);

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

    const goToImportExport = () => {
      history.push(ROUTES.IMPORT);
    };

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

    const unitHealthError = useMemo(() => {
      if (!unit.health) return 'Required';
      return undefined;
    }, [unit]);

    const unitModelsError = useMemo(() => {
      if (!unit.models) return 'Required';
      return undefined;
    }, [unit]);

    const unitSaveError = useMemo(() => {
      if (!unit.save) return 'Required';
      return undefined;
    }, [unit]);

    const copyUnit = () => {
      dispatch(
        unitsStore.actions.addUnit({
          unit: {
            name: `${unit.name} copy`,
            weapon_profiles: [...unit.weapon_profiles],
            reinforced: unit.reinforced,
            points: unit.points,
            health: unit.health,
            models: unit.models,
            attacksModifier: unit.attacksModifier,
            modifiers: [...unit.modifiers],
            save: unit.save,
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
      dispatch(unitsStore.actions.editUnitPoints({ index: id, points: Number(event.target.value) }));
    };

    const handleEditModels = (event: any) => {
      dispatch(unitsStore.actions.editUnitModels({ index: id, models: Number(event.target.value) }));
    };

    const handleEditHealth = (event: any) => {
      dispatch(unitsStore.actions.editUnitHealth({ index: id, health: Number(event.target.value) }));
    };

    const handleEditAttackModifier = (event: any) => {
      dispatch(
        unitsStore.actions.editUnitAttackModifier({ index: id, attacksModifier: Number(event.target.value) }),
      );
    };

    const handleEditSave = (event: any) => {
      dispatch(unitsStore.actions.editUnitSave({ index: id, save: Number(event.target.value) }));
    };

    const handleAddProfile = () => {
      dispatch(unitsStore.actions.addWeaponProfile({ index: id }));
    };

    const handleToggleUnit = () => {
      dispatch(unitsStore.actions.toggleUnit({ index: id }));
    };

    const handleToggleReinforced = () => {
      dispatch(unitsStore.actions.toggleReinforcedUnit({ index: id }));
    };

    const handleHitModifier = (_event: any, value: string | null) => {
      dispatch(unitsStore.actions.editHitModifier({ index: id, value }));
    };

    const handleWoundModifier = (_event: any, value: string | null) => {
      dispatch(unitsStore.actions.editWoundModifier({ index: id, value }));
    };

    const addUnitModifier = (modifier: IModifierInstanceParameter) => {
      dispatch(unitsStore.actions.addUnitModifier({ index: id, modifier }));
    };

    const removeUnitModifier = (index: number) => {
      dispatch(unitsStore.actions.removeUnitModifier({ index: id, modifierIndex: index }));
    };

    const moveUnitModifier = (index: number, newIndex: number) => {
      dispatch(
        unitsStore.actions.moveUnitModifier({ index: id, modifierIndex: index, modifierNewIndex: newIndex }),
      );
    };

    const onUnitModifierOptionChange = (index: number, name: string, value: TOptionValue) => {
      dispatch(unitsStore.actions.editUnitModifierOption({ index: id, modifierIndex: index, name, value }));
    };

    const onUnitModifierToggle = (index: number) => {
      dispatch(unitsStore.actions.toggleUnitModifierActive({ index: id, modifierIndex: index }));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getUnitModifierErrorCallBack = useCallback(
      _.memoize((index: number) => (error: boolean) => {
        dispatch(unitsStore.actions.editTargetModifierError({ index: id, modifierIndex: index, error }));
      }),
      [dispatch],
    );

    const unitToHitModifier = (name: string) => {
      if (name.includes(PLUS_ONE_HIT)) {
        return PLUS_ONE_HIT;
      }
      if (name.includes(MINUS_ONE_HIT)) {
        return MINUS_ONE_HIT;
      }
      return '';
    };
    const unitToWoundModifier = (name: string) => {
      if (name.includes(PLUS_ONE_WOUND)) {
        return PLUS_ONE_WOUND;
      }
      if (name.includes(MINUS_ONE_WOUND)) {
        return MINUS_ONE_WOUND;
      }
      return '';
    };

    return (
      <div ref={unitRef}>
        <ListItem
          className={clsx(classes.unit, className)}
          header={`${unit.name}`}
          checked={unit.active}
          onToggle={handleToggleUnit}
          onCollapseChange={setColapsed}
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
            { name: 'Import', onClick: goToImportExport },
            { name: 'Move Up', onClick: moveUnitUp, disabled: id <= 0 },
            { name: 'Move Down', onClick: moveUnitDown, disabled: id >= numUnits - 1 },
          ]}
          collapsible
          startCollapsed={collapsed}
        >
          {!collapsed && (
            <div>
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
              <div className={classes.inputs}>
                <TextField
                  className={classes.fieldSmallNumber}
                  label="Save"
                  value={unit.save}
                  type="number"
                  onChange={handleEditSave}
                  error={Boolean(unitSaveError)}
                  helperText={unitSaveError}
                />
                <TextField
                  className={classes.fieldSmallNumber}
                  label="Health"
                  value={unit.health}
                  type="number"
                  onChange={handleEditHealth}
                  error={Boolean(unitHealthError)}
                  helperText={unitHealthError}
                />
                <TextField
                  className={classes.fieldSmallNumber}
                  label="Models"
                  value={unit.models}
                  type="number"
                  onChange={handleEditModels}
                  error={Boolean(unitModelsError)}
                  helperText={unitModelsError}
                />
                <div className={classes.fieldReinforced}>
                  <Typography variant="caption">Reinforced</Typography>
                  <Switch checked={unit.reinforced} onChange={handleToggleReinforced} />
                </div>
                <ToggleButtonGroup
                  exclusive
                  value={unitToHitModifier(unit.name)}
                  onChange={handleHitModifier}
                  className={classes.toggleButtonsGroup}
                >
                  <ToggleButton value={PLUS_ONE_HIT}>{PLUS_ONE_HIT}</ToggleButton>
                  <ToggleButton value={MINUS_ONE_HIT}>{MINUS_ONE_HIT}</ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup
                  exclusive
                  value={unitToWoundModifier(unit.name)}
                  onChange={handleWoundModifier}
                  className={classes.toggleButtonsGroup}
                >
                  <ToggleButton value={PLUS_ONE_WOUND}>{PLUS_ONE_WOUND}</ToggleButton>
                  <ToggleButton value={MINUS_ONE_WOUND}>{MINUS_ONE_WOUND}</ToggleButton>
                </ToggleButtonGroup>
                <TextField
                  className={classes.fieldSmallNumber}
                  label="Attack modifier"
                  value={unit?.attacksModifier}
                  type="number"
                  onChange={handleEditAttackModifier}
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
              <div className={classes.profiles}>
                <UnitModifierList
                  activeModifiers={unit.modifiers}
                  addUnitModifier={addUnitModifier}
                  removeUnitModifier={removeUnitModifier}
                  moveUnitModifier={moveUnitModifier}
                  onUnitModifierOptionChange={onUnitModifierOptionChange}
                  onUnitModifierToggle={onUnitModifierToggle}
                  getUnitModifierErrorCallBack={getUnitModifierErrorCallBack}
                  getModifierById={getModifierById}
                />
              </div>
            </div>
          )}
        </ListItem>
      </div>
    );
  },
  (prevProps, nextProps) => _.isEqual(prevProps, nextProps),
);

export default Unit;

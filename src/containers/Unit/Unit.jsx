import React from 'react';
import WeaponProfile from 'components/WeaponProfile';
import { connect } from 'react-redux';
import {
  addWeaponProfile,
  deleteUnit,
  editUnitName,
  addUnit,
} from 'actions/units.action';
import ListItem from 'components/ListItem';
import { TextField, Button } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles({
  unit: {
    marginBottom: '1em',
  },
  profiles: {
    marginTop: '1em',
  },
});

const Unit = ({
  id, unit, addWeaponProfile, deleteUnit, editUnitName, addUnit,
}) => {
  const classes = useStyles();
  return (
    <ListItem
      className={classes.unit}
      header={`Unit (${unit.name})`}
      onDelete={() => deleteUnit(id)}
      onCopy={() => addUnit(`${unit.name} copy`, [...unit.weapon_profiles])}
      collapsible
    >
      <TextField
        label="Unit Name"
        value={unit.name}
        onChange={(event) => editUnitName(id, event.target.value)}
        fullWidth
      />
      <div className={classes.profiles}>
        {unit
          && unit.weapon_profiles
          && unit.weapon_profiles.map((profile, index) => (
            <WeaponProfile unitId={id} id={index} profile={profile} />
          ))}
      </div>
      <Button
        icon="add"
        onClick={() => addWeaponProfile(id)}
        fluid
        startIcon={<Add />}
        variant="contained"
        fullWidth
      >
      Add Profile
      </Button>
    </ListItem>
  );
};

export default connect(null, {
  addWeaponProfile, deleteUnit, editUnitName, addUnit,
})(
  Unit,
);

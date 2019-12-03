import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { toggleWeaponProfile, deleteWeaponProfile, addWeaponProfile } from 'actions/units.action';
import ProfileDialog from 'containers/ProfileDialog';
import { Switch } from '@material-ui/core';
import ListItem from 'components/ListItem';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import ModifierSummary from 'components/ModifierSummary';
import Characteristics from './Characteristics';

const useStyles = makeStyles({
  profile: {
    display: 'flex',
  },
  inactive: {
    color: 'gray',
  },
  content: {
    display: 'flex',
    verticalAlign: 'middle',
    marginLeft: '-0.5em',
  },
  switch: {
    margin: 'auto 0',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },
});

const WeaponProfile = ({
  unitId, id, profile, toggleWeaponProfile, deleteWeaponProfile, addWeaponProfile,
}) => {
  const classes = useStyles();
  const profileRef = useRef(null);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (profileRef.current) profileRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [id]);

  return (
    <div ref={profileRef}>
      <ListItem
        className={clsx(classes.profile, profile.active ? '' : classes.inactive)}
        header="Weapon Profile"
        onEdit={() => setOpen(true)}
        onDelete={() => deleteWeaponProfile(id, unitId)}
        onCopy={() => addWeaponProfile(unitId, { ...profile })}
        collapsible
      >
        <div className={classes.content}>
          <Switch
            className={classes.switch}
            onChange={() => toggleWeaponProfile(id, unitId)}
            checked={profile.active}
          />
          <div className={classes.details} onClick={() => setOpen(true)} role="button">
            <Characteristics profile={profile} />
            <ModifierSummary modifiers={profile.modifiers} />
          </div>
        </div>
        <ProfileDialog
          open={open}
          close={() => setOpen(false)}
          unitId={unitId}
          id={id}
          header="Edit Profile"
          profile={profile}
        />
      </ListItem>
    </div>
  );
};

export default connect(
  null, { toggleWeaponProfile, deleteWeaponProfile, addWeaponProfile },
)(WeaponProfile);

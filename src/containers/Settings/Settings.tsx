import { Card, CardContent, FormControlLabel, Switch, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { configStore } from 'store/slices';
import type { IStore } from 'types/store';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    maxWidth: 1200,
    margin: '0 auto',
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
}));

const Settings = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const darkMode = useSelector((state: IStore) => state.config.darkMode);
  const desktopGraphList = useSelector((state: IStore) => state.config.desktopGraphList);

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>Settings</Typography>
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Display</Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Configure theme and graph layout preferences.
          </Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => dispatch(configStore.actions.toggleDarkMode())} />}
            label="Dark mode"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={desktopGraphList}
                onChange={() => dispatch(configStore.actions.toggleDesktopGraphList())}
              />
            )}
            label="Display desktop graphs as list (instead of tabs)"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

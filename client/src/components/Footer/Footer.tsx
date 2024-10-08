import { Paper, Typography, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import { Github } from 'components/SocialButtons';
import { useRouteFind } from 'hooks';
import React from 'react';
import { ROUTES } from 'utils/urls';

const useStyles = makeStyles((theme) => ({
  footer: {
    textAlign: 'center',
    width: '100%',
  },
  paper: {
    padding: '1em',
  },
  Actions: {
    marginTop: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
  },
  mobileActions: {
    justifyContent: 'flex-start',
    padding: theme.spacing(1.5, 0),
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1, 0, 0),
    },
  },
  footerButton: {
    marginRight: theme.spacing(1),
    [theme.breakpoints.down('xs')]: {
      marginRight: theme.spacing(0.5),
    },
    '&:last-child': {
      marginRight: 0,
    },
  },
}));

/**
 * The footer that appears at the bottom of the page
 */
const Footer = () => {
  const classes = useStyles();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [, , page] = useRouteFind(Object.values(ROUTES));

  if (page === ROUTES.PDF) return null;

  return (
    <footer className={classes.footer}>
      <Paper className={clsx(classes.paper)} square>
        <Typography variant="body2" component="p">
          Built by: <br />
          Damon Hook&nbsp;
          <i>(NoMaDhOoK)</i> 2019-2021
          <br /> Grégory Ribéron&nbsp;
          <i>(Manwe)</i> 2024+
        </Typography>
        <Typography variant="body2" component="p">
          Disclaimer: This tool is in no way endorsed or sanctioned by Games Workshop - it is unofficial and
          fan-made. I take absolutely no credit for any of the Games Workshop content displayed above.
        </Typography>
        <Typography component="div" className={clsx(classes.Actions, mobile ? classes.mobileActions : null)}>
          <Github className={classes.footerButton} />
        </Typography>
      </Paper>
    </footer>
  );
};

export default Footer;

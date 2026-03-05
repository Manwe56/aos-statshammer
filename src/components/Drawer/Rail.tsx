import { Divider, List, SwipeableDrawer as AppDrawer } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { EmojiEvents, GetApp, Home, ImportExport, Info, Search, Settings as SettingsIcon, Timeline } from '@material-ui/icons';
import { useRouteFind } from 'hooks';
import React from 'react';
import { useSelector } from 'react-redux';
import { numUnitsSelector } from 'store/selectors';
import { ROUTES } from 'utils/urls';

import DrawerLogo from './DrawerLogo';
import MenuLinkItem from './MenuLinkItem';

const useStyles = makeStyles((theme: Theme) => ({
  drawer: {
    width: theme.mixins.drawer.miniWidth,
  },
  docked: {
    width: theme.mixins.drawer.miniWidth,
  },
  divider: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  list: {
    width: '100%',
  },
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    margin: theme.spacing(0.5, 0, 1),
    fontSize: '2.75rem',
  },
}));

const Drawer = () => {
  const classes = useStyles();

  const numUnits = useSelector(numUnitsSelector);

  const [, , page] = useRouteFind(Object.values(ROUTES));

  const isHome = [ROUTES.HOME, ROUTES.TARGET, ROUTES.DAMAGE, ROUTES.HEALTH].includes(page);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const dummyFunc = () => {};

  return (
    <AppDrawer
      open
      onOpen={dummyFunc}
      onClose={dummyFunc}
      variant="persistent"
      anchor="left"
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      className={classes.drawer}
      classes={{
        paperAnchorLeft: classes.docked,
      }}
    >
      <DrawerLogo mini />
      <Divider />
      <List className={classes.list}>
        <MenuLinkItem to={ROUTES.HOME} label="Home" icon={<Home />} selected={isHome} mini />
        <MenuLinkItem
          to={ROUTES.SIMULATIONS}
          label="Simulations"
          icon={<Timeline />}
          selected={page === ROUTES.SIMULATIONS}
          disabled={numUnits <= 0}
          mini
        />
        <MenuLinkItem
          to={ROUTES.PDF}
          label="Download PDF"
          icon={<GetApp />}
          selected={page === ROUTES.PDF}
          disabled={numUnits <= 0}
          mini
        />
        <MenuLinkItem
          to={ROUTES.RANKINGS}
          label="Rankings"
          icon={<EmojiEvents />}
          selected={page === ROUTES.RANKINGS}
          mini
        />
        <MenuLinkItem
          to={ROUTES.IMPORT}
          label="Import / Export"
          icon={<ImportExport />}
          selected={page === ROUTES.IMPORT}
          mini
        />
        <MenuLinkItem
          to={ROUTES.LISTS_ANALYSIS}
          label="Lists analysis"
          icon={<Search />}
          selected={page === ROUTES.LISTS_ANALYSIS}
          mini
        />
        <MenuLinkItem
          to={ROUTES.SETTINGS}
          label="Settings"
          icon={<SettingsIcon />}
          selected={page === ROUTES.SETTINGS}
          mini
        />
        <MenuLinkItem to={ROUTES.ABOUT} label="About" icon={<Info />} selected={page === ROUTES.ABOUT} mini />
      </List>
    </AppDrawer>
  );
};

export default Drawer;

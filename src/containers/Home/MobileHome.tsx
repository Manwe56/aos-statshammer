import { makeStyles } from '@material-ui/core/styles';
import { RoutedTabs } from 'components/Tabbed';
import Stats from 'containers/Stats';
import { ResultsMode } from 'containers/Stats/Results';
import Target from 'containers/Target';
import Units from 'containers/Units';
import React from 'react';
import { ROUTES } from 'utils/urls';

const useStyles = makeStyles(() => ({
  mobileHome: {
    display: 'flex',
    flex: 1,
    height: '100%',
  },
  tabs: {
    marginTop: 0,
    maxWidth: '100vw',
    height: '100%',
  },
  tab: {
    padding: '.5em',
  },
}));

const MobileAppContent = () => {
  const classes = useStyles();

  return (
    <div className={classes.mobileHome}>
      <RoutedTabs
        className={classes.tabs}
        tabNames={['Units', 'Target', 'Damage', 'Health']}
        tabContent={[
          <Units className={classes.tab} />,
          <Target className={classes.tab} />,
          <Stats className={classes.tab} resultsMode={ResultsMode.DAMAGE} />,
          <Stats className={classes.tab} resultsMode={ResultsMode.HEALTH} />,
        ]}
        tabRoutes={[ROUTES.HOME, ROUTES.TARGET, ROUTES.DAMAGE, ROUTES.HEALTH]}
      />
    </div>
  );
};

export default MobileAppContent;

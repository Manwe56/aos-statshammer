import { Paper, Tab, Tabs } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';

import TabPanel from './TabPanel';

const useStyles = makeStyles({
  tabs: {
    flexGrow: 1,
    marginTop: '1em',
  },
  content: {
    flexGrow: 1,
    maxWidth: '100vw',
  },
  swiper: {
    height: '100%',
  },
});

const a11yProps = (index: number) => ({
  id: `full-width-tab-${index}`,
  'aria-controls': `full-width-tabpanel-${index}`,
});

interface ITabbedProps {
  tabNames: string[];
  tabContent: React.ReactNode[];
  className?: string;
  onTabChange?: (index: number) => void;
  activeTab?: number;
}

/**
 * A simple tabbed interface
 */
const Tabbed: React.FC<ITabbedProps> = ({ tabNames, tabContent, className, onTabChange, activeTab }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const currentTab = typeof activeTab === 'number' ? activeTab : value;

  const handleChange = (event, newValue) => {
    if (typeof activeTab !== 'number') {
      setValue(newValue);
    }
    if (onTabChange) onTabChange(newValue);
  };
  const handleSwipe = (index) => {
    if (typeof activeTab !== 'number') {
      setValue(index);
    }
    if (onTabChange) onTabChange(index);
  };

  return (
    <div className={clsx(classes.tabs, className)}>
      <Paper square>
        <Tabs value={currentTab} indicatorColor="primary" onChange={handleChange} variant="fullWidth">
          {tabNames.map((name, index) => (
            <Tab label={name} {...a11yProps(index)} key={name} />
          ))}
        </Tabs>
      </Paper>
      <SwipeableViews
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={currentTab}
        onChangeIndex={handleSwipe}
        className={classes.swiper}
        resistance
      >
        {tabContent.map((content, index) => (
          <TabPanel value={currentTab} index={index} className={classes.content} key={tabNames[index]}>
            {content}
          </TabPanel>
        ))}
      </SwipeableViews>
    </div>
  );
};

export default Tabbed;

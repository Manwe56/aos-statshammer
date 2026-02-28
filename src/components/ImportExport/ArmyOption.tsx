import { ListItem, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ImportExport } from '@material-ui/icons';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { IArmy } from 'types/army';

const useStyles = makeStyles((theme) => ({
  body: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
  },
  nested: {
    background: theme.palette.background.nested,
  },
  content: {
    flexDirection: 'column',
    flex: 1,
  },
  name: {
    flex: 1,
  },
  description: {
    color: theme.palette.text.secondary,
  },
  icon: {
    flexDirection: 'column',
    margin: 'auto',
  },
}));

interface IArmyOptionProps {
  army: IArmy;
  onClick: (army: IArmy) => void;
  nested?: boolean;
}

/**
 * A single modifier definition
 */
const ArmyOption: React.FC<IArmyOptionProps> = React.memo(
  ({ army, onClick, nested }) => {
    const classes = useStyles();
    return (
      <ListItem className={clsx({ [classes.nested]: nested })} onClick={() => onClick(army)} button>
        <div className={classes.body}>
          <div className={classes.content}>
            <Typography variant="body1" className={classes.name}>
              {army.faction}
            </Typography>
            <Typography variant="body2" className={classes.description}>
              {army.label}
            </Typography>
          </div>
          <div className={classes.icon}>
            <ImportExport />
          </div>
        </div>
      </ListItem>
    );
  },
  (prevProps, nextProps) => _.isEqual(prevProps, nextProps),
);

ArmyOption.defaultProps = {
  nested: false,
};

export default ArmyOption;

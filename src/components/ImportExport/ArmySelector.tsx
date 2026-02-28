import { Button, Collapse, Paper, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { ImportExport, Remove } from '@material-ui/icons';
import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import { IArmy } from 'types/army';

import ArmyOption from './ArmyOption';

const useStyles = makeStyles(() => ({
  button: { justifyContent: 'left' },
}));

interface IArmySelectorProps {
  label: string;
  armies: IArmy[];
  onClick: (army: IArmy) => void;
}

/**
 * A component used to select new modifiers to apply
 */
const ArmySelector: React.FC<IArmySelectorProps> = React.memo(
  ({ label, armies, onClick }) => {
    const classes = useStyles();
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [open, setOpened] = useState(false);

    const handleClose = () => setOpened(false);
    const handleOpen = () => setOpened(true);

    const selectArmy = useCallback(
      (army) => {
        onClick(army);
      },
      [onClick],
    );

    return (
      <div>
        {open ? (
          <Button
            className={classes.button}
            fullWidth
            variant="contained"
            onClick={handleClose}
            startIcon={<Remove />}
            color="secondary"
            size={mobile ? 'large' : 'medium'}
          >
            Cancel
          </Button>
        ) : (
          <Button
            className={classes.button}
            fullWidth
            variant="contained"
            onClick={handleOpen}
            startIcon={<ImportExport />}
            color="primary"
            size={mobile ? 'large' : 'medium'}
          >
            {label}
          </Button>
        )}
        <Collapse in={open} timeout={{ enter: 200, exit: 0 }}>
          <Paper square>
            {armies.map((army) => (
              <ArmyOption army={army} onClick={selectArmy} />
            ))}
          </Paper>
        </Collapse>
      </div>
    );
  },
  (prevProps, nextProps) => _.isEqual(prevProps, nextProps),
);

ArmySelector.defaultProps = {};

export default ArmySelector;

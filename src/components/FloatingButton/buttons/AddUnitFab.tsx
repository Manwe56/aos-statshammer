import { Add as AddIcon } from '@material-ui/icons';
import appConfig from 'appConfig';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { numUnitsSelector } from 'store/selectors';
import { unitsStore } from 'store/slices';

import FloatingButton from '../FloatingButton';

const AddUnitFab = () => {
  const numUnits = useSelector(numUnitsSelector);
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(
      unitsStore.actions.addUnit({
        unit: {
          name: `Unit ${numUnits + 1}`,
          points: 100,
          reinforced: false,
          health: 2,
          models: 1,
          modifiers: [],
          save: 4,
          attacksModifier: 0,
          active: numUnits < appConfig.limits.unitsVisibleByDefault,
        },
      }),
    );
  };

  return <FloatingButton onClick={handleClick} icon={<AddIcon />} />;
};

export default AddUnitFab;

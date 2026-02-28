import { MenuItem, Select } from '@material-ui/core';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { Faction } from 'types/army';

interface IFactionSelectorProps {
  value: Faction;
  excluded: Faction[];
  handleSelect: (faction: Faction) => void;
}

/**
 * A component used to select a faction
 */
const FactionSelector: React.FC<IFactionSelectorProps> = React.memo(
  ({ value, excluded, handleSelect }) => {
    const selectFaction = useCallback(
      (event) => {
        handleSelect(event.target.value);
      },
      [handleSelect],
    );

    return (
      <Select value={value} onChange={selectFaction}>
        {Object.values(Faction)
          .filter((faction)=> excluded.indexOf(faction)===-1)
          .map((faction) => (
          <MenuItem value={faction}>{faction}</MenuItem>
        ))}
      </Select>
    );
  },
  (prevProps, nextProps) => _.isEqual(prevProps, nextProps),
);

FactionSelector.defaultProps = {};

export default FactionSelector;

import { Collapse } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card, { CardBody } from 'components/Card';
import type { IPrimaryItem, ISecondaryItem } from 'components/ListControls/types';
import LoadingBar from 'components/LoadingBar';
import React, { useState } from 'react';

import ListItemHeader from './ListItemHeader';

const useStyles = makeStyles(() => ({
  listItem: {
    marginBottom: '1em',
  },
  loader: {
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
}));

interface IListItemProps {
  header: string;
  checked?: boolean;
  onToggle?: (checked) => void;
  primaryItems?: IPrimaryItem[];
  secondaryItems?: ISecondaryItem[];
  className?: string;
  collapsible?: boolean;
  loading?: boolean;
  loaderDelay?: number;
  startCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * A list item component that renders as a card with a header. This component can optionally
 * contain various list related controls, as well as, optionally be collapsible.
 */
const ListItem: React.FC<IListItemProps> = ({
  children,
  header,
  checked,
  onToggle,
  primaryItems,
  secondaryItems,
  className,
  collapsible,
  loading,
  loaderDelay,
  startCollapsed,
  onCollapseChange,
  ...other
}) => {
  const classes = useStyles();
  const [collapsed, setColapsed] = useState(startCollapsed || false);

  const changeCollapsed = (newCollapsed: boolean) => {
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
    setColapsed(newCollapsed);
  };

  return (
    <Card className={clsx(classes.listItem, className)} {...other}>
      <ListItemHeader
        header={header}
        checked={checked}
        onToggle={onToggle}
        primaryItems={primaryItems}
        secondaryItems={secondaryItems}
        collapsible={collapsible}
        collapsed={collapsed}
        setColapsed={changeCollapsed}
      />
      {loading && <LoadingBar wait={loaderDelay} />}
      <Collapse in={!collapsed}>
        <CardBody>{children}</CardBody>
      </Collapse>
    </Card>
  );
};

ListItem.defaultProps = {
  collapsible: false,
  loading: false,
  loaderDelay: 500,
  startCollapsed: false,
};

export default ListItem;

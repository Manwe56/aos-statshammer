import { Switch, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import clsx from 'clsx';
import { CardHeader } from 'components/Card';
import ListControls from 'components/ListControls';
import type { IPrimaryItem, ISecondaryItem } from 'components/ListControls/types';
import React from 'react';

const useStyles = makeStyles((theme) => ({
  header: {
    justifyContent: 'space-between',
    verticalAlign: 'middle',
    WebkitTapHighlightColor: 'rgba(0,0,0,0)',
  },
  headerText: {
    flex: 1,
    margin: 'auto',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    WebkitTouchCallout: 'none',
    msUserSelect: 'none',
    KhtmlUserSelect: 'none',
  },
  listControls: {
    margin: 'auto',
    marginRight: theme.spacing(-1),
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  collapseIcon: {
    margin: 'auto 0 auto',
    marginLeft: theme.spacing(-1),
  },
  collapsible: {
    cursor: 'pointer',
  },
}));

interface IListItemHeaderProps {
  header: string;
  checked?: boolean;
  onToggle?: (checked) => void;
  primaryItems?: IPrimaryItem[];
  secondaryItems?: ISecondaryItem[];
  className?: string;
  collapsible?: boolean;
  startCollapsed?: boolean;
  collapsed: boolean;
  setColapsed: (collapsed: boolean) => void;
}

const ListItemHeader: React.FC<IListItemHeaderProps> = ({
  header,
  checked,
  onToggle,
  primaryItems,
  secondaryItems,
  className,
  collapsible,
  collapsed,
  setColapsed,
}) => {
  const classes = useStyles();

  const handleClick = () => setColapsed(!collapsible ? false : !collapsed);

  return (
    <CardHeader className={clsx(classes.header, collapsible ? classes.collapsible : '', className)}>
      {collapsible && (
        <span className={classes.collapseIcon} onClick={handleClick} role="button">
          {collapsed ? <ExpandLess /> : <ExpandMore />}
        </span>
      )}
      <Typography
        className={classes.headerText}
        onClick={handleClick}
        role="button"
        component="span"
        variant="h6"
      >
        {header}
      </Typography>
      {onToggle && <Switch onChange={onToggle} checked={checked} />}
      <ListControls
        primaryItems={primaryItems}
        secondaryItems={secondaryItems}
        className={classes.listControls}
      />
    </CardHeader>
  );
};

ListItemHeader.defaultProps = {
  collapsible: false,
  collapsed: false,
};

export default ListItemHeader;

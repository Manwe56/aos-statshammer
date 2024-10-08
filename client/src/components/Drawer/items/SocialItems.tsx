import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { Github } from 'components/SocialButtons';
import React from 'react';

const useStyles = makeStyles(() => ({
  socialItems: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  miniIcon: {
    textAlign: 'center',
  },
}));

interface ISocialItemsProps {
  mini?: boolean;
}
const SocialItems = ({ mini }: ISocialItemsProps) => {
  const classes = useStyles();

  return (
    <div className={clsx(classes.socialItems, { [classes.miniIcon]: mini })}>
      <Github forceVariant="mini" />
    </div>
  );
};

export default SocialItems;

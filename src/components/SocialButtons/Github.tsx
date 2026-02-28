import { GitHub as GitHubIcon } from '@material-ui/icons';
import React from 'react';

import type { ISocialButtonProps } from './props';
import SocialItem from './SocialItem';

const Github = ({ className, forceVariant }: ISocialButtonProps) => {
  return (
    <SocialItem
      className={className}
      href="https://github.com/Manwe56/aos-statshammer"
      text="Github"
      icon={<GitHubIcon />}
      forceVariant={forceVariant}
    />
  );
};

export default Github;

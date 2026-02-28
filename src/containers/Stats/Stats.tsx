import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { unitNamesSelector } from 'store/selectors';
import type { IStore } from 'types/store';

import Results, { ResultsMode } from './Results';

interface IStatsProps {
  className?: string;
  resultsMode: ResultsMode;
}

const Stats = ({ className, resultsMode }: IStatsProps) => {
  const stats = useSelector((state: IStore) => state.stats, _.isEqual);
  const unitNames = useSelector(unitNamesSelector, _.isEqual);

  return <Results stats={stats} unitNames={unitNames} className={className} resultsMode={resultsMode} />;
};

export default Stats;

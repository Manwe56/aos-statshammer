import { useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { BarGraph, LineGraph, RadarGraph } from 'components/Graphs';
import React from 'react';
import { useSelector } from 'react-redux';
import { desktopGraphListSelector } from 'store/selectors';
import { ChartsLabels } from 'types/charts';
import { StatsResults } from 'types/stats';
import type { TError } from 'types/store';

import GraphList from './GraphList';
import GraphTabbed from './GraphTabbed';

/** A mapping of Graph Name -> Graph Component, in render order */
const graphMap: Map<string, any> = new Map<string, any>([
  ['Bar Graph', BarGraph],
  ['Line Graph', LineGraph],
  ['Radar Graph', RadarGraph],
]);

interface IGraphsProps {
  loading: boolean;
  per100Points: boolean;
  results: StatsResults;
  error: TError;
  chartsLabels: ChartsLabels;
  unitNames: string[];
}

const Graphs = ({ loading, per100Points, error, results, unitNames, chartsLabels }: IGraphsProps) => {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const desktopGraphList = useSelector(desktopGraphListSelector);

  return mobile || desktopGraphList ? (
    <GraphList
      loading={loading}
      per100Points={per100Points}
      error={error}
      results={results}
      unitNames={unitNames}
      chartsLabels={chartsLabels}
      graphMap={graphMap}
    />
  ) : (
    <GraphTabbed
      loading={loading}
      per100Points={per100Points}
      error={error}
      results={results}
      unitNames={unitNames}
      chartsLabels={chartsLabels}
      graphMap={graphMap}
    />
  );
};

export default Graphs;

import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ChartTooltip } from 'components/GraphTooltips';
import ListItem from 'components/ListItem';
import React from 'react';
import { useDispatch } from 'react-redux';
import { statsStore } from 'store/slices';
import { ChartsLabels } from 'types/charts';
import { StatsResults } from 'types/stats';
import type { TError } from 'types/store';

import GraphWrapper from './GraphWrapper';

const useStyles = makeStyles(() => ({
  content: {},
}));

interface GraphListProps {
  loading: boolean;
  per100Points: boolean;
  results: StatsResults;
  error: TError;
  unitNames: string[];
  chartsLabels: ChartsLabels;
  graphMap: Map<string, any>;
}

const GraphList: React.FC<GraphListProps> = ({
  loading,
  per100Points,
  error,
  results,
  unitNames,
  chartsLabels,
  graphMap,
}) => {
  const dispatch = useDispatch();
  const classes = useStyles();

  const handleStatsToggle = () => {
    dispatch(statsStore.actions.toggleStatsPer100Points());
  };

  return (
    <Typography component="div">
      {[...graphMap].map(([name, Graph]) => (
        <ListItem
          key={name}
          header={name}
          checked={per100Points}
          onToggle={handleStatsToggle}
          collapsible
          loading={loading}
          loaderDelay={loading ? 0 : 350}
        >
          <GraphWrapper loading={loading} numUnits={unitNames.length} error={Boolean(error)}>
            <Graph
              title={chartsLabels.title}
              className={classes.content}
              data={results}
              series={unitNames}
              xAxis={{
                dataKey: 'label',
              }}
              yAxisLabel={{
                value: chartsLabels.valueLabel,
                position: 'insideLeft',
              }}
              tooltip={<ChartTooltip dataLabel={chartsLabels.axisLabel} />}
            />
          </GraphWrapper>
        </ListItem>
      ))}
    </Typography>
  );
};

export default GraphList;

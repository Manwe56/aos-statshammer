import { Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ChartTooltip } from 'components/GraphTooltips';
import ListItem from 'components/ListItem';
import Tabbed from 'components/Tabbed';
import React from 'react';
import { useDispatch } from 'react-redux';
import { statsStore } from 'store/slices';
import { ChartsLabels } from 'types/charts';
import { StatsResults } from 'types/stats';
import type { TError } from 'types/store';

import GraphWrapper from './GraphWrapper';

const useStyles = makeStyles(() => ({
  tabs: {
    margin: '-1em -1em 0',
  },
  tab: {
    padding: '1em 1em 0',
  },
  content: {},
}));

interface GraphTabbedProps {
  loading: boolean;
  per100Points: boolean;
  results: StatsResults;
  error: TError;
  unitNames: string[];
  chartsLabels: ChartsLabels;
  graphMap: Map<string, any>;
}

const GraphTabbed: React.FC<GraphTabbedProps> = ({
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
    <ListItem
      header="Graphs"
      checked={per100Points}
      onToggle={handleStatsToggle}
      collapsible
      loading={loading}
      loaderDelay={loading ? 0 : 350}
    >
      <Tabbed
        className={classes.tabs}
        tabNames={[...graphMap.keys()]}
        tabContent={[...graphMap].map(([name, Graph]) => (
          <Paper square className={classes.tab}>
            <GraphWrapper loading={loading} numUnits={unitNames.length} key={name} error={Boolean(error)}>
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
          </Paper>
        ))}
      />
    </ListItem>
  );
};

export default GraphTabbed;

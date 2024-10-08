import { Typography } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { BarGraph } from 'components/Graphs';
import { ChartTooltip } from 'components/GraphTooltips';
import ListItem from 'components/ListItem';
import React, { useCallback, useMemo } from 'react';
import type { ISimulationResult } from 'types/simulations';

const useStyles = makeStyles((theme: Theme) => ({
  metricsGraphs: {
    height: 400,
    margin: `0 auto ${theme.spacing(3)}px`,
    flex: 1,
    maxWidth: 900,
    [theme.breakpoints.down('sm')]: {
      height: 350,
    },
  },
}));

interface IMetricsGraphsProps {
  results: ISimulationResult[];
  pending?: boolean;
  unitNames: string[];
}

const MetricsGraphs = ({ results, unitNames, pending }: IMetricsGraphsProps) => {
  const classes = useStyles();
  const firstLoad = (!results || !results.length) && pending;
  const xAxisFormatter = useCallback((value) => (!value ? '-' : `${value}+`), []);

  const graphData = useMemo(
    () =>
      results.map(({ save, metrics }) => {
        return unitNames.reduce((acc, name) => ({ ...acc, [name]: metrics.mean[name] }), { save });
      }),
    [results, unitNames],
  );

  if (pending) return null;

  return (
    <Typography component="div">
      <ListItem header="Average Damage" collapsible loading={pending} loaderDelay={firstLoad ? 0 : 350}>
        <BarGraph
          title="Average Damage"
          className={classes.metricsGraphs}
          data={graphData}
          series={unitNames}
          xAxis={{
            dataKey: 'save',
            tickFormatter: xAxisFormatter,
          }}
          yAxisLabel={{
            value: 'Average Damage',
            position: 'insideLeft',
          }}
          tooltip={<ChartTooltip dataLabel="Save" />}
        />
      </ListItem>
    </Typography>
  );
};

export default MetricsGraphs;

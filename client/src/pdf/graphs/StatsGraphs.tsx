import { makeStyles } from '@material-ui/core/styles';
import { BarGraph, LineGraph, RadarGraph } from 'components/Graphs';
import React, { useCallback } from 'react';
import type { TResult } from 'types/stats';

import GraphWrapper from './GraphWrapper';

const useStyles = makeStyles(() => ({
  graphGroup: {
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  line: {
    flex: 2,
  },
  radar: {
    flex: 1,
  },
}));

interface IStatsGraphsProps {
  results: TResult[];
  unitNames: string[];
  per100Points: boolean;
}

const StatsGraphs: React.FC<IStatsGraphsProps> = ({ results, unitNames, per100Points }) => {
  const classes = useStyles();
  const xAxisFormatter = useCallback((value) => (value === 'None' ? '-' : `${value}+`), []);

  return (
    <>
      <GraphWrapper className="pdf-copy">
        <BarGraph
          title={`Average Damage Table ${per100Points ? 'per 100 points' : ''}`}
          isAnimationActive={false}
          data={results}
          series={unitNames}
          xAxis={{
            dataKey: 'save',
            tickFormatter: xAxisFormatter,
          }}
          yAxisLabel={{
            value: 'Average Damage',
            position: 'insideLeft',
          }}
        />
      </GraphWrapper>
      <GraphWrapper className="pdf-copy">
        <div className={classes.graphGroup}>
          <LineGraph
            title={`Average Damage Table ${per100Points ? 'per 100 points' : ''}`}
            className={classes.line}
            isAnimationActive={false}
            data={results}
            series={unitNames}
            xAxis={{
              dataKey: 'save',
              tickFormatter: xAxisFormatter,
            }}
            yAxisLabel={{
              value: 'Average Damage',
              position: 'insideLeft',
            }}
          />
          <RadarGraph
            title={`Average Damage Table ${per100Points ? 'per 100 points' : ''}`}
            className={classes.line}
            isAnimationActive={false}
            data={results}
            series={unitNames}
            xAxis={{
              dataKey: 'save',
              tickFormatter: xAxisFormatter,
            }}
          />
        </div>
      </GraphWrapper>
    </>
  );
};

export default StatsGraphs;

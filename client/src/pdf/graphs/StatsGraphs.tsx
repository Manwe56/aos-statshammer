import { makeStyles } from '@material-ui/core/styles';
import { BarGraph, LineGraph, RadarGraph } from 'components/Graphs';
import React, { useCallback, useMemo } from 'react';
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

const sanitizeResults = (results: TResult[]): TResult[] =>
  results.map((result) => {
    const sanitized: any = {};
    Object.keys(result).forEach((key) => {
      const value = result[key];
      // Handle NaN, undefined, null, and Infinity
      if (typeof value === 'number') {
        sanitized[key] = Number.isFinite(value) ? value : 0;
      } else if (value === undefined || value === null) {
        sanitized[key] = 0;
      } else {
        sanitized[key] = value;
      }
    });
    return sanitized;
  });

const StatsGraphs: React.FC<IStatsGraphsProps> = ({ results, unitNames, per100Points }) => {
  const classes = useStyles();
  const xAxisFormatter = useCallback((value) => (value === 'None' ? '-' : `${value}+`), []);

  // Sanitize results and ensure all unit names have values
  const sanitizedResults = useMemo(() => {
    console.log('StatsGraphs - Raw results:', results);
    console.log('StatsGraphs - Unit names:', unitNames);

    if (!results || !Array.isArray(results) || results.length === 0) {
      console.warn('StatsGraphs - No valid results');
      return [];
    }

    const cleaned = sanitizeResults(results);
    console.log('StatsGraphs - Cleaned results:', cleaned);

    // Ensure each result has all unit names with at least a 0 value
    const complete = cleaned.map((result) => {
      const completeResult = { ...result };
      unitNames.forEach((name) => {
        if (completeResult[name] === undefined || completeResult[name] === null) {
          console.warn(`StatsGraphs - Missing value for unit "${name}", setting to 0`);
          completeResult[name] = 0;
        }
      });
      return completeResult;
    });

    console.log('StatsGraphs - Final sanitized results:', complete);
    return complete;
  }, [results, unitNames]);

  // Don't render if data is invalid
  if (!results || results.length === 0 || !unitNames || unitNames.length === 0 || sanitizedResults.length === 0) {
    console.warn('StatsGraphs - Skipping render due to invalid data');
    return null;
  }

  return (
    <>
      <GraphWrapper className="pdf-copy">
        <BarGraph
          title={`Average Damage Table ${per100Points ? 'per 100 points' : ''}`}
          isAnimationActive={false}
          data={sanitizedResults}
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
            data={sanitizedResults}
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
            data={sanitizedResults}
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

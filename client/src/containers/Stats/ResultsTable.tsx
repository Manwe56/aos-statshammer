import { Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ArrowDownward } from '@material-ui/icons';
import clsx from 'clsx';
import { StatsErrorCard } from 'components/ErrorCards';
import TableSkeleton from 'components/Skeletons/TableSkeleton';
import React from 'react';
import { ChartsLabels } from 'types/charts';
import { StatsResults } from 'types/stats';
import type { TError } from 'types/store';

const useStyles = makeStyles((theme) => ({
  table: {
    background: theme.palette.background.nested,
  },
  skeleton: {},
  container: {
    overflowX: 'auto',
  },
  sticky: {
    position: 'sticky',
    zIndex: 11,
    backgroundColor: theme.palette.background.nested,
  },
  header: {
    fontWeight: theme.typography.fontWeightBold,
    textAlign: 'right',
  },
  headertitle: {
    fontWeight: theme.typography.fontWeightBold,
  },
  cell: {
    background: theme.palette.background.nested,
  },
  error: {
    width: 'auto',
    height: theme.spacing(30),
  },
}));

interface IResultsTableProps {
  loading: boolean;
  results: StatsResults;
  error: TError;
  unitNames: string[];
  chartsLabels: ChartsLabels;
  className?: string;
  showTotal: boolean;
  maxUnits: number;
  sortBy: string;
  changeSort: (sort: string) => void;
}

const ResultsTable: React.FC<IResultsTableProps> = ({
  error,
  loading,
  results,
  unitNames,
  chartsLabels,
  className,
  showTotal,
  maxUnits,
  sortBy,
  changeSort,
}) => {
  const classes = useStyles();
  if (error) {
    return <StatsErrorCard className={classes.error} />;
  }
  if (loading) {
    return (
      <TableSkeleton
        dense
        rows={
          unitNames && unitNames.length
            ? Math.min(maxUnits, unitNames.length) + (showTotal ? 1 : 0)
            : showTotal
            ? 2
            : 1
        }
        cols={6}
        className={classes.skeleton}
      />
    );
  }
  const total = 'total';
  const unitNamesMax = unitNames.slice(0, Math.min(unitNames.length, maxUnits));
  const unitNamesWithTotal = showTotal ? [...unitNamesMax, total] : unitNamesMax;
  const sum = (a, b) => a + b;
  const resultsWithTotal = results.map((result) => {
    return {
      ...result,
      total: unitNamesMax
        .map((name) => result[name])
        .reduce(sum, 0)
        .toFixed(2),
    };
  });
  return (
    <Paper className={classes.container}>
      <Table size="small" className={clsx(classes.table, className)}>
        <TableHead>
          <TableRow className={classes.header}>
            <TableCell className={clsx(classes.sticky, classes.headertitle)}>
              {chartsLabels.axisLabel}
            </TableCell>
            {resultsWithTotal.map((result) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <TableCell key={result.label} className={clsx(classes.sticky, classes.header)}>
                  <div onClick={() => changeSort(result.label)}>
                    {result.label}
                    {result.label === sortBy && <ArrowDownward />}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {unitNamesWithTotal.map((name) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <TableRow key={name}>
                <TableCell key={name} className={clsx(classes.sticky, classes.cell)}>
                  {name}
                </TableCell>
                {resultsWithTotal.map((result) => (
                  <TableCell key={result.label} align="right">
                    {result[name]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ResultsTable;

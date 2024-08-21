import { Button, Tooltip, Typography, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { BarChart, GetApp } from '@material-ui/icons';
import clsx from 'clsx';
import ListItem from 'components/ListItem';
import TargetSummary from 'components/TargetSummary';
import Graphs from 'containers/Graphs';
import _ from 'lodash';
import React from 'react';
import { useDispatch } from 'react-redux';
import { statsStore } from 'store/slices';
import { ChartsLabels } from 'types/charts';
import type { IStatsStore } from 'types/store';
import { averageDamageTitle, healthTitle } from 'utils/texts';
import { ROUTES } from 'utils/urls';

import ResultsTable from './ResultsTable';

const useStyles = makeStyles({
  results: {},
});

export enum ResultsMode {
  DAMAGE,
  HEALTH,
  ALL,
}

interface IResultsProps {
  stats: IStatsStore;
  unitNames: string[];
  className?: string;
  resultsMode: ResultsMode;
}

const Results: React.FC<IResultsProps> = React.memo(
  ({ stats, unitNames, className, resultsMode }) => {
    const dispatch = useDispatch();
    const classes = useStyles();
    const theme = useTheme();
    const firstLoad = !stats?.payload?.length && stats?.pending;
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));
    const lg = useMediaQuery(theme.breakpoints.up('lg'));
    const showDamage = resultsMode === ResultsMode.ALL || resultsMode === ResultsMode.DAMAGE;
    const showHealth = resultsMode === ResultsMode.ALL || resultsMode === ResultsMode.HEALTH;

    const damageChartsLabel = (per100Points: boolean): ChartsLabels => {
      return {
        title: averageDamageTitle(per100Points),
        axisLabel: 'Save',
        valueLabel: 'Average Damage',
      };
    };

    const healthChartsLabel = (per100Points: boolean): ChartsLabels => {
      return {
        title: healthTitle(per100Points),
        axisLabel: 'Rend',
        valueLabel: 'Effective health',
      };
    };

    const handleStatsToggle = () => {
      dispatch(statsStore.actions.toggleStatsPer100Points());
    };

    const downloadDisabled = unitNames.length <= 0;

    return (
      <Typography className={clsx(classes.results, className)} component="div">
        <TargetSummary />
        {!mobile && !lg && (
          <Tooltip
            title={`View more advanced stats (like full probability curves), 
            calculated through simulations`}
          >
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<BarChart />}
              disabled={downloadDisabled}
              style={{ marginBottom: theme.spacing(2) }}
              href={ROUTES.SIMULATIONS}
            >
              Simulations
            </Button>
          </Tooltip>
        )}
        {showDamage && (
          <ListItem
            header={damageChartsLabel(stats.per100Points).title}
            collapsible
            loading={stats.pending}
            checked={stats.per100Points}
            onToggle={handleStatsToggle}
            loaderDelay={firstLoad ? 0 : 350}
          >
            <ResultsTable
              loading={firstLoad}
              error={stats.error}
              results={stats.damageResults}
              unitNames={unitNames}
              chartsLabels={damageChartsLabel(stats.per100Points)}
            />
          </ListItem>
        )}
        {showDamage && (
          <Graphs
            loading={firstLoad}
            error={stats.error}
            per100Points={stats.per100Points}
            results={stats.damageResults}
            unitNames={unitNames}
            chartsLabels={damageChartsLabel(stats.per100Points)}
          />
        )}

        {showHealth && (
          <ListItem
            header={healthChartsLabel(stats.per100Points).title}
            collapsible
            loading={stats.pending}
            checked={stats.per100Points}
            onToggle={handleStatsToggle}
            loaderDelay={firstLoad ? 0 : 350}
          >
            <ResultsTable
              loading={firstLoad}
              error={stats.error}
              results={stats.effectiveHealthResults}
              unitNames={unitNames}
              chartsLabels={healthChartsLabel(stats.per100Points)}
            />
          </ListItem>
        )}
        {showHealth && (
          <Graphs
            loading={firstLoad}
            error={stats.error}
            per100Points={stats.per100Points}
            results={stats.effectiveHealthResults}
            unitNames={unitNames}
            chartsLabels={healthChartsLabel(stats.per100Points)}
          />
        )}
        {!mobile && !lg && (
          <Button
            href={ROUTES.PDF}
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<GetApp />}
            disabled={downloadDisabled}
            style={{ marginBottom: theme.spacing(2) }}
          >
            Download PDF
          </Button>
        )}
      </Typography>
    );
  },
  (prevProps, nextProps) => _.isEqual(prevProps, nextProps),
);

export default Results;

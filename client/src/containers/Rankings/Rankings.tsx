import { Paper, Typography } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { fetchStatsCompare } from 'api';
import FactionSelector from 'components/ImportExport/FactionSelector';
import ListItem from 'components/ListItem';
import Tabbed from 'components/Tabbed';
import ResultsTable from 'containers/Stats/ResultsTable';
import { useReadFromFile } from 'hooks';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDispatch, useSelector } from 'react-redux';
import { getRankingFaction, statsSelector } from 'store/selectors';
import { battletomesStore, statsStore } from 'store/slices';
import { Faction } from 'types/army';
import { ChartsLabels } from 'types/charts';
import { averageDamageTitle, healthTitle } from 'utils/texts';

const useStyles = makeStyles((theme: Theme) => ({
  app: {
    fontFamily: '"Roboto", sans-serif',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.background.default,
  },
  toolbar: {
    margin: '1em',
  },
  paper: {
    padding: '1em',
  },
  flexrow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1em',
  },
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  tabs: {
    marginTop: 0,
    maxWidth: '100vw',
  },
  tab: {
    padding: theme.spacing(2),
    maxWidth: '1366px',
    margin: '0 auto',

    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
      padding: theme.spacing(1),
    },
  },
}));

const Rankings = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const disclaimer = useReadFromFile('rankings-disclaimer.md');

  const stats = useSelector(statsSelector);
  const rankingFaction = useSelector(getRankingFaction);
  const firstLoad = !stats?.payload?.length && stats?.pending;
  const top = 50;
  const excludedFactions = [Faction.List];
  const [sortByDamage, setSortByDamage] = useState('3+');
  const [sortByHealth, setSortByHealth] = useState('2');
  const damageResults =
    stats.rankingDamageResults && stats.rankingDamageResults.length > 0
      ? stats.rankingDamageResults.filter((result) => result.label === sortByDamage)[0]
      : {};
  const unitNamesDamage = Object.keys(damageResults)
    .filter((name) => name !== 'label' && name !== 'save')
    .sort((a, b) => Number(damageResults[b]) - Number(damageResults[a]));
  const healthResults =
    stats.rankingEffectiveHealthResults && stats.rankingEffectiveHealthResults.length > 0
      ? stats.rankingEffectiveHealthResults.filter((result) => result.label === sortByHealth)[0]
      : {};
  const unitNamesHealth = Object.keys(healthResults)
    .filter((name) => name !== 'label' && name !== 'save')
    .sort((a, b) => Number(healthResults[b]) - Number(healthResults[a]));

  useEffect(() => {
    dispatch(fetchStatsCompare(true));
  }, [dispatch]);

  const handleStatsToggle = () => {
    dispatch(statsStore.actions.toggleStatsPer100Points());
    dispatch(fetchStatsCompare(true));
  };

  const handleFactionSelected = (faction) => {
    dispatch(battletomesStore.actions.setRankingFaction({ faction }));
    dispatch(fetchStatsCompare(true));
  };

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

  return (
    <div className={classes.app} id="rankings">
      <div className={classes.container}>
        <ReactMarkdown source={disclaimer} />
        <div className={classes.toolbar}>
          <Paper className={classes.paper}>
            <div className={classes.flexrow}>
              <Typography variant="h6">Faction to rank: </Typography>
              <FactionSelector
                value={rankingFaction}
                excluded={excludedFactions}
                handleSelect={handleFactionSelected}
              />
            </div>
            <Typography variant="body1">Total units ranked: {unitNamesDamage.length}</Typography>
          </Paper>
        </div>
        {unitNamesDamage.length > 0 && (
          <Tabbed
            className={classes.tabs}
            tabNames={['Damage', 'Health']}
            tabContent={[
              <ListItem
                header={damageChartsLabel(stats.per100Points).title}
                collapsible
                loading={stats.pending}
                checked={stats.per100Points}
                onToggle={handleStatsToggle}
                loaderDelay={firstLoad ? 0 : 350}
              >
                <ResultsTable
                  loading={stats.pending}
                  error={stats.error}
                  results={stats.rankingDamageResults}
                  unitNames={unitNamesDamage}
                  chartsLabels={damageChartsLabel(stats.per100Points)}
                  showTotal={false}
                  maxUnits={top}
                  sortBy={sortByDamage}
                  changeSort={(sort) => setSortByDamage(sort)}
                />
              </ListItem>,
              <ListItem
                header={healthChartsLabel(stats.per100Points).title}
                collapsible
                loading={stats.pending}
                checked={stats.per100Points}
                onToggle={handleStatsToggle}
                loaderDelay={firstLoad ? 0 : 350}
              >
                <ResultsTable
                  loading={stats.pending}
                  error={stats.error}
                  results={stats.rankingEffectiveHealthResults}
                  unitNames={unitNamesHealth}
                  chartsLabels={healthChartsLabel(stats.per100Points)}
                  showTotal={false}
                  maxUnits={top}
                  sortBy={sortByHealth}
                  changeSort={(sort) => setSortByHealth(sort)}
                />
              </ListItem>,
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default Rankings;

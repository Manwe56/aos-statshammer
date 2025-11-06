import { makeStyles } from '@material-ui/core/styles';
import { fetchModifiers, fetchSimulations, fetchStatsCompare, fetchTargetModifiers } from 'api';
import _ from 'lodash';
import PdfGenerator from 'pdf';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSanitizedActiveUnitsSelector, getSanitizedTargetSelector } from 'store/selectors';
import type { IStore } from 'types/store';

const useStyles = makeStyles(() => ({
  pdfContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  generatorInner: {
    flex: 1,
    display: 'flex',
  },
}));

const PdfContainer = () => {
  const classes = useStyles();
  const { units, modifiers, targetModifiers, stats, simulations } = useSelector(
    (state: IStore) => state,
    _.isEqual,
  );
  const sanitizedUnits = useSelector(getSanitizedActiveUnitsSelector)();
  const target = useSelector(getSanitizedTargetSelector);
  const dispatch = useDispatch();

  const results = stats.payload;
  const probabilities = simulations.results;

  useEffect(() => {
    dispatch(fetchStatsCompare(false));
    dispatch(fetchModifiers());
    dispatch(fetchTargetModifiers());
    dispatch(fetchSimulations());
  }, [dispatch]);

  const modifiersReady = modifiers.items && modifiers.items.length;
  const targetModifiersReady = targetModifiers.items && targetModifiers.items.length;
  const resultsReady = results && results.length;
  const probabilitiesReady = probabilities && probabilities.length;

  if (modifiersReady && targetModifiersReady && resultsReady && probabilitiesReady) {
    return (
      <div className={classes.pdfContainer}>
        <div className={classes.generatorInner}>
          <PdfGenerator
            units={sanitizedUnits}
            target={target}
            results={results}
            probabilities={probabilities}
          />
        </div>
      </div>
    );
  }
  return null;
};

export default PdfContainer;

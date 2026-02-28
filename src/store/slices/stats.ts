import { createSlice } from '@reduxjs/toolkit';
import type { StatsResults, TResults } from 'types/stats';
import type { IStatsStore, TError } from 'types/store';
import { saveLabel } from 'utils/texts';

const INITIAL_STATE: IStatsStore = {
  pending: false,
  payload: [],
  damageResults: [],
  effectiveHealthResults: [],
  rankingDamageResults: [],
  rankingEffectiveHealthResults: [],
  per100Points: false,
  error: null,
};

const fetchStatsPending = (state: IStatsStore) => {
  state.pending = true;
  state.error = null;
};

const fetchStatsSuccess = (
  state: IStatsStore,
  action: { payload: { results: TResults; effectiveHealthResults: StatsResults, rankings: boolean } },
) => {
  const { results, effectiveHealthResults, rankings } = action.payload;
  state.pending = false;
  state.error = null;
  state.payload = results;
  const labeledResult = results.map((result) => {
    return { label: saveLabel(result.save), ...result };
  });
  if (rankings){
    state.rankingDamageResults = labeledResult;
    state.rankingEffectiveHealthResults = effectiveHealthResults;  
  } else {
    state.damageResults = labeledResult;
    state.effectiveHealthResults = effectiveHealthResults;  
  }
};

const fetchStatsError = (state: IStatsStore, action: { payload: { error: TError } }) => {
  const { error } = action.payload;
  state.pending = false;
  state.error = error;
};

export const toggleStatsPer100Points = (state: IStatsStore) => {
  state.per100Points = !state.per100Points;
};

export const statsStore = createSlice({
  name: 'stats',
  initialState: INITIAL_STATE,
  reducers: {
    fetchStatsPending,
    fetchStatsSuccess,
    fetchStatsError,
    toggleStatsPer100Points
  },
});

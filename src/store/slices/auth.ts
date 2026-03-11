import { createSlice } from '@reduxjs/toolkit';
import type { IAuthStore, IGoogleAuthUser } from 'types/store';

const INITIAL_STATE: IAuthStore = {
  isAuthenticated: false,
  provider: null,
  idToken: null,
  tokenIssuedAt: null,
  tokenExpiresAt: null,
  user: null,
};

const signInWithGoogle = (
  state: IAuthStore,
  action: {
    payload: {
      idToken: string;
      tokenIssuedAt: number | null;
      tokenExpiresAt: number | null;
      user: IGoogleAuthUser;
    };
  },
) => {
  state.isAuthenticated = true;
  state.provider = 'google';
  state.idToken = action.payload.idToken;
  state.tokenIssuedAt = action.payload.tokenIssuedAt;
  state.tokenExpiresAt = action.payload.tokenExpiresAt;
  state.user = action.payload.user;
};

const signOut = (state: IAuthStore) => {
  state.isAuthenticated = false;
  state.provider = null;
  state.idToken = null;
  state.tokenIssuedAt = null;
  state.tokenExpiresAt = null;
  state.user = null;
};

export const authStore = createSlice({
  name: 'auth',
  initialState: INITIAL_STATE,
  reducers: {
    signInWithGoogle,
    signOut,
  },
});

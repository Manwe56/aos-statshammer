import { Button, Card, CardContent, FormControlLabel, Switch, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Clear, ExitToApp, Save } from '@material-ui/icons';
import BetaTag from 'components/BetaTag';
import BSDataUnits from 'components/ImportExport/BSDataUnits';
import ImportArmy from 'components/ImportExport/ImportArmy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authStore, battletomesStore, configStore, notificationsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';
import type { IStore } from 'types/store';
import { IUnitParameter } from 'types/unit';

const BSDATA_LAST_UPDATE_KEY = 'bsdata_last_update';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface IGoogleCredentialResponse {
  credential?: string;
}

interface IGoogleJwtPayload {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  exp?: number;
  iat?: number;
}

interface IGoogleIdentityApi {
  accounts?: {
    id: {
      initialize: (configuration: {
        client_id: string;
        callback: (response: IGoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme: 'outline' | 'filled_blue' | 'filled_black';
          size: 'small' | 'medium' | 'large';
          text?: string;
          shape?: 'rectangular' | 'pill';
          width?: number;
        },
      ) => void;
      disableAutoSelect: () => void;
    };
  };
}

type TGoogleWindow = Window & {
  google?: IGoogleIdentityApi;
  __googleIdentityScriptPromise__?: Promise<void>;
};

const getGoogleWindow = (): TGoogleWindow => window as TGoogleWindow;

const decodeGoogleCredential = (credential: string): IGoogleJwtPayload | null => {
  try {
    const payloadPart = credential.split('.')[1];
    if (!payloadPart) return null;

    const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
    const paddedPayload = `${normalizedPayload}${'='.repeat(paddingLength)}`;
    return JSON.parse(window.atob(paddedPayload)) as IGoogleJwtPayload;
  } catch {
    return null;
  }
};

const loadGoogleIdentityScript = (): Promise<void> => {
  const googleWindow = getGoogleWindow();
  if (googleWindow.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleWindow.__googleIdentityScriptPromise__) {
    return googleWindow.__googleIdentityScriptPromise__;
  }

  const scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`) as HTMLScriptElement | null;

    const waitUntilReady = (remainingChecks = 20) => {
      if (googleWindow.google?.accounts?.id) {
        resolve();
        return;
      }

      if (remainingChecks <= 0) {
        reject(new Error('Google Identity Services API is not available'));
        return;
      }

      window.setTimeout(() => waitUntilReady(remainingChecks - 1), 100);
    };

    if (existingScript) {
      existingScript.addEventListener('load', () => waitUntilReady(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script')), {
        once: true,
      });
      waitUntilReady();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => waitUntilReady();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.body.appendChild(script);
  }).catch((error: Error) => {
    delete googleWindow.__googleIdentityScriptPromise__;
    throw error;
  });

  googleWindow.__googleIdentityScriptPromise__ = scriptPromise;
  return scriptPromise;
};

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    maxWidth: 1200,
    margin: '0 auto',
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '1em',
    marginTop: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  textField: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'flex-end',
  },
  uploadButton: {
    marginRight: 'auto',
  },
  helperText: {
    marginTop: theme.spacing(1),
  },
  authRow: {
    marginTop: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  authUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  authAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  authButtonWrap: {
    marginTop: theme.spacing(1),
    minHeight: 44,
  },
}));

const Settings = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const rules = useSelector((state: IStore) => state.config.rules);
  const darkMode = useSelector((state: IStore) => state.config.darkMode);
  const desktopGraphList = useSelector((state: IStore) => state.config.desktopGraphList);
  const auth = useSelector((state: IStore) => state.auth);
  const [localRules, setLocalRules] = useState(rules);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [lastBSDataUpdate, setLastBSDataUpdate] = useState<string | null>(
    () => localStorage.getItem(BSDATA_LAST_UPDATE_KEY),
  );
  const isRulesDirty = localRules !== rules;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID ?? '';

  const readTextFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Unable to read file'));
      };
      reader.onerror = () => {
        reject(new Error('Unable to read file'));
      };
      reader.readAsText(file);
    });

  const handleSave = () => {
    dispatch(configStore.actions.updateRules({ rules: localRules }));
    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Rules saved successfully',
        variant: 'success',
      }),
    );
  };

  const handleClear = () => {
    setLocalRules('');
    dispatch(configStore.actions.clearRules());
    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Rules cleared',
        variant: 'info',
      }),
    );
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (!file) return;

    try {
      const text = await readTextFile(file);
      setLocalRules(text);
      dispatch(configStore.actions.updateRules({ rules: text }));
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Rules loaded and saved from file',
          variant: 'success',
        }),
      );
    } catch {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Could not read uploaded file',
          variant: 'error',
        }),
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleGoogleCredential = useCallback((response: IGoogleCredentialResponse) => {
    const credential = response.credential;
    if (!credential) {
      setGoogleAuthError('Google sign-in did not return a credential. Please try again.');
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Google sign-in failed. Missing credential response.',
          variant: 'error',
        }),
      );
      return;
    }

    const payload = decodeGoogleCredential(credential);
    if (!payload?.sub || !payload?.email) {
      setGoogleAuthError('Could not read profile information from Google credential.');
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Google sign-in failed. Invalid credential payload.',
          variant: 'error',
        }),
      );
      return;
    }

    dispatch(
      authStore.actions.signInWithGoogle({
        idToken: credential,
        tokenIssuedAt: payload.iat ? payload.iat * 1000 : null,
        tokenExpiresAt: payload.exp ? payload.exp * 1000 : null,
        user: {
          id: payload.sub,
          email: payload.email,
          emailVerified: Boolean(payload.email_verified),
          name: payload.name || payload.email,
          givenName: payload.given_name || '',
          familyName: payload.family_name || '',
          picture: payload.picture || '',
        },
      }),
    );

    setGoogleAuthError(null);
    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Signed in with Google',
        variant: 'success',
      }),
    );
  }, [dispatch]);

  const loadBT = (units: IUnitParameter[], faction: Faction) => {
    if (faction === Faction.List) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: `File is containing an army list, not a known faction. You can't import it as a battletome`,
          variant: 'error',
        }),
      );
      return;
    }
    const battletome: IArmy = { faction, label: 'Battletome', units };
    dispatch(battletomesStore.actions.addBattletome({ battletome }));
    dispatch(
      notificationsStore.actions.addNotification({
        message: `Battletome ${faction} updated successfully`,
        variant: 'success',
      }),
    );
  };

  const loadBSDataFaction = (units: IUnitParameter[], faction: Faction) => {
    const battletome: IArmy = { faction, label: 'BS Data', units };
    dispatch(battletomesStore.actions.addBattletome({ battletome }));
    const now = new Date().toLocaleString();
    localStorage.setItem(BSDATA_LAST_UPDATE_KEY, now);
    setLastBSDataUpdate(now);
    dispatch(
      notificationsStore.actions.addNotification({
        message: `Battletome ${faction} updated successfully from BS Data`,
        variant: 'success',
      }),
    );
  };

  const handleGoogleSignOut = () => {
    dispatch(authStore.actions.signOut());
    getGoogleWindow().google?.accounts?.id?.disableAutoSelect?.();
    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Signed out from Google',
        variant: 'info',
      }),
    );
  };

  useEffect(() => {
    if (!googleClientId || auth.isAuthenticated) {
      return;
    }

    let cancelled = false;

    const setupGoogleAuth = async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled) return;

        const googleIdentity = getGoogleWindow().google?.accounts?.id;
        if (!googleIdentity || !googleButtonRef.current) {
          setGoogleAuthError('Google authentication is unavailable right now.');
          return;
        }

        googleIdentity.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
        });

        googleButtonRef.current.innerHTML = '';
        googleIdentity.renderButton(googleButtonRef.current, {
          theme: darkMode ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280,
        });

        setGoogleAuthError(null);
      } catch {
        if (!cancelled) {
          setGoogleAuthError('Could not load Google authentication. Please refresh and try again.');
        }
      }
    };

    setupGoogleAuth();

    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated, darkMode, googleClientId, handleGoogleCredential]);

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Settings
      </Typography>

      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Display
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Configure theme and graph layout preferences.
          </Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => dispatch(configStore.actions.toggleDarkMode())} />}
            label="Dark mode"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={desktopGraphList}
                onChange={() => dispatch(configStore.actions.toggleDesktopGraphList())}
              />
            )}
            label="Display desktop graphs as list (instead of tabs)"
          />
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Authentication
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Sign in with Google to unlock authenticated services. The login token and profile are saved in application
            state.
          </Typography>

          {!googleClientId && (
            <Typography variant="body2" color="error">
              Set REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in.
            </Typography>
          )}

          {googleClientId && auth.isAuthenticated && auth.user && (
            <div className={classes.authRow}>
              <div className={classes.authUserInfo}>
                {auth.user.picture && <img className={classes.authAvatar} src={auth.user.picture} alt="Google profile" />}
                <div>
                  <Typography variant="subtitle1">{auth.user.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {auth.user.email}
                  </Typography>
                  {auth.tokenExpiresAt && (
                    <Typography variant="caption" color="textSecondary">
                      {`Token expires: ${new Date(auth.tokenExpiresAt).toLocaleString()}`}
                    </Typography>
                  )}
                </div>
              </div>
              <Button variant="outlined" color="secondary" startIcon={<ExitToApp />} onClick={handleGoogleSignOut}>
                Sign out
              </Button>
            </div>
          )}

          {googleClientId && !auth.isAuthenticated && <div className={classes.authButtonWrap} ref={googleButtonRef} />}

          {googleAuthError && (
            <Typography variant="body2" color="error" className={classes.helperText}>
              {googleAuthError}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Update factions
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            The application is by default containing only index definitions of the factions, and some factions are even
            missing. In this section you can update a faction with a list of units you exported previously and that
            represent an updated version of the faction.
            <br />
            <BetaTag /> You can also now update all the factions by loading the unit definitions directly from the{' '}
            <a href="https://github.com/BSData/age-of-sigmar-4th">BSData AoS 4th</a> open source repository. Please
            note that this is not fully supported yet.
          </Typography>
          {lastBSDataUpdate && (
            <Typography variant="caption" color="textSecondary">
              {`Last BSData update: ${lastBSDataUpdate}`}
            </Typography>
          )}
          <div className={classes.flexRow}>
            <ImportArmy onArmyLoad={loadBT} text="Import battletome" />
            <BSDataUnits onLoadBSDataUnits={loadBSDataFaction} />
          </div>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Rules Text
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Paste your rules text here. This will be stored locally and can be used for extraction in the Import from
            List feature.
          </Typography>
          <TextField
            className={classes.textField}
            id="rules-text"
            label="Rules"
            placeholder="Paste your rules text here..."
            multiline
            rows={20}
            variant="outlined"
            value={localRules}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setLocalRules(event.target.value);
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <div className={classes.buttonContainer}>
            <Button
              className={classes.uploadButton}
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload text file
            </Button>
            <Button variant="outlined" startIcon={<Clear />} onClick={handleClear} disabled={!localRules}>
              Clear
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!isRulesDirty}
            >
              Save
            </Button>
          </div>
          <Typography variant="caption" color="textSecondary" className={classes.helperText}>
            Uploading a text file loads and saves rules immediately. Manual edits require clicking Save.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

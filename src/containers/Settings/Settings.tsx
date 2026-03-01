import { Button, Card, CardContent, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Clear, Save } from '@material-ui/icons';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { configStore, notificationsStore } from 'store/slices';
import type { IStore } from 'types/store';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    maxWidth: 1200,
    margin: '0 auto',
  },
  card: {
    marginBottom: theme.spacing(2),
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
}));

const Settings = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const rules = useSelector((state: IStore) => state.config.rules);
  const [localRules, setLocalRules] = useState(rules);
  const isRulesDirty = localRules !== rules;
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Settings
      </Typography>

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

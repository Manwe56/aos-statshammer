import { Button, IconButton, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FileCopy, ImportExport, Search } from '@material-ui/icons';
import { lowerCase } from 'lodash';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mergedBattletomesSelector } from 'store/selectors';
import { notificationsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';
import type { IStore } from 'types/store';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  extractedRulesContainer: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  extractedRulesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  extractedRulesText: {
    width: '100%',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    maxHeight: '600px',
    overflowY: 'auto',
  },
}));

interface IArmyFromListProps {
  onLoadArmyFromList: (ArmyFromList: IArmy) => void;
}

const ArmyFromList = ({ onLoadArmyFromList }: IArmyFromListProps) => {
  const classes = useStyles();
  const [armyList, setArmyList] = useState('');
  const [extractedRules, setExtractedRules] = useState('');
  const dispatch = useDispatch();
  const matchPlay = useSelector(mergedBattletomesSelector);
  const rules = useSelector((state: IStore) => state.config.rules);
  
  const onClick = () => {
    const lowercaseArmylist = lowerCase(armyList);
    const armyUnits: IArmy = {
      faction: Faction.List,
      label: '',
      units: [],
    };
    matchPlay.forEach((army) => {
      army.units.forEach((unit) => {
        const strippedUnitName = lowerCase(unit.name
          .replace(/ - .*/g, '')
          .replace(/,.*/g, '')
          .replace(/\(.*\)/g, '')
          .replace(/\[.*\]/g, '')
          .trim());
        if (lowercaseArmylist.includes(strippedUnitName)) {
          armyUnits.units.push(unit);
        }
      });
    });
    if (armyUnits.units.length > 0) {
      onLoadArmyFromList(armyUnits);
    } else {
      dispatch(
        notificationsStore.actions.addNotification({
          message:
            'Sorry, not finding any known unit. Did you check your faction was already available in the factions that can be imported? ',
          variant: 'error',
        }),
      );
    }
  };

  const sanitizeLine = (line: string): string => {
    // Remove bullet points
    let sanitized = line.replace(/^[\s•\-\*]+/,'').trim();
    
    // Remove text before ' - ' (e.g., "Manifestation Lore - Manifestations" -> "Manifestations")
    const dashIndex = sanitized.indexOf(' - ');
    if (dashIndex !== -1) {
      sanitized = sanitized.substring(dashIndex + 3).trim();
    }
    
    // Remove parentheses and their content
    sanitized = sanitized.replace(/\s*\([^)]*\)/g, '').trim();
    sanitized = sanitized.replace(/\s*\[[^\]]*\]/g, '').trim();
    
    return sanitized;
  };

  const extractRulesForLine = (searchText: string, rulesText: string): string | null => {
    if (!searchText || searchText.length < 2) return null;
    
    const lines = rulesText.split('\n');
    const searchPattern = `### ${searchText}`;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line matches our search pattern
      if (line === searchPattern || line.toLowerCase() === searchPattern.toLowerCase()) {
        // Found the start of our section, now extract until the next # section
        const sectionLines = [lines[i]];
        
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          
          // Check if we've hit another section (starts with #)
          if (nextLine.trim().match(/^#+\s/)) {
            break;
          }
          
          sectionLines.push(nextLine);
        }
        
        return sectionLines.join('\n');
      }
    }
    
    return null;
  };

  const onExtractRules = () => {
    if (!rules || !armyList) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Please provide both an army list and rules text',
          variant: 'warning',
        }),
      );
      return;
    }

    const lines = armyList.split('\n');
    const foundRules: string[] = [];
    const foundRulesSet = new Set<string>(); // For deduplication
    let matchCount = 0;

    lines.forEach((line) => {
      const sanitized = sanitizeLine(line);
      if (sanitized) {
        const extractedRule = extractRulesForLine(sanitized, rules);
        if (extractedRule && !foundRulesSet.has(extractedRule)) {
          foundRules.push(extractedRule);
          foundRulesSet.add(extractedRule);
          matchCount++;
        }
      }
    });

    if (foundRules.length > 0) {
      setExtractedRules(foundRules.join('\n\n'));
      dispatch(
        notificationsStore.actions.addNotification({
          message: `Found ${matchCount} matching rule${matchCount > 1 ? 's' : ''}`,
          variant: 'success',
        }),
      );
    } else {
      setExtractedRules('');
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'No matching rules found',
          variant: 'info',
        }),
      );
    }
  };

  const copyToClipboard = () => {
    if (extractedRules) {
      navigator.clipboard.writeText(extractedRules).then(
        () => {
          dispatch(
            notificationsStore.actions.addNotification({
              message: 'Rules copied to clipboard',
              variant: 'success',
            }),
          );
        },
        () => {
          dispatch(
            notificationsStore.actions.addNotification({
              message: 'Failed to copy to clipboard',
              variant: 'error',
            }),
          );
        },
      );
    }
  };

  return (
    <div className={classes.root}>
      <TextField
        id="army-list-input"
        label="army list"
        placeholder="copy paste your army list here"
        multiline
        value={armyList}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setArmyList(event.target.value);
        }}
      />
      <div className={classes.buttonContainer}>
        <Button
          variant="contained"
          startIcon={<ImportExport />}
          color="primary"
          component="span"
          onClick={onClick}
        >
          Import from list
        </Button>
        {rules && (
          <Button
            variant="outlined"
            startIcon={<Search />}
            color="secondary"
            component="span"
            onClick={onExtractRules}
          >
            Extract Rules
          </Button>
        )}
      </div>
      
      {extractedRules && (
        <div className={classes.extractedRulesContainer}>
          <div className={classes.extractedRulesHeader}>
            <Typography variant="h6">Extracted Rules</Typography>
            <IconButton onClick={copyToClipboard} size="small" title="Copy to clipboard">
              <FileCopy />
            </IconButton>
          </div>
          <div className={classes.extractedRulesText}>
            {extractedRules}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArmyFromList;

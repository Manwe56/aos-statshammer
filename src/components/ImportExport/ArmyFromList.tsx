import { Button, FormControlLabel, IconButton, Switch, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FileCopy, ImportExport, Search } from '@material-ui/icons';
import { lowerCase } from 'lodash';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StatsController from 'api/core/controllers/statsController';
import { getSanitizedTargetSelector, mergedBattletomesSelector } from 'store/selectors';
import { configStore, notificationsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';
import type { IStore } from 'types/store';
import type { IModifierInstanceParameter } from 'types/modifiers';
import type { IUnitParameter, IWeaponProfileParameter } from 'types/unit';

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
  const [includeChargedVersions, setIncludeChargedVersions] = useState(true);
  const dispatch = useDispatch();
  const matchPlay = useSelector(mergedBattletomesSelector);
  const rules = useSelector((state: IStore) => state.config.rules);
  const target = useSelector(getSanitizedTargetSelector);

  const sanitizeLine = (line: string): string => {
    // Remove bullet points
    let sanitized = line.replace(/^[\s•*-]+/, '').trim();
    
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

  const unitNameForMatch = (name: string): string =>
    lowerCase(name
      .replace(/ - .*/g, '')
      .replace(/,.*/g, '')
      .replace(/\(.*\)/g, '')
      .replace(/\[.*\]/g, '')
      .trim());

  const cloneModifier = <T extends IModifierInstanceParameter>(modifier: T): T => ({
    ...modifier,
    options: modifier.options ? { ...modifier.options } : modifier.options,
  });

  const cloneWeaponProfile = (profile: IWeaponProfileParameter): IWeaponProfileParameter => ({
    ...profile,
    modifiers: (profile.modifiers ?? []).map(cloneModifier),
  });

  const cloneUnit = (unit: IUnitParameter): IUnitParameter => ({
    ...unit,
    modifiers: (unit.modifiers ?? []).map(cloneModifier),
    weapon_profiles: (unit.weapon_profiles ?? []).map(cloneWeaponProfile),
  });

  const applyReinforced = (unit: IUnitParameter): IUnitParameter => {
    if (unit.reinforced) {
      return unit;
    }
    const reinforcedUnit = cloneUnit(unit);
    reinforcedUnit.reinforced = true;
    reinforcedUnit.name = reinforcedUnit.name.includes(' [R]') ? reinforcedUnit.name : `${reinforcedUnit.name} [R]`;
    reinforcedUnit.points *= 2;
    reinforcedUnit.models *= 2;
    reinforcedUnit.weapon_profiles = (reinforcedUnit.weapon_profiles ?? []).map((weapon) => ({
      ...weapon,
      num_models: weapon.num_models * 2,
    }));
    return reinforcedUnit;
  };

  const removeChargeBonus = (unit: IUnitParameter): IUnitParameter => ({
    ...cloneUnit(unit),
    weapon_profiles: (unit.weapon_profiles ?? []).map((profile) => {
      if (profile.modifiers.some((modifier) => modifier.id === 'BONUS_CHARGE')) {
        return { ...profile, modifiers: profile.modifiers.filter((modifier) => modifier.id !== 'BONUS_CHARGE') };
      }
      return profile;
    }),
  });

  const duplicateChargeBonus = (unit: IUnitParameter): IUnitParameter[] => {
    if (!unit.weapon_profiles) {
      return [unit];
    }
    const hasChargeBonus = unit.weapon_profiles.some(
      (profile) => profile.modifiers.some((modifier) => modifier.id === 'BONUS_CHARGE'),
    );
    if (!hasChargeBonus) {
      return [unit];
    }
    const charged = {
      ...cloneUnit(unit),
      name: `${unit.name} (charged)`,
      weapon_profiles: unit.weapon_profiles.map((profile) => {
        if (profile.modifiers.some((modifier) => modifier.id === 'BONUS_CHARGE')) {
          const chargedModifiers = profile.modifiers
            .filter((modifier) => modifier.id !== 'BONUS_CHARGE')
            .map((modifier) => {
              if (modifier.id === 'MORTAL_WOUNDS') {
                return {
                  ...modifier,
                  options: { ...modifier.options, mortalWounds: `${modifier.options.mortalWounds}+1` },
                };
              }
              return modifier;
            });
          return {
            ...profile,
            name: profile.name ? `${profile.name} (charged)` : profile.name,
            damage: `${profile.damage}+1`,
            modifiers: chargedModifiers,
          };
        }
        return profile;
      }),
    };
    return [charged];
  };

  const applyChargePreference = (
    unit: IUnitParameter,
    includeCharged: boolean,
  ): IUnitParameter[] => {
    const hasChargeBonus = (unit.weapon_profiles ?? []).some((profile) =>
      profile.modifiers.some((modifier) => modifier.id === 'BONUS_CHARGE'),
    );

    if (!hasChargeBonus) {
      return [cloneUnit(unit)];
    }

    if (includeCharged) {
      return duplicateChargeBonus(unit);
    }

    return [removeChargeBonus(unit)];
  };

  const findBestUnitForLine = (sanitizedLine: string): IUnitParameter | null => {
    const normalizedLine = lowerCase(sanitizedLine.trim());
    if (!normalizedLine) {
      return null;
    }
    const allUnits = matchPlay.flatMap((army) => army.units);
    const sortedCandidates = [...allUnits].sort((a, b) => unitNameForMatch(b.name).length - unitNameForMatch(a.name).length);
    const match = sortedCandidates.find((unit) => {
      const normalizedUnitName = unitNameForMatch(unit.name);
      return (
        normalizedLine === normalizedUnitName
        || normalizedLine.includes(normalizedUnitName)
        || normalizedUnitName.includes(normalizedLine)
      );
    });
    return match ?? null;
  };

  const isChargedVariantName = (name: string): boolean => /\bcharge\b|\bcharged\b/i.test(name);

  const getChargedSiblingUnits = (unit: IUnitParameter): IUnitParameter[] => {
    const normalizedName = unitNameForMatch(unit.name);
    return matchPlay
      .flatMap((army) => army.units)
      .filter((candidate) => candidate.name !== unit.name)
      .filter((candidate) => unitNameForMatch(candidate.name) === normalizedName)
      .filter((candidate) => isChargedVariantName(candidate.name));
  };

  const getRegularSiblingUnits = (unit: IUnitParameter): IUnitParameter[] => {
    const normalizedName = unitNameForMatch(unit.name);
    return matchPlay
      .flatMap((army) => army.units)
      .filter((candidate) => candidate.name !== unit.name)
      .filter((candidate) => unitNameForMatch(candidate.name) === normalizedName)
      .filter((candidate) => !isChargedVariantName(candidate.name));
  };

  const getUnitsForLine = (
    line: string,
    nextLine: string,
    includeCharged: boolean,
  ): IUnitParameter[] => {
    const sanitized = sanitizeLine(line);
    if (!sanitized) {
      return [];
    }

    const foundUnit = findBestUnitForLine(sanitized);
    if (!foundUnit) {
      return [];
    }

    const shouldReinforce = /reinforced/i.test(nextLine ?? '');

    const chargedSiblings = getChargedSiblingUnits(foundUnit);
    const regularSiblings = getRegularSiblingUnits(foundUnit);
    const siblingPool = includeCharged ? chargedSiblings : regularSiblings;

    const preferredUnits = siblingPool.length > 0 ? siblingPool : [foundUnit];
    return preferredUnits.flatMap((unit) => {
      const preparedUnit = shouldReinforce ? applyReinforced(unit) : cloneUnit(unit);
      return applyChargePreference(preparedUnit, includeCharged);
    });
  };

  const getUnitsFromArmyList = (includeCharged: boolean): IUnitParameter[] => {
    const lines = armyList.split('\n');
    return lines.flatMap((line, index) => getUnitsForLine(line, lines[index + 1] ?? '', includeCharged));
  };

  const onClick = () => {
    if (!armyList) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Please provide an army list',
          variant: 'warning',
        }),
      );
      return;
    }

    dispatch(configStore.actions.updateImportedArmyListText({ importedArmyListText: armyList }));

    const armyUnits: IArmy = {
      faction: Faction.List,
      label: '',
      units: getUnitsFromArmyList(includeChargedVersions),
    };

    if (armyUnits.units.length > 0) {
      onLoadArmyFromList(armyUnits);
      return;
    }

    dispatch(
      notificationsStore.actions.addNotification({
        message:
          'Sorry, not finding any known unit. Did you check your faction was already available in the factions that can be imported? ',
        variant: 'error',
      }),
    );
  };

  const sanitizeUnitForStats = (unit: IUnitParameter) => {
    const safeNum = (value: any, fallback: number) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };

    return {
      name: unit.name || 'Unnamed Unit',
      points: safeNum(unit.points, 100),
      health: safeNum(unit.health, 1),
      models: safeNum(unit.models, 1),
      save: safeNum(unit.save, 4),
      active: unit.active !== false,
      reinforced: unit.reinforced || false,
      attacksModifier: safeNum(unit.attacksModifier, 0),
      modifiers: (unit.modifiers ?? []).map((modifier) => ({
        ...modifier,
        active: modifier.active ?? true,
      })),
      weapon_profiles: (unit.weapon_profiles ?? []).map((profile) => ({
        ...profile,
        active: profile.active !== false,
        num_models: safeNum(profile.num_models, 1),
        to_hit: safeNum(profile.to_hit, 4),
        to_wound: safeNum(profile.to_wound, 4),
        rend: safeNum(profile.rend, 0),
        modifiers: (profile.modifiers ?? []).map((modifier) => ({
          ...modifier,
          active: modifier.active ?? true,
        })),
      })),
    };
  };

  const buildAnalysisTable = (headers: string[], rows: string[][]): string => {
    const allRows = [headers, ...rows];
    const columnCount = headers.length;
    const columnWidths = Array.from({ length: columnCount }, (_, columnIndex) =>
      allRows.reduce((max, row) => Math.max(max, (row[columnIndex] ?? '').length), 0),
    );

    const formatRow = (row: string[]) =>
      row
        .map((cell, columnIndex) => {
          const value = cell ?? '';
          return columnIndex === 0
            ? value.padEnd(columnWidths[columnIndex], ' ')
            : value.padStart(columnWidths[columnIndex], ' ');
        })
        .join(' | ');

    const headerLine = formatRow(headers);
    const separator = columnWidths
      .map((width) => ''.padEnd(width, '-'))
      .join('-+-');
    const rowLines = rows.map((row) => formatRow(row));
    return [headerLine, separator, ...rowLines].join('\n');
  };

  const buildAnalysisTables = (unitsForAnalysis: IUnitParameter[]): string => {
    if (unitsForAnalysis.length === 0) {
      return '';
    }
    const occurrences = new Map<string, number>();
    const uniquelyNamedUnits = unitsForAnalysis.map((unit) => {
      const next = (occurrences.get(unit.name) ?? 0) + 1;
      occurrences.set(unit.name, next);
      return { ...unit, name: `${unit.name} #${next}` };
    });
    const sanitizedUnits = uniquelyNamedUnits.map(sanitizeUnitForStats);

    const controller = new StatsController();
    const { saveResults, healthResults } = controller.compareUnits({
      units: sanitizedUnits,
      target,
      per100Points: false,
    });

    const damageHeaders = ['Unit', ...saveResults.map((result) => `${result.save}+`)];
    const damageRows = uniquelyNamedUnits.map((unit) => {
      const values = saveResults.map((result) => Number(result[unit.name]) || 0);
      return [unit.name, ...values.map((value) => value.toFixed(2))];
    });
    const damageTotals = saveResults.map((result) =>
      uniquelyNamedUnits
        .reduce((sum, unit) => sum + (Number(result[unit.name]) || 0), 0)
        .toFixed(2),
    );
    damageRows.push(['TOTAL', ...damageTotals]);

    const healthHeaders = ['Unit', ...healthResults.map((result) => `${result.label}`)];
    const healthRows = uniquelyNamedUnits.map((unit) => {
      const values = healthResults.map((result) => Number(result[unit.name]) || 0);
      return [unit.name, ...values.map((value) => value.toFixed(2))];
    });
    const healthTotals = healthResults.map((result) =>
      uniquelyNamedUnits
        .reduce((sum, unit) => sum + (Number(result[unit.name]) || 0), 0)
        .toFixed(2),
    );
    healthRows.push(['TOTAL', ...healthTotals]);

    const damageTable = buildAnalysisTable(damageHeaders, damageRows);
    const healthTable = buildAnalysisTable(healthHeaders, healthRows);

    return `Damage output by save:\n${damageTable}\n\nEffective health by rend:\n${healthTable}`;
  };

  const onExtractRules = () => {
    if (!armyList) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Please provide an army list',
          variant: 'warning',
        }),
      );
      return;
    }

    dispatch(configStore.actions.updateImportedArmyListText({ importedArmyListText: armyList }));

    const lines = armyList.split('\n');
    const foundRules: string[] = [];
    const foundRulesSet = new Set<string>(); // For deduplication
    const unitsForAnalysis: IUnitParameter[] = getUnitsFromArmyList(includeChargedVersions);
    let matchCount = 0;

    lines.forEach((line) => {
      const sanitized = sanitizeLine(line);
      if (sanitized) {
        if (rules) {
          const extractedRule = extractRulesForLine(sanitized, rules);
          if (extractedRule && !foundRulesSet.has(extractedRule)) {
            foundRules.push(extractedRule);
            foundRulesSet.add(extractedRule);
            matchCount++;
          }
        }
      }
    });

    const analysisTable = buildAnalysisTables(unitsForAnalysis);

    const sections = [armyList];
    if (analysisTable) {
      sections.push(`List analysis:\n${analysisTable}`);
    }
    if (foundRules.length > 0) {
      sections.push(`The following rules apply to this list:\n\n${foundRules.join('\n\n')}`);
    }
    setExtractedRules(sections.join('\n\n'));

    if (foundRules.length > 0) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: `Found ${matchCount} matching rule${matchCount > 1 ? 's' : ''}`,
          variant: 'success',
        }),
      );
    } else {
      dispatch(
        notificationsStore.actions.addNotification({
          message: rules ? 'No matching rules found' : 'List analyzed',
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
        <FormControlLabel
          control={(
            <Switch
              color="primary"
              checked={includeChargedVersions}
              onChange={(_event, checked) => setIncludeChargedVersions(checked)}
            />
          )}
          label={includeChargedVersions ? 'Use charged versions' : 'Use regular versions'}
        />
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
              Analyze list
          </Button>
        )}
      </div>
      
      {extractedRules && (
        <div className={classes.extractedRulesContainer}>
          <div className={classes.extractedRulesHeader}>
            <Typography variant="h6">Analysis</Typography>
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

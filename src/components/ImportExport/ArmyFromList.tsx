import { Button, FormControlLabel, IconButton, Switch, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FileCopy, GetApp, ImportExport, Search } from '@material-ui/icons';
import { lowerCase } from 'lodash';
import React, { useRef, useState } from 'react';
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  hiddenInput: {
    display: 'none',
  },
  pdfListCounter: {
    marginLeft: theme.spacing(1),
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
  const [pdfLists, setPdfLists] = useState<string[]>([]);
  const [activePdfListIndex, setActivePdfListIndex] = useState(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [includeChargedVersions, setIncludeChargedVersions] = useState(true);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfjsLibRef = useRef<any>(null);
  const dispatch = useDispatch();
  const matchPlay = useSelector(mergedBattletomesSelector);
  const rules = useSelector((state: IStore) => state.config.rules);
  const target = useSelector(getSanitizedTargetSelector);

  const normalizePdfCharacters = (value: string): string => value
    .replace(/\u00A0/g, ' ')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬅ/g, 'ft')
    .replace(/ﬆ/g, 'st')
    .replace(/[Ɵθ]/g, 'ti')
    .replace(/Ʃ/g, 'tt')
    .replace(/ƞ/g, 'tf');

  const normalizeBrokenLigatures = (value: string): string => {
    let normalized = value;
    let previousValue = '';

    while (normalized !== previousValue) {
      previousValue = normalized;
      normalized = normalized.replace(
        /([A-Za-z]{2,})\s+(ffi|ffl|ff|fi|fl|ft|st|ti|tt|tf)\s+([A-Za-z]{1,})/g,
        '$1$2$3',
      );
    }

    return normalized;
  };

  const normalizePdfExtractedText = (value: string): string =>
    normalizeBrokenLigatures(normalizePdfCharacters(value))
      .replace(/\s+/g, ' ')
      .trim();

  const sanitizeLine = (line: string): string => {
    // Remove bullet points
    let sanitized = normalizePdfExtractedText(line).replace(/^[\s•*-]+/, '').trim();
    
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

  const stripUnitCountPrefix = (value: string): string => value
    .replace(/^\s*\d+\s*[x×]\s*/i, '')
    .replace(/^\s*x\s*\d+\s*/i, '')
    .replace(/^\s*\d+\s+/, '')
    .trim();

  const normalizeForMatch = (value: string): string =>
    lowerCase(stripUnitCountPrefix(normalizePdfExtractedText(value))
      .replace(/ - .*/g, '')
      .replace(/,.*/g, '')
      .replace(/\(.*\)/g, '')
      .replace(/\[.*\]/g, '')
      .trim());

  const compactForMatch = (value: string): string => value.replace(/\s+/g, '');

  const isDirectMatch = (left: string, right: string): boolean =>
    left === right || left.includes(right) || right.includes(left);

  const levenshteinDistanceWithin = (source: string, target: string, maxDistance: number): number => {
    if (source === target) {
      return 0;
    }

    if (Math.abs(source.length - target.length) > maxDistance) {
      return maxDistance + 1;
    }

    let previousRow = Array.from({ length: target.length + 1 }, (_, index) => index);

    for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex++) {
      const currentRow = [sourceIndex];
      let minValueInRow = sourceIndex;

      for (let targetIndex = 1; targetIndex <= target.length; targetIndex++) {
        const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;
        const value = Math.min(
          previousRow[targetIndex] + 1,
          currentRow[targetIndex - 1] + 1,
          previousRow[targetIndex - 1] + substitutionCost,
        );
        currentRow[targetIndex] = value;
        if (value < minValueInRow) {
          minValueInRow = value;
        }
      }

      if (minValueInRow > maxDistance) {
        return maxDistance + 1;
      }

      previousRow = currentRow;
    }

    return previousRow[target.length];
  };

  const isTolerantMatch = (left: string, right: string): boolean => {
    if (!left || !right) {
      return false;
    }

    if (isDirectMatch(left, right)) {
      return true;
    }

    const compactLeft = compactForMatch(left);
    const compactRight = compactForMatch(right);

    if (!compactLeft || !compactRight) {
      return false;
    }

    if (isDirectMatch(compactLeft, compactRight)) {
      return true;
    }

    const minLength = Math.min(compactLeft.length, compactRight.length);
    if (minLength < 8) {
      return false;
    }

    const maxLength = Math.max(compactLeft.length, compactRight.length);
    const maxDistance = Math.min(3, Math.max(1, Math.floor(maxLength * 0.12)));
    return levenshteinDistanceWithin(compactLeft, compactRight, maxDistance) <= maxDistance;
  };

  const extractRulesForLine = (searchText: string, rulesText: string): string | null => {
    const normalizedSearchText = normalizeForMatch(searchText);
    if (!normalizedSearchText || normalizedSearchText.length < 2) return null;
    
    const lines = rulesText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const sectionTitleMatch = line.match(/^###\s+(.+)$/);
      if (!sectionTitleMatch) {
        continue;
      }
      const sectionTitle = sectionTitleMatch[1]?.trim() ?? '';
      const normalizedSectionTitle = normalizeForMatch(sectionTitle);
      
      // Check if this section title matches our search pattern
      if (isTolerantMatch(normalizedSectionTitle, normalizedSearchText)) {
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

  const getRuleSearchCandidates = (line: string): string[] => {
    const sanitized = sanitizeLine(line);
    if (!sanitized) {
      return [];
    }

    const splitCandidates = sanitized
      .split(/[:|,\\/]/g)
      .map((candidate) => candidate.trim())
      .filter((candidate) => candidate.length > 1);

    const allCandidates = [sanitized, ...splitCandidates]
      .flatMap((candidate) => [candidate, stripUnitCountPrefix(candidate)])
      .map((candidate) => candidate.replace(/\s+/g, ' ').trim())
      .filter((candidate) => candidate.length > 1);

    const seen = new Set<string>();
    return allCandidates.filter((candidate) => {
      const normalized = candidate.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  };

  const unitNameForMatch = (name: string): string => normalizeForMatch(name);

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
    const normalizedLine = normalizeForMatch(sanitizedLine);
    if (!normalizedLine) {
      return null;
    }
    const allUnits = matchPlay.flatMap((army) => army.units);
    const sortedCandidates = [...allUnits]
      .map((unit) => ({ unit, normalizedUnitName: unitNameForMatch(unit.name) }))
      .sort((a, b) => b.normalizedUnitName.length - a.normalizedUnitName.length);

    const directMatch = sortedCandidates.find(({ normalizedUnitName }) => isDirectMatch(normalizedLine, normalizedUnitName));
    if (directMatch) {
      return directMatch.unit;
    }

    const tolerantMatch = sortedCandidates.find(({ normalizedUnitName }) => isTolerantMatch(normalizedLine, normalizedUnitName));
    return tolerantMatch?.unit ?? null;
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

  const getUnitsFromArmyList = (armyListText: string, includeCharged: boolean): IUnitParameter[] => {
    const lines = armyListText.split('\n');
    return lines.flatMap((line, index) => getUnitsForLine(line, lines[index + 1] ?? '', includeCharged));
  };

  const getPdfJsLib = async (): Promise<any> => {
    if (pdfjsLibRef.current) {
      return pdfjsLibRef.current;
    }

    const [pdfjsLib] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf'),
    ]);

    const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${publicUrl}/pdf.worker.min.js`;
    pdfjsLibRef.current = pdfjsLib;
    return pdfjsLib;
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
          return;
        }
        reject(new Error('Unable to read file'));
      };
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsArrayBuffer(file);
    });

  const extractTextFromPdfPage = async (page: any): Promise<string> => {
    const textContent = await page.getTextContent();
    const positionedItems = (textContent.items ?? [])
      .filter((item: any) => typeof item.str === 'string' && item.str.trim().length > 0)
      .map((item: any) => ({
        text: normalizePdfCharacters(item.str).trim(),
        x: Array.isArray(item.transform) ? Number(item.transform[4]) || 0 : 0,
        y: Array.isArray(item.transform) ? Number(item.transform[5]) || 0 : 0,
        hasEOL: Boolean(item.hasEOL),
      }));

    if (positionedItems.length === 0) {
      return '';
    }

    const sortedItems = [...positionedItems].sort((left, right) => {
      const yDifference = right.y - left.y;
      if (Math.abs(yDifference) > 2) {
        return yDifference;
      }
      return left.x - right.x;
    });

    const lines: string[] = [];
    let currentY = sortedItems[0].y;
    let currentLine: Array<{ text: string; x: number }> = [];

    const flushLine = () => {
      if (currentLine.length === 0) {
        return;
      }
      const lineText = normalizePdfExtractedText([...currentLine]
        .sort((left, right) => left.x - right.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim());
      if (lineText) {
        lines.push(lineText);
      }
      currentLine = [];
    };

    sortedItems.forEach((item) => {
      if (Math.abs(item.y - currentY) > 2) {
        flushLine();
        currentY = item.y;
      }

      currentLine.push({ text: item.text, x: item.x });

      if (item.hasEOL) {
        flushLine();
      }
    });

    flushLine();

    return lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const extractListsFromPdf = async (file: File): Promise<string[]> => {
    const pdfjsLib = await getPdfJsLib();
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });
    const pdfDocument = await loadingTask.promise;

    const extractedLists: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const pageText = await extractTextFromPdfPage(page);
      if (pageText.length > 0) {
        extractedLists.push(pageText);
      }
    }

    return extractedLists;
  };

  const applyPdfListAtIndex = (index: number) => {
    if (index < 0 || index >= pdfLists.length) {
      return;
    }

    setActivePdfListIndex(index);
    setArmyList(pdfLists[index]);
    setExtractedRules('');
  };

  const onGoToPreviousPdfList = () => applyPdfListAtIndex(activePdfListIndex - 1);

  const onGoToNextPdfList = () => applyPdfListAtIndex(activePdfListIndex + 1);

  const onUploadPdfLists = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.currentTarget;
    const [file] = inputElement.files ?? [];
    if (!file) {
      return;
    }

    try {
      setIsPdfLoading(true);
      const extractedLists = await extractListsFromPdf(file);

      if (extractedLists.length === 0) {
        setPdfLists([]);
        setActivePdfListIndex(0);
        dispatch(
          notificationsStore.actions.addNotification({
            message: 'No list text could be extracted from this PDF',
            variant: 'warning',
          }),
        );
        return;
      }

      setPdfLists(extractedLists);
      setActivePdfListIndex(0);
      setArmyList(extractedLists[0]);
      setExtractedRules('');

      dispatch(
        notificationsStore.actions.addNotification({
          message: `Loaded ${extractedLists.length} list${extractedLists.length > 1 ? 's' : ''} from PDF`,
          variant: 'success',
        }),
      );
    } catch {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Could not extract lists from PDF',
          variant: 'error',
        }),
      );
    } finally {
      setIsPdfLoading(false);
      inputElement.value = '';
    }
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
      units: getUnitsFromArmyList(armyList, includeChargedVersions),
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

  const buildListAnalysisOutput = (listText: string) => {
    const lines = listText.split('\n');
    const foundRules: string[] = [];
    const foundRulesSet = new Set<string>(); // For deduplication
    const unitsForAnalysis: IUnitParameter[] = getUnitsFromArmyList(listText, includeChargedVersions);
    let matchCount = 0;

    lines.forEach((line) => {
      if (!rules) {
        return;
      }

      const ruleSearchCandidates = getRuleSearchCandidates(line);
      ruleSearchCandidates.forEach((candidate) => {
        const extractedRule = extractRulesForLine(candidate, rules);
        if (extractedRule && !foundRulesSet.has(extractedRule)) {
          foundRules.push(extractedRule);
          foundRulesSet.add(extractedRule);
          matchCount++;
        }
      });
    });

    const analysisTable = buildAnalysisTables(unitsForAnalysis);

    const sections = [listText];
    if (analysisTable) {
      sections.push(`List analysis:\n${analysisTable}`);
    }
    if (foundRules.length > 0) {
      sections.push(`The following rules apply to this list:\n\n${foundRules.join('\n\n')}`);
    }

    return {
      outputText: sections.join('\n\n'),
      foundRulesCount: foundRules.length,
      matchCount,
    };
  };

  const notifyRulesExtractionResult = (foundRulesCount: number, matchCount: number) => {
    if (foundRulesCount > 0) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: `Found ${matchCount} matching rule${matchCount > 1 ? 's' : ''}`,
          variant: 'success',
        }),
      );
      return;
    }

    dispatch(
      notificationsStore.actions.addNotification({
        message: rules ? 'No matching rules found' : 'List analyzed',
        variant: 'info',
      }),
    );
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

    const analysisOutput = buildListAnalysisOutput(armyList);
    setExtractedRules(analysisOutput.outputText);
    notifyRulesExtractionResult(analysisOutput.foundRulesCount, analysisOutput.matchCount);
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

  const removeControlCharacters = (value: string): string =>
    Array.from(value).filter((character) => character.charCodeAt(0) >= 32).join('');

  const sanitizeFilename = (value: string): string => removeControlCharacters(value)
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120);

  const stripArmyPointsPrefix = (value: string): string => value
    .replace(/^\s*\d+\s*\/\s*\d+\s*(?:pts?|points?)?\s*/i, '')
    .trim();

  const stripListBulletPrefix = (value: string): string => value
    .replace(/^\s*[•*-]+\s*/, '')
    .trim();

  const getListAnalysisFilename = (listText: string): string => {
    const firstNonEmptyLine = listText
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? 'list-analysis';
    const lineWithoutBulletPrefix = stripListBulletPrefix(firstNonEmptyLine) || firstNonEmptyLine;
    const lineWithoutPointsPrefix = stripArmyPointsPrefix(lineWithoutBulletPrefix) || lineWithoutBulletPrefix;
    return sanitizeFilename(lineWithoutPointsPrefix) || 'list-analysis';
  };

  const downloadAnalysisText = (analysisText: string, listText: string) => {
    if (!analysisText) {
      return;
    }

    const filename = getListAnalysisFilename(listText);

    const analysisBlob = new Blob([analysisText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(analysisBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Analysis downloaded',
        variant: 'success',
      }),
    );
  };

  const downloadAnalysis = () => {
    if (!extractedRules) {
      return;
    }

    downloadAnalysisText(extractedRules, armyList);
  };

  const onAnalyzeDownloadAndNext = () => {
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

    const analysisOutput = buildListAnalysisOutput(armyList);
    setExtractedRules(analysisOutput.outputText);
    notifyRulesExtractionResult(analysisOutput.foundRulesCount, analysisOutput.matchCount);
    downloadAnalysisText(analysisOutput.outputText, armyList);

    if (pdfLists.length > 0 && activePdfListIndex < pdfLists.length - 1) {
      applyPdfListAtIndex(activePdfListIndex + 1);
      return;
    }

    if (pdfLists.length > 0) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Reached last PDF list',
          variant: 'info',
        }),
      );
    }
  };

  return (
    <div className={classes.root}>
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className={classes.hiddenInput}
        onChange={onUploadPdfLists}
      />
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
          Import this list to current player
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
        <Button
          variant="outlined"
          component="span"
          onClick={() => pdfInputRef.current?.click()}
          disabled={isPdfLoading}
        >
          {isPdfLoading ? 'Loading PDF lists...' : 'Load lists from PDF'}
        </Button>
        {pdfLists.length > 0 && (
          <>
            {rules && (
              <Button
                variant="contained"
                color="secondary"
                component="span"
                onClick={onAnalyzeDownloadAndNext}
                disabled={isPdfLoading}
              >
                Analyze + Download + Next
              </Button>
            )}
            <Button
              variant="outlined"
              component="span"
              onClick={onGoToPreviousPdfList}
              disabled={activePdfListIndex === 0 || isPdfLoading}
            >
              Previous list
            </Button>
            <Button
              variant="outlined"
              component="span"
              onClick={onGoToNextPdfList}
              disabled={activePdfListIndex >= pdfLists.length - 1 || isPdfLoading}
            >
              Next list
            </Button>
            <Typography variant="caption" className={classes.pdfListCounter}>
              {`PDF list ${activePdfListIndex + 1}/${pdfLists.length}`}
            </Typography>
          </>
        )}
      </div>
      
      {extractedRules && (
        <div className={classes.extractedRulesContainer}>
          <div className={classes.extractedRulesHeader}>
            <Typography variant="h6">Analysis</Typography>
            <div>
              <IconButton onClick={downloadAnalysis} size="small" title="Download as .txt">
                <GetApp />
              </IconButton>
              <IconButton onClick={copyToClipboard} size="small" title="Copy to clipboard">
                <FileCopy />
              </IconButton>
            </div>
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

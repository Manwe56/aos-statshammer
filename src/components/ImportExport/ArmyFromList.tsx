import { Button, FormControlLabel, IconButton, Paper, Switch, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FileCopy, GetApp, ImportExport, Search } from '@material-ui/icons';
import { lowerCase } from 'lodash';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StatsController from 'api/core/controllers/statsController';
import { getSanitizedTargetSelector, sortedBattletomesSelector } from 'store/selectors';
import { configStore, notificationsStore } from 'store/slices';
import { Faction, IArmy } from 'types/army';
import type { IListAnalysisPlayerStore, IStore, TPlayerSide } from 'types/store';
import type { IModifierInstanceParameter } from 'types/modifiers';
import type { IUnitParameter, IWeaponProfileParameter } from 'types/unit';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  tabs: {
    marginTop: theme.spacing(1),
  },
  tabPanel: {
    paddingTop: theme.spacing(2),
  },
  playerHeader: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  emptyState: {
    padding: theme.spacing(3, 2),
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
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
  analysisContainer: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  analysisHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  analysisText: {
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

const EMPTY_PLAYER_ANALYSIS_STATE: IListAnalysisPlayerStore = {
  armyListText: '',
  analysisText: '',
};

const TAB_LIST_INPUT = 'list-input';
const TAB_ANALYSIS = 'analysis';
const REINFORCED_NAME_SUFFIX = ' [R]';

type ListAnalysisTab = typeof TAB_LIST_INPUT | typeof TAB_ANALYSIS;

const getTabA11yProps = (tab: ListAnalysisTab) => ({
  id: `army-list-tab-${tab}`,
  'aria-controls': `army-list-tabpanel-${tab}`,
});

interface IArmyFromListProps {
  onLoadArmyFromList: (ArmyFromList: IArmy) => void;
  activePlayer: TPlayerSide;
  onSwitchPlayer: () => void;
}

const ArmyFromList = ({ onLoadArmyFromList, activePlayer, onSwitchPlayer }: IArmyFromListProps) => {
  const classes = useStyles();
  const [pdfLists, setPdfLists] = useState<string[]>([]);
  const [activePdfListIndex, setActivePdfListIndex] = useState(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [includeChargedVersions, setIncludeChargedVersions] = useState(true);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfjsLibRef = useRef<any>(null);
  const dispatch = useDispatch();
  const battletomes = useSelector(sortedBattletomesSelector);
  const listAnalysisByPlayer = useSelector((state: IStore) => state.config.listAnalysisByPlayer);
  const target = useSelector(getSanitizedTargetSelector);
  const [activeTab, setActiveTab] = useState<ListAnalysisTab>(TAB_LIST_INPUT);
  const currentPlayerAnalysis = listAnalysisByPlayer[activePlayer] || EMPTY_PLAYER_ANALYSIS_STATE;
  const armyList = currentPlayerAnalysis.armyListText;
  const legacyRulesMarker = '\n\nThe following rules apply to this list:\n\n';
  const legacyRulesIndex = currentPlayerAnalysis.analysisText.lastIndexOf(legacyRulesMarker);
  const analysisText = legacyRulesIndex >= armyList.length
    ? currentPlayerAnalysis.analysisText.slice(0, legacyRulesIndex)
    : currentPlayerAnalysis.analysisText;

  const setArmyList = (importedArmyListText: string) => {
    dispatch(configStore.actions.updatePlayerArmyListText({ player: activePlayer, importedArmyListText }));
  };

  const setAnalysisText = (importedListAnalysisText: string) => {
    dispatch(configStore.actions.updatePlayerListAnalysisText({ player: activePlayer, importedListAnalysisText }));
  };

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
    const allUnits = battletomes.flatMap((army) => army.units);
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
    return battletomes
      .flatMap((army) => army.units)
      .filter((candidate) => candidate.name !== unit.name)
      .filter((candidate) => unitNameForMatch(candidate.name) === normalizedName)
      .filter((candidate) => isChargedVariantName(candidate.name));
  };

  const getRegularSiblingUnits = (unit: IUnitParameter): IUnitParameter[] => {
    const normalizedName = unitNameForMatch(unit.name);
    return battletomes
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

  const withUnitOccurrenceSuffix = (units: IUnitParameter[]): IUnitParameter[] => {
    const occurrences = new Map<string, number>();

    return units.map((unit) => {
      const unitName = unit.name.trim();
      const hasReinforcedSuffix = unitName.endsWith(REINFORCED_NAME_SUFFIX);
      const baseName = hasReinforcedSuffix
        ? unitName.slice(0, -REINFORCED_NAME_SUFFIX.length).trimEnd()
        : unitName;
      const occurrenceKey = unitName;
      const nextOccurrence = (occurrences.get(occurrenceKey) ?? 0) + 1;
      occurrences.set(occurrenceKey, nextOccurrence);

      return {
        ...unit,
        name: `${baseName} #${nextOccurrence}${hasReinforcedSuffix ? REINFORCED_NAME_SUFFIX : ''}`,
      };
    });
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
    setAnalysisText('');
    setActiveTab(TAB_LIST_INPUT);
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
        setAnalysisText('');
        setActiveTab(TAB_LIST_INPUT);
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
      setAnalysisText('');
      setActiveTab(TAB_LIST_INPUT);

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

    const importedUnits = withUnitOccurrenceSuffix(getUnitsFromArmyList(armyList, includeChargedVersions));

    const armyUnits: IArmy = {
      faction: Faction.List,
      label: '',
      units: importedUnits,
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

  const onClearArmyList = () => {
    if (!armyList && !analysisText) {
      return;
    }

    setArmyList('');
    setAnalysisText('');
    setActiveTab(TAB_LIST_INPUT);

    dispatch(
      notificationsStore.actions.addNotification({
        message: 'Army list cleared',
        variant: 'info',
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
    const uniquelyNamedUnits = withUnitOccurrenceSuffix(unitsForAnalysis);
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
    const unitsForAnalysis: IUnitParameter[] = getUnitsFromArmyList(listText, includeChargedVersions);
    const analysisTable = buildAnalysisTables(unitsForAnalysis);
    const sections = [listText];
    if (analysisTable) {
      sections.push(`List analysis:\n${analysisTable}`);
    }
    return sections.join('\n\n');
  };

  const notifyAnalysisResult = () => {
    dispatch(
      notificationsStore.actions.addNotification({
        message: 'List analyzed',
        variant: 'info',
      }),
    );
  };

  const onAnalyzeList = () => {
    if (!armyList) {
      dispatch(
        notificationsStore.actions.addNotification({
          message: 'Please provide an army list',
          variant: 'warning',
        }),
      );
      return;
    }

    setAnalysisText(buildListAnalysisOutput(armyList));
    setActiveTab(TAB_ANALYSIS);
    notifyAnalysisResult();
  };

  const copyToClipboard = () => {
    if (analysisText) {
      navigator.clipboard.writeText(analysisText).then(
        () => {
          dispatch(
            notificationsStore.actions.addNotification({
              message: 'Analysis copied to clipboard',
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
    if (!analysisText) {
      return;
    }

    downloadAnalysisText(analysisText, armyList);
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

    const analysisOutput = buildListAnalysisOutput(armyList);
    setAnalysisText(analysisOutput);
    setActiveTab(TAB_ANALYSIS);
    notifyAnalysisResult();
    downloadAnalysisText(analysisOutput, armyList);

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
      <div className={classes.playerHeader}>
        <Typography variant="subtitle1">{`Player context: ${activePlayer}`}</Typography>
        <Button variant="outlined" size="small" onClick={onSwitchPlayer}>
          {`Switch to ${activePlayer === 'Self' ? 'Opponent' : 'Self'}`}
        </Button>
      </div>
      {battletomes.length === 0 && (
        <Typography variant="body2" color="textSecondary">
          No battletomes are saved. Create or import one in Import/Export to match units in a list.
        </Typography>
      )}
      <Paper square className={classes.tabs}>
        <Tabs
          value={activeTab}
          indicatorColor="primary"
          textColor="primary"
          onChange={(_event, nextTab) => setActiveTab(nextTab as ListAnalysisTab)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="List" value={TAB_LIST_INPUT} {...getTabA11yProps(TAB_LIST_INPUT)} />
          <Tab label="Analysis" value={TAB_ANALYSIS} {...getTabA11yProps(TAB_ANALYSIS)} />
        </Tabs>
      </Paper>

      <div
        role="tabpanel"
        hidden={activeTab !== TAB_LIST_INPUT}
        id={`army-list-tabpanel-${TAB_LIST_INPUT}`}
        aria-labelledby={`army-list-tab-${TAB_LIST_INPUT}`}
        className={classes.tabPanel}
      >
        {activeTab === TAB_LIST_INPUT && (
          <>
            <TextField
              id="army-list-input"
              label="army list"
              placeholder="copy paste your army list here"
              multiline
              fullWidth
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
                {`Import this list to ${activePlayer}`}
              </Button>
              <Button
                variant="outlined"
                component="span"
                onClick={onClearArmyList}
                disabled={!armyList && !analysisText}
              >
                Clear list
              </Button>
              <Button
                variant="outlined"
                startIcon={<Search />}
                color="secondary"
                component="span"
                onClick={onAnalyzeList}
              >
                Analyze list
              </Button>
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
                  <Button
                    variant="contained"
                    color="secondary"
                    component="span"
                    onClick={onAnalyzeDownloadAndNext}
                    disabled={isPdfLoading}
                  >
                    Analyze + Download + Next
                  </Button>
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
          </>
        )}
      </div>

      <div
        role="tabpanel"
        hidden={activeTab !== TAB_ANALYSIS}
        id={`army-list-tabpanel-${TAB_ANALYSIS}`}
        aria-labelledby={`army-list-tab-${TAB_ANALYSIS}`}
        className={classes.tabPanel}
      >
        {activeTab === TAB_ANALYSIS && (
          <>
            {analysisText ? (
              <div className={classes.analysisContainer}>
                <div className={classes.analysisHeader}>
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
                <div className={classes.analysisText}>
                  {analysisText}
                </div>
              </div>
            ) : (
              <div className={classes.emptyState}>
                <Typography variant="body2" color="textSecondary">
                  Run "Analyze list" to view the generated analysis here.
                </Typography>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default ArmyFromList;

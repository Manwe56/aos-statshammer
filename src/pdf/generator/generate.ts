/* eslint-disable no-underscore-dangle */

import { getFormattedDescription } from 'components/ModifierItem/ModifierDescription';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import store from 'store';
import { ISanitizedUnit, modifierByIdSelector, targetModifierByIdSelector } from 'store/selectors';
import type { IModifierInstanceParameter } from 'types/modifiers';
import type { IJsPDF } from 'types/pdf';
import type { TResult } from 'types/stats';
import type { ITargetStore } from 'types/store';

import cursor from './cursor';
import {
  addGraphs,
  addHeader,
  addHR,
  addPage,
  addSubHeader,
  headerColor,
  margin,
  sectionHeaderColor,
} from './pdfUtils';

const sanitizeLine = (line: string): string => {
  let sanitized = line.replace(/^[\s•*-]+/, '').trim();
  const dashIndex = sanitized.indexOf(' - ');
  if (dashIndex !== -1) {
    sanitized = sanitized.substring(dashIndex + 3).trim();
  }
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
    if (line === searchPattern || line.toLowerCase() === searchPattern.toLowerCase()) {
      const sectionLines = [lines[i]];
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
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

type TRuleSection = {
  title: string;
  content: string;
};

const getRulesForList = (armyListText: string, rulesText: string): TRuleSection[] => {
  if (!armyListText || !rulesText) {
    return [];
  }

  const foundRules: TRuleSection[] = [];
  const foundRulesSet = new Set<string>();
  armyListText.split('\n').forEach((line) => {
    const sanitized = sanitizeLine(line);
    if (!sanitized) {
      return;
    }
    const extractedRule = extractRulesForLine(sanitized, rulesText);
    if (!extractedRule || foundRulesSet.has(extractedRule)) {
      return;
    }

    const sectionLines = extractedRule.split('\n');
    const sectionTitle = sectionLines[0].replace(/^###\s*/, '').trim();
    const sectionContent = sectionLines.slice(1).join('\n').trim() || '-';
    foundRules.push({ title: sectionTitle, content: sectionContent });
    foundRulesSet.add(extractedRule);
  });

  return foundRules;
};

const getModifierItems = (modifiers: IModifierInstanceParameter[], isTarget = false): RowInput[] => {
  const state = store.getState();
  const getModifierById = modifierByIdSelector(state);
  const getTargetModifierById = targetModifierByIdSelector(state);
  const modifierItems = modifiers
    .map(({ id, options }) => {
      const definition = isTarget ? getTargetModifierById(id) : getModifierById(id);
      if (definition) {
        const content = `${definition.name}:\n\t${getFormattedDescription(definition, options, false)}`;
        return [{ content, colSpan: 6 }];
      }
      return null;
    })
    .filter((item) => item);
  if (modifierItems) {
    return [
      [
        {
          content: 'Modifiers',
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'bold', fillColor: sectionHeaderColor, textColor: 20 },
        },
      ],
      ...modifierItems,
    ] as RowInput[];
  }
  return [];
};

const generateUnits = (doc: IJsPDF, units: ISanitizedUnit[]) => {
  addSubHeader(doc, 'Units');
  units.forEach(({ name, weapon_profiles }) => {
    weapon_profiles.forEach((profile, index) => {
      const profileName = profile.name || 'Weapon Profile';
      const { num_models, attacks, to_hit, to_wound, rend, damage } = profile;
      let body = [[num_models, attacks, `${to_hit}+`, `${to_wound}+`, rend, damage]];

      if (profile.modifiers && profile.modifiers.length) {
        const modifierItems = getModifierItems(profile.modifiers);
        body = [...body, ...modifierItems] as (string | number)[][];
      }

      let head: RowInput[] = [
        [{ content: profileName, colSpan: 6, styles: { halign: 'center' } }],
        ['# Models', 'Attacks', 'To Hit', 'To Wound', 'Rend', 'Damage'],
      ];
      if (index === 0) {
        const headStyle = {
          halign: 'center',
          fontStyle: 'bold',
          fillColor: null,
          textColor: 20,
          fontSize: 12,
        };
        head = [[{ content: name, colSpan: 6, styles: headStyle }], ...head] as RowInput[];
      }

      autoTable(doc, {
        startY: cursor.pos,
        head,
        body,
        headStyles: { fillColor: headerColor },
        columnStyles: {
          0: { cellWidth: 85 },
          1: { cellWidth: 85 },
          2: { cellWidth: 85 },
          3: { cellWidth: 85 },
          4: { cellWidth: 85 },
          5: { cellWidth: 85 },
        },
        pageBreak: 'avoid',
        theme: 'grid',
      });
      cursor.pos = doc.previousAutoTable.finalY;
      cursor.incr(doc.internal.getLineHeight() - 5);
    });
    cursor.incr(20);
  });
  addHR(doc);
  cursor.incr(10);
};

const generateTarget = (doc: IJsPDF, target: ITargetStore) => {
  addSubHeader(doc, 'Target');
  const head: RowInput[] = [[{ content: 'Target', colSpan: 6, styles: { halign: 'center' } }]];
  const body = [...getModifierItems(target.modifiers, true)] as RowInput[];
  autoTable(doc, {
    startY: cursor.pos,
    head,
    body,
    headStyles: { fillColor: headerColor },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 85 },
      2: { cellWidth: 85 },
      3: { cellWidth: 85 },
      4: { cellWidth: 85 },
      5: { cellWidth: 85 },
    },
    pageBreak: 'avoid',
    theme: 'grid',
  });
  cursor.pos = doc.previousAutoTable.finalY;
  cursor.incr(doc.internal.getLineHeight() - 5);
  cursor.incr(20);
  addHR(doc);
  cursor.incr(10);
};

const generateStatsTable = (doc: IJsPDF, results: TResult[], unitNames: string[], per100Points: boolean) => {
  const body = unitNames.map((name) =>
    results.reduce<(string | number)[]>((acc, { save, ...results }) => [...acc, results[name]], [name]),
  );

  autoTable(doc, {
    startY: cursor.pos,
    head: [
      [
        {
          content: `Average Damage Table ${per100Points ? 'per 100 points' : ''}`,
          colSpan: 7,
          styles: { halign: 'center' },
        },
      ],
      ['Unit Name', ...results.map(({ save }) => (save !== 0 ? `${save}+` : '-'))],
    ],
    body,
    headStyles: { fillColor: headerColor },
    columnStyles: {
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
      5: { cellWidth: 40 },
      6: { cellWidth: 40 },
    },
    pageBreak: 'avoid',
    theme: 'grid',
  });
  cursor.pos = doc.previousAutoTable.finalY;
  cursor.incr(20);
};

const generateImportedListPage = (doc: IJsPDF, importedArmyListText: string) => {
  const listLines = importedArmyListText.split('\n').map((line) => line.trimEnd());

  if (listLines.every((line) => line.length === 0)) {
    return;
  }

  addHeader(doc, 'AoS Statshammer V4 Report');
  addSubHeader(doc, 'Imported Army List');
  cursor.incr(8);

  doc.setFontSize(11);
  const lineHeight = 14;
  const maxTextWidth = doc.internal.pageSize.getWidth() - margin * 2;

  listLines.forEach((line) => {
    const textLines = line.length > 0 ? doc.splitTextToSize(line, maxTextWidth) : [''];
    textLines.forEach((textLine) => {
      const bottomLimit = doc.internal.pageSize.getHeight() - margin;
      if (cursor.pos + lineHeight > bottomLimit) {
        addPage(doc);
        cursor.incr(20);
      }
      doc.text(textLine, margin, cursor.pos);
      cursor.incr(lineHeight);
    });
  });

  doc.setFontSize(12);
  cursor.incr(12);
  addHR(doc);
};

const generateRulesSectionPage = (doc: IJsPDF, importedArmyListText: string, rulesText: string) => {
  const rulesForList = getRulesForList(importedArmyListText, rulesText);
  if (rulesForList.length === 0) {
    return;
  }

  addPage(doc);
  cursor.incr(20);
  addSubHeader(doc, 'This list uses the following rules');
  cursor.incr(8);

  autoTable(doc, {
    startY: cursor.pos,
    head: [['Rule', 'Description']],
    body: rulesForList.map((rule) => [rule.title, rule.content]),
    headStyles: { fillColor: headerColor },
    alternateRowStyles: { fillColor: [246, 248, 255] },
    styles: { overflow: 'linebreak', valign: 'top' },
    columnStyles: {
      0: { cellWidth: 170, fontStyle: 'bold' },
      1: { cellWidth: 355 },
    },
    theme: 'grid',
  });
};

const generate = async (
  units: ISanitizedUnit[],
  target: ITargetStore,
  results: TResult[],
  unitNames: string[],
  per100points: boolean,
  statsClassName: string,
  cumulativeClassName: string,
  probabilitiesClassName: string,
  importedArmyListText = '',
  rulesText = '',
) => {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF('p', 'pt', 'a4') as IJsPDF;
  doc.setProperties({
    title: 'AoS Statshammer V4 Report',
  });
  cursor.reset();
  cursor.incr(20);
  generateImportedListPage(doc, importedArmyListText);
  if (!importedArmyListText || importedArmyListText.trim().length === 0) {
    addHeader(doc, 'AoS Statshammer V4 Report');
  } else {
    addPage(doc);
    cursor.incr(20);
    addHeader(doc, 'AoS Statshammer V4 Report');
  }
  generateUnits(doc, units);
  if (target && target.modifiers && target.modifiers.length) {
    generateTarget(doc, target);
  }
  doc.setFontSize(9);
  doc.setFontType('italic');
  doc.text('Turn to next page for results', doc.internal.pageSize.getWidth() - margin * 2, cursor.pos, {
    align: 'right',
  });
  doc.setFontType('normal');
  doc.setFontSize(12);

  addPage(doc);
  cursor.incr(20);
  addSubHeader(doc, 'Results');

  generateStatsTable(doc, results, unitNames, per100points);

  await addGraphs(doc, statsClassName);
  addPage(doc);
  cursor.incr(20);
  doc.setFontSize(14);
  addSubHeader(doc, 'Kill Probabilities');
  cursor.incr(10);
  await addGraphs(doc, cumulativeClassName);
  addPage(doc);
  cursor.incr(20);
  addSubHeader(doc, 'Probabilities');
  cursor.incr(10);
  await addGraphs(doc, probabilitiesClassName);
  generateRulesSectionPage(doc, importedArmyListText, rulesText);
  return doc;
};

export default generate;

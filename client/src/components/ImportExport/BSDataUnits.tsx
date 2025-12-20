import { Button } from '@material-ui/core';
import { ImportExport } from '@material-ui/icons';
import { nanoid } from 'nanoid';
import React from 'react';
import { notificationsStore } from 'store/slices';
import { Faction } from 'types/army';
import { IModifierInstance, IModifierInstanceParameter } from 'types/modifiers';
import { IUnitParameter, IWeaponProfileParameter } from 'types/unit';

interface IBSDataUnitsProps {
  onLoadBSDataUnits: (units: IUnitParameter[], faction: Faction) => void;
}

const BSDataUnits = ({ onLoadBSDataUnits }: IBSDataUnitsProps) => {
  const githubRawPrefix = 'https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main/';
  const costSuffix = '.cat';
  const librarySuffix = '%20-%20Library.cat';

  const getDirectChild = (element: Element, tagName: string): Element => {
    return element.childNodes
      .values()
      .filter((c) => c.nodeType === c.ELEMENT_NODE)
      .filter((c) => (c as Element).tagName === tagName)
      .toArray()[0] as Element;
  };

  const hasChild = (element: Element, tag: string, attribute: string, attributeValue: string): boolean => {
    const match = element
      .querySelectorAll(tag)
      .entries()
      .filter((entry) => entry[1].getAttribute(attribute) === attributeValue)
      .map((entry) => entry[1])
      .toArray();
    return match.length > 0;
  };

  const findNode = (
    element: Element,
    tag: string,
    attribute: string,
    attributeValue: string,
    unitName: string,
    logError = true,
  ): Element | undefined => {
    const match = element
      .querySelectorAll(tag)
      .entries()
      .filter((entry) => entry[1].getAttribute(attribute) === attributeValue)
      .map((entry) => entry[1])
      .toArray();
    if (match.length === 0) {
      if (logError) {
        console.log(
          `Unable to find attribute ${attribute} with value ${attributeValue} for unit ${unitName}`,
        );
      }
      return undefined;
    }
    return match[0];
  };

  const findNodeValue = (
    element: Element,
    tag: string,
    attribute: string,
    attributeValue: string,
    unitName: string,
  ): string => {
    return findNode(element, tag, attribute, attributeValue, unitName)?.textContent?.trim() || '';
  };

  const readDefaultAmount = (node: Element): number[] | undefined => {
    const defaultAmountString = node.getAttribute('defaultAmount');
    if (!defaultAmountString) {
      return undefined;
    }
    return defaultAmountString.split(',').map((s) => Number(s));
  };

  const readUnitFromNode = (
    element: Element,
    costs: Map<string, number>,
    faction: string,
    canBeReinforced,
  ): IUnitParameter[] => {
    const name = element.getAttribute('name') || '';

    const health = Number(findNodeValue(element, 'characteristic', 'name', 'Health', name));
    const save = Number(findNodeValue(element, 'characteristic', 'name', 'Save', name).replace('+', ''));
    const points = costs.get(name) || 1000;
    const reinforced = canBeReinforced.get(name) || false;
    const modifiers: IModifierInstanceParameter[] = [];
    const champion = element.querySelectorAll('categoryLink[name="CHAMPION"]').length > 0;
    const ward = element.querySelectorAll('categoryLink[name^="WARD"]');
    if (ward.length > 0) {
      const wardOn = Number(ward[0].getAttribute('name')?.replace('WARD (', '').replace('+)', ''));
      modifiers.push({ id: 'TARGET_FNP', active: true, options: { on: wardOn } });
    }

    // Ethreal for Nighthaunt and a list of hardcoded units...
    const ethrealUnits = ["Be'lakor", 'Jade Obelisk', 'The Light of Eltharion'];
    const ethereal =
      element.querySelectorAll('categoryLink[name="NIGHTHAUNT"]').length > 0 ||
      ethrealUnits.findIndex((u) => u === name) >= 0;
    if (ethereal) {
      modifiers.push({ id: 'TARGET_ETHEREAL', active: true, options: {} });
    }

    let modelNodes = element.querySelectorAll('selectionEntry[type="model"]').values().toArray();

    if (modelNodes.length === 0) {
      console.log(`Faction: ${faction}: model node not found for unit ${name}`);
      const modelNode = findNode(element, 'selectionEntry', 'name', name, name, true);
      if (modelNode === undefined) {
        console.log(`Faction: ${faction}: no valid definition node for unit ${name}`);
        return [];
      }
      modelNodes = [modelNode];
    }

    const readModelNode = (modelNode: Element) => {
      const modelDefaultAmounts = readDefaultAmount(modelNode);
      const constraintsNode = getDirectChild(modelNode, 'constraints');
      const modelMinCount = Number(
        findNode(constraintsNode, 'constraint', 'type', 'min', name)?.getAttribute('value'),
      );
      const models = modelDefaultAmounts ? modelDefaultAmounts.reduce((a, b) => a + b) : modelMinCount;

      const selectionEntriesNode = getDirectChild(modelNode, 'selectionEntries');
      const selectionEntryWarGearNode = findNode(
        modelNode,
        'selectionEntryGroup',
        'name',
        'Wargear Options',
        name,
        false,
      );

      const elementToWeapons = (selectionEntry: Element): IWeaponProfileParameter[] => {
        const profiles = selectionEntry.querySelectorAll('profile');
        if (profiles.length === 0) {
          // console.log(`no profile found for unit ${name} with entry ${selectionEntry.getAttribute('name')}`);
          return [];
        }

        const elementToWeapon = (profile: Element): IWeaponProfileParameter | undefined => {
          let weaponName = profile.getAttribute('name') || 'Unknown weapon';
          let active = true;

          const typeName = profile.getAttribute('typeName');
          if (typeName !== 'Melee Weapon' && typeName !== 'Ranged Weapon') {
            // console.log(`Unkown weapon type ${typeName} for unit ${name} profile ${weaponName}`);
            return undefined;
          }
          if (typeName === 'Ranged Weapon') {
            weaponName += ' (ranged)';
          }
          const weaponDefaultAmounts = readDefaultAmount(selectionEntry);

          const computeModels = (
            unitModels: number[] | undefined,
            weaponModels: number[] | undefined,
          ): number => {
            if (!unitModels || !weaponModels) {
              return models;
            }
            if (unitModels.length !== weaponModels.length) {
              if (unitModels.length < weaponModels.length) {
                console.log(
                  `Double check weapon profile ${weaponName} on unit ${name} that has more default values`,
                );
              }
              return unitModels.reduce((a, b) => a + b);
            }
            return unitModels.map((v, i) => v * weaponModels[i]).reduce((a, b) => a + b);
          };

          const num_models = computeModels(modelDefaultAmounts, weaponDefaultAmounts);
          const attacks = findNodeValue(profile, 'characteristic', 'name', 'Atk', weaponName);
          const to_hit = Number(
            findNodeValue(profile, 'characteristic', 'name', 'Hit', weaponName).replace('+', ''),
          );
          const to_wound = Number(
            findNodeValue(profile, 'characteristic', 'name', 'Wnd', weaponName).replace('+', ''),
          );
          const rend = Number(findNodeValue(profile, 'characteristic', 'name', 'Rnd', weaponName));
          const damage = findNodeValue(profile, 'characteristic', 'name', 'Dmg', weaponName);
          const ability = findNodeValue(profile, 'characteristic', 'name', 'Ability', weaponName).replaceAll(
            ' ',
            '',
          );

          const modifiers: IModifierInstance[] = [];

          if (champion && !ability.includes('Companion')) {
            modifiers.push({
              id: 'LEADER_BONUS',
              active: true,
              uuid: nanoid(),
              options: { characteristic: 'attacks', bonus: 1, numLeaders: 1 },
            });
          }
          if (ability.includes('Crit(Mortal)')) {
            modifiers.push({
              id: 'MORTAL_WOUNDS',
              active: true,
              uuid: nanoid(),
              options: {
                characteristic: 'to_hit',
                on: 6,
                mortalWounds: damage,
                unmodified: true,
                inAddition: false,
              },
            });
          }
          if (ability.includes('Crit(Auto-wound)')) {
            modifiers.push({
              id: 'AUTO_WOUND',
              active: true,
              uuid: nanoid(),
              options: { characteristic: 'to_hit', on: 6, unmodified: true },
            });
          }
          if (ability.includes('Crit(2Hits)')) {
            modifiers.push({
              id: 'EXPLODING',
              active: true,
              uuid: nanoid(),
              options: { characteristic: 'to_hit', on: 6, extraHits: 1, unmodified: true },
            });
          }
          if (ability.includes('Charge(+1Damage)')) {
            modifiers.push({
              id: 'BONUS_CHARGE',
              active: false,
              uuid: nanoid(),
              options: { characteristic: 'damage', bonus: 1 },
            });
          }

          if (isNaN(to_wound)) {
            active = false;
            weaponName += ' (check rules)';
          }

          return {
            name: weaponName,
            active,
            num_models,
            attacks,
            to_hit,
            to_wound,
            rend,
            damage,
            modifiers,
          };
        };

        return profiles
          .values()
          .map(elementToWeapon)
          .filter((w) => w !== undefined)
          .toArray();
      };

      const allModelsWeaponProfiles = selectionEntriesNode
        ? selectionEntriesNode
            .querySelectorAll('selectionEntry[type="upgrade"]')
            .values()
            .map((e) => elementToWeapons(e))
            .flatMap((w) => w)
            .toArray()
        : [];
      const wargearWeaponProfiles = selectionEntryWarGearNode
        ? selectionEntryWarGearNode
            .querySelectorAll('selectionEntry[type="upgrade"]')
            .values()
            .filter((e) => e.querySelectorAll('selectionEntry[type="upgrade"]').length === 0)
            .map((e) => {
              return { weapons: elementToWeapons(e), name: e.getAttribute('name') };
            })
            .filter((w) => w.weapons.length > 0)
            .toArray()
        : [];

      return { models, allModelsWeaponProfiles, wargearWeaponProfiles };
    };

    const modelsDefinitions = modelNodes.map((m) => readModelNode(m));

    const models = modelsDefinitions.map((def) => def.models).reduce((a, b) => a + b);

    const duplicateChargeBonus = (unit: IUnitParameter): IUnitParameter[] => {
      if (!unit.weapon_profiles) {
        return [unit];
      }
      if (
        unit.weapon_profiles?.filter((w) => w.modifiers.filter((m) => m.id === 'BONUS_CHARGE').length > 0)
          .length > 0
      ) {
        return [
          {
            ...unit,
            weapon_profiles: unit.weapon_profiles.map((p) => {
              if (p.modifiers.filter((m) => m.id === 'BONUS_CHARGE').length > 0) {
                return { ...p, modifiers: p.modifiers.filter((m) => m.id !== 'BONUS_CHARGE') };
              }
              return p;
            }),
          },
          {
            ...unit,
            name: `${unit.name} (charged)`,
            weapon_profiles: unit.weapon_profiles.map((p) => {
              if (p.modifiers.filter((m) => m.id === 'BONUS_CHARGE').length > 0) {
                const chargedModifiers = p.modifiers
                  .filter((m) => m.id !== 'BONUS_CHARGE')
                  .map((m) => {
                    if (m.id === 'MORTAL_WOUNDS') {
                      return { ...m, options: { ...m.options, mortalWounds: `${m.options.mortalWounds}+1` } };
                    }
                    return m;
                  });
                return {
                  ...p,
                  name: `${p.name} (charged)`,
                  damage: `${p.damage}+1`,
                  modifiers: chargedModifiers,
                };
              }
              return p;
            }),
          },
        ];
      }
      return [unit];
    };

    const emptyWeapons: IWeaponProfileParameter[] = [];
    const unit = {
      name,
      active: false,
      reinforced,
      points,
      health,
      models,
      save,
      attacksModifier: 0,
      modifiers,
      weapon_profiles: emptyWeapons,
    };

    let variations = [unit];

    modelsDefinitions.forEach((model) => {
      variations.forEach((v) => {
        v.weapon_profiles.push(...model.allModelsWeaponProfiles);
      });
      if (model.wargearWeaponProfiles.length > 0) {
        variations = model.wargearWeaponProfiles
          .map((wp) =>
            variations.map((v) => {
              return {
                ...v,
                name: `${v.name} (${wp.name})`,
                weapon_profiles: v.weapon_profiles.concat(wp.weapons),
              };
            }),
          )
          .flatMap((u) => u);
      }
    });

    const applyReinforced = (unit: IUnitParameter): IUnitParameter => {
      if (unit.reinforced) {
        unit.name = unit.name.concat(' [R]');
        unit.points *= 2;
        unit.models *= 2;
        if (unit.weapon_profiles) {
          unit.weapon_profiles = unit.weapon_profiles.map((weapon) => {
            return { ...weapon, num_models: weapon.num_models * 2 };
          });
        }
      }
      return unit;
    };

    return variations
      .map(applyReinforced)
      .map(duplicateChargeBonus)
      .flatMap((u) => u);
  };

  const onClick = () => {
    Object.keys(Faction)
      .filter((f) => isNaN(Number(f)) && f !== 'List')
      // .filter(f=>f==='IJ')
      .forEach((faction) => {
        const pathName = Faction[faction].replace(' ', '%20');
        const libraryUrl = githubRawPrefix + pathName + librarySuffix;
        const costUrl = githubRawPrefix + pathName + costSuffix;
        const readXmlFileFromUrl = (url: string, callBack: (doc: Document) => void) => {
          try {
            fetch(url).then((response) =>
              response.text().then((xml) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, 'application/xml');
                callBack(doc);
              }),
            );
          } catch (exception) {
            notificationsStore.actions.addNotification({
              message: `Sorry, an error occured while loading faction ${faction}`,
              variant: 'error',
            });
          }
        };
        const readUnits = (doc: Document, costs, reinforced) => {
          const units = doc
            .querySelectorAll('selectionEntry')
            .entries()
            .filter((entry) => entry[1].getAttribute('type') === 'unit')
            .filter(
              (entry) =>
                !hasChild(entry[1], 'categoryLink', 'name', 'FACTION TERRAIN') &&
                !hasChild(entry[1], 'categoryLink', 'name', 'MANIFESTATION') &&
                !hasChild(entry[1], 'categoryLink', 'name', 'ENDLESS SPELL'),
            )
            .map((entry) => readUnitFromNode(entry[1], costs, Faction[faction], reinforced))
            .flatMap((u) => u)
            .toArray();
          onLoadBSDataUnits(units, Faction[faction]);
        };
        const readCosts = (doc: Document) => {
          const costs: Map<string, number> = new Map<string, number>();
          const canBeReinforced: Map<string, boolean> = new Map<string, boolean>();
          doc
            .querySelectorAll('entryLink')
            .values()
            .filter((entry) => entry.querySelectorAll('cost').length > 0)
            .forEach((entry) => {
              const unitName = entry.getAttribute('name') || '';
              const costValue = Number(entry.querySelectorAll('cost')[0].getAttribute('value'));
              const reinforced =
                findNode(entry, 'entryLink', 'name', 'Reinforced', unitName, false) !== undefined;
              if (reinforced) {
                canBeReinforced.set(unitName, true);
                // console.log(`Unit ${unitName} can be reinforced`);
              }
              if (costs.has(unitName)) {
                // in case of 'single' version of the same unit (stormdrake etc)
                if (costValue > (costs.get(unitName) || 0)) {
                  costs.set(unitName, costValue);
                }
              } else {
                costs.set(unitName, costValue);
              }
            });
          readXmlFileFromUrl(libraryUrl, (libraryDoc) => readUnits(libraryDoc, costs, canBeReinforced));
        };
        readXmlFileFromUrl(costUrl, readCosts);
      });
  };

  return (
    <div>
      <Button
        variant="contained"
        startIcon={<ImportExport />}
        color="primary"
        component="span"
        onClick={onClick}
      >
        Load factions from BS Data
      </Button>
    </div>
  );
};

export default BSDataUnits;

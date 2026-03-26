import { activeUnit } from 'store/selectors';
import type { ISanitizedUnit } from 'store/selectors';
import type { IStore, TPlayerSide } from 'types/store';
import type { IUnit } from 'types/unit';

import type { ISequenceParticipant } from 'api/core/processors/sequenceProcessor';

interface IPreparedUnit {
  unitUuid: string;
  unit: ISanitizedUnit;
}

const sanitizeModifier = (modifier) => {
  const { id, active, options, uuid } = modifier;
  return { id, active, options, uuid };
};

const sanitizeWeaponProfile = (profile) => {
  const { uuid, active, attacks, damage, modifiers, num_models, rend, to_hit, to_wound, name } = profile;
  const safeNum = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    uuid,
    active,
    attacks,
    damage,
    modifiers: (modifiers ?? []).map((modifier) => sanitizeModifier(modifier)),
    num_models: safeNum(num_models, 1),
    rend: safeNum(rend, 0),
    to_hit: safeNum(to_hit, 4),
    to_wound: safeNum(to_wound, 4),
    name: name ?? 'Weapon Profile',
  };
};

const sanitizeUnit = (unit): ISanitizedUnit => {
  const { name, active, reinforced, points, weapon_profiles, health, models, save, attacksModifier, modifiers } = unit;
  const safeNum = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    name: name ?? 'Unnamed Unit',
    points: safeNum(points, 100),
    health: safeNum(health, 1),
    models: safeNum(models, 1),
    save: safeNum(save, 4),
    attacksModifier: safeNum(attacksModifier, 0),
    active: active !== false,
    reinforced: reinforced ?? false,
    modifiers: (modifiers ?? []).map(sanitizeModifier),
    weapon_profiles: (weapon_profiles ?? []).map(sanitizeWeaponProfile),
  };
};

const getSanitizedUnits = (units: IUnit[]): IPreparedUnit[] =>
  units
    .map((unit) => ({ unitUuid: unit.uuid, unit: sanitizeUnit(unit) }))
    .filter(({ unit }) => (unit.weapon_profiles ?? []).length > 0);

const getSanitizedActiveUnits = (units: IUnit[]): IPreparedUnit[] =>
  units
    .filter((unit) => unit.active)
    .map(activeUnit)
    .map((unit) => ({ unitUuid: unit.uuid, unit: sanitizeUnit(unit) }))
    .filter(({ unit }) => (unit.weapon_profiles ?? []).length > 0);

const buildSideParticipants = (
  units: IPreparedUnit[],
  side: TPlayerSide,
): ISequenceParticipant[] =>
  units.map(({ unit, unitUuid }) => ({
    id: `${side}:${unitUuid}`,
    unitUuid,
    unit,
    name: unit.name,
    side,
    initialModels: unit.models,
  }));

const normalizePlayerSide = (value: unknown): TPlayerSide =>
  value === 'Opponent' || value === 'Defender' ? 'Opponent' : 'Self';

const getUnitsBySide = (state: IStore): { selfUnits: IUnit[]; opponentUnits: IUnit[] } => {
  const activePlayer = normalizePlayerSide((state.config as any).activePlayer);
  if (activePlayer === 'Self') {
    return {
      selfUnits: state.units,
      opponentUnits: state.config.otherPlayerArmy,
    };
  }

  return {
    selfUnits: state.config.otherPlayerArmy,
    opponentUnits: state.units,
  };
};

export const getSequenceParticipants = (state: IStore): ISequenceParticipant[] => {
  const { selfUnits, opponentUnits } = getUnitsBySide(state);
  const self = buildSideParticipants(getSanitizedActiveUnits(selfUnits), 'Self');
  const opponent = buildSideParticipants(getSanitizedActiveUnits(opponentUnits), 'Opponent');
  return [...self, ...opponent];
};

export const getAllSequenceParticipants = (state: IStore): ISequenceParticipant[] => {
  const { selfUnits, opponentUnits } = getUnitsBySide(state);
  const self = buildSideParticipants(getSanitizedUnits(selfUnits), 'Self');
  const opponent = buildSideParticipants(getSanitizedUnits(opponentUnits), 'Opponent');
  return [...self, ...opponent];
};

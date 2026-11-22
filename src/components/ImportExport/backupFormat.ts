import { Faction, IArmy } from 'types/army';

export const serializeBattletomes = (battletomes: IArmy[]): string =>
  JSON.stringify({ version: 1, battletomes });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isModifier = (value: unknown): boolean =>
  isRecord(value) && typeof value.id === 'string' && isRecord(value.options);

const isUnit = (value: unknown): boolean => {
  if (!isRecord(value) || typeof value.name !== 'string' ||
      (value.modifiers !== undefined &&
        (!Array.isArray(value.modifiers) || !value.modifiers.every(isModifier)))) {
    return false;
  }
  return value.weapon_profiles === undefined ||
    (Array.isArray(value.weapon_profiles) && value.weapon_profiles.every((profile: unknown) =>
      isRecord(profile) && Array.isArray(profile.modifiers) && profile.modifiers.every(isModifier),
    ));
};

export const parseBattletomes = (text: string): IArmy[] => {
  const data: unknown = JSON.parse(text);
  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.battletomes)) {
    throw new Error('Invalid or unsupported battletome backup');
  }

  const factions = new Set<string>();
  const isBattletome = (value: unknown): value is IArmy => {
    if (!isRecord(value) || typeof value.faction !== 'string' || !value.faction.trim() ||
        value.faction === Faction.List || value.faction === Faction.All ||
        factions.has(value.faction) || typeof value.label !== 'string' || !Array.isArray(value.units)) {
      return false;
    }
    if (!value.units.every(isUnit)) {
      return false;
    }
    factions.add(value.faction);
    return true;
  };
  if (!data.battletomes.every(isBattletome)) {
    throw new Error('Invalid battletomes in backup; no factions were changed');
  }
  return data.battletomes;
};

import { Characteristic as C } from '../../constants';
import { booleanOption, rollOption } from '../../utils/modifierUtils';
import { D6 } from '../dice';
import type WeaponProfile from '../weaponProfile';
import BaseModifier from './BaseModifier';

export default class AutoWound extends BaseModifier {
  on: number;
  unmodified: boolean;

  constructor({ characteristic, on = 6, unmodified = true }) {
    super({ characteristic });
    this.on = Number(on);
    this.unmodified = Boolean(unmodified);
  }

  static get displayName() {
    return 'Auto Wound';
  }

  static get description() {
    return `{unmodified} rolls of {on}+ on hit result
    in automatically wound`;
  }

  static get availableCharacteristics() {
    return [C.TO_HIT];
  }

  static get options() {
    return {
      ...super.options,
      on: rollOption({ defaultVal: 6 }),
      unmodified: booleanOption({ defaultVal: true }),
    };
  }

  resolve(owner: WeaponProfile) {
    let autoWounds = D6.getProbability(this.on);
    const rerollModifier = owner.modifiers.getRerollModifier(this.characteristic);
    if (rerollModifier) {
      autoWounds += rerollModifier.numRerolls(owner) * D6.getProbability(this.on);
    }
    return autoWounds;
  }
}

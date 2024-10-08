import { Characteristic, getCharacteristic } from '../../constants';
import { choiceOption } from '../../utils/modifierUtils';

export default class BaseModifier {
  ['constructor']: typeof BaseModifier;
  characteristic: Characteristic;

  constructor({ characteristic }) {
    const c = getCharacteristic(characteristic);
    // @ts-ignore
    /*
    if (!this.constructor.availableCharacteristics.includes(c)) {
      // @ts-ignore
      throw new Error(`Invalid characteristic provided to ${this.constructor.name} (${characteristic})`);
    }
      */
    this.characteristic = c;
  }

  static get displayName() {
    return '';
  }

  static get description() {
    return '';
  }

  static get availableCharacteristics(): Characteristic[] {
    return [];
  }

  static get options() {
    return {
      characteristic: choiceOption({ items: this.availableCharacteristics }),
    };
  }

  static get metadata() {
    return {
      name: this.displayName,
      description: this.description,
      options: this.options,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolve(owner): number {
    throw new Error('Resolve method not implemented');
  }
}

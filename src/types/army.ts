import { IUnitParameter } from './unit';

export enum Faction {
  List = 'User defined', // used for user lists that are not a battletome
  All = 'All', // All factions. Used for rankings
  BoC = 'Beasts of Chaos',
  Khorne = 'Blades of Khorne',
  Bonesplitterz = 'Bonesplitterz',
  CoS = 'Cities of Sigmar',
  DoK = 'Daughters of Khaine',
  Tzeentch = 'Disciples of Tzeentch',
  FEC = 'Flesh-eater Courts',
  FS = 'Fyreslayers',
  Gitz = 'Gloomspite Gitz',
  Slaanesh = 'Hedonites of Slaanesh',
  HoH = 'Helsmiths of Hashut',
  Idoneth = 'Idoneth Deepkin',
  IJ = 'Ironjawz',
  KO = 'Kharadron Overlords',
  Kruleboyz = 'Kruleboyz',
  LRL = 'Lumineth Realm-lords',
  Nurgle = 'Maggotkin of Nurgle',
  NH = 'Nighthaunt',
  Ogor = 'Ogor Mawtribes',
  OBR = 'Ossiarch Bonereapers',
  Seraphon = 'Seraphon',
  Skaven = 'Skaven',
  StD = 'Slaves to Darkness',
  SoB = 'Sons of Behemat',
  SbG = 'Soulblight Gravelords',
  SCE = 'Stormcast Eternals',
  Sylvaneth = 'Sylvaneth',
}

export interface IArmy {
  units: IUnitParameter[];
  faction: Faction;
  label: string;
}

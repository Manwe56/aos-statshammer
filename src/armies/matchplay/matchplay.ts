import { Faction, IArmy } from 'types/army';

import KHORNE from './BladesOfKhorne.json';
import DOK from './DaughtersOfKhaine.json';
import TZEENCH from './DisciplesOfTzeentch.json';
import FEC from './Flesh-EaterCourts.json';
import FS from './Fyreslayers.json';
import SLAANESH from './HedonitesOfSlaanesh.json';
import IDONETH from './IdonethDeepkin.json';
import IJ from './Ironjaws.json';
import KO from './KharadronsOverlord.json';
import KB from './Kruleboyz.json';
import LRL from './LuminethRealm-Lords.json';
import NURGLE from './MaggotkinOfNurgle.json';
import NH from './NightHaunt.json';
import OGOR from './OgorMawtribes.json';
import OBR from './OssiarchBonereapers.json';
import STD from './SlavesToDarkness.json';
import SOB from './SonsOfBehemath.json';
import SBG from './SoulblightGravelords.json';
import SCE from './Stormcast.json';
import SYLV from './Sylvaneth.json';

const BladesOfKhorne: any = {
  ...KHORNE,
  faction: Faction.Khorne,
  label: 'index',
};

const DaughtersOfKhaine: any = {
  ...DOK,
  faction: Faction.DoK,
  label: 'index',
};

const DisciplesOfTzeentch: any = {
  ...TZEENCH,
  faction: Faction.Tzeentch,
  label: 'index',
};

const FleshEaterCourts: any = {
  ...FEC,
  faction: Faction.FEC,
  label: 'index',
};

const Fyreslayers: any = {
  ...FS,
  faction: Faction.FS,
  label: 'index',
};

const HedonitesOfSlaanesh: any = {
  ...SLAANESH,
  faction: Faction.Slaanesh,
  label: 'index',
};

const IdonethDeepkin: any = {
  ...IDONETH,
  faction: Faction.Idoneth,
  label: 'index',
};

const Ironjaws: any = {
  ...IJ,
  faction: Faction.IJ,
  label: 'index',
};

const KharadronsOverlord: any = {
  ...KO,
  faction: Faction.KO,
  label: 'index',
};

const Kruleboyz: any = {
  ...KB,
  faction: Faction.Kruleboyz,
  label: 'index',
};

const LuminethRealmLords: any = {
  ...LRL,
  faction: Faction.LRL,
  label: 'index',
};

const MaggotkinOfNurgle: any = {
  ...NURGLE,
  faction: Faction.Nurgle,
  label: 'index',
};

const NightHaunt: any = {
  ...NH,
  faction: Faction.NH,
  label: 'index',
};

const OgorMawtribes: any = {
  ...OGOR,
  faction: Faction.Ogor,
  label: 'index',
};

const OssiarchBonereapers: any = {
  ...OBR,
  faction: Faction.OBR,
  label: 'index',
};

const SlavesToDarkness: any = {
  ...STD,
  faction: Faction.StD,
  label: 'index',
};

const SonsOfBehemath: any = {
  ...SOB,
  faction: Faction.SoB,
  label: 'index',
};

const SoulblightGravelords: any = {
  ...SBG,
  faction: Faction.SbG,
  label: 'index',
};

const Stormcast: any = {
  ...SCE,
  faction: Faction.SCE,
  label: 'index',
};

const Sylvaneth: any = {
  ...SYLV,
  faction: Faction.Sylvaneth,
  label: 'index',
};

const MATCHPLAY: IArmy[] = [
  BladesOfKhorne,
  DaughtersOfKhaine,
  DisciplesOfTzeentch,
  FleshEaterCourts,
  Fyreslayers,
  HedonitesOfSlaanesh,
  IdonethDeepkin,
  Ironjaws,
  KharadronsOverlord,
  Kruleboyz,
  LuminethRealmLords,
  MaggotkinOfNurgle,
  NightHaunt,
  OgorMawtribes,
  OssiarchBonereapers,
  SlavesToDarkness,
  SonsOfBehemath,
  SoulblightGravelords,
  Stormcast,
  Sylvaneth,
];

export default MATCHPLAY;

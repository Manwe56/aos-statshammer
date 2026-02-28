export type SaveCompareResult = {
  save: number;
  [name: string]: number;
};

export type HealthCompareResult = {
  label: string;
  [name: string]: number | string;
};

export interface ICompareResponse {
  saveResults: SaveCompareResult[];
  healthResults: HealthCompareResult[];
}

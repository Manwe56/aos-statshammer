export type TResult = {
  save: number;
  [name: string]: number;
};

export type TResults = TResult[];

export type StatsResult = {
  [name: string]: number | string;
  label: string;
};

export type StatsResults = StatsResult[];

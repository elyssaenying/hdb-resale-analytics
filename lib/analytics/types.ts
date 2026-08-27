export interface Row {
  town: string;
  flatType: string;
  year: number;
  monthNumber: number;
  isLatestMonth: boolean;
  resalePrice: number;
  floorAreaSqm: number;
  pricePerSqm: number;
  remainingLeaseYears: number;
  storeyMid: number;
}

export interface Dataset {
  towns: string[];
  flatTypes: string[];
  rows: Row[];
  generatedAt: string;
}

export interface FilterState {
  towns: string[];
  flatTypes: string[];
  includePartial: boolean;
}

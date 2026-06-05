/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum BuildingType {
  None = 'None',
  Road = 'Road',
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial',
  Park = 'Park',
  Office = 'Office',
  Utility = 'Utility',
  Service = 'Service',
  // Specific Utilities requested by user
  CoalPlant = 'CoalPlant',
  OilPlant = 'OilPlant',
  WindTurbine = 'WindTurbine',
  SolarPlant = 'SolarPlant',
  HydroDam = 'HydroDam',
  NuclearPlant = 'NuclearPlant',
  WaterPump = 'WaterPump',
  SewageTreatment = 'SewageTreatment',
  HeatingSystem = 'HeatingSystem',
  // Standard and Emergency services requested by user:
  PowerPlant = 'PowerPlant',
  PoliceStation = 'PoliceStation',
  FireStation = 'FireStation',
  Hospital = 'Hospital',
  School = 'School',
  Hotel = 'Hotel',
  Supermarket = 'Supermarket',
  Cinema = 'Cinema',
  ShoppingMall = 'ShoppingMall',
  LogisticsHub = 'LogisticsHub',
  ChemicalPlant = 'ChemicalPlant',
  TechFactory = 'TechFactory',
}

export interface BuildingConfig {
  type: BuildingType;
  cost: number;
  name: string;
  description: string;
  color: string; // Main color for 3D material
  popGen: number; // Population generation per tick
  incomeGen: number; // Money generation per tick
}

export interface TileData {
  x: number;
  y: number;
  buildingType: BuildingType;
  // Suggested by AI for visual variety later
  variant?: number;
  level?: number; // 1 to 4 building tiers
  districtId?: string; // Id of district this tile belongs to
  unlocked?: boolean; // Whether tile is unlocked for building
}

export type Grid = TileData[][];

export interface BankLoan {
  id: string;
  amount: number;
  interestRate: number;
  dailyPayment: number;
}

export interface DistrictConfig {
  id: string;
  name: string;
  policy: string; // e.g. "None", "Heavy Traffic Ban", "Free Transport", "Recycling", "Smoke Detectors", "Educational Boost", "Energy Saving"
}

export interface CityStats {
  money: number;
  population: number;
  day: number;
  happiness: number; // 0 to 100
  taxRates: {
    residential: number;
    commercial: number;
    industrial: number;
    office: number;
  };
  loans: BankLoan[];
  activePolicies: string[];
  ratingElectricity: number; // 0 to 100
  ratingWater: number; // 0 to 100
  ratingSewage: number; // 0 to 100
  ratingHeating: number; // 0 to 100
  ratingServices: number; // 0 to 100
  districts: DistrictConfig[];
  unemployment: number; // 0 to 100
  traffic: number; // 0 to 100 (rating flow)
  landValue: number; // $ average land value
  popChange: number; // population change per tick
  netIncome: number; // treasury daily change
  demandRes: number; // 0 to 100
  demandCom: number; // 0 to 100
  demandInd: number; // 0 to 100
  jobStaffingRatio?: number;
  comSpamFactor?: number;
  indSpamFactor?: number;
  offSpamFactor?: number;
  totalJobs?: number;
}

export interface AIGoal {
  description: string;
  targetType: 'population' | 'money' | 'building_count';
  targetValue: number;
  buildingType?: BuildingType; // If target is building_count
  reward: number;
  completed: boolean;
}

export interface NewsItem {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}
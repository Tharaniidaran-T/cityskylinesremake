/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType } from './types';

// Map Settings
export const GRID_SIZE = 12;

// Game Settings
export const TICK_RATE_MS = 2000; // Game loop updates every 2 seconds
export const INITIAL_MONEY = 1000;

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Deconstruct a building. Costs $5.',
    color: '#ef4444', // Used for UI
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Paves pathway for cars. Custom markings auto-render.',
    color: '#374151', // gray-700
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: 'Build adjacent houses (or stack build) to merge to Skyscraper!',
    color: '#f87171', // red-400
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: 'Generates income. Combine adjacent shops to make mega malls!',
    color: '#60a5fa', // blue-400
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: 'Massive income. Merging factories creates smart Quantum Gigafactories!',
    color: '#facc15', // yellow-400
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Entertainment',
    description: 'Brings leisure and custom fun activities to your citizens. +1 Pop/day',
    color: '#4ade80', // green-400
    popGen: 1,
    incomeGen: 0,
  },
  [BuildingType.Office]: {
    type: BuildingType.Office,
    cost: 300,
    name: 'Office',
    description: 'Tech employment. Combine office blocks into a Quantum Megastructure! +$25/day',
    color: '#a855f7', // purple-500
    popGen: 0,
    incomeGen: 25,
  },
  [BuildingType.Utility]: {
    type: BuildingType.Utility,
    cost: 500,
    name: 'Utility',
    description: 'Power & water systems. Reduces utility deficit indexes by +10. -$10/day',
    color: '#06b6d4', // cyan-500
    popGen: 0,
    incomeGen: -10,
  },
  [BuildingType.Service]: {
    type: BuildingType.Service,
    cost: 450,
    name: 'Service',
    description: 'Municipal safety coverage. Raises service happiness indexes by +12. -$15/day',
    color: '#ec4899', // pink-500
    popGen: 0,
    incomeGen: -15,
  },
  [BuildingType.CoalPlant]: {
    type: BuildingType.CoalPlant,
    cost: 500,
    name: 'Coal Plant',
    description: 'Electricity: Cheap fossil power. Reduces power shortages by set output +10. -$30/day',
    color: '#475569', // slate-600
    popGen: 0,
    incomeGen: -30,
  },
  [BuildingType.OilPlant]: {
    type: BuildingType.OilPlant,
    cost: 1100,
    name: 'Oil Plant',
    description: 'Electricity: Fast diesel burn. Reduces power shortages by set output +24. -$55/day',
    color: '#343a40', // dark grey
    popGen: 0,
    incomeGen: -55,
  },
  [BuildingType.WindTurbine]: {
    type: BuildingType.WindTurbine,
    cost: 350,
    name: 'Wind Turbine',
    description: 'Electricity: Absolute eco clean. Reduces power shortages by set output +5. -$10/day',
    color: '#22d3ee', // wind cyan
    popGen: 0,
    incomeGen: -10,
  },
  [BuildingType.SolarPlant]: {
    type: BuildingType.SolarPlant,
    cost: 1600,
    name: 'Solar Plant',
    description: 'Electricity: Highly efficient photovoltaic. Reduces power shortages by +40. -$75/day',
    color: '#eab308', // solar yellow
    popGen: 0,
    incomeGen: -75,
  },
  [BuildingType.HydroDam]: {
    type: BuildingType.HydroDam,
    cost: 2800,
    name: 'Hydro Dam',
    description: 'Electricity: Colossal cascading water energy. Reduces power shortages by +85. -$130/day',
    color: '#2563eb', // water blue
    popGen: 0,
    incomeGen: -130,
  },
  [BuildingType.NuclearPlant]: {
    type: BuildingType.NuclearPlant,
    cost: 5500,
    name: 'Nuclear Plant',
    description: 'Electricity: Stellar magnetic containment. Reduces power shortages by +250. -$250/day',
    color: '#10b981', // green nuclear emerald
    popGen: 0,
    incomeGen: -250,
  },
  [BuildingType.WaterPump]: {
    type: BuildingType.WaterPump,
    cost: 400,
    name: 'Water Pump',
    description: 'Water: Sweeps deep clean ground aquifer water. Reduces water shortage index by +15. -$15/day',
    color: '#38bdf8', // sky-400
    popGen: 0,
    incomeGen: -15,
  },
  [BuildingType.SewageTreatment]: {
    type: BuildingType.SewageTreatment,
    cost: 500,
    name: 'Sewage Plant',
    description: 'Sewage: Clears municipality sewage discharge drains. Reduces sewage layout by +18. -$20/day',
    color: '#b45309', // amber-700
    popGen: 0,
    incomeGen: -20,
  },
  [BuildingType.HeatingSystem]: {
    type: BuildingType.HeatingSystem,
    cost: 750,
    name: 'Heating Plant',
    description: 'Heating: Releases hot district thermal steam. Reduces freezing index by +20. -$25/day',
    color: '#f97316', // orange-500
    popGen: 0,
    incomeGen: -25,
  },
  [BuildingType.PowerPlant]: {
    type: BuildingType.PowerPlant,
    cost: 500,
    name: 'Power Plant',
    description: 'Electricity: Conventional thermal grid block. Reduces power shortages by +15. -$30/day',
    color: '#06b6d4',
    popGen: 0,
    incomeGen: -30,
  },
  [BuildingType.PoliceStation]: {
    type: BuildingType.PoliceStation,
    cost: 300,
    name: 'Police Station',
    description: 'Services: Patrol cars suppress urban felony rate. Reduces crime index by +20. -$25/day',
    color: '#1e40af',
    popGen: 0,
    incomeGen: -25,
  },
  [BuildingType.FireStation]: {
    type: BuildingType.FireStation,
    cost: 300,
    name: 'Fire Station',
    description: 'Services: Heavy hydrant pump engines. Reduces local fire hazard rate by +20. -$25/day',
    color: '#ef4444',
    popGen: 0,
    incomeGen: -25,
  },
  [BuildingType.Hospital]: {
    type: BuildingType.Hospital,
    cost: 600,
    name: 'Hospital',
    description: 'Services: Advanced healthcare surgery clinic. Reduces health hazard rate by +25. -$45/day',
    color: '#10b981',
    popGen: 0,
    incomeGen: -45,
  },
  [BuildingType.School]: {
    type: BuildingType.School,
    cost: 250,
    name: 'School',
    description: 'Services: Expands secondary education academic literacy. Reduces ignorance by +15. -$20/day',
    color: '#f59e0b',
    popGen: 0,
    incomeGen: -20,
  },
  [BuildingType.Hotel]: {
    type: BuildingType.Hotel,
    cost: 450,
    name: 'Leisure Hotel',
    description: 'Commercial: Invites rich travelers. Generates premium tourism tax revenue. +$45/day',
    color: '#3b82f6',
    popGen: 0,
    incomeGen: 45,
  },
  [BuildingType.Supermarket]: {
    type: BuildingType.Supermarket,
    cost: 250,
    name: 'Supermarket',
    description: 'Commercial: High-volume wholesale department grocer. Generates robust income. +$25/day',
    color: '#6366f1',
    popGen: 0,
    incomeGen: 25,
  },
  [BuildingType.Cinema]: {
    type: BuildingType.Cinema,
    cost: 350,
    name: 'Indie Cinema',
    description: 'Commercial: Boutique movie theater. Drives shopper & leisure demand. +$35/day',
    color: '#38bdf8',
    popGen: 0,
    incomeGen: 35,
  },
  [BuildingType.ShoppingMall]: {
    type: BuildingType.ShoppingMall,
    cost: 850,
    name: 'Strip Mall',
    description: 'Commercial: Integrated outdoor retail strip. Colossal daily tax yields. +$110/day',
    color: '#818cf8',
    popGen: 0,
    incomeGen: 110,
  },
  [BuildingType.LogisticsHub]: {
    type: BuildingType.LogisticsHub,
    cost: 350,
    name: 'Logistics Hub',
    description: 'Industrial: Freight shipping cargo center. Supports manufacturing storage. +$35/day',
    color: '#eab308',
    popGen: 0,
    incomeGen: 35,
  },
  [BuildingType.ChemicalPlant]: {
    type: BuildingType.ChemicalPlant,
    cost: 600,
    name: 'Chemical Plant',
    description: 'Industrial: Processing facility for core industrial polymers and materials. +$75/day',
    color: '#e24a4a',
    popGen: 0,
    incomeGen: 75,
  },
  [BuildingType.TechFactory]: {
    type: BuildingType.TechFactory,
    cost: 1200,
    name: 'Tech Factory',
    description: 'Industrial: Precision electronics microchip foundry. +$180/day',
    color: '#2dd4bf',
    popGen: 0,
    incomeGen: 180,
  },
};

export interface BuildingTier {
  name: string;
  description: string;
  color: string;
  popGen: number;
  incomeGen: number;
}

export const BUILDING_TIERS: Record<BuildingType, Record<number, BuildingTier>> = {
  [BuildingType.None]: {
    1: { name: 'Bulldoze', description: 'Clear a tile. Costs $5.', color: '#ef4444', popGen: 0, incomeGen: 0 }
  },
  [BuildingType.Road]: {
    1: { name: 'Road', description: 'Standard roadway.', color: '#374151', popGen: 0, incomeGen: 0 }
  },
  [BuildingType.Residential]: {
    1: { name: 'Cozy Cottage', description: 'Charming cottage for families. +5 Pop/day', color: '#f87171', popGen: 5, incomeGen: 0 },
    2: { name: 'Modern Townhouse', description: 'Multi-story suburban residence. +18 Pop/day', color: '#fb923c', popGen: 18, incomeGen: 0 },
    3: { name: 'Apartment Block', description: 'High-density urban housing. +50 Pop/day', color: '#ef4444', popGen: 50, incomeGen: 0 },
    4: { name: 'Luxury Skyscraper', description: 'Climactic residencial tower. +150 Pop/day', color: '#c084fc', popGen: 150, incomeGen: 0 },
  },
  [BuildingType.Commercial]: {
    1: { name: 'Corner Store', description: 'Local grocery with fresh goods. +$15/day', color: '#60a5fa', popGen: 0, incomeGen: 15 },
    2: { name: 'Retail Plaza', description: 'Strip mall with active dining. +$50/day', color: '#2563eb', popGen: 0, incomeGen: 50 },
    3: { name: 'Finance Tower', description: 'Corporate offices and consulting tiers. +$150/day', color: '#1d4ed8', popGen: 0, incomeGen: 150 },
    4: { name: 'Mega SkyMall', description: 'Elite skyscraper mall and office complex. +$450/day', color: '#0ea5e9', popGen: 0, incomeGen: 450 },
  },
  [BuildingType.Industrial]: {
    1: { name: 'Craft Workshop', description: 'Small manufacturing hangar. +$40/day', color: '#facc15', popGen: 0, incomeGen: 40 },
    2: { name: 'Heavy Factory', description: 'Automated assembly systems. +$130/day', color: '#eab308', popGen: 0, incomeGen: 130 },
    3: { name: 'Chemical Refinery', description: 'Process high-tech fuel cells. +$400/day', color: '#ca8a04', popGen: 0, incomeGen: 400 },
    4: { name: 'Quantum Gigafactory', description: 'Superconducting clean-energy generator. +$1200/day', color: '#fbbf24', popGen: 0, incomeGen: 1200 },
  },
  [BuildingType.Park]: {
    1: { name: 'Local Arcade', description: 'Retro gaming cabinets for teens. +2 Pop/day', color: '#4ade80', popGen: 2, incomeGen: 0 },
    2: { name: 'Cinema Complex', description: 'Multi-screen theater with IMAX. +8 Pop/day', color: '#22c55e', popGen: 8, incomeGen: 5 },
    3: { name: 'Concert Hall', description: 'Acoustics-crafted orchestral auditorium. +25 Pop/day', color: '#16a34a', popGen: 25, incomeGen: 15 },
    4: { name: 'Mega Stadium', description: 'Colossal open-roof sports stadium with laser shows. +80 Pop/day', color: '#047857', popGen: 80, incomeGen: 50 },
  },
  [BuildingType.Office]: {
    1: { name: 'Startup Incubator', description: 'Small local business incubator. +$25/day', color: '#c084fc', popGen: 0, incomeGen: 25 },
    2: { name: 'Corporate Office', description: 'Standard finance and admin hub. +$90/day', color: '#a855f7', popGen: 0, incomeGen: 90 },
    3: { name: 'Tech Headquarters', description: 'Advanced AI and tech campus. +$280/day', color: '#9333ea', popGen: 0, incomeGen: 280 },
    4: { name: 'Quantum Megastructure', description: 'Breathtaking monolithic cyber-tower. +$900/day', color: '#7c3aed', popGen: 0, incomeGen: 900 }
  },
  [BuildingType.Utility]: {
    1: { name: 'Wind Turbine', description: 'Eco-friendly localized power source. -$10/day', color: '#22d3ee', popGen: 0, incomeGen: -10 },
    2: { name: 'Water Pumping Tower', description: 'Deep groundwater extraction system. -$25/day', color: '#06b6d4', popGen: 0, incomeGen: -25 },
    3: { name: 'Solar Collector Array', description: 'Extensive photovoltaic field. -$70/day', color: '#0891b2', popGen: 0, incomeGen: -70 },
    4: { name: 'Clean Nuclear Reactor', description: 'Ultimate emission-free fusion core power. -$200/day', color: '#0e7490', popGen: 0, incomeGen: -200 }
  },
  [BuildingType.Service]: {
    1: { name: 'Elementary Clinic', description: 'Localized first-aid clinic. -$15/day', color: '#f472b6', popGen: 0, incomeGen: -15 },
    2: { name: 'Police Fire Precinct', description: 'Suburban emergency dispatch. -$40/day', color: '#ec4899', popGen: 0, incomeGen: -40 },
    3: { name: 'City High Hospital', description: 'Full-scale academic hospital & surgery. -$110/day', color: '#db2777', popGen: 0, incomeGen: -110 },
    4: { name: 'Grand Academic Campus', description: 'Unified disaster reaction & university level. -$320/day', color: '#be185d', popGen: 0, incomeGen: -320 }
  },
  [BuildingType.CoalPlant]: {
    1: { name: 'Small Coal Plant', description: 'Fossil combustion with basic boilers. Electricity +10. -$30/day', color: '#475569', popGen: 0, incomeGen: -30 },
    2: { name: 'Advanced Coal Plant', description: 'Fitted with sulfur-capturing scrubbers. Electricity +25. -$60/day', color: '#334155', popGen: 0, incomeGen: -60 },
    3: { name: 'Mega Coal Station', description: 'Multi-boiler high voltage station. Electricity +60. -$100/day', color: '#1e293b', popGen: 0, incomeGen: -100 },
    4: { name: 'Super Steam Turbine', description: 'Highly pressurized hyper-furnaces. Electricity +150. -$150/day', color: '#0f172a', popGen: 0, incomeGen: -150 }
  },
  [BuildingType.OilPlant]: {
    1: { name: 'Diesel Generator', description: 'Emergency localized back-up diesel set. Electricity +24. -$55/day', color: '#3f3f46', popGen: 0, incomeGen: -55 },
    2: { name: 'Heavy Oil Plant', description: 'High fuel injection heavy combuster. Electricity +55. -$100/day', color: '#27272a', popGen: 0, incomeGen: -100 },
    3: { name: 'Refinery-Grid Burner', description: 'Integrated fuel refining power array. Electricity +120. -$160/day', color: '#18181b', popGen: 0, incomeGen: -160 },
    4: { name: 'Oil Megawatt Unit', description: 'Power grid fuel megastructure. Electricity +300. -$240/day', color: '#09090b', popGen: 0, incomeGen: -240 }
  },
  [BuildingType.WindTurbine]: {
    1: { name: 'Wind Turbine', description: 'Standard shoreline single wind turbine. Electricity +5. -$10/day', color: '#22d3ee', popGen: 0, incomeGen: -10 },
    2: { name: 'Deep Sea Turbine', description: 'Floated offshore high-wind turbine. Electricity +12. -$20/day', color: '#06b6d4', popGen: 0, incomeGen: -20 },
    3: { name: 'Helix Concentrator', description: 'Futuristic magnetic drag generator. Electricity +25. -$35/day', color: '#0891b2', popGen: 0, incomeGen: -35 },
    4: { name: 'Giga Wind Harvester', description: 'Colossal tropospheric wind harvester. Electricity +60. -$50/day', color: '#0e7490', popGen: 0, incomeGen: -50 }
  },
  [BuildingType.SolarPlant]: {
    1: { name: 'Rooftop Solar Array', description: 'Standard crystalline silicon field. Electricity +40. -$75/day', color: '#fef08a', popGen: 0, incomeGen: -75 },
    2: { name: 'Photovoltaic Grid', description: 'Dual-axis solar tracking generator. Electricity +85. -$130/day', color: '#facc15', popGen: 0, incomeGen: -130 },
    3: { name: 'CSP Mirror Tower', description: 'Concentrated sun-melting boiler tower. Electricity +180. -$200/day', color: '#eab308', popGen: 0, incomeGen: -200 },
    4: { name: 'Quantum Solar Dyson', description: 'Superconducting solar photon matrix. Electricity +450. -$300/day', color: '#ca8a04', popGen: 0, incomeGen: -300 }
  },
  [BuildingType.HydroDam]: {
    1: { name: 'Micro-Hydro Turbine', description: 'Small cascading stream converter. Electricity +85. -$130/day', color: '#93c5fd', popGen: 0, incomeGen: -130 },
    2: { name: 'Cascading Dam Core', description: 'Concrete reservoir spillway loop. Electricity +190. -$220/day', color: '#60a5fa', popGen: 0, incomeGen: -220 },
    3: { name: 'Gravity Dam Wall', description: 'Massive hydraulic river barricade. Electricity +380. -$350/day', color: '#2563eb', popGen: 0, incomeGen: -350 },
    4: { name: 'Three Gorges SkyDam', description: 'Climactic hyper-turbines dam lock. Electricity +1000. -$500/day', color: '#1d4ed8', popGen: 0, incomeGen: -500 }
  },
  [BuildingType.NuclearPlant]: {
    1: { name: 'Fission Test Reactor', description: 'Small localized research core loop. Electricity +250. -$250/day', color: '#a7f3d0', popGen: 0, incomeGen: -250 },
    2: { name: 'Heavy Water Core', description: 'Pressurized nuclear boiler station. Electricity +550. -$450/day', color: '#34d399', popGen: 0, incomeGen: -450 },
    3: { name: 'Breeder Fission Station', description: 'Waste-recycling breeder pile. Electricity +1100. -$750/day', color: '#059669', popGen: 0, incomeGen: -750 },
    4: { name: 'Subatomic Fusion Core', description: 'Stellar magnetic containment torus. Electricity +2500. -$1100/day', color: '#064e3b', popGen: 0, incomeGen: -1100 }
  },
  [BuildingType.WaterPump]: {
    1: { name: 'Aquifer Siphon', description: 'Deep groundwater aquifer well. Water +15. -$15/day', color: '#cbd5e1', popGen: 0, incomeGen: -15 },
    2: { name: 'Shoreline Intake Valve', description: 'Submersible pipeline drawing fluid. Water +35. -$30/day', color: '#94a3b8', popGen: 0, incomeGen: -30 },
    3: { name: 'Mega Desalination', description: 'High pressure salt extraction grid. Water +80. -$55/day', color: '#64748b', popGen: 0, incomeGen: -55 },
    4: { name: 'Atmosphere Condenser', description: 'Liquefies air humidity instantly. Water +200. -$90/day', color: '#475569', popGen: 0, incomeGen: -90 }
  },
  [BuildingType.SewageTreatment]: {
    1: { name: 'Septic Sludge Tank', description: 'Basic mechanical filter settling basin. Sewage +18. -$20/day', color: '#d97706', popGen: 0, incomeGen: -20 },
    2: { name: 'Wastewater Bioreactor', description: 'Active aerobic bacteria sludge digestion. Sewage +40. -$35/day', color: '#b45309', popGen: 0, incomeGen: -35 },
    3: { name: 'Gravel Sludge Processor', description: 'Advanced clarifying chemical plant. Sewage +90. -$60/day', color: '#78350f', popGen: 0, incomeGen: -60 },
    4: { name: 'Zero-Lag Purifier Hub', description: 'Graphene filtration water recycler. Sewage +220. -$100/day', color: '#451a03', popGen: 0, incomeGen: -100 }
  },
  [BuildingType.HeatingSystem]: {
    1: { name: 'District Boiler House', description: 'Localized furnace for cozy buildings. Heating +20. -$25/day', color: '#fdba74', popGen: 0, incomeGen: -25 },
    2: { name: 'Geothermal Pipeline', description: 'Sub-soil thermal hot-spring loops. Heating +45. -$45/day', color: '#f97316', popGen: 0, incomeGen: -45 },
    3: { name: 'Steam Expansion Depot', description: 'Large high-pressure steam distribution mains. Heating +100. -$75/day', color: '#ea580c', popGen: 0, incomeGen: -75 },
    4: { name: 'Plasma Heat Grid', description: 'Quantum district glowing glow heater. Heating +250. -$120/day', color: '#c2410c', popGen: 0, incomeGen: -120 }
  },
  [BuildingType.PowerPlant]: {
    1: { name: 'Coal Power Block', description: 'Grid-connected heavy coal generator. Electricity +15. -$30/day', color: '#475569', popGen: 0, incomeGen: -30 },
    2: { name: 'Compact Gas Turbine', description: 'Gas combustion turbine. Electricity +45. -$70/day', color: '#0ea5e9', popGen: 0, incomeGen: -70 },
    3: { name: 'Fission Core Station', description: 'Uranium rod nuclear boiling core. Electricity +180. -$200/day', color: '#10b981', popGen: 0, incomeGen: -200 },
    4: { name: 'Stellar Fusion Matrix', description: 'Quantum fusion containment ring. Electricity +600. -$500/day', color: '#8b5cf6', popGen: 0, incomeGen: -500 }
  },
  [BuildingType.PoliceStation]: {
    1: { name: 'Local Police Precinct', description: 'Suburban dispatch patrol car. -$25/day', color: '#1e40af', popGen: 0, incomeGen: -25 },
    2: { name: 'Municipal Police HQ', description: 'Centralized district detention. -$60/day', color: '#1e3a8a', popGen: 0, incomeGen: -60 },
    3: { name: 'Federal Security Bureau', description: 'Tactical crime forensic unit. -$140/day', color: '#172554', popGen: 0, incomeGen: -140 },
    4: { name: 'Omni Cyber Intelligence', description: 'Autonomous camera policing array. -$300/day', color: '#312e81', popGen: 0, incomeGen: -300 }
  },
  [BuildingType.FireStation]: {
    1: { name: 'Volunteer Fire Hall', description: 'Basic responder hose station. -$25/day', color: '#ef4444', popGen: 0, incomeGen: -25 },
    2: { name: 'Municipal Fire Station', description: 'Multi-engine prompt response garage. -$60/day', color: '#dc2626', popGen: 0, incomeGen: -60 },
    3: { name: 'Regional Disaster Bureau', description: 'Chemical flame suppressant depot. -$140/day', color: '#b91c1c', popGen: 0, incomeGen: -140 },
    4: { name: 'Quantum Foam Command', description: 'Automated satellite foam launcher. -$300/day', color: '#7f1d1d', popGen: 0, incomeGen: -300 }
  },
  [BuildingType.Hospital]: {
    1: { name: 'Neighborhood Clinic', description: 'Basic urgent care clinic. -$45/day', color: '#10b981', popGen: 0, incomeGen: -45 },
    2: { name: 'District Medical Center', description: 'Equipped emergency surgery hospital. -$100/day', color: '#059669', popGen: 0, incomeGen: -100 },
    3: { name: 'Regional Surgical Hospital', description: 'High-tech cancer and pathology wing. -$220/day', color: '#047857', popGen: 0, incomeGen: -220 },
    4: { name: 'Medical Education Campus', description: 'Academic clinical super-campus. -$500/day', color: '#064e3b', popGen: 0, incomeGen: -500 }
  },
  [BuildingType.School]: {
    1: { name: 'Elementary School', description: 'Basic primary education block. -$20/day', color: '#f59e0b', popGen: 0, incomeGen: -20 },
    2: { name: 'Urban High School', description: 'Secondary training preps for college. -$50/day', color: '#d97706', popGen: 0, incomeGen: -50 },
    3: { name: 'Polytechnic Academy', description: 'Technical college degree courses. -$110/day', color: '#b45309', popGen: 0, incomeGen: -110 },
    4: { name: 'Grand SkyUniversity', description: 'Ivy education and research accelerator. -$260/day', color: '#78350f', popGen: 0, incomeGen: -260 }
  },
  [BuildingType.Hotel]: {
    1: { name: 'Cozy Motel', description: 'Charming roadside traveler motel. +$20/day', color: '#2563eb', popGen: 0, incomeGen: 20 },
    2: { name: 'Boutique Inn', description: 'Chic local bed and breakfast. +$55/day', color: '#1d4ed8', popGen: 0, incomeGen: 55 },
    3: { name: 'Luxury Resort', description: 'Grand resort. +$180/day', color: '#312e81', popGen: 0, incomeGen: 180 },
    4: { name: 'Omni SkyResort', description: 'Breathtaking 5-star mountain resort. +$550/day', color: '#4f46e5', popGen: 0, incomeGen: 550 },
  },
  [BuildingType.Supermarket]: {
    1: { name: 'Minimart', description: 'Local express corner grocery. +$15/day', color: '#4f46e5', popGen: 0, incomeGen: 15 },
    2: { name: 'Discount Grocer', description: 'High volume family wholesale shop. +$45/day', color: '#4338ca', popGen: 0, incomeGen: 45 },
    3: { name: 'Mega Supermarket', description: 'Full-scale departmental supermarket. +$140/day', color: '#3730a3', popGen: 0, incomeGen: 140 },
    4: { name: 'Quantum HyperMall', description: 'Futuristic hyper-mall and groceries combo. +$400/day', color: '#312e81', popGen: 0, incomeGen: 400 },
  },
  [BuildingType.Cinema]: {
    1: { name: 'Cozy Theater', description: 'Classic neighborhood movie theater with retro concessions. +$30/day', color: '#38bdf8', popGen: 0, incomeGen: 30 },
    2: { name: 'Multiplex Cine', description: 'Dynamic screens showing mainstream releases. +$90/day', color: '#0ea5e9', popGen: 0, incomeGen: 90 },
    3: { name: 'IMAX Theatre', description: 'Immersive giant screens and premium sound system. +$240/day', color: '#0284c7', popGen: 0, incomeGen: 240 },
    4: { name: 'Grand Cineplex Palace', description: 'Massive entertainment destination with VR playgrounds. +$650/day', color: '#0369a1', popGen: 0, incomeGen: 650 },
  },
  [BuildingType.ShoppingMall]: {
    1: { name: 'Street Arcade', description: 'Continuous vendor shops along a single walkway. +$95/day', color: '#818cf8', popGen: 0, incomeGen: 95 },
    2: { name: 'Galleria Center', description: 'Two-story covered shopping square with dining court. +$260/day', color: '#6366f1', popGen: 0, incomeGen: 260 },
    3: { name: 'Metropolitan Mall', description: 'Grand glass dome mall hosting international brands. +$700/day', color: '#4f46e5', popGen: 0, incomeGen: 700 },
    4: { name: 'Infinite SkyMall', description: 'Vertical shopping and entertainment complex with high transit yield. +$1800/day', color: '#3730a3', popGen: 0, incomeGen: 1800 },
  },
  [BuildingType.LogisticsHub]: {
    1: { name: 'Cargo Yard', description: 'Basic freight sorting containers with truck terminals. +$30/day', color: '#eab308', popGen: 0, incomeGen: 30 },
    2: { name: 'Distribution Depot', description: 'Automated warehouse handling high-throughput grocery shipments. +$85/day', color: '#ca8a04', popGen: 0, incomeGen: 85 },
    3: { name: 'Fulfillment Center', description: 'Fully integrated robotic sorters packing modern electronics. +$220/day', color: '#a16207', popGen: 0, incomeGen: 220 },
    4: { name: 'Global Logistics Port', description: 'Intermodal magnetic-rail terminal distributing planetary cargo. +$600/day', color: '#854d0e', popGen: 0, incomeGen: 600 },
  },
  [BuildingType.ChemicalPlant]: {
    1: { name: 'Polymer Refinery', description: 'Small-scale liquid refinery processing plastics into compounds. +$65/day', color: '#ef4444', popGen: 0, incomeGen: 65 },
    2: { name: 'Compound Lab', description: 'State-of-the-art facility synthesizing advanced carbon fibres. +$180/day', color: '#dc2626', popGen: 0, incomeGen: 180 },
    3: { name: 'Heavy Chemical Works', description: 'Massive catalytic converters producing complex composites. +$480/day', color: '#b91c1c', popGen: 0, incomeGen: 480 },
    4: { name: 'Molecular Synthesis Block', description: 'Quantum nano-assemblers synthesizing ultra-materials. +$1300/day', color: '#991b1b', popGen: 0, incomeGen: 1300 },
  },
  [BuildingType.TechFactory]: {
    1: { name: 'Assembly Fab', description: 'Local computer board printed assembly line. +$150/day', color: '#2dd4bf', popGen: 0, incomeGen: 150 },
    2: { name: 'Robotics Plant', description: 'Advanced automation systems fabrication factory. +$400/day', color: '#14b8a6', popGen: 0, incomeGen: 400 },
    3: { name: 'Microchip Foundry', description: 'Cleanroom silicon lithography manufacturing wafer chips. +$1000/day', color: '#0d9488', popGen: 0, incomeGen: 1000 },
    4: { name: 'Quantum Lithography Prime', description: 'Subatomic quantum core assembler. Ultimate manufacturing income. +$2800/day', color: '#0f766e', popGen: 0, incomeGen: 2800 },
  }
};
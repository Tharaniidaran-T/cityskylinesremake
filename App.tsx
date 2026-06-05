/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY, BUILDING_TIERS } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { generateCityGoal, generateNewsEvent } from './services/geminiService';

const isCommercialType = (type: BuildingType): boolean => {
  return type === BuildingType.Commercial || 
         type === BuildingType.Hotel || 
         type === BuildingType.Supermarket || 
         type === BuildingType.Cinema || 
         type === BuildingType.ShoppingMall;
};

const isIndustrialType = (type: BuildingType): boolean => {
  return type === BuildingType.Industrial || 
         type === BuildingType.LogisticsHub || 
         type === BuildingType.ChemicalPlant || 
         type === BuildingType.TechFactory;
};


// Dynamic adjacent validation and merge with chain reaction support
export const checkAndMergeAdjacent = (
  x: number,
  y: number,
  type: BuildingType,
  currentGrid: Grid,
  accumulatedMessages: string[] = []
): { grid: Grid; merged: boolean; messages: string[] } => {
  let grid = currentGrid.map(row => [...row]);
  let currentTile = grid[y][x];
  if (currentTile.buildingType !== type) return { grid, merged: false, messages: accumulatedMessages };
  
  const currentLevel = currentTile.level || 1;
  if (currentLevel >= 4) return { grid, merged: false, messages: accumulatedMessages };

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;

    if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
      const neighbor = grid[ny][nx];
      if (neighbor.buildingType === type && (neighbor.level || 1) === currentLevel) {
        const nextLevel = currentLevel + 1;
        grid[y][x] = { ...currentTile, level: nextLevel };
        grid[ny][nx] = { x: nx, y: ny, buildingType: BuildingType.None };

        const tierNames = BUILDING_TIERS[type];
        const oldName = tierNames?.[currentLevel]?.name || type;
        const newName = tierNames?.[nextLevel]?.name || type;
        const message = `✨ Combined adjacent ${oldName}s into a ${newName}!`;
        const updatedMessages = [...accumulatedMessages, message];

        // Recurse for potential chain reaction merge at (x, y)
        const chainResult = checkAndMergeAdjacent(x, y, type, grid, updatedMessages);
        if (chainResult.merged) {
          return { grid: chainResult.grid, merged: true, messages: chainResult.messages };
        } else {
          return { grid, merged: true, messages: updatedMessages };
        }
      }
    }
  }

  return { grid, merged: accumulatedMessages.length > 0, messages: accumulatedMessages };
};

// Initialize empty grid with island shape generation for 3D visual interest
const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  const center = GRID_SIZE / 2;

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // Circle shape to form the elegant SkyMetropolis floating island
      const dist = Math.sqrt((x - center + 0.5) * (x - center + 0.5) + (y - center + 0.5) * (y - center + 0.5));
      const unlocked = dist <= 4.2; // Central region is unlocked, outer bounds are locked initially!
      
      row.push({ x, y, buildingType: BuildingType.None, unlocked });
    }
    grid.push(row);
  }
  return grid;
};

// Expand grid by adding locked padding on all 4 directions
const expandGrid = (currentGrid: Grid): Grid => {
  const pad = 4;
  const oldH = currentGrid.length;
  const oldW = currentGrid[0].length;
  const newSize = oldH + pad * 2;
  const newGrid: Grid = [];

  for (let y = 0; y < newSize; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < newSize; x++) {
      const origX = x - pad;
      const origY = y - pad;
      
      if (origX >= 0 && origX < oldW && origY >= 0 && origY < oldH) {
        row.push({
          ...currentGrid[origY][origX],
          x,
          y
        });
      } else {
        row.push({
          x,
          y,
          buildingType: BuildingType.None,
          unlocked: false
        });
      }
    }
    newGrid.push(row);
  }
  return newGrid;
};

function App() {
  // --- Game State ---
  const [quality, setQuality] = useState<'standard' | 'high'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-quality');
      if (saved === 'high' || saved === 'standard') return saved;
    }
    return 'standard';
  });

  const [skyTheme, setSkyTheme] = useState<'azure' | 'midnight' | 'sunset' | 'cosmic'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-sky-theme');
      if (saved === 'azure' || saved === 'midnight' || saved === 'sunset' || saved === 'cosmic') return saved;
    }
    return 'azure';
  });

  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-auto-rotate');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [showControls, setShowControls] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-show-controls');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [alwaysDaytime, setAlwaysDaytime] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-always-daytime');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('skymetropolis-quality', quality);
  }, [quality]);

  useEffect(() => {
    localStorage.setItem('skymetropolis-sky-theme', skyTheme);
  }, [skyTheme]);

  useEffect(() => {
    localStorage.setItem('skymetropolis-auto-rotate', String(autoRotate));
  }, [autoRotate]);

  useEffect(() => {
    localStorage.setItem('skymetropolis-show-controls', String(showControls));
  }, [showControls]);

  useEffect(() => {
    localStorage.setItem('skymetropolis-always-daytime', String(alwaysDaytime));
  }, [alwaysDaytime]);

  const [grid, setGrid] = useState<Grid>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.grid) return parsed.grid;
        } catch (e) {
          console.error("Failed to parse saved grid", e);
        }
      }
    }
    return createInitialGrid();
  });

  const [stats, setStats] = useState<CityStats>(() => {
    const initial = {
      money: INITIAL_MONEY,
      population: 0,
      day: 1,
      happiness: 80,
      taxRates: {
        residential: 10,
        commercial: 10,
        industrial: 10,
        office: 10,
      },
      loans: [],
      activePolicies: [],
      ratingElectricity: 100,
      ratingWater: 100,
      ratingSewage: 100,
      ratingHeating: 100,
      ratingServices: 100,
      districts: [],
      unemployment: 0,
      traffic: 100,
      landValue: 35,
      popChange: 0,
      netIncome: 120,
      demandRes: 50,
      demandCom: 35,
      demandInd: 20,
      jobStaffingRatio: 1.0,
      comSpamFactor: 1.0,
      indSpamFactor: 1.0,
      offSpamFactor: 1.0,
      totalJobs: 0,
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.stats) {
            return { ...initial, ...parsed.stats };
          }
        } catch (e) {
          console.error("Failed to parse saved stats", e);
        }
      }
    }
    return initial;
  });

  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  const [paintingDistrictId, setPaintingDistrictId] = useState<string | null>(null);
  const [isBuyLandMode, setIsBuyLandMode] = useState<boolean>(false);
  
  // --- AI State ---
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.currentGoal !== undefined) return parsed.currentGoal;
        } catch (e) {}
      }
    }
    return null;
  });
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.newsFeed) return parsed.newsFeed;
        } catch (e) {}
      }
    }
    return [];
  });

  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.aiEnabled !== undefined) return parsed.aiEnabled;
        } catch (e) {}
      }
    }
    return true;
  });

  const [gameStarted, setGameStarted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.gameStarted !== undefined) return parsed.gameStarted;
        } catch (e) {}
      }
    }
    return false;
  });
  
  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const aiEnabledRef = useRef(aiEnabled);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { goalRef.current = currentGoal; }, [currentGoal]);
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  // --- Auto-Save Effect ---
  useEffect(() => {
    if (!gameStarted) return;
    try {
      const saveData = {
        version: 1,
        grid,
        stats,
        currentGoal,
        newsFeed,
        aiEnabled,
        gameStarted,
        timestamp: Date.now()
      };
      localStorage.setItem('skymetropolis-save', JSON.stringify(saveData));
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  }, [grid, stats, currentGoal, newsFeed, aiEnabled, gameStarted]);

  // Check AI Goal Completion as an outcome of state changes
  useEffect(() => {
    if (!gameStarted || !aiEnabled || !currentGoal || currentGoal.completed) return;

    // Count building types on the grid
    const buildingCounts: Record<string, number> = {};
    grid.flat().forEach(tile => {
      if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
        const lvl = tile.level || 1;
        buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + lvl;
      }
    });

    let isMet = false;
    if (currentGoal.targetType === 'money' && stats.money >= currentGoal.targetValue) isMet = true;
    if (currentGoal.targetType === 'population' && stats.population >= currentGoal.targetValue) isMet = true;
    if (currentGoal.targetType === 'building_count' && currentGoal.buildingType) {
      if ((buildingCounts[currentGoal.buildingType] || 0) >= currentGoal.targetValue) isMet = true;
    }

    if (isMet) {
      setCurrentGoal(prev => prev ? { ...prev, completed: true } : null);
    }
  }, [stats.money, stats.population, grid, currentGoal, aiEnabled, gameStarted]);

  // --- AI Logic Wrappers ---

  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]); // Keep last few
  }, []);

  const fetchNewGoal = useCallback(async () => {
    if (isGeneratingGoal || !aiEnabledRef.current) return;
    setIsGeneratingGoal(true);
    // Short delay for visual effect
    await new Promise(r => setTimeout(r, 500));
    
    const newGoal = await generateCityGoal(statsRef.current, gridRef.current);
    if (newGoal) {
      setCurrentGoal(newGoal);
    } else {
      // Retry soon if failed, but only if AI still enabled
      if(aiEnabledRef.current) setTimeout(fetchNewGoal, 5000);
    }
    setIsGeneratingGoal(false);
  }, [isGeneratingGoal]); 

  const fetchNews = useCallback(async () => {
    // chance to fetch news per tick
    if (!aiEnabledRef.current || Math.random() > 0.15) return; 
    const news = await generateNewsEvent(statsRef.current, null);
    if (news) addNewsItem(news);
  }, [addNewsItem]);


  // --- Initial Setup ---
  useEffect(() => {
    if (!gameStarted) return;

    addNewsItem({ id: Date.now().toString(), text: "Welcome to SkyMetropolis. Terrain generation complete. Purchase outer boundaries to expand!", type: 'positive' });
    
    if (aiEnabled) {
      // @google/genai-api-key-fix: The API key's availability is a hard requirement and should not be checked in the UI.
      fetchNewGoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);


  // --- Game Loop ---
  useEffect(() => {
    if (!gameStarted) return;

    const intervalId = setInterval(() => {
      // 1. Gather all active buildings, levels, consumers
      let baseIncome = 0;
      let buildingCounts: Record<string, number> = {};
      let totalBuildings = 0; // count of non-utility, non-road structures
      let maxPop = 0;
      let resCount = 0;
      let roadCount = 0;
      
      // Breakdown counts and level sums to calculate rates and outputs
      let resLevelSum = 0;
      let comLevelSum = 0;
      let indLevelSum = 0;
      let offLevelSum = 0;
      let utilityLevelSum = 0;
      let serviceLevelSum = 0;
      let policeLevelSum = 0;
      let fireLevelSum = 0;
      let hospitalLevelSum = 0;
      let schoolLevelSum = 0;
      let powerPlantLevelSum = 0;
      
      // Detailed utility capacities
      let powerGenerated = 0;
      let waterGenerated = 0;
      let sewageTreated = 0;
      let heatingSupplied = 0;
      let pollutionHarm = 0; // Coal and oil plants create smog and lower happiness
      
      let baseDailyPopGrowth = 0;

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType === BuildingType.Road) {
          roadCount += 1;
        } else if (tile.buildingType !== BuildingType.None) {
          const lvl = tile.level || 1;
          const tier = BUILDING_TIERS[tile.buildingType]?.[lvl] || BUILDINGS[tile.buildingType];
          
          if (tile.buildingType === BuildingType.Residential) {
            resCount += 1;
            resLevelSum += lvl;
            maxPop += lvl === 1 ? 50 : lvl === 2 ? 150 : lvl === 3 ? 400 : 1500;
            baseDailyPopGrowth += tier.popGen;
          } else if (isCommercialType(tile.buildingType)) {
            comLevelSum += lvl;
          } else if (isIndustrialType(tile.buildingType)) {
            indLevelSum += lvl;
          } else if (tile.buildingType === BuildingType.Office) {
            offLevelSum += lvl;
          } else if (tile.buildingType === BuildingType.Utility) {
            utilityLevelSum += lvl;
            // Backwards compatibility with standard Utility tile:
            if (lvl === 1) powerGenerated += 5;
            else if (lvl === 2) waterGenerated += 25;
            else if (lvl === 3) powerGenerated += 18;
            else if (lvl === 4) { powerGenerated += 55; waterGenerated += 50; }
          } else if (tile.buildingType === BuildingType.Service) {
            serviceLevelSum += lvl;
          } else if (tile.buildingType === BuildingType.CoalPlant) {
            const outputs = [10, 25, 60, 150];
            powerGenerated += outputs[lvl - 1] || 10;
            pollutionHarm += lvl * 1.5; // pollutes happiness!
          } else if (tile.buildingType === BuildingType.OilPlant) {
            const outputs = [24, 55, 120, 300];
            powerGenerated += outputs[lvl - 1] || 24;
            pollutionHarm += lvl * 0.8;
          } else if (tile.buildingType === BuildingType.WindTurbine) {
            const outputs = [5, 12, 25, 60];
            powerGenerated += outputs[lvl - 1] || 5;
          } else if (tile.buildingType === BuildingType.SolarPlant) {
            const outputs = [40, 85, 180, 450];
            powerGenerated += outputs[lvl - 1] || 40;
          } else if (tile.buildingType === BuildingType.HydroDam) {
            const outputs = [85, 190, 380, 1000];
            powerGenerated += outputs[lvl - 1] || 85;
          } else if (tile.buildingType === BuildingType.NuclearPlant) {
            const outputs = [250, 550, 1100, 2500];
            powerGenerated += outputs[lvl - 1] || 250;
          } else if (tile.buildingType === BuildingType.WaterPump) {
            const outputs = [15, 35, 80, 200];
            waterGenerated += outputs[lvl - 1] || 15;
          } else if (tile.buildingType === BuildingType.SewageTreatment) {
            const outputs = [18, 40, 90, 220];
            sewageTreated += outputs[lvl - 1] || 18;
          } else if (tile.buildingType === BuildingType.HeatingSystem) {
            const outputs = [20, 45, 100, 250];
            heatingSupplied += outputs[lvl - 1] || 20;
          } else if (tile.buildingType === BuildingType.PowerPlant) {
            powerPlantLevelSum += lvl;
            const outputs = [15, 45, 180, 600];
            powerGenerated += outputs[lvl - 1] || 15;
          } else if (tile.buildingType === BuildingType.PoliceStation) {
            policeLevelSum += lvl;
          } else if (tile.buildingType === BuildingType.FireStation) {
            fireLevelSum += lvl;
          } else if (tile.buildingType === BuildingType.Hospital) {
            hospitalLevelSum += lvl;
          } else if (tile.buildingType === BuildingType.School) {
            schoolLevelSum += lvl;
          }
          
          totalBuildings += 1;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + lvl;
        }
      });

      // 2. Update Stats incrementally in setStats callback
      setStats(prev => {
        // Tax Rates multipliers mapping
        const rTax = prev.taxRates?.residential ?? 10;
        const cTax = prev.taxRates?.commercial ?? 10;
        const iTax = prev.taxRates?.industrial ?? 10;
        const oTax = prev.taxRates?.office ?? 10;

        // Metrics for staffing ratio and overspecialization (spam) penalties
        const totalJobs = (comLevelSum * 8) + (indLevelSum * 15) + (offLevelSum * 12) +
                          (policeLevelSum * 6) + (fireLevelSum * 6) + (hospitalLevelSum * 8) + (schoolLevelSum * 8) +
                          (powerPlantLevelSum * 4);
        
        const workforce = Math.round(prev.population * 0.65);
        
        // Staffing ratio: "you need people in order to make money"
        // If there are job-providing buildings, they must have employees to earn money.
        // If totalJobs is 0, staffing ratio is 1.0 (no penalty)
        const jobStaffingRatio = totalJobs === 0 ? 1.0 : Math.min(1.0, workforce / totalJobs);

        // Anti-spam factor: "you cant just spam one type of job building and get rich"
        // If a single job type exceeds 60% of all job buildings, it suffers from oversaturation.
        let comSpamFactor = 1.0;
        let indSpamFactor = 1.0;
        let offSpamFactor = 1.0;

        const totalJobLevels = comLevelSum + indLevelSum + offLevelSum;
        if (totalJobLevels >= 4) {
          const comRatio = comLevelSum / totalJobLevels;
          const indRatio = indLevelSum / totalJobLevels;
          const offRatio = offLevelSum / totalJobLevels;

          if (comRatio > 0.6) {
            comSpamFactor = Math.max(0.15, 1.0 - (comRatio - 0.6) * 2.0);
          }
          if (indRatio > 0.6) {
            indSpamFactor = Math.max(0.15, 1.0 - (indRatio - 0.6) * 2.0);
          }
          if (offRatio > 0.6) {
            offSpamFactor = Math.max(0.15, 1.0 - (offRatio - 0.6) * 2.0);
          }
        }

        // Random chance of dispatching informative warnings (8% daily chance if problematic)
        if (Math.random() < 0.08) {
          if (workforce === 0 && totalJobs > 0) {
            setTimeout(() => {
              addNewsItem({
                id: (Date.now() + Math.random()).toString(),
                text: `🛑 Understaffing crisis! Zero workforce. Commercial and Industrial zones cannot operate or generate taxes without citizens!`,
                type: 'negative'
              });
            }, 10);
          } else if (jobStaffingRatio < 0.5) {
            setTimeout(() => {
              addNewsItem({
                id: (Date.now() + Math.random()).toString(),
                text: `⚠️ Labor shortage: Job positions are only ${Math.round(jobStaffingRatio * 100)}% staffed. Land revenues are scaling down. Build more housing!`,
                type: 'negative'
              });
            }, 10);
          } else if (comSpamFactor < 0.8 || indSpamFactor < 0.8 || offSpamFactor < 0.8) {
            const worstZone = comSpamFactor < indSpamFactor && comSpamFactor < offSpamFactor ? 'Commercial' : indSpamFactor < offSpamFactor ? 'Industrial' : 'Office';
            setTimeout(() => {
              addNewsItem({
                id: (Date.now() + Math.random()).toString(),
                text: `⚠️ Industry Oversaturation: Too many ${worstZone} buildings constructed. Local market oversaturating; profits are severely penalized!`,
                type: 'neutral'
              });
            }, 10);
          }
        }

        // Base revenue yields mapped dynamically to level structures and current tax rates
        let residentialYield = 0;
        let commercialYield = 0;
        let industrialYield = 0;
        let officeYield = 0;

        gridRef.current.flat().forEach(tile => {
          if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
            const lvl = tile.level || 1;
            const tier = BUILDING_TIERS[tile.buildingType]?.[lvl] || BUILDINGS[tile.buildingType];
            
            if (tile.buildingType === BuildingType.Residential) {
              residentialYield += tier.popGen * 0.4 * (rTax / 10); // residential yields tax based on active pop index
            } else if (isCommercialType(tile.buildingType)) {
              // Yield depends on staffing index and spam factor
              commercialYield += tier.incomeGen * (cTax / 10) * jobStaffingRatio * comSpamFactor;
            } else if (isIndustrialType(tile.buildingType)) {
              // Yield depends on staffing index and spam factor
              industrialYield += tier.incomeGen * (iTax / 10) * jobStaffingRatio * indSpamFactor;
            } else if (tile.buildingType === BuildingType.Office) {
              // Yield depends on staffing index and spam factor
              officeYield += tier.incomeGen * (oTax / 10) * jobStaffingRatio * offSpamFactor;
            }
          }
        });

        // Upkeeps from utilities, services, districts
        let utilityUpkeepSum = 0;
        let serviceUpkeepSum = 0;
        
        const utTypes = [
          BuildingType.Utility,
          BuildingType.CoalPlant,
          BuildingType.OilPlant,
          BuildingType.WindTurbine,
          BuildingType.SolarPlant,
          BuildingType.HydroDam,
          BuildingType.NuclearPlant,
          BuildingType.WaterPump,
          BuildingType.SewageTreatment,
          BuildingType.HeatingSystem,
          BuildingType.PowerPlant
        ];

        const svTypes = [
          BuildingType.Service,
          BuildingType.PoliceStation,
          BuildingType.FireStation,
          BuildingType.Hospital,
          BuildingType.School
        ];

        gridRef.current.flat().forEach(tile => {
          if (utTypes.includes(tile.buildingType)) {
            const lvl = tile.level || 1;
            const tier = BUILDING_TIERS[tile.buildingType]?.[lvl] || BUILDINGS[tile.buildingType];
            utilityUpkeepSum += Math.abs(tier.incomeGen);
          } else if (svTypes.includes(tile.buildingType)) {
            const lvl = tile.level || 1;
            const tier = BUILDING_TIERS[tile.buildingType]?.[lvl] || BUILDINGS[tile.buildingType];
            serviceUpkeepSum += Math.abs(tier.incomeGen);
          }
        });

        // Policies costing maintenance
        let policyExpenses = 0;
        const policies = prev.activePolicies || [];
        if (policies.includes("Heavy Traffic Ban")) policyExpenses += 10;
        if (policies.includes("Free Public Transport")) policyExpenses += 40;
        if (policies.includes("Recycling Programs")) policyExpenses += 20;
        if (policies.includes("Smoke Detectors")) policyExpenses += 15;
        if (policies.includes("Educational Boost")) {
          policyExpenses += 30;
          officeYield *= 1.15; // boost office yield!
        }
        if (policies.includes("Energy Saving")) policyExpenses += 12;

        // District-wide upkeep and rule modifiers
        let districtExpenses = 0;
        const activeDistricts = prev.districts || [];
        activeDistricts.forEach(dist => {
          if (dist.policy === "Eco-Zoning") {
            districtExpenses += 10;
          } else if (dist.policy === "High-Tech Focus") {
            districtExpenses += 15;
            officeYield *= 1.05; // further incremental boost
          } else if (dist.policy === "Police Patrol") {
            districtExpenses += 8;
          }
        });

        // Sum up total earnings and expenses before loans
        let calculatedIncome = (residentialYield + commercialYield + industrialYield + officeYield) - (utilityUpkeepSum + serviceUpkeepSum + policyExpenses + districtExpenses);

        // Loans repayment processing
        let loanPaymentsDeduction = 0;
        const updatedLoans = prev.loans.map(loan => {
          loanPaymentsDeduction += loan.dailyPayment;
          return {
            ...loan,
            amount: Math.max(0, loan.amount - loan.dailyPayment)
          };
        }).filter(loan => {
          const isStillUnpaid = loan.amount > 0;
          if (!isStillUnpaid) {
            // Notify when unpaid completes
            setTimeout(() => {
              addNewsItem({
                id: (Date.now() + Math.random()).toString(),
                text: `🏦 Financial alert: Loan has been fully settled back to the bank!`,
                type: 'positive'
              });
            }, 10);
          }
          return isStillUnpaid;
        });

        const netMoneyChange = calculatedIncome - loanPaymentsDeduction;

        // Citizen Simulation & Jobs Index
        // Factories (indLevelSum), Shops (comLevelSum), Offices (offLevelSum), and municipal services create jobs
        const occupiedJobs = Math.min(workforce, totalJobs);
        const unemployedCount = Math.max(0, workforce - occupiedJobs);
        const unemploymentRate = workforce === 0 ? 0 : Math.round((unemployedCount / workforce) * 100);

        // Calculate Electricity, Water and Services caps dynamically
        const consumerCount = resCount + comLevelSum + indLevelSum + offLevelSum;
        const energyModifier = policies.includes("Energy Saving") ? 0.75 : 1.0;
        const effectiveConsumers = Math.max(1, consumerCount * energyModifier);

        const powerNeeded = effectiveConsumers * 6;
        const waterNeeded = effectiveConsumers * 5;
        const sewageNeeded = effectiveConsumers * 5;
        const heatingNeeded = effectiveConsumers * 5;

        // Electricity ratings
        let ratingElec = (consumerCount === 0 || prev.population < 30) ? 100 : Math.min(100, Math.round((powerGenerated / powerNeeded) * 100));
        if (policies.includes("Recycling Programs")) ratingElec = Math.min(100, ratingElec + 8);

        // Water ratings
        let ratingWat = (consumerCount === 0 || prev.population < 30) ? 100 : Math.min(100, Math.round((waterGenerated / waterNeeded) * 100));

        // Sewage treatment ratings
        let ratingSew = (consumerCount === 0 || prev.population < 30) ? 100 : Math.min(100, Math.round((sewageTreated / sewageNeeded) * 100));

        // Heating system ratings (Snowfall DLC active)
        let ratingHeat = (consumerCount === 0 || prev.population < 30) ? 100 : Math.min(100, Math.round((heatingSupplied / heatingNeeded) * 100));

        // Services coverage index calculations for Police, Fire, Hospital, and School
        const activePop = Math.max(1, prev.population);
        const ratingPolice = prev.population < 15 ? 100 : Math.min(100, Math.round((policeLevelSum * 220) / Math.max(220, activePop) * 100));
        const ratingFire = prev.population < 15 ? 100 : Math.min(100, Math.round((fireLevelSum * 220) / Math.max(220, activePop) * 100));
        const ratingHealth = prev.population < 15 ? 100 : Math.min(100, Math.round((hospitalLevelSum * 320) / Math.max(320, activePop) * 100));
        const ratingEducation = prev.population < 15 ? 100 : Math.min(100, Math.round((schoolLevelSum * 250) / Math.max(250, activePop) * 100));

        // Combine them into general services rating
        let ratingServ = prev.population === 0 ? 100 : Math.round((ratingPolice + ratingFire + ratingHealth + ratingEducation) / 4);
        
        if (policies.includes("Free Public Transport")) ratingServ = Math.min(100, ratingServ + 15);
        if (policies.includes("Smoke Detectors")) ratingServ = Math.min(100, ratingServ + 10);
        if (policies.includes("Educational Boost")) ratingServ = Math.min(100, ratingServ + 10);

        // Education boosts Commercial/Office yields slightly
        if (ratingEducation > 75) {
          commercialYield *= 1.12;
          officeYield *= 1.15;
        }

        // Happiness calculation
        let calculatedHappiness = 90;
        calculatedHappiness -= (100 - ratingElec) * 0.25;
        calculatedHappiness -= (100 - ratingWat) * 0.2;
        calculatedHappiness -= (100 - ratingSew) * 0.2; // Sewage rating affects health & happiness
        calculatedHappiness -= (100 - ratingHeat) * 0.15;  // Heating is vital for Snowfall comfort
        calculatedHappiness -= (100 - ratingServ) * 0.2;
        calculatedHappiness -= pollutionHarm * 0.5; // Coal & oil plant fumes drop general happiness

        // Unemployment penalty
        if (unemploymentRate > 15) {
          calculatedHappiness -= (unemploymentRate - 15) * 0.3;
        }

        // Average tax deviations - gentler deviation
        const avgTax = (rTax + cTax + iTax + oTax) / 4;
        if (avgTax > 15) {
          calculatedHappiness -= (avgTax - 15) * 4;
        } else if (avgTax < 7) {
          calculatedHappiness += (7 - avgTax) * 1.5;
        }

        // Policy bonuses
        if (policies.includes("Free Public Transport")) calculatedHappiness += 8;
        if (policies.includes("Heavy Traffic Ban")) calculatedHappiness += 3;
        if (policies.includes("Recycling Programs")) calculatedHappiness += 2;

        // District Eco bonus
        activeDistricts.forEach(dist => {
          if (dist.policy === "Eco-Zoning") calculatedHappiness += 2;
        });

        calculatedHappiness = Math.max(10, Math.min(100, Math.round(calculatedHappiness)));
        if (prev.population < 500) {
          calculatedHappiness = 100;
        }

        // Population growths depending on happiness status
        let popDelta = baseDailyPopGrowth;
        if (calculatedHappiness >= 75) {
          popDelta = Math.round(popDelta * 1.5) + 2;
        } else if (calculatedHappiness < 35) {
          // People leave the city if it's too sad
          popDelta = prev.population > 15 ? -Math.max(2, Math.round(prev.population * 0.015)) : 0;
        } else {
          popDelta = Math.max(1, Math.round(popDelta * 0.8));
        }

        // Jobs availability/shortage modifier
        if (totalJobs > workforce && calculatedHappiness >= 50) {
          const vacancies = totalJobs - workforce;
          popDelta += Math.max(1, Math.round(vacancies * 0.04));
        }
        if (unemploymentRate > 15 && prev.population > 20) {
          popDelta -= Math.round(unemploymentRate * 0.08);
        }

        let newPop = prev.population + popDelta;
        if (newPop > maxPop) newPop = maxPop;
        if (newPop < 0) newPop = 0;
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5);

        // Land Value calculation ($/m²)
        let computedLandValue = 30 + Math.round(
          (policeLevelSum * 4) + (fireLevelSum * 4) + (hospitalLevelSum * 6) + (schoolLevelSum * 5) + (ratingEducation > 70 ? 8 : 0) - (pollutionHarm * 1.5)
        );
        computedLandValue = Math.max(15, Math.min(300, computedLandValue));

        // Traffic Flow percent
        let computedTraffic = 100;
        if (roadCount === 0) {
          computedTraffic = totalBuildings > 0 ? 30 : 100;
        } else {
          const roadRatio = totalBuildings / roadCount;
          computedTraffic = Math.max(35, Math.min(100, Math.round(100 - (roadRatio * 6.5) + (policies.includes("Heavy Traffic Ban") ? 10 : 0) + (policies.includes("Free Public Transport") ? 12 : 0))));
        }

        // RCI Demand Bars - boosted defaults to be lively
        // Residential: jobs attract residents. High unemployment repels residents. Happiness boosts.
        let demandResNew = Math.max(25, Math.min(100, Math.round(
          50 + (totalJobs - workforce) * 1.5 - (unemploymentRate > 10 ? (unemploymentRate - 10) * 1.5 : 0) + (calculatedHappiness - 60) * 1.0
        )));
        if (resCount === 0) demandResNew = 90;

        // Commercial: depends on population to shops ratio and residents' purchasing power (employment rate).
        let demandComNew = Math.max(20, Math.min(100, Math.round(
          35 + (newPop / Math.max(1, comLevelSum * 8)) * 15 - unemploymentRate * 0.3 + (calculatedHappiness - 50) * 0.5
        )));

        // Industrial: depends on workforce size for factories, and low taxes.
        let demandIndNew = Math.max(15, Math.min(100, Math.round(
          20 + unemploymentRate * 1.5 + (newPop * 0.08) - (indLevelSum * 4 + offLevelSum * 3)
        )));

        const newStats = {
          ...prev,
          money: Math.round(prev.money + netMoneyChange),
          population: newPop,
          day: prev.day + 1,
          happiness: calculatedHappiness,
          ratingElectricity: ratingElec,
          ratingWater: ratingWat,
          ratingSewage: ratingSew,
          ratingHeating: ratingHeat,
          ratingServices: ratingServ,
          loans: updatedLoans,
          unemployment: unemploymentRate,
          traffic: computedTraffic,
          landValue: computedLandValue,
          popChange: popDelta,
          netIncome: netMoneyChange,
          demandRes: demandResNew,
          demandCom: demandComNew,
          demandInd: demandIndNew,
          jobStaffingRatio,
          comSpamFactor,
          indSpamFactor,
          offSpamFactor,
          totalJobs,
        };

        return newStats;
      });

      // 4. Trigger news
      fetchNews();

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, gameStarted]);


  // --- Interaction Logic ---

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return; // Prevent clicking through start screen

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool; // Capture current tool
    
    if (x < 0 || x >= currentGrid[0].length || y < 0 || y >= currentGrid.length) return;

    const currentTile = currentGrid[y][x];

    // Locked Territory purchasing
    if (currentTile.unlocked === false) {
      if (!isBuyLandMode) {
        addNewsItem({
          id: (Date.now() + Math.random()).toString(),
          text: `⚠️ Enable 'Buy Land' mode in the bottom toolbar to purchase new territory at [${x + 1}, ${y + 1}] for $250.`,
          type: 'neutral'
        });
        return;
      }
      const tileCost = 250;
      if (currentStats.money >= tileCost) {
        let newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, unlocked: true };
        
        setGrid(newGrid);
        setStats(prev => ({ ...prev, money: prev.money - tileCost }));
        
        addNewsItem({
          id: (Date.now() + Math.random()).toString(),
          text: `🗺️ Purchased territory tile at [${x + 1}, ${y + 1}] for $${tileCost}.`,
          type: 'positive'
        });
      } else {
        addNewsItem({
          id: (Date.now() + Math.random()).toString(),
          text: `Insufficient treasury. Territory purchase costs $${tileCost}.`,
          type: 'negative'
        });
      }
      return;
    }

    // Paint district if active
    if (paintingDistrictId) {
      const newGrid = currentGrid.map(row => [...row]);
      const currentLabel = currentStats.districts.find(d => d.id === paintingDistrictId)?.name || 'District';
      const isRemoving = currentTile.districtId === paintingDistrictId;
      newGrid[y][x] = {
        ...currentTile,
        districtId: isRemoving ? undefined : paintingDistrictId
      };
      setGrid(newGrid);
      addNewsItem({
        id: (Date.now() + Math.random()).toString(),
        text: isRemoving 
          ? `📍 Removed area [${x + 1}, ${y + 1}] from ${currentLabel}.`
          : `📍 Added area [${x + 1}, ${y + 1}] to District: ${currentLabel}.`,
        type: 'neutral'
      });
      return;
    }

    const buildingConfig = BUILDINGS[tool];

    // Bulldoze logic
    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None, level: 1 };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
            // Add news feedback
            const prevLvl = currentTile.level || 1;
            const prevName = BUILDING_TIERS[currentTile.buildingType]?.[prevLvl]?.name || currentTile.buildingType;
            addNewsItem({
              id: Date.now().toString(),
              text: `Demolished ${prevName}.`,
              type: 'neutral'
            });
        } else {
            addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
        }
      }
      return;
    }

    // Placement Logic
    if (currentTile.buildingType === BuildingType.None) {
      if (currentStats.money >= buildingConfig.cost) {
        // Deduct cost
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        
        // Place building at Level 1
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool, level: 1 };
        
        setGrid(newGrid);
        const tierNames = BUILDING_TIERS[tool];
        addNewsItem({
          id: (Date.now() + Math.random()).toString(),
          text: `Constructed a new ${tierNames?.[1]?.name || buildingConfig.name}.`,
          type: 'neutral'
        });
      } else {
        // Not enough money feedback
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
      }
    } else if (currentTile.buildingType === tool) {
      // Stack Upgrade Merge logic
      const currentLevel = currentTile.level || 1;
      if (currentLevel < 4) {
        // Population-based checks for merges after Level 2:
        if (currentLevel === 2 && currentStats.population < 200) {
          addNewsItem({
            id: (Date.now() + Math.random()).toString(),
            text: `🔒 Upgrade locked: Population must be at least 200 to merge to Tier 3 (Current: ${currentStats.population}).`,
            type: 'negative'
          });
          return;
        }
        if (currentLevel === 3 && currentStats.population < 600) {
          addNewsItem({
            id: (Date.now() + Math.random()).toString(),
            text: `🔒 Upgrade locked: Population must be at least 600 to merge to Tier 4 (Current: ${currentStats.population}).`,
            type: 'negative'
          });
          return;
        }

        const upgradeCost = buildingConfig.cost * (currentLevel + 1);
        if (currentStats.money >= upgradeCost) {
          // Deduct cost
          setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
          
          const newGrid = currentGrid.map(row => [...row]);
          newGrid[y][x] = { ...currentTile, level: currentLevel + 1 };
          
          const tierNames = BUILDING_TIERS[tool];
          const oldName = tierNames?.[currentLevel]?.name || tool;
          const newName = tierNames?.[currentLevel + 1]?.name || tool;
          
          addNewsItem({
            id: (Date.now() + Math.random()).toString(),
            text: `🛠️ Upgraded and merged ${oldName} into ${newName} for $${upgradeCost}!`,
            type: 'positive'
          });

          setGrid(newGrid);
        } else {
          addNewsItem({
            id: (Date.now() + Math.random()).toString(),
            text: `Treasury insufficient to stack-upgrade (Requires $${upgradeCost}).`,
            type: 'negative'
          });
        }
      } else {
        addNewsItem({
          id: (Date.now() + Math.random()).toString(),
          text: `Building has reached its maximum, ultimate skyscraper tier (Level 4).`,
          type: 'neutral'
        });
      }
    }
  }, [selectedTool, addNewsItem, gameStarted, paintingDistrictId, isBuyLandMode]);

  const handleClaimReward = () => {
    if (currentGoal && currentGoal.completed) {
      setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
      addNewsItem({id: Date.now().toString(), text: `Goal achieved! ${currentGoal.reward} deposited to treasury.`, type: 'positive'});
      setCurrentGoal(null);
      fetchNewGoal();
    }
  };

  const handleSelectTool = useCallback((tool: BuildingType) => {
    setSelectedTool(tool);
    setIsBuyLandMode(false);
    setPaintingDistrictId(null);
  }, []);

  const handleSelectDistrictPaint = useCallback((id: string | null) => {
    setPaintingDistrictId(id);
    if (id !== null) {
      setIsBuyLandMode(false);
      setSelectedTool(BuildingType.None);
    }
  }, []);

  const handleToggleBuyLandMode = useCallback((active: boolean) => {
    setIsBuyLandMode(active);
    if (active) {
      setSelectedTool(BuildingType.None);
      setPaintingDistrictId(null);
    }
  }, []);

  const handleLoadGameData = useCallback((saveData: any) => {
    if (!saveData) return;
    
    setIsBuyLandMode(false);
    setPaintingDistrictId(null);
    
    if (saveData.grid) {
      setGrid(saveData.grid);
      gridRef.current = saveData.grid;
    }
    if (saveData.stats) {
      setStats(saveData.stats);
      statsRef.current = saveData.stats;
    }
    if (saveData.currentGoal !== undefined) {
      setCurrentGoal(saveData.currentGoal);
      goalRef.current = saveData.currentGoal;
    }
    if (saveData.newsFeed !== undefined) {
      setNewsFeed(saveData.newsFeed);
    }
    if (saveData.aiEnabled !== undefined) {
      setAiEnabled(saveData.aiEnabled);
      aiEnabledRef.current = saveData.aiEnabled;
    }
    if (saveData.gameStarted !== undefined) {
      setGameStarted(saveData.gameStarted);
    }
  }, []);

  const handleResetGame = useCallback(() => {
    if (window.confirm("⚠️ HIGH ALERT: Are you sure you want to completely deconstruct the city and start a fresh level? All progress will be lost.")) {
      localStorage.removeItem('skymetropolis-save');
      const freshGrid = createInitialGrid();
      setGrid(freshGrid);
      gridRef.current = freshGrid;
      
      const freshStats = {
        money: INITIAL_MONEY,
        population: 0,
        day: 1,
        happiness: 80,
        taxRates: {
          residential: 10,
          commercial: 10,
          industrial: 10,
          office: 10,
        },
        loans: [],
        activePolicies: [],
        ratingElectricity: 100,
        ratingWater: 100,
        ratingSewage: 100,
        ratingHeating: 100,
        ratingServices: 100,
        districts: [],
        unemployment: 0,
        traffic: 100,
        landValue: 35,
        popChange: 0,
        netIncome: 120,
        demandRes: 50,
        demandCom: 35,
        demandInd: 20,
      };
      setStats(freshStats);
      statsRef.current = freshStats;
      
      setCurrentGoal(null);
      goalRef.current = null;
      setNewsFeed([{
        id: Date.now().toString(),
        text: "City rebuilt! A pristine 16x16 floating island is under construction.",
        type: 'positive'
      }]);
      setGameStarted(false);
      setIsBuyLandMode(false);
      setPaintingDistrictId(null);
    }
  }, []);

  const handleStart = (enabled: boolean) => {
    setAiEnabled(enabled);
    setGameStarted(true);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent transition-all duration-700 ${
      skyTheme === 'azure' ? 'bg-sky-900' :
      skyTheme === 'midnight' ? 'bg-slate-950' :
      skyTheme === 'sunset' ? 'bg-amber-950' :
      'bg-indigo-950'
    }`}>
      {/* 3D Rendering Layer - Always visible now, providing background for start screen */}
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        stats={stats}
        quality={quality}
        isBuyLandMode={isBuyLandMode}
        skyTheme={skyTheme}
        autoRotate={autoRotate}
        alwaysDaytime={alwaysDaytime}
      />
      
      {/* Start Screen Overlay */}
      {!gameStarted && (
        <StartScreen onStart={handleStart} />
      )}

      {/* UI Layer */}
      {gameStarted && (
        <UIOverlay
          stats={stats}
          setStats={setStats}
          selectedTool={selectedTool}
          onSelectTool={handleSelectTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={handleClaimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
          paintingDistrictId={paintingDistrictId}
          onSelectDistrictPaint={handleSelectDistrictPaint}
          quality={quality}
          onSetQuality={setQuality}
          isBuyLandMode={isBuyLandMode}
          onToggleBuyLandMode={handleToggleBuyLandMode}
          grid={grid}
          onLoadSaveData={handleLoadGameData}
          onResetGame={handleResetGame}
          onToggleAiEnabled={setAiEnabled}
          skyTheme={skyTheme}
          onSetSkyTheme={setSkyTheme}
          autoRotate={autoRotate}
          onToggleAutoRotate={setAutoRotate}
          showControls={showControls}
          onToggleShowControls={setShowControls}
          alwaysDaytime={alwaysDaytime}
          onToggleAlwaysDaytime={setAlwaysDaytime}
        />
      )}

      {/* CSS for animations and utility */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .mask-image-b { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%); mask-image: linear-gradient(to bottom, transparent 0%, black 15%); }
        
        /* Vertical text for toolbar label */
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        
        /* Custom scrollbar for news */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

        /* Hide scrollbars for hideable scroll views (like subnavbar) */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}

export default App;
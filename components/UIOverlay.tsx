/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem, Grid } from '../types';
import { BUILDINGS, BUILDING_TIERS } from '../constants';

interface UIOverlayProps {
  stats: CityStats;
  setStats: React.Dispatch<React.SetStateAction<CityStats>>;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  isGeneratingGoal: boolean;
  aiEnabled: boolean;
  paintingDistrictId: string | null;
  onSelectDistrictPaint: (id: string | null) => void;
  quality: 'standard' | 'high';
  onSetQuality: (q: 'standard' | 'high') => void;
  isBuyLandMode: boolean;
  onToggleBuyLandMode: (val: boolean) => void;
  grid: Grid;
  onLoadSaveData: (saveData: any) => void;
  onResetGame: () => void;
  onToggleAiEnabled: (val: boolean) => void;
  skyTheme: 'azure' | 'midnight' | 'sunset' | 'cosmic';
  onSetSkyTheme: (theme: 'azure' | 'midnight' | 'sunset' | 'cosmic') => void;
  autoRotate: boolean;
  onToggleAutoRotate: (val: boolean) => void;
  showControls: boolean;
  onToggleShowControls: (val: boolean) => void;
  alwaysDaytime: boolean;
  onToggleAlwaysDaytime: (val: boolean) => void;
}

const tools = [
  BuildingType.None, // Bulldoze
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Office,
  BuildingType.School,
  BuildingType.PoliceStation,
  BuildingType.FireStation,
  BuildingType.Hospital,
  BuildingType.Utility,
  BuildingType.Park,
];

const UNLOCK_THRESHOLDS: Record<string, number> = {
  [BuildingType.None]: 0,
  [BuildingType.Road]: 0,
  [BuildingType.Residential]: 0,
  [BuildingType.Utility]: 0,
  [BuildingType.Park]: 0,
  [BuildingType.Commercial]: 0,
  [BuildingType.Industrial]: 0,
  [BuildingType.Office]: 0,
  [BuildingType.PoliceStation]: 0,
  [BuildingType.School]: 0,
  [BuildingType.FireStation]: 0,
  [BuildingType.Hospital]: 0,
  [BuildingType.Hotel]: 0,
  [BuildingType.Supermarket]: 0,
  [BuildingType.Cinema]: 0,
  [BuildingType.ShoppingMall]: 0,
  [BuildingType.LogisticsHub]: 0,
  [BuildingType.ChemicalPlant]: 0,
  [BuildingType.TechFactory]: 0,
};

const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
  money: number;
}> = ({ type, isSelected, onClick, money }) => {
  const config = BUILDINGS[type];
  const canAfford = money >= config.cost;
  const isBulldoze = type === BuildingType.None;
  
  // Use 3D color for preview
  const bgColor = config.color;

  return (
    <button
      onClick={onClick}
      disabled={!isBulldoze && !canAfford}
      className={`
        relative flex flex-col items-center justify-center rounded-lg border-2 transition-all shadow-lg backdrop-blur-sm flex-shrink-0
        w-14 h-14 md:w-16 md:h-16
        ${isSelected ? 'border-white bg-white/20 scale-110 z-10 font-bold' : 'border-gray-700 bg-gray-900/80 hover:bg-gray-800'}
        ${!isBulldoze && !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={config.description}
    >
      <div className="w-5 h-5 md:w-7 md:h-7 rounded mb-0.5 md:mb-1 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isBulldoze ? 'transparent' : bgColor }}>
        {isBulldoze && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center font-bold text-xs md:text-sm">✕</div>}
        {type === BuildingType.Road && <div className="w-full h-1.5 bg-gray-800 transform -rotate-45"></div>}
      </div>
      <span className="text-[7.5px] md:text-[9px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{config.name}</span>
      {config.cost > 0 && (
        <span className={`text-[7.5px] md:text-[9.5px] font-mono leading-none ${canAfford ? 'text-green-300' : 'text-red-400'}`}>${config.cost}</span>
      )}
    </button>
  );
};

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  setStats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  isGeneratingGoal,
  aiEnabled,
  paintingDistrictId,
  onSelectDistrictPaint,
  quality,
  onSetQuality,
  isBuyLandMode,
  onToggleBuyLandMode,
  grid,
  onLoadSaveData,
  onResetGame,
  onToggleAiEnabled,
  skyTheme,
  onSetSkyTheme,
  autoRotate,
  onToggleAutoRotate,
  showControls,
  onToggleShowControls,
  alwaysDaytime,
  onToggleAlwaysDaytime,
}) => {
  const newsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [helpPanelTab, setHelpPanelTab] = useState<'controls' | 'fusion'>('controls');
  const [selectedGuideTab, setSelectedGuideTab] = useState<BuildingType>(BuildingType.Residential);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showSavesMenu, setShowSavesMenu] = useState(false);
  const [importedCode, setImportedCode] = useState('');
  const [saveStatus, setSaveStatus] = useState<{message: string, isError: boolean} | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'tax' | 'loans' | 'policies' | 'districts'>('analytics');
  const [hudCollapsed, setHudCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skymetropolis-hud-collapsed');
      return saved === 'true';
    }
    return false;
  });

  const toggleHudCollapsed = () => {
    setHudCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('skymetropolis-hud-collapsed', String(next));
      return next;
    });
  };

  // Categories configurations
  const categories = [
    {
      id: 'road',
      name: 'Road',
      icon: '🛣️',
      items: [BuildingType.Road]
    },
    {
      id: 'residential',
      name: 'Residential',
      icon: '🏠',
      items: [BuildingType.Residential]
    },
    {
      id: 'commercial',
      name: 'Commercial',
      icon: '🛒',
      items: [
        BuildingType.Commercial, 
        BuildingType.Supermarket, 
        BuildingType.Hotel, 
        BuildingType.Cinema, 
        BuildingType.ShoppingMall
      ]
    },
    {
      id: 'industrial',
      name: 'Industrial',
      icon: '🏭',
      items: [
        BuildingType.Industrial, 
        BuildingType.LogisticsHub, 
        BuildingType.ChemicalPlant, 
        BuildingType.TechFactory
      ]
    },
    {
      id: 'office',
      name: 'Office',
      icon: '🏢',
      items: [BuildingType.Office]
    },
    {
      id: 'utilities',
      name: 'Utilities',
      icon: '⚡',
      items: [
        BuildingType.WindTurbine,
        BuildingType.CoalPlant,
        BuildingType.PowerPlant,
        BuildingType.OilPlant,
        BuildingType.SolarPlant,
        BuildingType.HydroDam,
        BuildingType.NuclearPlant,
        BuildingType.WaterPump,
        BuildingType.SewageTreatment,
        BuildingType.HeatingSystem
      ]
    },
    {
      id: 'services',
      name: 'Services',
      icon: '🚓',
      items: [
        BuildingType.School,
        BuildingType.PoliceStation,
        BuildingType.FireStation,
        BuildingType.Hospital,
        BuildingType.Service
      ]
    },
    {
      id: 'parks',
      name: 'Entertainment',
      icon: '🎡',
      items: [BuildingType.Park]
    }
  ];

  const getCategoryForTool = (tool: BuildingType) => {
    if (tool === BuildingType.None) return null;
    return categories.find(cat => cat.items.includes(tool))?.id || null;
  };

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Automatically update active category if selectedTool changes elsewhere
  useEffect(() => {
    if (selectedTool !== BuildingType.None) {
      const catId = getCategoryForTool(selectedTool);
      if (catId) {
        setActiveCategory(catId);
      }
    } else {
      setActiveCategory(null);
    }
  }, [selectedTool]);

  const handleCategoryClick = (catId: string) => {
    onToggleBuyLandMode(false);
    if (activeCategory === catId) {
      setActiveCategory(null);
      onSelectTool(BuildingType.None);
    } else {
      setActiveCategory(catId);
      const cat = categories.find(c => c.id === catId);
      if (cat && cat.items.length > 0) {
        const unlockedItem = cat.items.find(item => stats.population >= (UNLOCK_THRESHOLDS[item] ?? 0)) || cat.items[0];
        onSelectTool(unlockedItem);
      }
    }
    onSelectDistrictPaint(null);
  };

  // New District creation state
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictPolicy, setNewDistrictPolicy] = useState('Eco-Zoning');

  // Auto-scroll news
  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  const guideTabs = [
    BuildingType.Residential,
    BuildingType.Commercial,
    BuildingType.Industrial,
    BuildingType.Office,
    BuildingType.WindTurbine,
    BuildingType.CoalPlant,
    BuildingType.OilPlant,
    BuildingType.SolarPlant,
    BuildingType.HydroDam,
    BuildingType.NuclearPlant,
    BuildingType.WaterPump,
    BuildingType.SewageTreatment,
    BuildingType.HeatingSystem,
    BuildingType.Service,
    BuildingType.Park,
  ];

  // Helper formatting values
  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-green-400';
    if (rating >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHappinessFace = (hap: number) => {
    if (hap >= 85) return '😁';
    if (hap >= 65) return '🙂';
    if (hap >= 45) return '😐';
    return '😡';
  };

  // Toggle policies handler
  const handleTogglePolicy = (policyName: string) => {
    setStats(prev => {
      const active = prev.activePolicies || [];
      const hasPolicy = active.includes(policyName);
      return {
        ...prev,
        activePolicies: hasPolicy 
          ? active.filter(p => p !== policyName)
          : [...active, policyName]
      };
    });
  };

  // Tax slider update
  const handleTaxChange = (category: 'residential' | 'commercial' | 'industrial' | 'office', value: number) => {
    setStats(prev => ({
      ...prev,
      taxRates: {
        ...prev.taxRates,
        [category]: value
      }
    }));
  };

  // Loans request handler
  const handleTakeLoan = (amount: number, dailyRepay: number) => {
    if ((stats.loans || []).length >= 3) return;
    setStats(prev => {
      const newL = {
        id: 'loan-' + Date.now(),
        amount: amount * 1.15, // Include 15% interest
        interestRate: 15,
        dailyPayment: dailyRepay
      };
      return {
        ...prev,
        money: prev.money + amount,
        loans: [...(prev.loans || []), newL]
      };
    });
  };

  // Create District
  const handleCreateDistrict = () => {
    if (!newDistrictName.trim()) return;
    setStats(prev => {
      const newD = {
        id: 'dist-' + Date.now(),
        name: newDistrictName.trim(),
        policy: newDistrictPolicy
      };
      return {
        ...prev,
        districts: [...(prev.districts || []), newD]
      };
    });
    setNewDistrictName('');
  };

  // Delete District
  const handleDeleteDistrict = (id: string) => {
    setStats(prev => ({
      ...prev,
      districts: (prev.districts || []).filter(d => d.id !== id)
    }));
    if (paintingDistrictId === id) {
      onSelectDistrictPaint(null);
    }
  };

  // --- Save / Load / Copy Code Helpers ---
  const generateSaveString = () => {
    const saveData = {
      version: 1,
      grid,
      stats,
      currentGoal,
      newsFeed,
      aiEnabled,
      gameStarted: true, // If they export it, it should load active
      timestamp: Date.now()
    };
    try {
      const jsonStr = JSON.stringify(saveData);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      return b64;
    } catch (e) {
      console.error("Failed to generate save string", e);
      return "";
    }
  };

  const loadFromSaveString = (code: string) => {
    try {
      const trimmed = code.trim();
      if (!trimmed) {
        setSaveStatus({ message: "Error: Please enter a valid non-empty save code.", isError: true });
        return;
      }
      const decodedStr = decodeURIComponent(escape(atob(trimmed)));
      const parsed = JSON.parse(decodedStr);
      if (!parsed || !parsed.grid || !parsed.stats) {
        setSaveStatus({ message: "ValidationError: Invalid SkyMetropolis structure. Missing grid or stats.", isError: true });
        return;
      }
      onLoadSaveData(parsed);
      setSaveStatus({ message: "🎉 System Success! Utopia restored from transfer code. Let's build! 🚀", isError: false });
      setImportedCode('');
    } catch (e) {
      setSaveStatus({ message: "ParsingError: Corrupted transfer code. Make sure you copied the complete line.", isError: true });
    }
  };

  const downloadSaveFile = () => {
    const saveData = {
      version: 1,
      grid,
      stats,
      currentGoal,
      newsFeed,
      aiEnabled,
      gameStarted: true,
      timestamp: Date.now()
    };
    try {
      const jsonStr = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `skymetropolis_save_${stats.population}_pop_day_${stats.day}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSaveStatus({ message: "💾 Save File Exported! Clean file downloaded to your downloads folder.", isError: false });
    } catch (e) {
      setSaveStatus({ message: "ExportError: Failed to write JSON save file.", isError: true });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || !parsed.grid || !parsed.stats) {
          setSaveStatus({ message: "FileValidationError: Invalid JSON structure. Main variables are absent.", isError: true });
          return;
        }
        onLoadSaveData(parsed);
        setSaveStatus({ message: "🎉 System Success! Utopia imported from file: " + file.name, isError: false });
      } catch (err) {
        setSaveStatus({ message: "FileParsingError: Failed to parse uploaded JSON file.", isError: true });
      }
    };
    reader.readAsText(file);
  };

  const manualBrowserSave = () => {
    const saveData = {
      version: 1,
      grid,
      stats,
      currentGoal,
      newsFeed,
      aiEnabled,
      gameStarted: true,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('skymetropolis-save', JSON.stringify(saveData));
      setSaveStatus({ message: "✨ Saved to Browser Slot! Auto-save is actively working.", isError: false });
    } catch (e) {
      setSaveStatus({ message: "BrowserSaveError: Local storage write failed.", isError: true });
    }
  };

  const manualBrowserLoad = () => {
    try {
      const saved = localStorage.getItem('skymetropolis-save');
      if (!saved) {
        setSaveStatus({ message: "SlotError: No saved games found in browser slot.", isError: true });
        return;
      }
      const parsed = JSON.parse(saved);
      onLoadSaveData(parsed);
      setSaveStatus({ message: "✨ Session loaded! Restored successfully from browser slot.", isError: false });
    } catch (e) {
      setSaveStatus({ message: "BrowserLoadError: Failed to read from browser slot.", isError: true });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
      
      {/* Top Bar: Stats & Goal */}
      <div className="flex flex-col gap-2 w-full max-w-full">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
          
          {/* Main Dashboard & HUD Indicators */}
          {!hudCollapsed ? (
            <div className="bg-gray-950/95 text-white p-2.5 md:p-3 rounded-xl border border-slate-800 shadow-2xl backdrop-blur-md flex flex-wrap gap-2 md:gap-4.5 items-center justify-between pointer-events-auto">
              
              {/* Collapse to Side trigger */}
              <button
                onClick={toggleHudCollapsed}
                className="p-1 px-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded font-black uppercase text-[8px] md:text-[9.5px] leading-tight text-cyan-400 cursor-pointer active:scale-95 transition-all flex items-center gap-0.5 mr-0.5"
                title="Collapse HUD indicators to side pill"
              >
                ◀ Coll
              </button>

              <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

              {/* Treasury / Day Income */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Treasury</span>
                  <span className={`text-[8.5px] leading-none font-bold font-mono ${stats.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.netIncome >= 0 ? `+$${stats.netIncome}` : `-$${Math.abs(stats.netIncome)}`}/day
                  </span>
                </div>
                <span className="text-sm md:text-xl font-black text-green-400 font-mono leading-none mt-0.5">${stats.money.toLocaleString()}</span>
              </div>
              
              <div className="w-px h-6 bg-slate-800 hidden md:block"></div>
              
              {/* Citizens & Growth change */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none font-sans">Citizens</span>
                  <span className={`text-[8.5px] leading-none font-bold font-mono ${stats.popChange >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {stats.popChange >= 0 ? `+${stats.popChange}` : `${stats.popChange}`}/day
                  </span>
                </div>
                <span className="text-xs md:text-base font-bold text-blue-300 font-mono leading-none mt-0.5">{stats.population.toLocaleString()}</span>
              </div>
              
              <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

              {/* Unemployment Rate */}
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5 font-sans">Unemployment</span>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className={`text-xs md:text-sm font-bold font-mono leading-none ${stats.unemployment > 12 ? 'text-red-300' : 'text-slate-300'}`}>
                    {stats.unemployment}%
                  </span>
                  {stats.population > 0 && (
                    <span className="text-[7px] md:text-[8px] font-mono leading-none text-slate-400">
                      {Math.max(0, Math.round((stats.population * 0.45) * (stats.unemployment / 100))).toLocaleString()} need job{Math.round((stats.population * 0.45) * (stats.unemployment / 100)) !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

              {/* Happiness index */}
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5 font-sans">Happiness</span>
                <span className={`text-xs md:text-base font-bold font-mono leading-none ${getRatingColor(stats.happiness)}`}>
                  {getHappinessFace(stats.happiness)} {stats.happiness}%
                </span>
              </div>
              
              <div className="w-px h-6 bg-slate-800 hidden pr-1 md:block"></div>

              {/* Traffic Flow */}
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5 font-sans">Traffic</span>
                <span className={`text-xs md:text-sm font-bold font-mono leading-none ${stats.traffic >= 80 ? 'text-green-400' : stats.traffic >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stats.traffic}%
                </span>
              </div>

              <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

              {/* Day index */}
              <div className="flex flex-col items-end pr-1">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Day</span>
                <span className="text-xs md:text-sm font-bold text-white font-mono leading-none">{stats.day}</span>
              </div>

              <div className="w-px h-6 bg-slate-800 hidden md:block font-sans"></div>

              {/* Unified Settings Option Panel */}
              <button
                onClick={() => {
                  setShowSavesMenu(true);
                  setShowDashboard(false);
                  setShowHelpDropdown(false);
                  setSaveStatus(null);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-emerald-300 text-white rounded font-bold uppercase text-[9px] md:text-[10px] tracking-wide transition-all select-none cursor-pointer flex items-center gap-1 active:scale-95 shadow-md border border-slate-700"
              >
                ⚙️ Settings
              </button>

              <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

              {/* Dashboard Opener Button */}
              <button
                onClick={() => {
                  setShowDashboard(prev => !prev);
                  setShowHelpDropdown(false);
                  setShowSavesMenu(false);
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold uppercase text-[9px] md:text-[10px] tracking-wide transition-all select-none cursor-pointer"
              >
                💼 City Hall Dashboard {showDashboard ? '✕' : '▲'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pointer-events-auto animate-fade-in bg-gray-950/95 p-2 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">
              <button
                onClick={toggleHudCollapsed}
                className="px-2 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:scale-105 text-white rounded font-bold uppercase text-[9px] md:text-[10px] tracking-wide transition-all select-none cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md font-mono"
                title="Expand stats panel"
              >
                ▶ <span className="text-[11px]">📊</span> <span className="font-sans">SYS HUD</span>
              </button>
              
              <div className="w-px h-5 bg-slate-800"></div>

              {/* Mini Indicators */}
              <div className="flex items-center gap-2.5 px-0.5 md:px-1.5">
                <div className="flex flex-col text-left">
                  <span className="text-[7.2px] text-slate-400 font-bold uppercase leading-none">Cash</span>
                  <span className="text-[11.5px] font-black text-green-400 font-mono leading-none mt-0.5">${stats.money.toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[7.2px] text-slate-400 font-bold uppercase leading-none font-sans">Pop</span>
                  <span className="text-[11px] font-bold text-blue-300 font-mono leading-none mt-0.5">{stats.population.toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[7.2px] text-slate-400 font-bold uppercase leading-none font-sans">Happy</span>
                  <span className="text-[11px] font-bold text-amber-300 font-mono leading-none mt-0.5">😊 {stats.happiness}%</span>
                </div>
              </div>

              <div className="w-px h-5 bg-slate-800"></div>

              <button
                onClick={() => {
                  setShowDashboard(prev => !prev);
                  setShowHelpDropdown(false);
                  setShowSavesMenu(false);
                }}
                className="px-2 py-1 bg-slate-850 hover:bg-slate-750 font-bold uppercase text-[9px] text-indigo-300 rounded border border-slate-700 cursor-pointer"
              >
                Dashboard
              </button>
              
              <button
                onClick={() => {
                  setShowSavesMenu(true);
                  setShowDashboard(false);
                  setShowHelpDropdown(false);
                  setSaveStatus(null);
                }}
                className="p-1 bg-slate-850 hover:bg-slate-750 font-bold rounded border border-slate-700 cursor-pointer"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          )}

        </div>

        {/* District Painting active guidance block */}
        {paintingDistrictId && (
          <div className="bg-amber-600/90 text-white px-3 py-1.5 rounded-xl border border-amber-400/50 flex justify-between items-center w-full max-w-sm pointer-events-auto self-start shadow-xl animate-pulse">
            <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider">
              📍 Painting: {stats.districts.find(d => d.id === paintingDistrictId)?.name || 'District'}
            </span>
            <button
              onClick={() => onSelectDistrictPaint(null)}
              className="bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded text-[9px] md:text-[10px] font-sans font-bold cursor-pointer select-none"
            >
              Exit Painting
            </button>
          </div>
        )}
      </div>

      {/* Floating Top-Left Unified "?" Guide and Controls panel */}
      <div className="absolute left-2 md:left-4 top-[84px] md:top-[88px] pointer-events-auto flex flex-col items-start gap-2 z-40">
        <button
          onClick={() => {
            setShowHelpDropdown(v => !v);
            setShowDashboard(false);
            setShowSavesMenu(false);
          }}
          className="w-10 h-10 rounded-xl bg-slate-950/95 text-white border border-indigo-500/50 hover:bg-slate-900 font-extrabold flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:scale-105 transition-all text-sm uppercase tracking-wider backdrop-blur-md cursor-pointer select-none"
          title="Utopia Registry Guide & Controls (?)"
        >
          <span className="text-indigo-400 font-black text-lg">?</span>
        </button>

        {showHelpDropdown && (
          <div className="w-80 md:w-96 bg-slate-950/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden p-3 text-white flex flex-col gap-2.5 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-[10px] md:text-xs tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent uppercase font-mono">
                ❓ Utopia Registry & Guide
              </span>
              <button 
                onClick={() => setShowHelpDropdown(false)} 
                className="text-slate-400 hover:text-white font-bold text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setHelpPanelTab('controls')}
                className={`py-1 text-[9px] font-bold uppercase rounded-lg border transition-all cursor-pointer select-none text-center
                  ${helpPanelTab === 'controls' 
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                🎮 Keyboard Controls
              </button>
              <button
                onClick={() => setHelpPanelTab('fusion')}
                className={`py-1 text-[9px] font-bold uppercase rounded-lg border transition-all cursor-pointer select-none text-center
                  ${helpPanelTab === 'fusion' 
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                ✨ Fusion Registry
              </button>
            </div>

            {/* Tab 1: Keyboard Controls */}
            {helpPanelTab === 'controls' && (
              <div className="flex flex-col gap-2 font-mono text-[9px] md:text-[10px] leading-relaxed text-slate-300">
                <div className="bg-indigo-950/20 border border-indigo-800/30 p-2.5 rounded-lg">
                  <p className="font-extrabold text-indigo-300 uppercase tracking-wide text-[10px] mb-2 border-b border-indigo-900/40 pb-1">Primary Navigation Controls</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Navigate Selection:</span>
                      <div className="flex gap-1">
                        <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[8px] font-bold text-slate-200 select-all">[W][A][S][D]</span>
                        <span className="text-slate-500">or</span>
                        <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[8px] font-bold text-slate-200 select-all">[Arrows]</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Build / Manual Fusion:</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[8px] font-bold text-slate-200">[Enter]</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Mouse Interaction:</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[8px] font-bold text-slate-200">Click Tile</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/60 p-2.5 rounded-lg text-slate-400 text-[8.5px] leading-snug">
                  💡 <strong className="text-amber-400 font-semibold font-sans">Pro Tip:</strong> Hover a tier or building tool, select a pre-existing construction, then press <kbd className="text-white font-bold bg-slate-800 px-1 rounded">[Enter]</kbd> to manually stack upgrade and trigger hyper-building merges instantly!
                </div>
              </div>
            )}

            {/* Tab 2: Fusion Registry (from previous Building Merge Guide) */}
            {helpPanelTab === 'fusion' && (
              <>
                {/* Instruction block */}
                <div className="bg-cyan-950/20 border border-cyan-800/30 p-2 rounded-lg text-[9px] md:text-[10px] leading-relaxed text-cyan-200/90 font-mono">
                  <p className="font-bold text-cyan-300 mb-0.5">Fusion Mechanics:</p>
                  <ul className="list-disc pl-3.5 space-y-0.5 select-none text-[8px] md:text-[9.5px]">
                    <li><strong className="text-white">Stack Upgrade & Merge</strong>: Select an existing building and select its matching construction tool, then press <span className="text-indigo-400 font-bold">[Enter]</span> to manually upgrade and merge to the next higher tier!</li>
                  </ul>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 border-b border-slate-900 pb-1.5 overflow-x-auto no-scrollbar">
                  {guideTabs.map((type) => {
                    const config = BUILDINGS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedGuideTab(type)}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] md:text-[9px] font-bold uppercase transition-all flex-shrink-0 cursor-pointer
                          ${selectedGuideTab === type 
                            ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' 
                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                      >
                        {config.name}
                      </button>
                    );
                  })}
                </div>

                {/* Tiers List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar select-none">
                  {[1, 2, 3, 4].map((lvl) => {
                    const tier = BUILDING_TIERS[selectedGuideTab]?.[lvl];
                    if (!tier) return null;
                    return (
                      <div key={lvl} className="flex gap-2 items-start p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[10px]">
                        {/* Badge */}
                        <div className="flex-shrink-0 w-7 h-7 md:w-8 h-8 rounded border border-white/20 flex flex-col justify-center items-center font-mono font-black" style={{ backgroundColor: tier.color }}>
                          <span className="text-[8px] text-black">Lvl</span>
                          <span className="text-[10px] text-black -mt-1">{lvl}</span>
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-1">
                            <span className="font-extrabold text-[10px] md:text-[11px] text-white truncate">{tier.name}</span>
                            <div className="font-mono text-[8px] text-slate-400 font-bold whitespace-nowrap">
                              {tier.incomeGen > 0 && <span className="text-green-400">+${tier.incomeGen}/d</span>}
                              {tier.incomeGen < 0 && <span className="text-red-400">-${Math.abs(tier.incomeGen)}/d</span>}
                              {tier.popGen > 0 && <span className="text-blue-300 ml-1">+{tier.popGen}p/d</span>}
                            </div>
                          </div>
                          <p className="text-[8.5px] md:text-[9.5px] text-slate-400 leading-tight mt-0.5">{tier.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MID PANEL: Mayor Dashboard Modal */}
      {showDashboard && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs pointer-events-auto">
          <div className="lg:w-[480px] w-full max-w-full bg-slate-950/95 border border-indigo-500/30 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.8)] p-4 md:p-5 flex flex-col gap-4 animate-fade-in max-h-[85vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">💼</span>
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-white tracking-widest uppercase font-mono bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  Sky Hall Dashboard
                </h2>
                <p className="text-[8px] md:text-[9.5px] text-slate-400 leading-none">Administrative and fiscal controls of standard mayor</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDashboard(false)} 
              className="text-slate-400 hover:text-white font-bold text-sm bg-slate-900 border border-slate-800 p-1.5 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Sub Navbar */}
          <div className="flex border-b border-slate-900 pb-2 overflow-x-auto no-scrollbar gap-1">
            {(['analytics', 'tax', 'loans', 'policies', 'districts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDashboardTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[9.5px] md:text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all flex-shrink-0
                  ${dashboardTab === tab 
                    ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]' 
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {tab === 'analytics' && '📊 Citizen Needs'}
                {tab === 'tax' && '💰 Taxes & Budget'}
                {tab === 'loans' && '🏦 Banking & Bonds'}
                {tab === 'policies' && '📜 City Policies'}
                {tab === 'districts' && '📍 District Painting'}
              </button>
            ))}
          </div>

          {/* Tab 0: Citizens' Needs Analytics */}
          {dashboardTab === 'analytics' && (
            <div className="flex flex-col gap-3 py-1 animate-fade-in max-h-[50vh] overflow-y-auto pr-1 no-scrollbar select-none text-left">
              
              {/* Overall Happiness & Summary */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-2.5 rounded-xl border border-indigo-500/20 text-[10.5px] md:text-xs">
                <span className="text-indigo-400 font-extrabold uppercase font-mono tracking-wider text-[8.5px] block mb-1">Utopia Satisfaction Analytics</span>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white mb-0.5">Overall Happiness: <span className={getRatingColor(stats.happiness)}>{getHappinessFace(stats.happiness)} {stats.happiness}%</span></h3>
                  <p className="leading-snug text-slate-300">
                    We model daily metrics based on resource availability, service coverage, employment rates, and taxes. Provide adequate zoning and services to increase growth.
                  </p>
                </div>
              </div>

              {/* Priority Action Items block */}
              {(() => {
                const alerts: { text: string; urgent: boolean }[] = [];
                if (stats.ratingElectricity < 80) alerts.push({ text: "⚡ Electricity capacity is low! Install Power Plants or Wind Turbines to restore operations.", urgent: true });
                if (stats.ratingWater < 80) alerts.push({ text: "💧 Water shortages tracked. Build additional Water Pumps immediately.", urgent: true });
                if (stats.ratingSewage < 80) alerts.push({ text: "🌊 Sewage backups detected. Build more Sewage Treatment plants.", urgent: true });
                if (stats.ratingHeating < 80) alerts.push({ text: "🔥 Heating grid is shrouded in cosmic frost. Expand Heating Systems.", urgent: true });
                if (stats.ratingServices < 80) alerts.push({ text: "🚓 Emergency services (Police & Fire & Medical) coverage gaps. Expand station buildings.", urgent: true });
                if (stats.unemployment > 15) alerts.push({ text: "💼 High Unemployment! Residents are idle. Build Commercial or Industrial zones to expand jobs.", urgent: false });
                if (stats.traffic < 70) alerts.push({ text: "🛣️ Traffic gridlock in central transit sectors. Boost transit networks.", urgent: false });
                
                // Staffing and spam alerts
                if (stats.totalJobs && stats.totalJobs > 0 && stats.jobStaffingRatio !== undefined && stats.jobStaffingRatio < 0.95) {
                  const staffedPct = Math.round(stats.jobStaffingRatio * 100);
                  alerts.push({
                    text: `👥 Labor deficit! Businesses are only ${staffedPct}% staffed due to underpopulation. Build Residential zones to supply workers.`,
                    urgent: stats.jobStaffingRatio < 0.5
                  });
                }
                if (stats.comSpamFactor !== undefined && stats.comSpamFactor < 0.9) {
                  alerts.push({
                    text: `💰 Commercial zone spam! Local sales revenue is cut by ${Math.round((1 - stats.comSpamFactor) * 100)}% due to oversaturation. Diverify into Industrial or Offices.`,
                    urgent: false
                  });
                }
                if (stats.indSpamFactor !== undefined && stats.indSpamFactor < 0.9) {
                  alerts.push({
                    text: `🏭 Industrial zone spam! Factory revenue is cut by ${Math.round((1 - stats.indSpamFactor) * 100)}% due to oversaturation. Diverify into Commercial or Offices.`,
                    urgent: false
                  });
                }
                if (stats.offSpamFactor !== undefined && stats.offSpamFactor < 0.9) {
                  alerts.push({
                    text: `🏢 Office zone spam! Corporate revenue is cut by ${Math.round((1 - stats.offSpamFactor) * 100)}% due to oversaturation. Diverify into Commercial or Industrial.`,
                    urgent: false
                  });
                }

                return (
                  <div className="bg-slate-900 border border-slate-850 p-2 rounded-xl text-[10.5px]">
                    <span className="text-slate-500 uppercase font-mono font-bold text-[8px] block mb-1.5">📢 Mayor's Urgent Advisory List</span>
                    {alerts.length === 0 ? (
                      <div className="flex items-center gap-1.5 text-green-400 font-mono font-bold text-[8.5px] md:text-[9.5px]">
                        <span>🟢</span>
                        <span>Perfect Harmony! All citizen needs are satisfied. Your expansion operates at maximum structural stability.</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {alerts.map((alert, i) => (
                          <div key={i} className={`p-1.5 rounded text-[8.5px] md:text-[9.5px] font-mono leading-tight flex items-start gap-1.5 ${alert.urgent ? 'bg-red-950/20 border border-red-900/30 text-red-300' : 'bg-amber-950/20 border border-amber-900/30 text-amber-300'}`}>
                            <span className="mt-0.5">{alert.urgent ? '🚨' : '⚠️'}</span>
                            <span>{alert.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Interactive Citizen Needs Indicators Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                {[
                  {
                    name: "Power & Electricity Grid",
                    val: stats.ratingElectricity,
                    desc: "Sustains factories, shops, heating arrays, and dwellings.",
                    icon: "⚡",
                    rec: "Build: Utility > Power/Wind/Solar"
                  },
                  {
                    name: "Municipal Water Works",
                    val: stats.ratingWater,
                    desc: "Critical resource. Suppresses dehydration and sustains crops.",
                    icon: "💧",
                    rec: "Build: Utility > Water Pump"
                  },
                  {
                    name: "Sewage Bio-Filtration",
                    val: stats.ratingSewage,
                    desc: "Eliminates contamination and disease vectors from the grid.",
                    icon: "🌊",
                    rec: "Build: Utility > Sewage Treatment"
                  },
                  {
                    name: "Geothermal Heat Grids",
                    val: stats.ratingHeating,
                    desc: "Guards buildings against chilling sub-zero altitude freeze.",
                    icon: "🔥",
                    rec: "Build: Utility > Heating System"
                  },
                  {
                    name: "Emergency civil coverage",
                    val: stats.ratingServices,
                    desc: "Safety response times (Schools, Police, Fire, Hospitals).",
                    icon: "🚓",
                    rec: "Build: Services > School/Police/Fire/Hospital"
                  },
                  {
                    name: "Commercial Transport Flow",
                    val: stats.traffic,
                    desc: "Measures gridlock density on elevated infrastructure networks.",
                    icon: "🛣️",
                    rec: "Build more Roads or toggle Transit policies"
                  },
                  {
                    name: "Resident Job Market",
                    val: Math.max(0, 100 - stats.unemployment),
                    desc: "Measures citizens employed successfully in local zone jobs.",
                    icon: "💼",
                    rec: "Build: Commercial, Industrial, or Offices"
                  },
                  {
                    name: "Zoning RCI Demand Rating",
                    val: Math.round((stats.demandRes + stats.demandCom + stats.demandInd) / 3),
                    desc: "Sustains expansion rates based on zoning supply balance.",
                    icon: "📈",
                    rec: "Build corresponding zones to balance demand ratio.",
                    customContent: (
                      <div className="flex flex-col gap-1 w-full mt-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/80">
                        <span className="text-[7.5px] text-slate-400 font-sans leading-none mb-1">RCI demand levels for residential, commercial and industrial grids:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 h-5 flex-1 items-end bg-slate-900 rounded p-0.5 justify-center">
                            <div className="w-2.5 bg-green-500 rounded-sm transition-all duration-500" style={{ height: `${stats.demandRes}%` }} title={`Residential: ${stats.demandRes}%`}></div>
                            <div className="w-2.5 bg-blue-500 rounded-sm transition-all duration-400" style={{ height: `${stats.demandCom}%` }} title={`Commercial: ${stats.demandCom}%`}></div>
                            <div className="w-2.5 bg-amber-400 rounded-sm transition-all duration-400" style={{ height: `${stats.demandInd}%` }} title={`Industrial: ${stats.demandInd}%`}></div>
                          </div>
                          <div className="flex flex-col text-[7px] font-mono leading-tight text-slate-300 flex-shrink-0">
                            <span className="text-green-400">R: {stats.demandRes}%</span>
                            <span className="text-blue-400">C: {stats.demandCom}%</span>
                            <span className="text-amber-400">I: {stats.demandInd}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    name: "Citizen Land Value Index",
                    val: Math.min(100, Math.max(0, Math.round((stats.landValue / 500) * 100))),
                    desc: `Properties are currently valued at $${stats.landValue}/m² average on the local land index.`,
                    icon: "💵",
                    rec: "Upgrade services and parks nearby to boost values."
                  }
                ].map((need, index) => {
                  const percentColor = need.val >= 85 ? 'text-green-400' : need.val >= 60 ? 'text-yellow-400' : 'text-red-400';
                  const barBgColor = need.val >= 85 ? 'bg-green-500' : need.val >= 60 ? 'bg-yellow-400' : 'bg-red-500';

                  return (
                    <div key={index} className="bg-slate-900 border border-slate-850 p-2 rounded-xl flex flex-col gap-1.5 hover:border-indigo-500/30 transition-all text-left">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[9.5px] md:text-[10px] text-white flex items-center gap-1 leading-none">
                          <span>{need.icon}</span> {need.name}
                        </span>
                        <span className={`font-mono font-bold text-[9.5px] ${percentColor} leading-none`}>{need.val}%</span>
                      </div>
                      
                      {/* Slim dynamic progress bar */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${barBgColor} rounded-full transition-all duration-700`} style={{ width: `${need.val}%` }}></div>
                      </div>

                      {need.desc && <p className="text-[8px] md:text-[8.5px] leading-snug text-slate-400 font-sans">{need.desc}</p>}
                      
                      {need.customContent}

                      <div className="bg-slate-950/50 px-1.5 py-0.5 rounded text-[7.5px] font-mono text-indigo-400 flex justify-between items-baseline select-none text-left mt-auto">
                        <span>Recom:</span>
                        <span className="font-semibold">{need.rec}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Tab 1: Taxes & Budgets */}
          {dashboardTab === 'tax' && (
            <div className="flex flex-col gap-3.5 py-1">
              <div className="bg-slate-900/60 p-2 md:p-3 rounded-xl border border-slate-850 text-[10px] md:text-xs">
                <span className="text-slate-400 uppercase font-mono block mb-1">Fiscal Advice</span>
                <p className="leading-relaxed text-slate-300">
                  Base tax rate is <strong className="text-white">10%</strong>. Setting taxes higher boosts immediate treasury deposit incomes, but lowers resident satisfaction and limits long term population grow. Rates below <strong className="text-white">8%</strong> add steady happiness bonuses!
                </p>
              </div>

              {(['residential', 'commercial', 'industrial', 'office'] as const).map(cat => {
                const value = stats.taxRates?.[cat] ?? 10;
                
                let modifiersText = null;
                if (cat === 'commercial' && (stats.jobStaffingRatio !== undefined || stats.comSpamFactor !== undefined)) {
                  const staffStr = stats.jobStaffingRatio !== undefined ? `${Math.round(stats.jobStaffingRatio * 100)}%` : '100%';
                  const spamStr = stats.comSpamFactor !== undefined ? `${Math.round(stats.comSpamFactor * 100)}%` : '100%';
                  modifiersText = (
                    <div className="flex gap-2 text-[8px] font-mono text-slate-450 mt-1 select-none">
                      <span>Staffing efficiency: <strong className={stats.jobStaffingRatio && stats.jobStaffingRatio < 1.0 ? "text-amber-400" : "text-emerald-400"}>{staffStr}</strong></span>
                      <span>•</span>
                      <span>Market diversity: <strong className={stats.comSpamFactor && stats.comSpamFactor < 1.0 ? "text-amber-500" : "text-emerald-400"}>{spamStr}</strong></span>
                    </div>
                  );
                } else if (cat === 'industrial' && (stats.jobStaffingRatio !== undefined || stats.indSpamFactor !== undefined)) {
                  const staffStr = stats.jobStaffingRatio !== undefined ? `${Math.round(stats.jobStaffingRatio * 100)}%` : '100%';
                  const spamStr = stats.indSpamFactor !== undefined ? `${Math.round(stats.indSpamFactor * 100)}%` : '100%';
                  modifiersText = (
                    <div className="flex gap-2 text-[8px] font-mono text-slate-450 mt-1 select-none">
                      <span>Staffing efficiency: <strong className={stats.jobStaffingRatio && stats.jobStaffingRatio < 1.0 ? "text-amber-400" : "text-emerald-400"}>{staffStr}</strong></span>
                      <span>•</span>
                      <span>Market diversity: <strong className={stats.indSpamFactor && stats.indSpamFactor < 1.0 ? "text-amber-500" : "text-emerald-400"}>{spamStr}</strong></span>
                    </div>
                  );
                } else if (cat === 'office' && (stats.jobStaffingRatio !== undefined || stats.offSpamFactor !== undefined)) {
                  const staffStr = stats.jobStaffingRatio !== undefined ? `${Math.round(stats.jobStaffingRatio * 100)}%` : '100%';
                  const spamStr = stats.offSpamFactor !== undefined ? `${Math.round(stats.offSpamFactor * 100)}%` : '100%';
                  modifiersText = (
                    <div className="flex gap-2 text-[8px] font-mono text-slate-450 mt-1 select-none">
                      <span>Staffing efficiency: <strong className={stats.jobStaffingRatio && stats.jobStaffingRatio < 1.0 ? "text-amber-400" : "text-emerald-400"}>{staffStr}</strong></span>
                      <span>•</span>
                      <span>Market diversity: <strong className={stats.offSpamFactor && stats.offSpamFactor < 1.0 ? "text-amber-500" : "text-emerald-400"}>{spamStr}</strong></span>
                    </div>
                  );
                }

                return (
                  <div key={cat} className="flex flex-col gap-1 building-card border border-slate-800/40 p-2.5 rounded-xl bg-slate-900/30">
                    <div className="flex justify-between items-center text-[11px] md:text-xs">
                      <span className="font-extrabold uppercase text-indigo-400 tracking-wide font-mono">{cat} Zone Tax</span>
                      <strong className="text-white font-mono text-xs">{value}%</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      disabled={paintingDistrictId !== null}
                      value={value}
                      onChange={(e) => handleTaxChange(cat, parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1 md:h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    {modifiersText}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Bank Loans Desk */}
          {dashboardTab === 'loans' && (
            <div className="flex flex-col gap-3 py-1">
              <div className="bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-900/30 text-[10.5px] text-indigo-200">
                <span>Maximum 3 outstanding financial instruments are permitted. Each taken loan charges daily automatic deductions for amortization in exchange for lump sum liquidity.</span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-between items-center">
                  <div>
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Metropolitan Loan</span>
                    <h3 className="text-base md:text-lg font-black text-white font-mono mt-0.5">$5,000</h3>
                    <p className="text-[8.5px] text-slate-400 leading-tight mt-1">Amortization: $120/d<br />Includes 15% rate fee</p>
                  </div>
                  <button
                    onClick={() => handleTakeLoan(5000, 120)}
                    disabled={(stats.loans || []).length >= 3}
                    className="mt-3.5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wide text-[9px] py-1.5 px-2 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Borrow Cash
                  </button>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col justify-between items-center">
                  <div>
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Treasury Bond</span>
                    <h3 className="text-base md:text-lg font-black text-white font-mono mt-0.5">$20,000</h3>
                    <p className="text-[8.5px] text-slate-400 leading-tight mt-1">Amortization: $450/d<br />Includes 15% rate fee</p>
                  </div>
                  <button
                    onClick={() => handleTakeLoan(20000, 450)}
                    disabled={(stats.loans || []).length >= 3}
                    className="mt-3.5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wide text-[9px] py-1.5 px-2 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Borrow Cash
                  </button>
                </div>
              </div>

              {/* Outstanding list */}
              <div className="mt-2.5">
                <span className="text-[9px] text-slate-500 tracking-wider uppercase font-mono block mb-1">Active Debt Instruments ({(stats.loans || []).length}/3)</span>
                {(!stats.loans || stats.loans.length === 0) ? (
                  <div className="text-[10px] text-slate-500 italic py-2">Treasury holds zero outstanding financial loans. Good job!</div>
                ) : (
                  <div className="space-y-1.5">
                    {stats.loans.map((loan, idx) => (
                      <div key={loan.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800 text-[10.5px]">
                        <span className="font-mono text-indigo-300">Loan #{idx + 1}</span>
                        <span className="text-white font-bold font-mono">Deduction: -${loan.dailyPayment}/day</span>
                        <span className="text-red-400 font-bold font-mono">${Math.round(loan.amount).toLocaleString()} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: City Policies */}
          {dashboardTab === 'policies' && (
            <div className="flex flex-col gap-2 py-1 max-h-72 overflow-y-auto pr-1">
              {[
                { name: "Heavy Traffic Ban", cost: 10, desc: "Restricts trucks. Happiness holds +3%, offsets commercial load, costs $10 upkeep/day" },
                { name: "Free Public Transport", cost: 40, desc: "Promotes mobility. Social service index +15, Happiness +8, costs $40 upkeep/day" },
                { name: "Recycling Programs", cost: 20, desc: "Eco awareness. Power utility output rating +8%, Happiness +2, costs $20 upkeep/day" },
                { name: "Smoke Detectors", cost: 15, desc: "Mandates safety alarms. Service index +10, costs $15 upkeep/day" },
                { name: "Educational Boost", cost: 30, desc: "Tuition incentives. Service rating +10, Office revenue +15%, costs $30 upkeep/day" },
                { name: "Energy Saving", cost: 12, desc: "Promotes smart bulbs. Lowers power utility load by 25%, costs $12 upkeep/day" },
              ].map(policy => {
                const isActive = (stats.activePolicies || []).includes(policy.name);
                return (
                  <div
                    key={policy.name}
                    onClick={() => handleTogglePolicy(policy.name)}
                    className={`flex justify-between items-start p-2.5 rounded-xl border cursor-pointer transition-all
                      ${isActive 
                        ? 'bg-indigo-950/40 border-indigo-500 pr-3.5' 
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800'}`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-slate-600'}`}></span>
                        <span className="font-bold text-xs white text-slate-100">{policy.name}</span>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 leading-tight">{policy.desc}</p>
                    </div>
                    <div className="flex-shrink-0 font-bold font-mono text-[9px] md:text-[10.5px] whitespace-nowrap bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-800/40 text-indigo-300">
                      -${policy.cost}/day
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 4: District Planner */}
          {dashboardTab === 'districts' && (
            <div className="flex flex-col gap-3 py-1">
              {/* Creator Card */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 flex flex-col gap-2">
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest font-mono">Establish Neighborhood District</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="E.g. Bio-Tech Valley..."
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    className="pointer-events-auto bg-slate-950/90 text-white rounded border border-slate-700 px-2.5 py-1 flex-1 text-[10.5px] items-center outline-none"
                  />
                  <select
                    value={newDistrictPolicy}
                    onChange={(e) => setNewDistrictPolicy(e.target.value)}
                    className="pointer-events-auto bg-slate-950/90 text-white rounded border border-slate-700 p-1 text-[10px]"
                  >
                    <option value="Eco-Zoning">Eco-Zoning ($10/d)</option>
                    <option value="High-Tech Focus">High-Tech ($15/d)</option>
                    <option value="Police Patrol">Police Patrol ($8/d)</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateDistrict}
                  disabled={!newDistrictName.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold uppercase tracking-wide text-[9.5px] py-1 px-3 rounded cursor-pointer disabled:opacity-40"
                >
                  Create and Paint Neighborhood
                </button>
              </div>

              {/* Created Districts list */}
              <div>
                <span className="text-[9px] text-slate-500 tracking-wider uppercase font-mono block mb-1">Local Districts</span>
                {(!stats.districts || stats.districts.length === 0) ? (
                  <div className="text-[10px] text-slate-500 italic py-1">No custom districts found. Create one above to paint specific properties onto islands!</div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                    {stats.districts.map(dist => {
                      const isPaintingCurrent = paintingDistrictId === dist.id;
                      return (
                        <div key={dist.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
                          <div>
                            <span className="font-extrabold text-white text-xs">{dist.name}</span>
                            <span className="text-slate-400 font-mono block mt-0.5 text-[8.5px]">Focus: {dist.policy}</span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => onSelectDistrictPaint(isPaintingCurrent ? null : dist.id)}
                              className={`px-2 py-1 rounded font-bold uppercase text-[8.5px] select-none cursor-pointer transition-all
                                ${isPaintingCurrent 
                                  ? 'bg-amber-500 text-black animate-scale border border-amber-400 shadow-lg' 
                                  : 'bg-indigo-900 text-indigo-100 hover:bg-indigo-800'}`}
                            >
                              {isPaintingCurrent ? '📍 Painting' : '📍 Paint Map'}
                            </button>
                            <button
                              onClick={() => handleDeleteDistrict(dist.id)}
                              className="bg-red-950/30 text-red-400 hover:bg-red-900/30 p-1 rounded font-bold uppercase text-[8.5px] select-none cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Bottom Bar: Tools & News */}
      <div className="flex flex-col-reverse lg:flex-row lg:justify-between lg:items-end pointer-events-auto mt-auto gap-2 w-full max-w-full font-sans">
        
        {/* Toolbar - Responsive horizontal layout */}
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          {/* Detailed Drop-up options construct drawer representing categories (Road, Residential, etc.) */}
          {activeCategory && (() => {
            const cat = categories.find(c => c.id === activeCategory);
            if (!cat) return null;
            
            return (
              <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/95 border border-indigo-500/20 rounded-xl pointer-events-auto shadow-2xl backdrop-blur-xl animate-fade-in w-full lg:w-auto max-w-full">
                <div className="flex justify-between items-center px-1 border-b border-slate-900 pb-1.5">
                  <span className="text-[9px] md:text-[10px] text-indigo-400 font-extrabold tracking-widest uppercase font-mono flex items-center gap-1.5 select-none animate-pulse">
                    <span>{cat.icon}</span> {cat.name} Construction Options
                  </span>
                  <button 
                    onClick={() => {
                      setActiveCategory(null);
                      onSelectTool(BuildingType.None);
                    }} 
                    className="text-[10px] text-slate-500 hover:text-white px-1 select-none font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 min-h-[70px] items-center">
                  {cat.items.map((subType) => {
                    const config = BUILDINGS[subType];
                    if (!config) return null;
                    
                    const threshold = UNLOCK_THRESHOLDS[subType] ?? 0;
                    const isLocked = stats.population < threshold;
                    const canAfford = stats.money >= config.cost;
                    const isSelected = selectedTool === subType;
                    
                    if (isLocked) {
                      return (
                        <div
                          key={subType}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-lg border border-slate-900 bg-slate-900/40 flex flex-col items-center justify-center text-slate-500 relative select-none flex-shrink-0"
                          title={`Requires ${threshold} Citizens to unlock`}
                        >
                          <span className="text-[10px] md:text-xs">🔒</span>
                          <span className="text-[6.5px] md:text-[7.5px] font-bold text-center tracking-tight leading-none uppercase mt-0.5 max-w-[50px] truncate text-slate-500">
                            {config.name}
                          </span>
                          <span className="text-[5px] md:text-[6px] font-mono leading-none mt-0.5 text-slate-500">Pop {threshold}</span>
                        </div>
                      );
                    }

                    // Emoji helper for sub-items
                    const getEmojiForSubtype = (type: BuildingType) => {
                      switch (type) {
                        case BuildingType.Road: return '🛣️';
                        case BuildingType.Residential: return '🏠';
                        case BuildingType.Commercial: return '🛒';
                        case BuildingType.Supermarket: return '🍏';
                        case BuildingType.Hotel: return '🏨';
                        case BuildingType.Cinema: return '🍿';
                        case BuildingType.ShoppingMall: return '🏬';
                        
                        case BuildingType.Industrial: return '🏭';
                        case BuildingType.LogisticsHub: return '📦';
                        case BuildingType.ChemicalPlant: return '🧪';
                        case BuildingType.TechFactory: return '🤖';
                        
                        case BuildingType.Office: return '🏢';
                        case BuildingType.Park: return '🌳';
                        
                        case BuildingType.WindTurbine: return '💨';
                        case BuildingType.CoalPlant: return '🏭';
                        case BuildingType.PowerPlant: return '⚡';
                        case BuildingType.OilPlant: return '🛢️';
                        case BuildingType.SolarPlant: return '☀️';
                        case BuildingType.HydroDam: return '🧱';
                        case BuildingType.NuclearPlant: return '☢️';
                        case BuildingType.WaterPump: return '💧';
                        case BuildingType.SewageTreatment: return '💩';
                        case BuildingType.HeatingSystem: return '🔥';
                        
                        case BuildingType.School: return '🏫';
                        case BuildingType.PoliceStation: return '🚓';
                        case BuildingType.FireStation: return '🚒';
                        case BuildingType.Hospital: return '🏥';
                        case BuildingType.Service: return '🩺';
                        default: return '🏗️';
                      }
                    };

                    return (
                      <button
                        key={subType}
                        onClick={() => onSelectTool(subType)}
                        className={`relative flex flex-col items-center justify-center rounded-lg border transition-all text-white flex-shrink-0 p-1 w-14 h-14 md:w-16 md:h-16 cursor-pointer select-none
                          ${isSelected ? 'border-indigo-400 bg-indigo-950/50 scale-105 shadow-[0_0_10px_rgba(129,140,248,0.25)]' : 'border-slate-800 bg-slate-900/95 hover:bg-slate-850'}
                          ${!canAfford ? 'opacity-40' : ''}
                        `}
                        title={`${config.name}: ${config.description}`}
                      >
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded border border-neutral-700/30 mb-0.5 flex items-center justify-center text-xs md:text-sm select-none" style={{ backgroundColor: isSelected ? 'rgba(99,102,241,0.2)' : config.color + '30', borderColor: config.color }}>
                          {getEmojiForSubtype(subType)}
                        </div>
                        <span className="text-[6.5px] md:text-[8px] font-extrabold truncate w-[52px] text-center font-sans tracking-wide leading-none uppercase mt-0.5">{config.name}</span>
                        <span className={`text-[6px] md:text-[7.5px] font-mono leading-none mt-0.5 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>${config.cost}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Bottom Root Category Selector Bar */}
          <div className="flex gap-1 md:gap-2 bg-gray-950/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl w-full lg:w-auto overflow-x-auto no-scrollbar justify-start items-center">
            <div className="flex gap-1.5 min-w-max px-1">
              {/* Standalone Bulldozer Button */}
              <button
                onClick={() => {
                  onSelectTool(BuildingType.None);
                  setActiveCategory(null);
                  onSelectDistrictPaint(null);
                  onToggleBuyLandMode(false);
                }}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl border-2 transition-all shadow-lg backdrop-blur-md flex-shrink-0
                  w-14 h-14 md:w-16 md:h-16 cursor-pointer select-none
                  ${selectedTool === BuildingType.None && paintingDistrictId === null && !isBuyLandMode
                    ? 'border-red-500 bg-red-950/40 scale-105 z-10 font-bold' 
                    : 'border-slate-800 bg-slate-950/80 hover:bg-slate-900'}
                `}
                title="Bulldoze: Deconstruct a building. Costs $5."
              >
                <span className="text-lg md:text-xl">🚜</span>
                <span className="text-[7.5px] md:text-[9px] font-bold text-red-400 uppercase tracking-wider leading-none mt-1">Bulldoze</span>
              </button>

              {/* Standalone Buy Land Button */}
              <button
                onClick={() => {
                  onToggleBuyLandMode(true);
                  setActiveCategory(null);
                }}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl border-2 transition-all shadow-lg backdrop-blur-md flex-shrink-0
                  w-14 h-14 md:w-16 md:h-16 cursor-pointer select-none
                  ${isBuyLandMode
                    ? 'border-green-500 bg-green-950/40 scale-105 z-10 font-bold shadow-[0_0_12px_rgba(34,197,94,0.3)]' 
                    : 'border-slate-800 bg-slate-950/80 hover:bg-slate-900'}
                `}
                title="Buy Land Mode: Toggle on to expand your floating island boundary tiles securely. Safe from accidental construction clicks!"
              >
                <span className="text-lg md:text-xl">🗺️</span>
                <span className="text-[7.5px] md:text-[9px] font-bold text-green-400 uppercase tracking-wider leading-none mt-1">Buy Land</span>
              </button>

              {/* Loop through Categories */}
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;

                // Lock category if all items are locked from general view
                const allLocked = cat.items.every(item => stats.population < (UNLOCK_THRESHOLDS[item] ?? 0));
                const lowestThreshold = Math.min(...cat.items.map(item => UNLOCK_THRESHOLDS[item] ?? 0));

                if (allLocked) {
                  return (
                    <div
                      key={cat.id}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 border-slate-900 bg-slate-950/40 flex flex-col items-center justify-center text-slate-600 relative select-none"
                      title={`Requires ${lowestThreshold} citizens to unlock`}
                    >
                      <span className="text-[12px] md:text-sm">🔒</span>
                      <span className="text-[6.5px] md:text-[7.5px] font-semibold text-center tracking-tight leading-none uppercase mt-0.5 max-w-[50px] truncate text-slate-500">
                        {cat.name}
                      </span>
                      <span className="text-[5px] md:text-[6px] font-mono text-slate-500 leading-none">
                        Pop {lowestThreshold}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`
                      relative flex flex-col items-center justify-center rounded-xl border-2 transition-all shadow-lg backdrop-blur-md flex-shrink-0
                      w-14 h-14 md:w-16 md:h-16 cursor-pointer select-none
                      ${isSelected 
                        ? 'border-indigo-400 bg-indigo-950/40 scale-105 z-10 font-bold shadow-[0_0_12px_rgba(129,140,248,0.2)]' 
                        : 'border-slate-800 bg-slate-950/80 hover:bg-slate-900'}
                    `}
                    title={`Open ${cat.name} category`}
                  >
                    <span className="text-lg md:text-xl drop-shadow-sm">{cat.icon}</span>
                    <span className="text-[7.2px] md:text-[8.5px] font-bold text-slate-200 uppercase tracking-wider leading-none mt-1">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[7.5px] text-slate-500 uppercase writing-mode-vertical flex items-center justify-center font-black tracking-widest pl-1 border-l border-slate-800 select-none font-sans">Build</div>
          </div>
        </div>

        {/* News Feed */}
        <div className="w-full md:w-80 h-28 md:h-36 bg-black/85 text-white rounded-xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative">
          <div className="bg-slate-900/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-800 flex justify-between items-center">
            <span>City News Channel</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          </div>
          
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-25 z-20"></div>
          
          <div ref={newsRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 text-[9.5px] md:text-[10.5px] font-mono scroll-smooth mask-image-b z-10">
            {newsFeed.length === 0 && <div className="text-slate-600 italic text-center mt-7 select-none">No immediate city updates stream.</div>}
            {newsFeed.map((news) => (
              <div key={news.id} className={`
                border-l-2 pl-2 py-0.5 transition-all animate-fade-in leading-normal relative
                ${news.type === 'positive' ? 'border-green-500 text-green-200 bg-green-950/15' : ''}
                ${news.type === 'negative' ? 'border-red-500 text-red-200 bg-red-950/15' : ''}
                ${news.type === 'neutral' ? 'border-blue-400 text-blue-100 bg-blue-950/15' : ''}
              `}>
                <span className="opacity-50 text-[7px] absolute top-0.5 right-1 select-none">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                {news.text}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal - SkyMetropolis City Advisory Guide */}
      {showHelpMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div className="text-left">
                  <h3 className="font-bold text-white text-sm md:text-base">SkyMetropolis City Advisory Guide</h3>
                  <p className="text-[10px] md:text-xs text-slate-400">Master the physics of floating city expansion</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpMenu(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs md:text-sm text-left">
              
              {/* RCI Demand Section */}
              <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5">
                  📈 The RCI Demand System
                </h4>
                <p className="text-slate-400 text-[10px] md:text-xs mb-4 leading-relaxed">
                  Floating cities are governed by citizens' needs. The multicolored bars show the immediate development demand for different building zones:
                </p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 font-bold flex items-center justify-center border border-green-500/30 flex-shrink-0">R</span>
                    <div>
                      <h5 className="font-bold text-white text-[11px] md:text-xs">Residential Demand (Citizens & Cabins)</h5>
                      <p className="text-slate-400 text-[10px] md:text-xs mt-0.5 leading-relaxed">
                        Driven by jobs availability and general commercial outlets. Higher value means citizens need housing. Keep happiness high and build houses (or stack build townhouses and apartments) to increase population.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 flex-shrink-0">C</span>
                    <div>
                      <h5 className="font-bold text-white text-[11px] md:text-xs">Commercial Demand (Shops & Retail)</h5>
                      <p className="text-slate-400 text-[10px] md:text-xs mt-0.5 leading-relaxed">
                        Driven by city population size (shoppers) and tourists. Higher demand means businesses are demanding commercial space. Construct Shops, Supermarkets, Cinemas, or Leisure Hotels to collect premium daily sales taxes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 flex-shrink-0">I</span>
                    <div>
                      <h5 className="font-bold text-white text-[11px] md:text-xs">Industrial Demand (Factories & Tech)</h5>
                      <p className="text-slate-400 text-[10px] md:text-xs mt-0.5 leading-relaxed">
                        Driven by unemployment indices and citizen size. High demand means there are jobless citizens seeking physical production tasks. Place heavy Factories, logistics yards, or Chemical/Tech chip foundries to provide ample jobs.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Stack / Fusion Grid Section */}
              <section className="space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5">
                  🗼 Dynamic Fusion and Tiers
                </h4>
                <p className="text-slate-300 text-[10px] md:text-xs leading-relaxed">
                  Unlike static builders, SkyMetropolis features <strong className="text-indigo-400 font-semibold">Chained Fusion</strong>. Construct identical adjacent structures of the same level to automatically trigger a fusion merge into futuristic high-rises (up to Level 4 structures):
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px] md:text-xs pl-2">
                  <li><strong>Level 1 (Basic)</strong>: Cozy cottages, local minimarts, basic workshops.</li>
                  <li><strong>Level 2 (Medium)</strong>: Townhouses, plazas, heavy factories, district depots.</li>
                  <li><strong>Level 3 (Advanced)</strong>: Apartment towers, boutique hotels, chemical labs.</li>
                  <li><strong>Level 4 (Utopian)</strong>: Glass skybridges, quantum hypermalls, subatomic foundries.</li>
                </ul>
              </section>

              {/* Gameplay tips */}
              <section className="space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5">
                  🔑 Advisor Tips for Sky Mayors
                </h4>
                <ul className="space-y-2 text-[10px] md:text-xs leading-relaxed text-slate-300">
                  <li>
                    🌐 <strong className="text-cyan-400 font-medium">Happiness Cap</strong>: Happiness stays locked at a perfect <span className="text-green-400 font-mono font-bold">100%</span> until you reach 500 citizens! Take advantage of this early-game honeymoon phase to design your metropolis, establish secure loan deals, and lay initial road lines.
                  </li>
                  <li>
                    ⚡ <strong className="text-cyan-400 font-medium">Utilities & Services</strong>: Build Water Pumps, Sewage Treatment, and Power Plants to keep shortages at bay. Deficits rapidly drain happiness once population passes the 500 mark.
                  </li>
                  <li>
                    💵 <strong className="text-cyan-400 font-medium font-bold">Expansion Borders</strong>: Enable <span className="text-green-400 font-bold">Buy Land</span> mode in the bottom toolbar, select any locked boundary zone, and press <span className="text-indigo-400 font-bold">[Enter]</span> (or click) to purchase and unlock more territory, maximizing your available building space.
                  </li>
                </ul>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/40">
              <button
                onClick={() => setShowHelpMenu(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-cyan-500/20 hover:shadow-sm text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Got it, back to building!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal - SkyMetropolis Save Vault & Laptop Transfer Portal */}
      {showSavesMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <div className="text-left">
                  <h3 className="font-bold text-white text-sm md:text-base">City Settings & Saves Control Desk</h3>
                  <p className="text-[10px] md:text-xs text-slate-400">Configure simulation options, save files, or copy instant travel codes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSavesMenu(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Close settings menu"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-5 text-slate-300 text-xs md:text-sm text-left">
              
              {/* Dynamic Action Status Messages */}
              {saveStatus && (
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  saveStatus.isError 
                    ? 'bg-red-950/50 border-red-500/50 text-red-300' 
                    : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                }`}>
                  <span className="text-sm">{saveStatus.isError ? '⚠️' : '✅'}</span>
                  <div className="flex-1 text-[11px] md:text-xs font-semibold font-sans">
                    {saveStatus.message}
                  </div>
                  <button 
                    onClick={() => setSaveStatus(null)} 
                    className="text-[10px] opacity-60 hover:opacity-100 font-bold px-1.5 cursor-pointer ml-auto"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* SECTION 1: Game Options & Visual Performance Settings */}
              <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
                <h4 className="text-amber-400 font-bold flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5">
                  🕹️ Simulation & Graphics Settings
                </h4>
                
                <div className="space-y-4">
                  {/* Resolution Toggle */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-left flex-1">
                      <span className="block text-xs font-bold text-slate-200">Rendering Resolution Fidelity</span>
                      <span className="text-[10px] text-slate-400">Standard for smooth frame-rates; High unlocks detailed tile shadows and anti-aliasing.</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                      <button
                        onClick={() => onSetQuality('standard')}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${quality === 'standard' ? 'bg-slate-700 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        STD (Standard)
                      </button>
                      <button
                        onClick={() => onSetQuality('high')}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${quality === 'high' ? 'bg-indigo-600 border border-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        ✨ High-Fidelity
                      </button>
                    </div>
                  </div>

                  {/* AI Goals Advisor Toggle */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-3">
                    <div className="text-left flex-1">
                      <span className="block text-xs font-bold text-slate-200">Gemini Strategic AI Goals Advisor</span>
                      <span className="text-[10px] text-slate-400">Controls generation of dynamic city targets, financial rewards, and morning news ticker events.</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                      <button
                        onClick={() => onToggleAiEnabled(false)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${!aiEnabled ? 'bg-slate-700 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        OFF (Pure Mode)
                      </button>
                      <button
                        onClick={() => onToggleAiEnabled(true)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${aiEnabled ? 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        ON (Advisor Mode)
                      </button>
                    </div>
                  </div>

                  {/* Camera Auto-Rotation */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-3">
                    <div className="text-left flex-1">
                      <span className="block text-xs font-bold text-slate-200">Cinematic Orbit Camera Tour</span>
                      <span className="text-[10px] text-slate-400">Actively rotates the camera slowly around your floating city for a dynamic scenic showcase.</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                      <button
                        onClick={() => onToggleAutoRotate(false)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${!autoRotate ? 'bg-slate-700 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        OFF
                      </button>
                      <button
                        onClick={() => onToggleAutoRotate(true)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${autoRotate ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        🎥 ACTIVE
                      </button>
                    </div>
                  </div>

                  {/* Keyboard Guide HUD Overlay */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-3">
                    <div className="text-left flex-1">
                      <span className="block text-xs font-bold text-slate-200">Keyboard Controls HUD Overlay</span>
                      <span className="text-[10px] text-slate-400">Shows or hides the WASD/Arrow keys floating visual guide box in the bottom-left of the screen.</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                      <button
                        onClick={() => onToggleShowControls(false)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${!showControls ? 'bg-slate-700 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        HIDE
                      </button>
                      <button
                        onClick={() => onToggleShowControls(true)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${showControls ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        SHOW
                      </button>
                    </div>
                  </div>

                  {/* Always Daytime Mode */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-3">
                    <div className="text-left flex-1">
                      <span className="block text-xs font-bold text-slate-200">Always Daytime Mode</span>
                      <span className="text-[10px] text-slate-400">Lock the skies at daytime light values and disable dynamic night simulation cycles completely.</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                      <button
                        onClick={() => onToggleAlwaysDaytime(false)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${!alwaysDaytime ? 'bg-slate-700 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        OFF
                      </button>
                      <button
                        onClick={() => onToggleAlwaysDaytime(true)}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold transition-all cursor-pointer ${alwaysDaytime ? 'bg-indigo-600 border border-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        🌞 ALWAYS DAY
                      </button>
                    </div>
                  </div>

                  {/* Backdrop Sky Theme selection */}
                  <div className="flex flex-col gap-2 border-t border-slate-800/60 pt-3">
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-200">Utopia Canopy Backdrop Atmosphere</span>
                      <span className="text-[10px] text-slate-400">Customize the clear color theme of the sky atmosphere framing your floating island.</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl">
                      {(['azure', 'midnight', 'sunset', 'cosmic'] as const).map((theme) => {
                        const active = skyTheme === theme;
                        const label = theme === 'azure' ? '🔵 Sky Azure' :
                                      theme === 'midnight' ? '🌑 Midnight' :
                                      theme === 'sunset' ? '🌅 Sunset' : '🌌 Cosmic';
                        return (
                          <button
                            key={theme}
                            onClick={() => onSetSkyTheme(theme)}
                            className={`py-1 text-[9px] font-bold uppercase rounded-lg border transition-all cursor-pointer select-none text-center
                              ${active 
                                ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow' 
                                : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Browser Autosave & Local DB Cache Management */}
              <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <h4 className="text-emerald-400 font-bold flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5 border-emerald-900/40">
                  🗄️ Browser Cache Slots (Persistent Database)
                </h4>
                <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed">
                  The game automatically records your 16x16 layout whenever a tile builds or state changes. Use these tools to force save checkpoints or restore previous browser session states.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <button
                    onClick={manualBrowserSave}
                    className="py-2 bg-slate-850 hover:bg-slate-800 hover:border-emerald-500 text-slate-200 border border-slate-700/60 rounded-lg text-[10px] md:text-xs font-bold transition-all text-center cursor-pointer select-none active:scale-95"
                    title="Force write immediate state snapshot to browser"
                  >
                    💾 Force Save Day
                  </button>
                  <button
                    onClick={manualBrowserLoad}
                    className="py-2 bg-slate-850 hover:bg-slate-800 hover:border-indigo-500 text-slate-200 border border-slate-700/60 rounded-lg text-[10px] md:text-xs font-bold transition-all text-center cursor-pointer select-none active:scale-95"
                    title="Load previously saved backup from browser memories"
                  >
                    📖 Restore Browser Slot
                  </button>
                </div>
              </section>

              {/* SECTION 3: Save File Blueprint System (JSON Export/Import) */}
              <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <h4 className="text-cyan-400 font-bold flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5 border-cyan-900/40">
                  📁 Save File Blueprints (.json)
                </h4>
                <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed">
                  Export your entire floating city state as a lightweight JSON blueprint file. Perfect for storing historic backups on your drive or transferring files directly.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <button
                    onClick={downloadSaveFile}
                    className="py-2 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 rounded-lg text-[10px] md:text-xs font-bold transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1.5 active:scale-95"
                    title="Download the full 16x16 grid and stats state as a JSON file"
                  >
                    📤 Download save.json
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 rounded-lg text-[10px] md:text-xs font-bold transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1.5 active:scale-95"
                    title="Upload and restore a SkyMetropolis city state JSON file"
                  >
                    📥 Upload save.json
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
              </section>

              {/* SECTION 4: Laptop-to-Laptop Transfer Code (Compressed String string) */}
              <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <h4 className="text-indigo-400 font-bold flex items-center gap-2 text-xs md:text-sm border-b border-slate-800 pb-1.5 border-indigo-900/40">
                  💻 Keyboard-Paste Transfer Code (No files required!)
                </h4>
                <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed">
                  Moving progress to another laptop? Just copy the generated text string below, paste it directly in the text input on your other laptop click "Load Code", and construct instantly!
                </p>
                
                {/* Generated Code Area */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Your Current Laptop Transfer Code:</span>
                  <div className="flex gap-1.5">
                    <textarea
                      readOnly
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      value={generateSaveString()}
                      className="w-full flex-1 h-12 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg p-1.5 text-[9px] font-mono text-left focus:outline-none focus:border-amber-500/55 cursor-text leading-tight resize-none select-all font-mono"
                      title="Click once to select all, then use Ctrl+C / Cmd+C"
                    />
                    <button
                      onClick={() => {
                        const code = generateSaveString();
                        navigator.clipboard.writeText(code)
                          .then(() => {
                            setSaveStatus({ message: "📋 Utopia transfer code copied to clipboard successfully! Paste this code in the input area of your other laptop.", isError: false });
                          })
                          .catch(() => {
                            setSaveStatus({ message: "Note: Clipboard blocked by frame. Please highlight the text area and copy it manually using Ctrl+C.", isError: false });
                          });
                      }}
                      className="px-3 bg-indigo-650/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-800/60 hover:border-indigo-500 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer font-sans select-none flex items-center justify-center active:scale-95 shrink-0"
                      title="Copy transfer string to clipboard"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>

                {/* Import Code Area */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Paste code to Import on this laptop:</span>
                  <div className="flex gap-1.5">
                    <textarea
                      placeholder="Paste your 16x16 SkyMetropolis transfer code here..."
                      value={importedCode}
                      onChange={(e) => setImportedCode(e.target.value)}
                      className="w-full flex-1 h-12 bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg p-1.5 text-[9px] font-mono select-text placeholder-slate-700 text-left focus:outline-none focus:border-indigo-550 leading-tight resize-none font-mono"
                    />
                    <button
                      onClick={() => {
                        loadFromSaveString(importedCode);
                      }}
                      className="px-3 bg-emerald-600/20 hover:bg-emerald-650/30 text-emerald-300 border border-emerald-800/60 hover:border-emerald-500 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer font-sans select-none flex items-center justify-center whitespace-nowrap active:scale-95 shrink-0"
                      title="Parse transfer code and recover layout"
                    >
                      ⚡ Load Code
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION 5: Danger Zone Resets */}
              <section className="bg-red-950/10 p-3 rounded-xl border border-red-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3">
                <div className="text-left flex-1">
                  <h5 className="font-bold text-red-400 text-xs flex items-center gap-1">⚠️ Danger Zone: Fresh Rebuild</h5>
                  <p className="text-[9.5px] text-slate-500 leading-tight mt-0.5">Completely clean the browser cache, clear your current city state, and reset map grids to 16x16.</p>
                </div>
                <button
                  onClick={() => {
                    onResetGame();
                    setShowSavesMenu(false);
                  }}
                  className="py-1.5 px-3 bg-red-950/40 hover:bg-red-950 text-red-300 border border-red-800/40 hover:border-red-600 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer whitespace-nowrap select-none active:scale-95 shrink-0"
                >
                  💣 Rebuild Island
                </button>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/40 pb-5">
              <button
                onClick={() => setShowSavesMenu(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-sm text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95"
              >
                Return to Metropolis
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UIOverlay;

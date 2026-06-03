/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem } from '../types';
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
}) => {
  const newsRef = useRef<HTMLDivElement>(null);
  const [showFusionGuide, setShowFusionGuide] = useState(false);
  const [selectedGuideTab, setSelectedGuideTab] = useState<BuildingType>(BuildingType.Residential);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'tax' | 'loans' | 'policies' | 'districts'>('tax');

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

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
      
      {/* Top Bar: Stats & Goal */}
      <div className="flex flex-col gap-2 w-full max-w-full">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
          
          {/* Main Dashboard & HUD Indicators */}
          <div className="bg-gray-950/95 text-white p-2.5 md:p-3 rounded-xl border border-slate-800 shadow-2xl backdrop-blur-md flex flex-wrap gap-2 md:gap-4.5 items-center justify-between pointer-events-auto">
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

            {/* Land value index */}
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5 font-sans">Land Value</span>
              <span className="text-xs md:text-sm font-bold text-emerald-400 font-mono leading-none">
                ${stats.landValue}/m²
              </span>
            </div>

            <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

            {/* Micro Demand Bars (🟩 🟦 🟨) */}
            <div className="flex flex-col items-start gap-1 justify-center">
              <span className="text-[7.2px] text-slate-500 font-bold uppercase tracking-wider leading-none">Demand</span>
              <div className="flex items-center gap-1.5 h-6">
                <div className="flex items-center gap-0.5 h-full">
                  {/* Residential (Green) */}
                  <div className="w-1.5 h-full bg-slate-800 rounded-sm relative overflow-hidden flex flex-col justify-end" title={`Residential: ${stats.demandRes}%`}>
                    <div className="w-full bg-green-500 rounded-sm transition-all duration-500" style={{ height: `${stats.demandRes}%` }}></div>
                  </div>
                  {/* Commercial (Blue) */}
                  <div className="w-1.5 h-full bg-slate-800 rounded-sm relative overflow-hidden flex flex-col justify-end" title={`Commercial: ${stats.demandCom}%`}>
                    <div className="w-full bg-blue-500 rounded-sm transition-all duration-400" style={{ height: `${stats.demandCom}%` }}></div>
                  </div>
                  {/* Industrial (Yellow) */}
                  <div className="w-1.5 h-full bg-slate-800 rounded-sm relative overflow-hidden flex flex-col justify-end" title={`Industrial: ${stats.demandInd}%`}>
                    <div className="w-full bg-amber-400 rounded-sm transition-all duration-400" style={{ height: `${stats.demandInd}%` }}></div>
                  </div>
                </div>
                {/* Actual demand values */}
                <div className="flex flex-col text-[7px] md:text-[8px] font-mono leading-none text-slate-300">
                  <span className="text-green-400 font-bold">R:{stats.demandRes}%</span>
                  <span className="text-blue-400 font-bold">C:{stats.demandCom}%</span>
                  <span className="text-amber-400 font-bold">I:{stats.demandInd}%</span>
                </div>
                {/* Help Button */}
                <button
                  onClick={() => setShowHelpMenu(true)}
                  className="w-4 h-4 rounded-full bg-slate-800 hover:bg-slate-700 hover:border-indigo-400 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-mono font-bold hover:text-white transition-all cursor-pointer pointer-events-auto shadow-sm"
                  title="Explain RCI demand and other systems (?)"
                >
                  ?
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

            {/* Day index */}
            <div className="flex flex-col items-end pr-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Day</span>
              <span className="text-xs md:text-sm font-bold text-white font-mono leading-none">{stats.day}</span>
            </div>

            <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

            {/* Graphics Quality Control Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/80 px-2 py-1 rounded-lg">
              <span className="text-[7.2px] text-slate-400 font-bold uppercase tracking-widest leading-none font-sans">RESO</span>
              <button
                onClick={() => onSetQuality(quality === 'high' ? 'standard' : 'high')}
                className={`py-0.5 px-1.5 rounded font-black text-[9px] uppercase transition-all select-none cursor-pointer border flex items-center gap-1
                  ${quality === 'high' 
                    ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'}`}
                title={quality === 'high' ? "High Quality: Crisp high DPI, soft realistic shadows, and anti-aliasing" : "Standard Quality: Faster performance, standard shadows"}
              >
                <span>{quality === 'high' ? '✨ HIGH' : '⚡ STD'}</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

            {/* Dashboard Opener Button */}
            <button
              onClick={() => {
                setShowDashboard(prev => !prev);
                setShowFusionGuide(false);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold uppercase text-[9px] md:text-[10px] tracking-wide transition-all select-none cursor-pointer"
            >
              💼 City Hall Dashboard {showDashboard ? '✕' : '▲'}
            </button>
          </div>

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

      {/* MID PANEL: Mayor Dashboard Modal */}
      {showDashboard && (
        <div className="m-auto lg:w-[480px] w-full max-w-full bg-slate-950/95 Border border-indigo-500/30 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.8)] pointer-events-auto p-4 md:p-5 flex flex-col gap-4 animate-fade-in z-40 max-h-[75vh] overflow-y-auto no-scrollbar">
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
            {(['tax', 'loans', 'policies', 'districts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDashboardTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[9.5px] md:text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all flex-shrink-0
                  ${dashboardTab === tab 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {tab === 'tax' && '💰 Taxes & Budget'}
                {tab === 'loans' && '🏦 Banking & Bonds'}
                {tab === 'policies' && '📜 City Policies'}
                {tab === 'districts' && '📍 District Painting'}
              </button>
            ))}
          </div>

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
      )}

      {/* Bottom Bar: Tools & News */}
      <div className="flex flex-col-reverse lg:flex-row lg:justify-between lg:items-end pointer-events-auto mt-auto gap-2 w-full max-w-full font-sans">
        
        {/* Toolbar - Responsive horizontal layout */}
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          {/* Floating Controls Overlay */}
          <div className="bg-slate-950/95 border border-indigo-500/35 p-2 px-3 rounded-xl text-[9px] md:text-[10px] leading-snug text-indigo-200 shadow-xl font-mono flex items-center gap-2 max-w-full select-none backdrop-blur-md self-start pointer-events-auto">
            <span className="text-sm">⌨️</span>
            <div>
              <strong className="text-indigo-400 font-sans uppercase tracking-wider block text-[8px] md:text-[9px]">Controls Panel (Keyboard + Mouse)</strong>
              <div className="opacity-95 text-slate-300">
                <span className="text-amber-400 font-bold">[W][A][S][D] / Arrows</span> to navigate grid selection | <span className="text-green-400 font-bold">[Enter]</span> to build/merge (or purchase in 'Buy Land' mode) | <span className="text-indigo-400 font-bold">Click</span> tile to select
              </div>
            </div>
          </div>

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
      
      {/* Dynamic Building Fusion Registry Guide */}
      <div className="absolute left-2 md:left-4 bottom-20 md:bottom-24 pointer-events-auto flex flex-col items-start gap-2 z-30">
        <button
          onClick={() => {
            setShowFusionGuide(prev => !prev);
            setShowDashboard(false);
          }}
          className="bg-slate-950/90 text-white border border-cyan-500/50 hover:bg-slate-900 font-bold px-2.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105 transition-all text-[9.5px] md:text-xs uppercase tracking-wider flex items-center gap-1 backdrop-blur-md cursor-pointer select-none"
        >
          <span className="text-cyan-400 animate-pulse font-bold">✨</span>
          <span>Building Merge Guide {showFusionGuide ? '▲' : '▼'}</span>
        </button>

        {showFusionGuide && (
          <div className="w-80 md:w-96 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden p-3 text-white flex flex-col gap-2 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-[11px] md:text-xs tracking-wide bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent uppercase font-mono">
                ✨ Building Fusion Registry
              </span>
              <button 
                onClick={() => setShowFusionGuide(false)} 
                className="text-slate-400 hover:text-white font-bold text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

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
          </div>
        )}
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

    </div>
  );
};

export default UIOverlay;

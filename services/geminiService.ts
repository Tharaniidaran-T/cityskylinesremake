import { AIGoal, BuildingType, CityStats, Grid, NewsItem } from "../types";

// Helper to count active buildings on the grid
const countBuildingsOnGrid = (grid: Grid, type: BuildingType): number => {
  let count = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x].buildingType === type) {
        count++;
      }
    }
  }
  return count;
};

// --- Procedural Goal Generation ---
export const generateCityGoal = async (stats: CityStats, grid: Grid): Promise<AIGoal | null> => {
  // Short procedural mock delay for feeling like a live advisory check
  await new Promise(r => setTimeout(r, 400));

  const pop = stats.population;
  const money = stats.money;

  // 1. Initial Growth Goal
  if (pop < 80) {
    return {
      description: "Welcome to the skies! Set up our basic foundation. Pave Roads and lay down Cozy Residential Houses to attract our first 80 citizens.",
      targetType: "population",
      targetValue: 80,
      reward: 400,
      completed: false
    };
  }

  // 2. Commercial / Retail expansion
  const commercialCount = countBuildingsOnGrid(grid, BuildingType.Commercial) + 
                          countBuildingsOnGrid(grid, BuildingType.Supermarket) + 
                          countBuildingsOnGrid(grid, BuildingType.Hotel);
  if (commercialCount < 2) {
    return {
      description: "Citizens are demanding grocery outlets and entertainment! Construct commercial Shops, Supermarkets, or Cinemas to fulfill retail demand.",
      targetType: "building_count",
      buildingType: BuildingType.Commercial,
      targetValue: 3,
      reward: 600,
      completed: false
    };
  }

  // 3. Financial Treasury Crisis
  if (money < 800) {
    return {
      description: "Our treasury funds are running thin! Optimize your tax rates and accumulate $3,000 to safe-guard our sky city budget.",
      targetType: "money",
      targetValue: 3000,
      reward: 500,
      completed: false
    };
  }

  // 4. Moderate Expansion Goal
  if (pop < 250) {
    return {
      description: "We are scaling up! Expand our residential zone boundaries to reach a population of 250 citizens.",
      targetType: "population",
      targetValue: 250,
      reward: 800,
      completed: false
    };
  }

  // 5. Industrial Support Goal
  const industrialCount = countBuildingsOnGrid(grid, BuildingType.Industrial) + 
                          countBuildingsOnGrid(grid, BuildingType.LogisticsHub) + 
                          countBuildingsOnGrid(grid, BuildingType.ChemicalPlant);
  if (industrialCount < 3) {
    return {
      description: "A growing workforce needs jobs. Erect heavy industrial Factories, Logistics Hubs, or Chemical Plants to boost employment.",
      targetType: "building_count",
      buildingType: BuildingType.Industrial,
      targetValue: 5,
      reward: 1200,
      completed: false
    };
  }

  // 6. Advanced High Tech Expansion
  if (pop < 600) {
    return {
      description: "Targeting high density upgrades! Boost services (Schools/Hospitals) and help us reach a key milestone of 600 citizens.",
      targetType: "population",
      targetValue: 600,
      reward: 1500,
      completed: false
    };
  }

  // 7. Megapolis Endgame Goal
  return {
    description: "Utopian Floating Spire Project: Grow SkyMetropolis into an astronomical world wonder. Reach 1,500 total citizens and $15,000 in treasury.",
    targetType: "population",
    targetValue: 1500,
    reward: 3500,
    completed: false
  };
};

// --- Procedural SimCity-Style News Feed Headlines ---
const REGULAR_HEADLINES = [
  { text: "☀️ Pristine weather reported today! Hot air balloon tourism on the rise.", type: "positive" },
  { text: "👀 Rumors of gravity fluctuation dismissed as 'minor turbulence' by mayor's office.", type: "neutral" },
  { text: "💧 Sourcing liquid from low-hanging clouds reported 'highly refreshing' by residents.", type: "positive" },
  { text: "🍔 Local fast food diner announces 'Balsa Wood' burger consisting mostly of air.", type: "neutral" },
  { text: "🌳 Central Park attendance reaches 100%. Citizens praise the 'surprisingly genuine' synthetic grass.", type: "positive" },
  { text: "🎈 Flying delivery drones report zero bird strikes this week.", type: "positive" },
  { text: "🌁 Morning fog adds romantic mystique, or possibly heavy industrial smog.", type: "neutral" },
  { text: "📰 Floating Islander Times names SkyMetropolis 'the highest rated city' literally.", type: "positive" },
  { text: "☕ Coffee shop reports high sales as citizens stay awake to look at gorgeous isometric sunsets.", type: "positive" },
  { text: "🧳 Tourist levels looking stable. Visitors complain about thin air, but love the duty-free shops.", type: "positive" },
  { text: "💤 Anti-sleep laws rejected. City council confirms dreams are still free tax-haven material.", type: "neutral" },
  { text: "📦 Gravity-reversing shipping containers speed up distribution loading times.", type: "positive" },
];

const UNEMPLOYED_HEADLINES = [
  { text: "🛠️ Citizens demand work! Council urged to zone industrial Factories or modern tech foundries.", type: "negative" },
  { text: "💼 Local job agencies report queues extending around the cloud edges. 'We need industrial zones!'", type: "negative" },
  { text: "🏚️ Workforce idle. Citizens seen playing frisbee across hovering islands during work hours.", type: "neutral" },
];

const POWER_SHORTAGE_HEADLINES = [
  { text: "🔌 Blackouts reported in eastern sectors! Build cleaner Wind Turbines or high-yield Coal Plants.", type: "negative" },
  { text: "🕯️ Surge in candle sales as citizens endure partial grid power load-shedding.", type: "negative" },
];

const HAPPY_HEADLINES = [
  { text: "🎉 Local festival celebrations fill the streets! Citizens adore the city management.", type: "positive" },
  { text: "🌟 High happiness yields a boost in resident migration. Everyone wants to move to our sky city!", type: "positive" },
];

const CRIME_HEADLINES = [
  { text: "🚨 Joyriding hover-scooters reported in major grid sectors. Increase Police Station coverage!", type: "negative" },
  { text: "🔒 Local store owner installs triple padlocks. Calls for localized municipal safety.", type: "negative" },
];

export const generateNewsEvent = async (stats: CityStats, recentAction: string | null): Promise<NewsItem | null> => {
  // Mock short delay
  await new Promise(r => setTimeout(r, 100));

  let pool = [...REGULAR_HEADLINES];

  // Inject situational headlines matching stats
  if (stats.unemployment > 15) {
    pool = [...pool, ...UNEMPLOYED_HEADLINES];
  }
  if (stats.ratingElectricity < 75) {
    pool = [...pool, ...POWER_SHORTAGE_HEADLINES];
  }
  if (stats.happiness > 85) {
    pool = [...pool, ...HAPPY_HEADLINES];
  }
  if (stats.ratingServices < 60) {
    pool = [...pool, ...CRIME_HEADLINES];
  }

  if (recentAction) {
    pool.push({
      text: `📢 Feedback on recent zone: "Building that was definitely a bold move!" - local resident.`,
      type: "neutral"
    });
  }

  const select = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: (Date.now() + Math.random()).toString(),
    text: select.text,
    type: select.type as 'positive' | 'negative' | 'neutral'
  };
};

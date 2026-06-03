# 🌇 SkyMetropolis 3D

[![Verify Build Integrity](https://github.com/yourusername/sky-metropolis/actions/workflows/verify-build.yml/badge.svg)](https://github.com/yourusername/sky-metropolis/actions/workflows/verify-build.yml)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r173-000000.svg?logo=three.js&logoColor=white)](https://threejs.org)

**SkyMetropolis 3D** is a high-performance, real-time isometric 3D city builder game running fully in the browser. Players manage a floating sky metropolis on a grid, adjusting regional policies, monitoring municipal stats, building roads, zoning sectors, placing power, water, and heating systems, and keeping citizens happy under the advice of procedural AI advisors.

---

## 🎨 Creative Showcase & Features

*   **⚡ High-Performance Isometric WebGL Engine:** Powered by React Three Fiber and Three.js, using low-overhead **instanced rendering** for traffic, citizen systems, and foliage, allowing high frame rates on low-end hardware.
*   **🏡 Adaptive Zoning & Building Tiers:** Multiple categories of buildings (Residential, Commercial, Industrial, Offices, Schools, Fire Stations, Police Stations, and Hospitals) featuring 4 distinct architectural tiers per category that upgrade as land value grows.
*   *🔧 Complete Utilities Grid:* Manage water pumps, waste management, municipal heating systems, wind turbines, coal plants, solar facilities, and nuclear stations.
*   **📈 Full Simulation Loop:** Integrated municipal variables including employment rates, traffic/road flow, electrical grid distribution, water quality, heat coverage, crime/fire protection ratings, bank loans, adjustable tax rates, and island district definitions.
*   **🎯 Procedural Objectives & Newspapers:** Simulation events deliver SimCity-inspired live running headlines based on your current gameplay metrics, with task rewards designed to boost progress.

---

## 🚀 Extreme Performance Optimizations for Lower-End Hardware (e.g. Chromebooks)

To ensure high-fidelity 3D rendering remains highly performant and accessible on educational-grade laptops and Chromebooks, several cutting-edge engine adjustments have been engineered:

1.  **Lightweight Materials:** Swapped heavy `MeshStandardMaterial` shaders with simpler `MeshLambertMaterial` shaders across all structures. This reduces the per-pixel lighting computational overhead significantly while retaining beautiful vertex lighting.
2.  **Shadow Map Optimization:** Uses `BasicShadowMap` shadow algorithms alongside a reduced `512x512` shadow-map resolution to drastically reduce GPU frame-budget times.
3.  **Low-DPR Scaling & Antialiasing Disabling:** Locked target device-pixel-ratio (DPR) to `1` and deactivated anti-aliasing buffers where unnecessary to reduce high visual fill-rate rendering bottlenecks.
4.  **CPU/GPU Offloading via Instanced Rendering:** Road traffic (cars) and citizens (population systems) are batched using `THREE.InstancedMesh`. High-overhead individual ThreeJS Groups have been eliminated, maintaining 60 FPS even with large populations.
5.  **Simulated Agent Clamping:** Intelligently limits the maximum number of simultaneously walking citizens and vehicles on the screen relative to overall populations to avoid CPU thermal throttling.

---

## 🛠️ Local Installation & Development

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.x or v20.x recommended).

### Steps
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/yourusername/sky-metropolis.git
    cd sky-metropolis
    ```

2.  **Install Package Dependencies:**
    ```bash
    npm install
    ```

3.  **Launch the Local Server:**
    ```bash
    npm run dev
    ```
    The application will load at `http://localhost:3000` (or the fallback local address provided in your terminal).

4.  **Type-checking and Linting:**
    ```bash
    npm run lint
    ```

5.  **Compile the Production Build:**
    ```bash
    npm run build
    ```

---

## 🕹️ Controls & Navigation

*   **Primary Action (Left Click):** Build chosen tools (Roads, Houses, Power Plants, or Zones) or select existing structures to examine statistics / trigger manual tier upgrades.
*   **Destruct Action (Bulldozer tool):** Clear structures to reclaim 50% construction refund.
*   **Orbit Camera:** Hold left-click and drag on empty terrain to slide/orbit across the grid.
*   **Mouse Wheel / Pinch Zoom:** Zoom in/out of the flying islands seamlessly.

---

## 📂 Project Architecture

```txt
├── .github/workflows/   # GitHub CI/CD Actions config
├── components/
│   ├── IsoMap.tsx       # Core WebGL/Three.js 3D isometric simulation viewport
│   ├── UIOverlay.tsx    # Responsive sidebars/stats/overlays for game controls
│   └── StartScreen.tsx  # Game loader screen
├── services/
│   └── geminiService.ts# Procedural advisory text and simulation events generator
├── App.tsx              # Core app container & state management loop
├── types.ts             # Strict TypeScript definitions for structures
├── constants.tsx        # Balancing multipliers, costs, and gameplay config
└── vite.config.ts       # Module loading configurations
```

---

## 🛡️ License
Distributable under the **Apache-2.0 License**. See `LICENSE` inside your repository or the source file headers for legal boundaries.

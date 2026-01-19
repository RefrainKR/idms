# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shani Song Gacha Probability Simulator** - A web-based gacha (loot box) probability calculator for THE IDOLM@STER Shiny Colors Song for Prism. Uses Dynamic Programming and the Coupon Collector algorithm to simulate collection probabilities for 3-star, 2-star, and birthday gacha systems.

**Version**: 1.7.0
**Language**: Vanilla JavaScript (ES6 modules)
**Tech Stack**: HTML5, CSS3, Chart.js 4.4.1

## Development Commands

This is a client-side web application with no build process. To develop:

```bash
# Serve the scsfp/ directory with any static file server
cd scsfp
python -m http.server 8000
# or
npx serve
```

Open `http://localhost:8000/index.html` in a browser.

## Architecture

### MVVM Pattern

The codebase follows Model-View-ViewModel architecture:

- **Models** ([js/model/gacha/](scsfp/js/model/gacha/)): Store state using Observable pattern
  - [Star3GachaModel.js](scsfp/js/model/gacha/Star3GachaModel.js), [Star2GachaModel.js](scsfp/js/model/gacha/Star2GachaModel.js), [BirthdayGachaModel.js](scsfp/js/model/gacha/BirthdayGachaModel.js)

- **ViewModels** ([js/viewmodel/gacha/](scsfp/js/viewmodel/gacha/)): Business logic, DP calculations
  - All inherit from [BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
  - Handle storage, input binding, and trigger recalculations

- **Views** ([js/view/](scsfp/js/view/)): UI rendering and Chart.js integration
  - [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js) renders results for all gacha types

- **Core** ([js/core/](scsfp/js/core/)): Shared algorithms
  - [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP state transitions, convolution
  - [Observable.js](scsfp/js/core/Observable.js): Reactive data binding
  - [GachaConstants.js](scsfp/js/core/GachaConstants.js): All configuration constants

### Entry Points

1. [index.html](scsfp/index.html) - Main UI with 3 tabs (3-star, Birthday, 2-star)
2. [js/main.js](scsfp/js/main.js) - Application initialization, instantiates ViewModels

### Key Algorithms

**Dynamic Programming State**: `dp[k]` = probability of collecting exactly k items

**Core Operations** (in [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)):
- `runSinglePull(dp, prob)`: Single gacha pull with individual probability
- `runGuaranteedPull(dp)`: Ceiling/guarantee mechanic (100% acquisition)
- `runRandomTicket(dp, poolSize)`: Random ticket reward (1/poolSize for each item)
- `convolve(dpA, dpB)`: Combine independent probability distributions (for 2-star group analysis)

**Gacha Rules** (defined in [GachaConstants.js:60-78](scsfp/js/core/GachaConstants.js#L60-L78)):
```javascript
GACHA_RULES = {
  STAR3: {
    STEPUP_CYCLE: 40,           // Step4 boost every 40 pulls
    CEILING_INTERVAL: 200       // Ceiling ticket every 200 pulls
  },
  STAR2: {
    HIGH_RATE_INTERVAL: 10,     // 95% boost every 10th pull (normal gacha)
    STEPUP_GUARANTEE_FIRST: 5,  // First guarantee at 5 pulls
    STEPUP_GUARANTEE_INTERVAL: 10, // Then every 10 pulls
    NORMAL_CEILING_INTERVAL: 100,
    STEPUP_CEILING_INTERVAL: 50
  },
  BIRTHDAY: {
    STEPUP_MAX: 30,
    STEPUP_GUARANTEE: 30,       // 100% at 30th pull
    CEILING_INTERVAL: 200
  }
}
```

## Gacha Type Implementations

### 3-Star Gacha ([Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js))

**Features**:
- Normal gacha: individual pickup rate
- Step-up gacha: 40-pull cycles with Step4 rate boost
- Loop rewards: random tickets (1/N) or select tickets (ceiling)
- Ceiling: every 200 pulls (normal + step-up combined)
- CDF reverse lookup: calculate pulls needed for target probability

**Calculation Flow** (lines 161-243):
1. Run normal pulls with base rate
2. Run step-up pulls, checking for Step4 (i % 40 === 0) and applying loop rewards
3. Apply ceiling tickets (select rewards + floor(totalPulls/200))

**Loop Rewards System** ([Star3GachaViewModel.js:195-207](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js#L195-L207)):
- `loopRewards` object maps loop number (1, 2, 3...) to 'random' or 'select'
- Random: calls `runRandomTicket(dp, N)` - equal chance for any item
- Select: increments ceiling counter

### 2-Star Gacha ([Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js))

**Features**:
- 4 independent groups (A, B, C, D) with separate step-up pools
- Convolution combines group results
- Step-up guarantees at 5, 15, 25... pulls
- Normal gacha: 95% boost every 10th pull
- Ceiling: 100 pulls (normal), 50 pulls (step-up)

**Group Targeting** (lines 142-154):
- `viewTargetGroup`: 'ALL' or specific group ('A', 'B', 'C', 'D')
- Non-selected groups have targetCount forced to 0
- If all targets are 0, treats as full collection mode (M=N)

### Birthday Gacha ([BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js))

**Features**:
- Normal gacha: 1.5% rate
- Step-up gacha: 2.0% rate, max 30 pulls
- 30th step-up pull: 100% guaranteed acquisition
- Ceiling: every 200 pulls (combined)

## State Management

**Observable Pattern** ([Observable.js](scsfp/js/core/Observable.js)):
- All model properties are Observable instances
- Changes trigger `calculate()` and `save()` via subscriptions
- `isInitializing` flag prevents cascading recalculations during load

**LocalStorage** ([StorageManager.js](scsfp/js/utils/StorageManager.js)):
- Keys: `shani_gacha_3star`, `shani_gacha_2star`, `shani_gacha_birthday`
- Saves: pickup counts, rates, loop settings, reward selections
- Does NOT save: pull counts (`normalPulls`, `stepPulls`) - intentionally reset on reload

**Input Binding** ([InputBinder.js](scsfp/js/view/component/InputBinder.js)):
- Two-way binding between HTML inputs and Observable properties
- Automatic validation via `ProbabilityValidator.clamp()`
- Type coercion: 'int' or 'float'

## Important Files

- [GachaConstants.js](scsfp/js/core/GachaConstants.js): All configuration, input definitions, presets, gacha rules
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP algorithms, must use `ProbabilityValidator` for all probability calculations
- [ProbabilityValidator.js](scsfp/js/utils/ProbabilityValidator.js): Probability clamping, total probability calculation (`getTotalProb`), cumulative distribution fixes
- [PROJECT_STATUS.md](scsfp/PROJECT_STATUS.md): Detailed analysis of codebase structure, technical debt, algorithm explanations (Korean)

## Chart.js Integration

**Library Loading** ([index.html](scsfp/index.html)):
```html
<!-- Chart.js and ChartDataLabels loaded via CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0"></script>
```

**Registration** ([main.js:10](scsfp/js/main.js#L10)):
```javascript
Chart.register(ChartDataLabels); // Global variable from CDN
```

**Chart Rendering** ([ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)):
- Wrapper around Chart.js for consistent styling
- Handles chart destruction and recreation on updates

## Common Patterns

### Adding a New Gacha Type

1. Add `CONFIG.NEW_TYPE` to [GachaConstants.js](scsfp/js/core/GachaConstants.js)
2. Create `NewTypeGachaModel.js` in [js/model/gacha/](scsfp/js/model/gacha/)
3. Create `NewTypeGachaViewModel.js` extending [BaseGachaViewModel](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
4. Add rendering logic to [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)
5. Add tab to [index.html](scsfp/index.html)
6. Instantiate in [main.js](scsfp/js/main.js)

### Probability Calculation Safety

**Always use ProbabilityValidator**:
```javascript
// Clamp individual probability to [0, 1]
const validProb = ProbabilityValidator.clamp(prob);

// Calculate total probability for M items with individual prob p
// Handles edge case: p × M > 1.0
const p_any = ProbabilityValidator.getTotalProb(p_indiv, M);
```

### ViewModel Lifecycle

```javascript
constructor() {
  this.isInitializing = true; // Prevent cascading updates
}

init() {
  // 1. Load from storage
  // 2. Subscribe to Observable changes
  // 3. Bind inputs
  this.isInitializing = false;
  this.calculate(); // Initial calculation
}

calculate() {
  // 1. Read model values
  // 2. Run DP simulation
  // 3. Render results via View
}
```

## Known Technical Debt

1. **Code Duplication**: `_calculateEfficiencyData` and `_calculateCDFData` in [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) repeat similar simulation logic
2. **DOM Manipulation in ViewModel**: [Star3GachaViewModel.js:89-97](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js#L89-L97) directly manipulates DOM (`targetInput.max`) - should use Observable
3. **Group Calculation in ViewModel**: `_calcGroup` logic in [Star2GachaViewModel.js:103-124](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js#L103-L124) should be in ProbabilityEngine
4. **Chart Re-rendering**: Charts are destroyed and recreated on every update - should use `chart.update()`

## Critical Rules

1. **All probability calculations must use ProbabilityValidator** for safety
2. **Never modify Observable values during `isInitializing = true`** to prevent cascade
3. **Chart.js is a global variable from CDN** - no import statement
4. **Ceiling counts use `Math.floor()`** - fractional ceilings are truncated
5. **Pull counts are NOT saved** to LocalStorage - intentional design
6. **DP arrays use 0-indexed** but represent collection counts (0 to M items)

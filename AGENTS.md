# AGENTS.md

## Repository scope

The repository root contains the application in `scsfp/`. Run and resolve application-relative paths from that directory.

IDMS / `scsfp` is a static GitHub Pages utility for THE IDOLM@STER Shiny Colors Song for Prism. It provides gacha collection-probability analysis and payment-efficiency comparison.

This is an established application, not a greenfield project. Major features already exist.

## Current phase and work order

The current phase is behavior-preserving semantic cleanup.

1. Inspect the current Git state and preserve unrelated or in-progress user changes.
2. Read the current project context and verify it against the source.
3. Confirm game-rule meaning before changing names that encode domain behavior.
4. Clean up naming, UI wording, comments/JSDoc, and documentation drift.
5. Verify calculations and UI behavior are unchanged.
6. Only after that, review `scsfp/docs/IDMS_GACHA_ANALYSIS_IDEAS.md` and implement only ideas explicitly selected by the user.

Do not implement ideas merely because they appear in the ideas document. Keep behavior-changing work separate from naming/documentation-only work.

## Architecture to preserve

Unless the user explicitly requests otherwise, preserve the current lightweight static architecture:

- GitHub Pages/static hosting;
- Vanilla JavaScript with ES modules;
- HTML/CSS and Chart.js loaded from CDN;
- MVVM-style separation;
- LocalStorage for the settings currently persisted;
- no required build step, backend, server, or database.

Do not introduce React, Vue, TypeScript, SSR, backend services, or a large build/state-management system merely as a refactor.

Current source layout:

- `scsfp/index.html`: application UI;
- `scsfp/js/main.js`: application initialization and persistent ViewModel creation;
- `scsfp/js/model/`: Observable-backed state and serialization, including `SharedSettings.js`;
- `scsfp/js/viewmodel/`: presentation orchestration;
- `scsfp/js/view/`: rendering, Chart.js integration, and `ChartAdapter.js`;
- `scsfp/js/component/`: UI components such as `InputBinder.js` and tab/section managers;
- `scsfp/js/core/`: domain calculations and constants;
- `scsfp/js/config/`: gacha, payment, and UI configuration;
- `scsfp/js/utils/`: reusable utilities;
- `scsfp/css/`: `common.css`, `gacha.css`, and `payment.css`.

All four gacha ViewModels extend `BaseGachaViewModel`; `PaymentViewModel` extends `BaseViewModel`. They are created once in `main.js` and remain alive while sections are shown or hidden.

## Authoritative context and path rules

Read these before substantial work, selecting only the references relevant to the task:

1. repository-root `AGENTS.md`;
2. current conversation/task and Git diff;
3. `scsfp/docs/IDMS_CODEX_HANDOFF.md`;
4. `scsfp/docs/game/GACHA_SYSTEM.md` and `scsfp/docs/game/GAME_RULES.md`;
5. relevant current source files.

The game/payment documents currently live under `scsfp/docs/game/`, not directly under `scsfp/docs/`.

The former `scsfp/CLAUDE.md`, `scsfp/REFACTORING.md`, and `scsfp/README.md` were removed because they were stale historical material. Do not recreate or rely on them. Useful legacy-path cautions retained from that review include:

- the former `docs/UPDATE.md` is now historical material at `docs/archive/UPDATE.md`, while current game rules live under `docs/game/`;
- `js/core/SharedSettings.js` instead of `js/model/SharedSettings.js`;
- `js/utils/ChartAdapter.js` instead of `js/view/ChartAdapter.js`;
- `js/view/component/InputBinder.js` instead of `js/component/InputBinder.js`;
- old names including `GachaConstants.js`, `GachaTypeConfig.js`, `PaymentConstants.js`, and `css/style.css` instead of the current files.

`scsfp/docs/IDMS_CODEX_HANDOFF.md` is a recent review handoff, but it is still secondary to the current game docs and code. Treat its banner examples and statements marked as possible/appearing as items to verify.

## Verified calculation model

Do not reduce this application to a generic binomial gacha calculator. Collection-state DP, total-acquisition distributions, CDF/required-pull calculations, group convolution, tickets, guaranteed acquisitions, Step-up limits, and shared or separate stacks are intentional behavior.

### Collection modes

- `snipe`: collect specifically designated targets. The DP capacity is the target count.
- `any`: collect any requested number from the full pickup pool. The DP capacity is the pickup count.

These are distinct probability problems and must remain distinct.

`dp` represents collection state. `dpTotal` represents total target acquisitions including duplicates. The total-acquisition analysis is secondary but valid; do not remove it during cleanup.

### 3-star ordinary banners

- Normal and Step-up use different pull transitions but share one 200-pull selectable-reward stack.
- Direct input calculation combines the entered Normal and Step-up pulls and applies `floor((normalPulls + stepPulls) / 200)` shared rewards.
- A Step-up cycle is 40 pulls. The configured Step4 pickup-total probability is divided by the pickup count for per-pickup collection transitions.
- Step-up loops are limited by `maxLoops`; the Step-up input is clamped through `stepMax`.
- Loop rewards distinguish random pickup tickets from select tickets. Random tickets retain duplicate risk; select tickets use a guaranteed-useful collection transition while an uncollected target remains.
- Current presets model ordinary two-loop banners with a loop-2 random ticket and PJ with loop-2 random plus loop-3 select.

For 3-star efficiency and required-pull curves, `comparedStrategyKind: stepupFirst` means Step-up through `maxLoops * 40`, then Normal while retaining the shared 200-pull stack. Strategy results use `normalOnlyData` and `comparedStrategyData` so the shared renderer never infers the strategy from an ambiguous field name.

### Birthday and collaboration banners

- Birthday uses a 30-pull Step-up limit, a configurable counterfactual toggle for the pull-30 guaranteed target, and a shared 200-pull Normal+Step-up ceiling. Its efficiency/CDF Step-up curve changes to Normal after pull 30.
- Collaboration uses the common rate-boost Step-up calculation with no guaranteed target pull. `GACHA_RULES.COLLAB.PRACTICAL_STEPUP_PULL_LIMIT = 9999` is the current practical-infinity sentinel, so within the current chart range its Step-up curve does not switch to Normal.
- Do not generalize exact collaboration behavior across banners without verifying banner evidence.

### 2-star banners

- Normal divides the total pickup probability across the full pickup pool and has a 100-pull selectable reward.
- Step-up divides pickups into A-D groups, uses group-sized pools, has guaranteed pickup positions at pull 5 and every 10 pulls afterward, and has a separate 50-pull selectable reward stack.
- Normal and Step-up stacks are not shared.
- The direct combined calculation currently derives Step-up rewards from `floor(totalStepPulls / 50)`, where `totalStepPulls` is summed across A-D inputs. Confirm the exact in-game sharing boundary among group banners before changing this behavior or its wording.
- The 2-star efficiency comparison is Normal-only versus Step-up-only for one selected group and reports `comparedStrategyKind: stepupOnly`.

### Best and Worst

In efficiency data:

- `best` is the probability of reaching the requested complete collection state (`collectionDp[targetCount]`);
- `worst` is the probability of obtaining none of the targets (`collectionDp[0]`).

These names support the current UI concept. Do not rename them automatically. Prefer clarifying labels/comments such as “Best (goal completed)” and “Worst (0 targets obtained)” if needed.

## Calculation safety and unresolved rule boundaries

Before modifying probability behavior:

1. identify the exact banner and game rule;
2. locate the current documentation/evidence;
3. trace direct calculation, efficiency, and CDF paths separately;
4. verify transition order, ticket handling, stack boundaries, and Step-up limits;
5. record ambiguity and ask before making a behavior change;
6. compare representative outputs before and after any refactor.

In particular, verify these points before behavior changes:

- exact 3-star/S-card guaranteed-slot probability tables, ordinary versus PJ Step4 behavior, and banner-specific exceptions;
- exact collaboration Step-up rules for the banner in question;
- whether the 2-star 50 stack is shared across all A-D group selections exactly as the current summed implementation assumes;
- whether the `ceilingMode` analytical toggle should also disable loop select tickets. Current 3-star code counts loop select rewards separately but applies them inside the ceiling-enabled branch;
- whether applying accumulated select/ceiling guarantees after all pull transitions, while random tickets are applied at loop completion, is the intended ordering for every analysis;
- duplicate-resource/무돌 assumptions. Current supporting analysis includes counterfactual/duplicate assumptions that must be explicit in UI and docs.

Do not silently “fix” any of these during naming cleanup.

## Naming and documentation refactor status

The first semantic naming pass is complete. Current cross-layer contracts use:

- `normalOnlyData`, `comparedStrategyData`, and `comparedStrategyKind`;
- `normalOnlyCompletionCdf` and `comparedStrategyCompletionCdf`;
- `normalOnlyRequiredPulls` and `comparedStrategyRequiredPulls`;
- `collectionDp` and `totalAcquisitionDp` at ViewModel/View boundaries;
- separate names for shared stack rewards, Step-up loop select tickets, and random tickets;
- `pickupCount` and `targetCount` in public APIs and context objects.

Future cleanup should focus only on verified residual drift: old historical names outside `docs/archive/`, unclear analytical toggle wording, and banner-specific rule evidence. Do not churn tight mathematical variables merely for stylistic uniformity.

Short mathematical `N`/`M` variables are acceptable inside tight DP routines. Public APIs, context objects, view rendering, and cross-file boundaries should prefer `pickupCount`, `targetCount`, and similarly semantic names.

## UI and information hierarchy

During cleanup, it is acceptable to clarify labels, reorder existing information, or move secondary analysis into a more appropriate existing section. Do not add new calculations or derived metrics in this phase.

Current conceptual priority is:

1. collection probability;
2. Normal versus the applicable Step-up strategy;
3. target probability to required pulls;
4. Any/Snipe and 2-star group targeting;
5. total acquisition, duplicate-resource expectation, and counterfactual supporting analyses.

Clearly distinguish actual game configuration from analytical on/off counterfactuals.

## Verification and Git discipline

- There is currently no package/build/test harness in the repository. Use a local static server and browser checks when runtime verification is needed, plus targeted deterministic calculation comparisons for probability refactors.
- Do not create commits, push, or open pull requests unless the user explicitly requests it.
- Preserve user changes. The current documentation move from `scsfp/docs/*.md` to `scsfp/docs/game/*.md`, with historical update notes in `scsfp/docs/archive/`, may appear in Git as deleted tracked files plus untracked replacements until the user stages it; do not revert or duplicate it.
- Do not use `AGENTS.md` as a running task log. Put durable project/domain rules here and temporary progress in the conversation or a task-specific note requested by the user.

## Model-switch recovery

After a model switch, do not assume private reasoning state was transferred and do not restart a full audit automatically. Recover in this order:

1. read `AGENTS.md`;
2. inspect the current conversation/task;
3. inspect Git status/diff and modified files;
4. read the relevant handoff and game docs;
5. identify completed and remaining work;
6. continue from the first incomplete step.

Perform a new full repository audit only if the state cannot be reconstructed, rules materially changed, changes conflict, or the user explicitly requests it.

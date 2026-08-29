# AGENTS.md

## Repository scope

The repository root contains the application in `scsfp/`. Run and resolve application-relative paths from that directory.

IDMS / `scsfp` is a static GitHub Pages utility for THE IDOLM@STER Shiny Colors Song for Prism. It provides gacha collection-probability analysis and payment-efficiency comparison.

This is an established application, not a greenfield project. Major features already exist.

## Current phase and work order

The behavior-preserving semantic cleanup was completed for the v1.11.0 release. The current phase is discussion indexed by repository-root `NEXTROAD.md`, with one active idea at a time extracted into a sibling `NEXTROAD_*.md` detail document. There is no active implementation task until the user explicitly approves one.

1. Inspect the current Git state and preserve unrelated or in-progress user changes.
2. Read `NEXTROAD.md` and its linked active detail document for shared discussion, or root `tasks/BOARD.md` for an approved active task.
3. Verify each candidate against the current source and game rules.
4. Do not create an implementation packet until discussion is complete and the user explicitly starts development.
5. At implementation start, preserve the selected detail document in `tasks/<task>/SOURCE.md`, define Sol decisions and acceptance criteria, and only then move the task to Terra.
6. Keep behavior-changing work separate from completed v1.11.0 cleanup history.

Do not implement ideas merely because they appear in `NEXTROAD.md` or a linked `NEXTROAD_*.md`. Keep behavior-changing work separate from naming/documentation-only work.

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
3. `NEXTROAD.md` and its linked active detail document for discussion, or `tasks/BOARD.md` and the relevant active task directory after implementation has begun;
4. `scsfp/docs/game/GACHA_SYSTEM.md` and `scsfp/docs/game/GAME_RULES.md`;
5. relevant current source files;
6. repository-root `DEVLOG.md` only when historical context is needed.

The game/payment documents currently live under `scsfp/docs/game/`, not directly under `scsfp/docs/`.

The former `scsfp/CLAUDE.md`, `scsfp/REFACTORING.md`, and `scsfp/README.md` were removed because they were stale historical material. Do not recreate or rely on them. Useful legacy-path cautions retained from that review include:

- the former `docs/UPDATE.md` is now the agent-maintained repository-root `DEVLOG.md`, while current game rules live under `scsfp/docs/game/`;
- old references to `js/core/SharedSettings.js` are stale; the current file is `js/model/SharedSettings.js`;
- old references to `js/utils/ChartAdapter.js` are stale; the current file is `js/view/ChartAdapter.js`;
- old references to `js/view/component/InputBinder.js` are stale; the current file is `js/component/InputBinder.js`;
- old names including `GachaConstants.js`, `GachaTypeConfig.js`, `PaymentConstants.js`, and `css/style.css` instead of the current files.

Document responsibilities are intentionally separated:

- `NEXTROAD.md`: shared index and short backlog for future development directions. The sole developer and Sol may edit it freely.
- `NEXTROAD_*.md`: one detailed idea under active review at a time. Its decisions and unresolved questions are kept separate from the master index. Neither the index nor a detail document authorizes implementation.
- `scsfp/docs/`: current shared project and game knowledge. The sole developer may freely correct or extend it when game specifications change; agents must treat such edits as important input and verify them against code before changing behavior.
- `DEVLOG.md`: long-term completed-change and design-context record maintained by the coding agent. The developer normally reads it or asks the agent to correct it rather than editing it as an informal note. Historical dated entries must not be rewritten merely to match current paths.
- `tasks/`: agent operational workspace for approved implementation, Sol/Terra handoff, verification, and completed task packets. It is not the developer's idea notebook and does not belong under `scsfp/docs/`.
- `AGENTS.md`: durable repository and agent rules, not a running task log.

The repository is public. “Agent operational workspace” describes editing responsibility, not privacy; never place credentials, private tokens, or other secrets in `tasks/` or any tracked document.

Use root `tasks/` only after a substantial task enters implementation. A task document does not authorize implementation by itself. After work is completed, verified, and reflected in current code or durable documentation, move it to `tasks/finish/` rather than deleting it. Finished task documents are historical context and are not part of the default authoritative reading set. Put obsolete or superseded shared Markdown under `scsfp/docs/old/` only when preservation is useful; do not mix `DEVLOG.md`, `NEXTROAD.md`, active `NEXTROAD_*.md`, or agent task packets into that directory.

## Sol-Terra task protocol

Treat Sol and Terra as repository workflow roles rather than permanent model-version assumptions:

- Sol role: idea analysis, domain-rule interpretation, scope and acceptance decisions, and final review;
- Terra role: implementation, mechanical refactoring, targeted tests, and implementation reporting within an approved task specification;
- Sol review remains responsible for comparing the actual diff and verification evidence against the task decisions;
- Terra must record an unresolved question and return the task to Sol rather than guessing about game rules, probability behavior, or material scope changes.

Planning and implementation are separated as follows:

1. Select a candidate in `NEXTROAD.md`, extract it into one sibling `NEXTROAD_*.md`, and conduct detailed review there; no task packet or code change follows from a proposal alone.
2. When the user explicitly approves implementation, confirm the version and non-`main` branch before editing application files.
3. Copy the complete selected `NEXTROAD_*.md` into `tasks/<task>/SOURCE.md` and verify preservation. Then replace its detail link in `NEXTROAD.md` with the task link and current status, and remove the transferred root detail document. Do not reset or discard unrelated backlog items.
4. Create `TASK.md`, `DECISIONS.md`, `HANDOFF.md`, and `RESULT.md`; derive scope and acceptance criteria from `SOURCE.md` without silently dropping decisions.
5. Set the task to `ready-for-terra` only after Sol has verified the packet and unresolved domain questions are recorded.

Track each substantial implementation under root `tasks/` and its current phase in `tasks/BOARD.md` with one of these states:

`planning` → `ready-for-terra` → `implementing` → `ready-for-sol-review` → `changes-requested` → `done`

Update `HANDOFF.md` before switching roles. It must state the completed work, exact remaining work, changed files, verification already run, unresolved questions, current branch, and next role. Do not rely on private reasoning state surviving a model switch.

Sol and Terra must not modify the same files concurrently in one working tree. Prefer sequential ownership on one task branch. If the user explicitly requests truly concurrent implementation, use separate branches and separate Git worktrees, define non-overlapping file ownership first, and merge only after review.

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
- A Step-up loop select ticket and the shared 200-stack selectable reward are different acquisition sources but belong to the same ceiling concept because both grant a selected target. It is intentional that `ceilingMode` includes or excludes both together.
- `randomTicketMode` controls only random tickets, while `step4Mode` controls only the Step4 pickup-rate increase. Keep these effects independently attributable in analysis.
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
- The 2-star efficiency comparison is an all-Normal strategy versus an all-Step-up strategy for one selected group and reports `comparedStrategyKind: stepupOnly`.

### Best and Worst

In efficiency data:

- `best` is the probability of reaching the requested complete collection state (`collectionDp[targetCount]`);
- `worst` is the probability of obtaining none of the targets (`collectionDp[0]`).

These internal names support the current UI concept. Keep the concise user-facing labels `Best (성공)` and `Worst (폭사)` unless the user requests another presentation.

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

Future cleanup should focus only on verified residual drift outside designated historical locations such as `tasks/finish/` and `scsfp/docs/old/`, unclear analytical toggle wording, and banner-specific rule evidence. Do not churn tight mathematical variables merely for stylistic uniformity.

Short mathematical `N`/`M` variables are acceptable inside tight DP routines. Public APIs, context objects, view rendering, and cross-file boundaries should prefer `pickupCount`, `targetCount`, and similarly semantic names.

## UI and information hierarchy

During cleanup, it is acceptable to clarify labels, reorder existing information, or move secondary analysis into a more appropriate existing section. Do not add new calculations or derived metrics in this phase.

Use concise Korean game terminology in the user interface. Internal identifiers and strategy metadata may remain English, but do not expose those implementation-oriented identifiers or detailed strategy descriptions to users. Use:

- `일반` for the Normal comparison series;
- `스탭업` for the compared Step-up series, while documenting fallback behavior outside the short UI label;
- `일반 vs 스탭업` for comparison tabs;
- `천장` for the toggle and umbrella concept covering both Step-up loop select tickets and shared-stack selectable rewards;
- `랜덤 티켓` for the random pickup-ticket reward, which is not a ceiling and remains controlled separately;
- `셀렉 티켓` for the game-labelled Step-up loop reward and `200스택 천장` for the shared-stack source when a table or explanation must distinguish them. Both selectable sources remain controlled by the `천장` toggle;
- `Best (성공)` and `Worst (폭사)` for the efficiency-mode toggle.

Current conceptual priority is:

1. collection probability;
2. 일반 versus the applicable 스탭업 strategy;
3. target probability to required pulls;
4. Any/Snipe and 2-star group targeting;
5. total acquisition, duplicate-resource expectation, and counterfactual supporting analyses.

Clearly distinguish actual game configuration from analytical on/off counterfactuals.

## Verification and Git discipline

- `main` is the public GitHub Pages deployment branch; `.github/workflows/jekyll-gh-pages.yml` deploys on pushes to `main`. A commit applied to `main` can immediately change the live utility used by other players. Never perform ordinary development directly on `main`.
- Before any file modification, inspect the current branch. If it is `main`, switch to the latest applicable version branch first. For maintenance of the current v1.11 release, use `v.1.11.X`; do not fall back to an unrelated stale branch merely because it exists.
- Project versions use `1.<major>.<minor>` and version-line branches use `v.1.<major>.X`. The leading `1` remains fixed unless the user personally decides that a rewrite-scale change warrants version 2.
- When the user ends a `NEXTROAD_*.md` discussion and explicitly starts a new feature, behavior replacement, or other planned development, branch from the current released `main` into the next line such as `v.1.12.X`, and set the application version from `1.11.0` to `1.12.0` as part of that approved implementation.
- Increment `<minor>` for bug fixes, correction of an unintended result after review, and small wording or detail changes that do not materially add or replace functionality, for example `1.11.0` to `1.11.1`. Keep those changes on the same `v.1.11.X` branch; do not create one branch per patch release.
- Increment `<major>` for new functionality or intentional material replacement of existing behavior, for example `1.11.0` to `1.12.0`. Changing the leading `1` is not an agent decision.
- The sole developer controls commits, pushes, merges into `main`, and releases. Agents leave reviewed changes in the working tree and must not commit, push, merge, or publish unless the user explicitly requests that exact Git action.
- There is currently no package/build/test harness in the repository. Use a local static server and browser checks when runtime verification is needed, plus targeted deterministic calculation comparisons for probability refactors.
- Preserve user changes. Documentation moves among `scsfp/docs/`, root `tasks/`, and `scsfp/docs/old/` may appear in Git as deleted tracked files plus untracked replacements until the user stages them; do not revert or duplicate them.
- Do not use `AGENTS.md` as a running task log. Put durable project/domain rules here and temporary progress in the conversation or a task-specific note requested by the user.

## Model-switch recovery

After a model switch, do not assume private reasoning state was transferred and do not restart a full audit automatically. Recover in this order:

1. read `AGENTS.md`;
2. read `NEXTROAD.md` and its linked active detail document if the work is still being discussed, otherwise read `tasks/BOARD.md` and the relevant task's `SOURCE.md`, `TASK.md`, `DECISIONS.md`, and `HANDOFF.md`;
3. inspect the current conversation/task;
4. inspect Git status/diff and modified files;
5. read the relevant game docs and source files;
6. identify completed and remaining work;
7. continue only from the documented next role and first incomplete step.

Perform a new full repository audit only if the state cannot be reconstructed, rules materially changed, changes conflict, or the user explicitly requests it.

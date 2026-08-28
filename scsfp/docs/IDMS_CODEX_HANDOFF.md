# IDMS_CODEX_HANDOFF.md

Date: 2026-08-28

## 1. Purpose of this handoff

This document transfers the important conclusions from the ChatGPT review of `RefrainKR/idms` to Codex.

It is deliberately focused on:
- what this project is;
- how the unusual gacha rules should be understood;
- what appears important in the current implementation;
- what should be verified;
- what should be cleaned up first.

**Feature additions and feature modifications are intentionally not specified here.**
Those belong in `IDMS_GACHA_ANALYSIS_IDEAS.md` and must be considered only after the naming/documentation refactor is complete.

---

## 2. Correct project framing

This is not intended to become a full server-hosted commercial service.

The practical goal is a lightweight static tool deployed through GitHub Pages.

Most desired functionality is already present.

Therefore the current job is not:
- redesigning the architecture;
- introducing a backend;
- migrating to a framework;
- rewriting the probability engine.

The immediate job is:
1. verify what the existing code actually does;
2. verify important game-rule assumptions;
3. make unclear names/documentation accurately describe that behavior;
4. preserve calculations;
5. only then consider further functionality.

---

## 3. Why a dedicated calculator exists

Shiny Colors Song for Prism has gacha rules that are difficult to evaluate intuitively and are poorly represented by generic gacha calculators.

The useful questions are not merely:
> If the pickup probability is X%, what is the chance after N pulls?

The real questions include:
- How much better is paid 스탭업 than 일반 for a particular target?
- Does the advantage change between sniping one target and collecting all pickups?
- How many total pulls are needed for a chosen success probability?
- What happens after a limited 스탭업 is exhausted and the user must continue on 일반?
- How much practical value does paid currency obtain through access to 스탭업?
- How much does narrowing the 2-star pool through a 스탭업 group improve sniping?

This is why the DP/CDF/state-transition behavior is central to the project.

---

## 4. Confirmed conceptual model from the review

### 4.1 Ordinary 3-star banners

일반 and 스탭업:
- have different pull rules;
- share the same 200 stack;
- at 200 total shared stack, a pickup can be selected.

Example:
- 120 일반 + 80 스탭업 = 200 -> 천장.

Ordinary 스탭업:
- uses paid currency;
- contains per-step bonuses/guarantees depending on banner type;
- cannot necessarily be repeated forever;
- has a maximum number of loops.

Once the 스탭업 allowance is exhausted, a user who continues pulling must use 일반.

This limit is an important game/economic constraint, not merely a UI limit.

### 4.2 Loop rewards

Some ordinary 3-star 스탭업 banners add loop rewards.

Examples discussed:
- a banner capped at two loops can award a random pickup ticket at the second loop;
- PJ can be capped at three loops:
  - loop 2: random pickup ticket;
  - loop 3: select ticket in addition to the previous reward structure.

Random and selectable tickets have very different collection value and must remain separate in the model.

### 4.3 Collaboration/special 3-star 스탭업

Some collaboration/special banners use a different 스탭업 pattern.

Possible structure:
- mainly increased pickup probability;
- not necessarily the ordinary Step1-4 reward pattern;
- 스탭업 can be repeatable without a meaningful loop cap;
- 일반 and 스탭업 still share the 200 stack.

The current large numeric collaboration 스탭업 limit (for example `9999`) should be understood as an implementation of practical infinity if the code confirms this.

### 4.4 2-star 일반

일반 2-star:
- includes all pickup targets;
- total pickup probability is distributed among the whole pickup pool;
- has a 100-stack selectable reward.

If total pickup probability is 28% and there are 28 equal pickup targets, an individual target is approximately 1%.

### 4.5 2-star 스탭업

2-star 스탭업 is not simply "일반 with better step bonuses".

The pickup pool is divided into smaller selectable groups based on in-game affiliations.

This matters for sniping.

Example:
- 일반: 28% / 28 targets ≈ 1% each.
- Selected 스탭업 group: 28% / 7 targets ≈ 4% each.

2-star 스탭업:
- uses its own 50-stack selectable reward;
- does not share this stack with the 100-stack 일반 banner.

This difference from 3-star shared stacking is critical.

---

## 5. Existing analysis behavior understood from the code review

### 5.1 Collection-state DP

The project already models collection-state probabilities rather than only expected counts.

This is necessary for:
- all-collection;
- partial collection;
- target sniping;
- random tickets;
- selectable tickets.

### 5.2 Any vs Snipe

`any` and `snipe` are intentionally different.

Example with four pickups:
- Any 3/4: obtain any three of the four.
- Snipe 3/4: obtain three specifically designated targets.

Do not merge these modes.

### 5.3 일반 vs 스탭업 진행 비교

A graph already compares progress for:
- 일반;
- 스탭업.

The UI intentionally uses these short Korean labels instead of implementation-oriented strategy names. The detailed strategy remains explicit in code and documentation: finite 3-star and birthday 스탭업 uses the available 스탭업 pulls first and then falls back to 일반.

The current comparison contract records the 스탭업 strategy explicitly:

For finite 3-star and birthday 스탭업 it represents `stepupFirst`:
1. use 스탭업 until the allowed maximum;
2. continue excess pulls on 일반;
3. retain the shared 200-stack logic.

For 2-star selected groups and collaboration within the current chart range it represents `stepupOnly`.

The shared result fields are `normalOnlyData` and `comparedStrategyData`; `comparedStrategyKind` prevents the renderer from guessing which 스탭업 strategy the second dataset means.

### 5.4 Target probability -> required pulls

The project already calculates the first pull count at which a chosen target probability is reached for 일반 and the compared 스탭업 strategy.

This is an important existing feature and should not be reinvented as a new feature.

### 5.5 Best / Worst

The progress graph's `best` and `worst` concepts are meaningful.

They correspond approximately to:
- `Best (성공)`: probability of the desired complete target state;
- `Worst (폭사)`: probability of obtaining none of the targets.

Do not replace the concise UI labels with longer refactoring descriptions. Preserve their exact mathematical meaning in comments and documentation.

### 5.6 Total acquisition count

The project also tracks total acquisitions including duplicates (`totalAcquisitionDp`; tight engine internals may still use short mathematical names).

This is mathematically valid but is less central to the primary decision problem than collection probability and strategy comparison.

Do not delete it during the naming refactor.

### 5.7 Duplicate-resource expectation

The duplicate-resource/"무돌" calculation appears to rely on assumptions such as duplicate ownership.

Its label and documentation should make the assumption explicit if the current UI can be interpreted as an unconditional expectation.

---

## 6. Semantic cleanup status

The intended refactor is **semantic cleanup**.

The first behavior-preserving naming pass has separated:
- all-일반 data from the compared strategy data;
- `stepupFirst` from `stepupOnly`;
- shared stack ceilings from 스탭업 loop select tickets;
- random tickets from guaranteed acquisitions;
- collection-state DP from duplicate-inclusive total-acquisition DP;
- semantic View/ViewModel context fields from tight mathematical `N`/`M` internals.

Continue to treat unclear game rules and analytical counterfactual toggles as verification work, not automatic cleanup.

### Not a priority
- architectural abstraction for its own sake;
- framework migration;
- splitting files solely to reduce line count;
- rewriting working DP logic;
- genericizing the engine away from ShinySong-specific rules.

---

## 7. Current strategy/result naming

| Current name | Meaning |
|---|---|
| `normalOnlyData` | 비교 범위 전체를 일반으로 진행한 결과 |
| `comparedStrategyData` | Data for the strategy identified by `comparedStrategyKind` |
| `comparedStrategyKind: stepupFirst` | 스탭업 한도 소진 후 일반으로 전환하는 전략 |
| `comparedStrategyKind: stepupOnly` | 비교 범위 전체를 스탭업으로 진행하는 전략 |
| `normalOnlyCompletionCdf` | 일반의 Pull 수별 목표 완료 확률 |
| `comparedStrategyCompletionCdf` | Compared-strategy goal-completion probability by Pull count |
| `normalOnlyRequiredPulls` | 일반에서 목표 확률에 처음 도달하는 Pull 수 |
| `comparedStrategyRequiredPulls` | First Pull count reaching the target probability under the compared strategy |
| `maxStepupPulls` | 일반 전환 전까지 이용 가능한 최대 스탭업 Pull 수 |
| `normalPullsAfterStepup` | 스탭업 소진 후 진행하는 일반 Pull 수 |
| `stepupSelectTicketCount` | 스탭업 주회 보상으로 얻는 셀렉 티켓 수 |
| `sharedCeilingSelectCount` | 공유 200스택 천장 횟수 |
| `totalGuaranteedSelectCount` | Current combined guaranteed-useful selection transitions |

`N` / `M`:
- acceptable in tight probability math;
- semantic names such as `pickupCount` / `targetCount` are preferable at boundaries and context objects.

`best` / `worst`:
- not a priority rename;
- display as `Best (성공)` / `Worst (폭사)`.

User-facing strategy labels:
- display `일반` / `스탭업` and `일반 vs 스탭업`;
- keep `normalOnly...`, `stepupFirst`, and `stepupOnly` only as internal identifiers that explain calculation behavior;
- display a stack-based selectable reward as `천장`, while retaining `셀렉 티켓` for a distinct 스탭업 loop reward.

---

## 8. Retained legacy-document cautions

The former root-level `CLAUDE.md`, `REFACTORING.md`, and `README.md` were removed after the context review. Their verified, durable guidance now lives in the repository-root `AGENTS.md` and this handoff. Do not recreate or depend on those deleted files.

Legacy drift identified during the review included paths/locations such as:
- `SharedSettings.js`;
- `InputBinder.js`;
- `ChartAdapter.js`;
and references to earlier filenames/structures.

Continue to inspect current documentation for:
- old filenames retained after refactors;
- claims such as "no technical debt remains";
- future-expansion assumptions no longer relevant to a GitHub Pages utility;
- descriptions of removed files;
- rules that were specific to Claude rather than generally appropriate for Codex.

Do not delete useful historical information without understanding it; move/archive or rewrite it when appropriate.

---

## 9. Probability rules that still deserve verification

The broad system model above is understood, but some exact values should be treated as "verify before behavior change".

Examples from project docs:
- exact 3-star/S-SSR split on guaranteed Step positions;
- values such as 5 / 61.333 / 3 / 30.667;
- 10 / 56 / 6 / 28;
- ordinary Step4 60% P 3-star / 40% S SSR;
- PJ Step4 P 3-star 100%;
- banner-specific ceiling exceptions;
- exact collaboration special-Step behavior.

These values may be internally consistent and may have been transcribed from in-game probability tables, but they should be checked against the best available project evidence before rewriting logic.

---

## 10. Documentation/organization cleanup allowed in this phase

The handoff may guide:
- document ordering;
- navigation/order of existing analysis sections;
- moving secondary analysis to a "details" area;
- clarifying which controls are real-game settings versus analytical what-if toggles;
- correcting stale descriptions.

These are organization/clarity changes, not new analytical features.

Any actual new calculation, new derived metric, new user-input strategy engine, or changed probability behavior belongs in `IDMS_GACHA_ANALYSIS_IDEAS.md` and should wait until the initial cleanup is complete.

---

## 11. Recommended execution order

### Phase 1 — Context
Read:
- repository-root `AGENTS.md`
- this handoff
- current docs
- current source tree

### Phase 2 — AGENTS
Create/update `AGENTS.md` from verified current reality.

Use only context verified against the current tree and implementation.

### Phase 3 — Naming/documentation audit
Produce a list of:
- ambiguous names;
- stale docs;
- misleading labels;
- exact game-rule ambiguities.

### Phase 4 — Naming/documentation refactor
Perform behavior-preserving changes only.

### Phase 5 — Regression verification
Verify that probability outputs and UI behavior are unchanged except for intended wording/organization.

### Phase 6 — Ideas
Only now read `IDMS_GACHA_ANALYSIS_IDEAS.md` as the feature/improvement backlog.

The user chooses which ideas to implement.

---

## 12. Bottom line

The project is substantially built.

The immediate task is to make the existing implementation easier to understand and safer to maintain without disturbing the unusual gacha mathematics.

Do not turn the cleanup phase into a feature-development phase.

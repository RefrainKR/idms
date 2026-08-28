# IDEAS.md

Date: 2026-08-28

## Purpose

This document is the backlog for **future feature additions or behavior/analysis improvements** after the initial naming/documentation refactor is complete.

It is not part of the immediate cleanup task.

Required order:
1. verify repository and game-rule meaning;
2. update `AGENTS.md`;
3. naming/documentation refactor;
4. regression verification;
5. only then review this document;
6. implement only ideas explicitly selected by the user.

---

# 1. Highest-value candidate: 스탭업 checkpoint marginal value

The current probability engine already calculates progression across pull counts.

Use that existing result to extract game-significant checkpoints rather than creating a new probability engine.

Examples:
- 40 pulls: one 스탭업 loop
- 80 pulls: two loops / possible random pickup ticket
- 120 pulls: PJ third loop / possible select ticket
- 200 total shared stack: select ceiling

Possible output:

| Checkpoint | Goal probability | Change from previous checkpoint |
|---|---:|---:|
| 40 | 27.5% | — |
| 80 + random ticket | 56.8% | +29.3%p |
| 120 + select ticket | 81.4% | +24.6%p |
| 200 shared ceiling | ... | ... |

Numbers above are examples only.

### Why this is useful
It answers:
> If I pay for 스탭업, where is the next meaningful stopping point?

This is more actionable than only knowing that 스탭업 is better overall.

### Implementation preference
Reuse existing DP/CDF progression data.
Do not introduce a second simulation engine.

---

# 2. 일반-equivalent pull count

For a given 스탭업 checkpoint:

1. calculate its target-completion probability;
2. find the earliest 일반 pull count that reaches the same probability.

Example:

```text
스탭업 at 80 pulls
completion probability = 72.4%

일반 reaches 72.4% at 137 pulls

=> 스탭업 80-pull result ≈ 일반 137-pull result
=> +57 일반 pulls of probability effect
```

This is an intuitive way to describe 스탭업 value.

### Important limitation
This is **not a universal exchange rate**.

It depends on:
- banner;
- number of pickups;
- snipe vs any;
- target count;
- checkpoint;
- random/select rewards;
- ceiling state.

The UI/documentation must present it as a conditional equivalence.

---

# 3. Free-currency equivalent effect

This is derived from the 일반-equivalent pull count.

If one 일반 pull costs 250 free currency:

```text
일반-equivalent bonus = 57 pulls
57 × 250 = 14,250 free currency
```

Possible wording:

> Under the current target and banner conditions, the 스탭업 bonuses provide approximately the same collection-probability effect as 14,250 additional free currency spent on 일반 pulls.

### Do not present this as
- a fixed paid/free currency exchange rate;
- a universal monetary valuation.

It is target-conditional probability equivalence.

---

# 4. Multi-threshold target-probability summary

The project already supports:
> target probability -> required pulls.

Extend the presentation to show several useful thresholds at once.

Example:

| Target probability | 일반 | 스탭업 | Pull difference |
|---|---:|---:|---:|
| 50% | 78 | 54 | 24 |
| 70% | 126 | 86 | 40 |
| 80% | 164 | 113 | 51 |
| 90% | 238 | 187 | 51 |
| 95% | 302 | 251 | 51 |

Numbers are examples only.

### Benefit
A user can see how 스탭업 value changes depending on how much certainty they want, without repeatedly changing a single target-probability input.

### Implementation preference
Reuse the existing CDF arrays and threshold search.

---

# 5. Owned-currency strategy analysis

Lower priority because it expands scope.

Possible inputs:
- current paid currency;
- current free currency.

Possible calculation:
1. use paid currency for the available 스탭업 path;
2. after 스탭업 is exhausted or paid currency is insufficient, use 일반 where applicable;
3. include shared ceilings and tickets;
4. report final collection probability.

Example output:

```text
Paid currency: ...
Free currency: ...

Possible path:
스탭업 80 pulls
+ 일반 128 pulls
+ one shared 200-stack select

Target 1 acquired: 91.2%
Both targets acquired: 67.8%
```

### Why lower priority
This begins to connect the gacha engine directly to the payment/currency subsystem and increases product complexity.

---

# 6. Existing-feature improvement: total acquisition count

The current duplicate-inclusive total-acquisition distribution is mathematically valid, but it is less central than collection probability.

Possible improvement:
- keep it;
- move it into a secondary/detailed-analysis section;
- connect it more clearly to duplicate-resource value if that subsystem becomes more rigorous.

Do not delete it solely because it is secondary.

---

# 7. Existing-feature improvement: duplicate-resource expectation

Current "무돌" expectation may assume that relevant draws are duplicates.

Potential improvements:
- rename to make the assumption explicit;
- display the assumption beside the result;
- optionally support ownership-state inputs in a future version if useful.

Candidate labels:
- `중복 기준 무돌 기대값`
- `전부 중복 가정 기대값`

A full ownership-state model is not currently a high-priority addition.

---

# 8. Existing-feature improvement: analytical toggles

Controls that remove:
- ceiling;
- random ticket;
- select reward;
- Step bonuses;
etc. are useful for counterfactual analysis.

However, they can be confusing if presented as ordinary game configuration.

Potential improvement:
- actual-game rules enabled by default;
- place counterfactual toggles under an advanced/analysis section.

This allows questions such as:
- How much does the random ticket itself add?
- How strong is Step4 guarantee?
- How much does the ceiling change the curve?

---

# 9. Best / Worst presentation

Do not remove the Best/Worst graph merely for naming purity.

Interpretation:
- Best: desired complete state;
- Worst: zero target acquisitions / failure extreme.

Possible UI clarification:
- `Best (성공)`
- `Worst (폭사)`

Worst can be interpreted as "폭사 위험", which is meaningful to users deciding whether to spend.

---

# 10. Possible future risk metric: failure-risk reduction

This is optional and lower priority than 일반-equivalent pulls.

Example:
- 일반 completion: 70% -> failure 30%
- 스탭업 completion: 85% -> failure 15%
- failure risk reduced by 50%

This can be more informative than raw `+15%p` in some cases.

However:
- do not turn it into a single universal efficiency score;
- show it only as a supplementary interpretation if implemented.

---

# 11. Ideas that should NOT be prioritized

## 11.1 Won per +1 percentage point

Example:
```text
+12.4%p for ₩18,000
=> ₩1,452 per +1%p
```

Mathematically computable, but not a good primary decision metric.

Reasons:
- probability value is nonlinear;
- 50->51% and 98->99% are both +1%p but not equivalent decisions;
- ceiling/ticket jumps make curves discontinuous;
- target type changes value.

Prefer:
- actual probability;
- required pulls;
- 일반-equivalent pulls;
- optionally failure-risk reduction.

## 11.2 Monte Carlo as a user-facing probability engine

Do not add Monte Carlo where the DP gives an exact distribution.

Monte Carlo can still be useful as a developer-only independent validation method.

## 11.3 Single automatic "best strategy" score

Do not collapse the user's decision into one universal recommendation.

The best choice depends on:
- one-target snipe vs all-collection;
- paid currency value;
- free currency holdings;
- willingness to pay;
- desired certainty;
- banner-specific 스탭업 rules.

The tool should primarily expose accurate numbers so the user can decide.

## 11.4 Fixed paid/free currency exchange rate

Do not claim:
> 1 paid currency = X free currency

based only on 스탭업 probability advantage.

Any equivalence derived from the gacha engine is conditional on the current banner/goal and should be labeled accordingly.

---

# 12. Suggested feature priority after cleanup

1. 스탭업 checkpoint marginal-value table
2. 일반-equivalent pull count
3. Free-currency equivalent effect
4. Multi-threshold target-probability summary
5. UI placement/clarification of secondary analyses
6. Owned paid/free currency strategy analysis
7. Optional failure-risk reduction display

Before implementing any item, verify whether an equivalent feature already exists in another view or under a different name.

---

# 13. Implementation principle for future ideas

Prefer derived views over new engines.

The project already has:
- collection DP;
- total-acquisition DP;
- 스탭업 state progression;
- ceiling/ticket handling;
- CDF/progress arrays.

Many proposed features can be implemented by reading existing probability curves at meaningful points or searching them in reverse.

This reduces the risk of two implementations of the same game rules drifting apart.

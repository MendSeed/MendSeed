# QuietFray v0.1 — Model Card

## Model Details
- **Model Name:** QuietFray v0.1
- **Domain:** Category-Aware Temporal Point Process Evidence Model
- **Primary Objective:** Discriminate between persistent, unresolved real-world friction ($H_1$) and transient, burst-driven, or superficial engagement ($H_0$).
- **Integrated System:** MendSeed (Public Problem Discovery Platform)
- **Status:** Research baseline with reproducible synthetic benchmarks.

## Intended Use
- Scoring canonical problem statements based on the structure of evidence over time.
- Highlighting issues that exhibit steady, diverse problem reports and sustained community support.
- Assisting Problem Hunters and open-source builders in identifying persistent friction worth solving.

## Non-Goals & Limitations
- **Not a measure of human credibility:** QuietFray evaluates anonymous event streams, not individuals.
- **Not a replacement for votes:** Support votes and QuietFray scores are maintained as distinct metrics.
- **Not an autonomous censor:** Visibility and moderation checks are strictly independent of ranking.
- **Uncalibrated Posterior:** The unified score $U_i$ represents candidate log-evidence under specified modeling assumptions, not an objective probability of real-world importance.

## Input Channels
1. **$V_i(t)$:** Directional support votes.
2. **$R_i(t)$:** Approved problem reports with quality proxies $(c_k, H_k, s_k^{\mathrm{burst}})$.
3. **$A_i(t)$:** Unresolved duration in days since canonical publication.
4. **$F_i(t)$:** Documented resolution reopening events.
5. **$\pi_c$:** Empirical Bayes category prior regularized over historical reviewed outcomes.

## Subcritical Hawkes Condition
The model implements dual-timescale exponential memory kernels:
$$\nu_{m,z} = \alpha_{m,z,f}\tau_f + \alpha_{m,z,s}\tau_s < 1$$
Verified analytically and experimentally via automated test suite.

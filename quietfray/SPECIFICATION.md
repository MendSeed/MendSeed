# QuietFray v0.1 — Model Specification

## 1. Overview
QuietFray v0.1 is a category-aware temporal evidence model for ranking problem opportunities in MendSeed. It estimates whether an observed event stream is more consistent with persistent, unresolved unmet need ($H_1$) or transient, viral, or weak evidence ($H_0$).

## 2. Event Channels
1. **$V_i(t)$ (Votes):** Anonymous support votes with direction (UP/DOWN).
2. **$R_i(t)$ (Reports):** Approved independent submissions with mark vectors $(c_k, H_k, s_k^{\mathrm{burst}})$.
3. **$A_i(t)$ (Unresolved Duration):** Elapsed days since canonical publication.
4. **$F_i(t)$ (Reopen Signals):** Documented failures or reopenings of prior attempted fixes.
5. **$\pi_c$ (Category Prior):** Regularized empirical Bayes prior across problem categories.

## 3. Mathematical Formulation

### 3.1 Dual-Timescale Intensity States
For channel $m \in \{V, R\}$ and timescale $k \in \{f, s\}$:
$$x_{m,k}(t) = \sum_{j: t_j < t} q_j \exp\left(-\frac{t - t_j}{\tau_k}\right)$$
- Fast timescale: $\tau_f = 0.02$ days (28.8 minutes)
- Slow timescale: $\tau_s = 3.0$ days
- For votes: $q_j = 1$
- For reports: $q_k = \operatorname{clip}(c_k H_k (1 - s_k^{\mathrm{burst}}), 0, 1)$

### 3.2 Intensity Functions
$$\lambda_{m,z}(t) = \mu_{c,m} + \alpha_{m,z,f} x_{m,f}(t) + \alpha_{m,z,s} x_{m,s}(t)$$

Subcriticality branching mass check ($\nu_{m,z} < 1$):
- Votes $H_0$: $\nu = 0.315 < 1$
- Votes $H_1$: $\nu = 0.487 < 1$
- Reports $H_0$: $\nu = 0.360 < 1$
- Reports $H_1$: $\nu = 0.550 < 1$

### 3.3 Log-Evidence Point Process
$$\ell_m = \sum_{j: t_j \le T} \log \frac{\lambda_{m,1}(t_j^-)}{\lambda_{m,0}(t_j^-)} - \int_0^T [\lambda_{m,1}(t) - \lambda_{m,0}(t)] dt$$

### 3.4 Report Mark Likelihood
- Confidence $c$: $\text{Beta}(3,4)$ under $H_0$, $\text{Beta}(8,2)$ under $H_1$
- Diversity $H$: $\text{Beta}(1.5,5)$ under $H_0$, $\text{Beta}(5,2)$ under $H_1$
- Recent Duplication $s$: $\text{Beta}(8,1.5)$ under $H_0$, $\text{Beta}(1.5,8)$ under $H_1$

### 3.5 Unified Evidence Score
$$U_i = \operatorname{logit}(\pi_c) + \ell_V + \ell_R + \ell_{\mathrm{marks}} + \ell_{\mathrm{vote}} + \ell_{\mathrm{reopen}} + \ell_{\mathrm{surv}}$$

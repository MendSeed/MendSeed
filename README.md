# MendSeed

> **The world is full of things that shouldn't be this annoying.**  
> *Report the friction you keep running into. Find the problems others recognize. Give builders something real to solve.*

MendSeed is an open-source, privacy-first, evidence-driven public problem-discovery and solution-development platform.

---

## Core Product Principles

1. **Account-Free Participation:** Report, explore, and support problems without passwords, email requirements, or public identities.
2. **Capability-Based Authorization:** Opaque cryptographic tokens (`mcap_...`) govern actions that require continuity (stewardship leases, solution updates, resolution authority). The server stores only SHA-256 hashes.
3. **Evidence-Backed Synthesis:** Canonical issues consolidate symptoms from multiple approved reports. Original author wording is preserved as underlying evidence.
4. **Enforced Resolution Rule:** An issue may **only be marked Solved** by the verified holder of the capability token for a linked solution report with documented verification evidence.
5. **QuietFray v0.1 Research Engine:** A category-aware temporal evidence point-process model that contrasts sustained evidence accumulation ($H_1$) against transient viral bursts ($H_0$).
6. **Free-First Resilience:** Zero-cost default deployment. Functions reliably even if third-party AI or external services are unavailable.

---

## Lifecycle: From Problem to Verified Fix

$$\text{Report} \longrightarrow \text{Validate} \longrightarrow \text{Consolidate} \longrightarrow \text{Explore} \longrightarrow \text{Claim} \longrightarrow \text{Investigate} \longrightarrow \text{Submit Solution} \longrightarrow \text{Verify} \longrightarrow \text{Resolve}$$

1. **Report:** Anonymous friction report with title, description, and category.
2. **Deterministic Checks:** Validation, spam/injection filters, and secret protection before commit.
3. **Consolidation:** Clustering similar symptoms into canonical issues while preserving original reports.
4. **Exploration:** Problem Hunters explore via **Friction Map**, **Top 10** (Trending, Most Supported, Newest), and **Problem Stream**.
5. **Stewardship Lease:** Builders claim a time-limited 7-day lease to coordinate investigation without blocking others.
6. **Solution Report:** Structured fix submissions with GitHub repositories, application demos, or documentation links.
7. **Resolution:** Cryptographically authorized transition to Solved with audit evidence. Failed fixes can be reopened with documented justification.

---

## QuietFray v0.1 Research Model

QuietFray is a temporal evidence point-process model:

- **Dual-Timescale Kernels:** Fast ($\tau_f = 0.02$ days) and slow ($\tau_s = 3.0$ days) memory states.
- **Subcritical Hawkes Branching Mass:** Verified $\nu_{m,z} < 1$ across all channels.
- **Integrated Intensity:** Closed-form analytical updates using $\operatorname{expm1}$.
- **Mark Likelihoods:** Beta distributions over confidence ($c$), description diversity ($H$), and burst similarity ($s$).
- **Survival Persistence:** Weibull duration hazard log-ratio.
- **Empirical Bayes Category Priors:** Regularized category baseline rates.

### Running QuietFray Benchmarks

```bash
# Run unit tests and mathematical checks
npx vitest run quietfray/tests/model.test.ts

# In-browser benchmark lab
# Navigate to the "Observatory" tab in the application and click "Run Benchmark Suite"
```

---

## Local Development & Setup

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
git clone https://github.com/MendSeed/MendSeed.git
cd MendSeed
npm install
```

### Run Dev Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Database Setup (Optional Neon PostgreSQL)
MendSeed operates in resilient local mode by default. To connect a Neon or PostgreSQL database:

1. Create a PostgreSQL database.
2. Run migration script:
   ```bash
   psql $DATABASE_URL -f scripts/schema.sql
   ```
3. Set `DATABASE_URL` in your environment.

---

## Public Policies & Governance

- [Privacy Policy](docs/privacy.md): Zero trackers, isolated newsletter storage, cryptographic capability tokens.
- [Moderation Guidelines](docs/moderation.md): Constructive problem reporting, anti-spam, secret redaction.
- [Data Retention](docs/retention.md): Provenance preservation, capability-based deletion.
- [Security Disclosure](docs/security.md): Coordinated vulnerability reporting.

---

## License

MIT License. Open source and free for the community.

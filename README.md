# QuantumWealth

![CI/CD Status](https://img.shields.io/github/actions/workflow/status/quantsingularity/QuantumWealth/cicd.yml?branch=main&label=CI%2FCD&logo=github)

## AI-Powered Wealth Management and Robo-Advisory Platform

QuantumWealth is a robo-advisory platform: a Django backend for accounts, advisor, market, portfolio, risk, and tax, paired with a React web dashboard and 9 genuinely implemented AI modules (portfolio optimization, risk, robo-advice, market prediction, tax optimization, sentiment, factor models, backtesting, and anomaly detection), each pulling real market data via yfinance and wired directly into the backend.

<div align="center">
  <img src="docs/images/homepage.bmp" alt="QuantumWealth HomePage" width="100%">
</div>

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Feature Status](#feature-status)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation and Setup](#installation-and-setup)
- [Running the Stack](#running-the-stack)
- [API Surface](#api-surface)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

QuantumWealth demonstrates a robo-advisory workflow across a real, runnable codebase. All 9 AI modules are genuinely implemented, not aspirational: real cvxpy-based Black-Litterman and Hierarchical Risk Parity optimization, real Monte Carlo GBM simulation for VaR, and real VADER sentiment scoring with an honest fallback if the library isn't installed, and six of them are genuinely imported and called by the Django backend. CI runs the backend's 192 tests, the AI modules' separate 154-test suite, and the frontend's 126 Vitest tests.

## Project Structure

```
QuantumWealth/
├── code/
│   ├── backend/                    # Django application
│   │   ├── quantumwealth/          # Project config: settings, URLs
│   │   ├── apps/                   # accounts, advisor, market, portfolio, risk, tax
│   │   └── tests/                  # Backend test suite (run in CI)
│   └── ai_models/                  # 9 AI modules, 6 of them genuinely imported
│       ├── portfolio_optimizer/    # Mean-variance, Black-Litterman, risk parity, HRP
│       ├── risk_engine/            # Historical/parametric VaR, CVaR, Monte Carlo GBM
│       ├── robo_advisor/           # Goal planning (FV/PMT), ERC rebalancing
│       ├── market_predictor/       # GBM forecasting, regime detection, RSI/SMA
│       ├── tax_optimizer/          # Tax-loss harvesting, wash-sale calendar
│       ├── sentiment_analyzer/     # VADER news sentiment, with a fallback
│       │                           # if the library isn't installed
│       ├── factor_models/          # Fama-French 5-factor OLS, BHB attribution
│       ├── backtester/             # Event-driven simulation with transaction
│       │                           # costs and benchmark comparison
│       ├── anomaly_detector/       # Isolation Forest, z-score outliers
│       └── tests/                  # AI modules' own test suite (run in CI)
├── frontend/                       # React (Vite) web dashboard
├── infrastructure/                 # Nginx config, PostgreSQL init
├── scripts/                        # setup.sh, backup_db.sh
├── docs/                           # Documentation (this directory)
├── docker-compose.yml              # Full stack: db, redis,
│                                   # celery worker/beat, backend,
│                                   # frontend build, nginx
└── README.md
```

## Feature Status

### Application tier (wired and tested)

| Component                  | Details                                                                                                                                                                |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**                    | Django REST backend covering accounts, advisor, market, portfolio, risk, and tax apps, with Swagger UI and ReDoc served alongside the API.                             |
| **Portfolio optimization** | Real cvxpy-based mean-variance, Black-Litterman, risk parity, and Hierarchical Risk Parity optimization, pulling market data via yfinance.                             |
| **Risk engine**            | Historical VaR, parametric VaR, CVaR, a Monte Carlo GBM simulation, and 5 stress scenarios.                                                                            |
| **Robo advisor**           | Future-value and payment-based goal planning, Equal Risk Contribution rebalancing, and concentration detection.                                                        |
| **Market predictor**       | GBM price forecasting, rolling regime detection, and RSI plus SMA indicators.                                                                                          |
| **Tax optimizer**          | Greedy tax-loss harvest scheduling, an after-tax return model, and a wash-sale calendar.                                                                               |
| **Sentiment analyzer**     | Real VADER-based news sentiment scoring, combined with momentum, volume, and RSI into a composite signal, with a fallback to a neutral score if VADER isn't installed. |
| **Factor models**          | Fama-French 5-factor OLS regression, Brinson-Hood-Beebower performance attribution, and sector decomposition.                                                          |
| **Backtester**             | Event-driven simulation with transaction costs and benchmark comparison.                                                                                               |
| **Anomaly detector**       | Isolation Forest, z-score outlier detection, and wash-sale clustering.                                                                                                 |
| **Web dashboard**          | React app (Vite, plain JavaScript) with Tailwind CSS and Recharts, backed by Celery worker and beat containers for background and scheduled tasks.                     |

## Technology Stack

| Area                 | Technology                                                                                                          |
| :------------------- | :------------------------------------------------------------------------------------------------------------------ |
| Backend              | Django, Django REST Framework                                                                                       |
| Data layer           | PostgreSQL, Redis (cache and Celery broker)                                                                         |
| Background tasks     | Celery (worker and beat, both containerized)                                                                        |
| Quant / optimization | cvxpy (Black-Litterman, HRP, mean-variance, risk parity), SciPy, NumPy, pandas                                      |
| Market data          | yfinance                                                                                                            |
| Sentiment            | VADER (vaderSentiment), with a neutral-score fallback if not installed                                              |
| Anomaly detection    | scikit-learn (Isolation Forest)                                                                                     |
| Web frontend         | React 18, Vite, Tailwind CSS, Recharts                                                                              |
| Infrastructure       | Docker, Docker Compose, Nginx                                                                                       |
| CI/CD                | GitHub Actions                                                                                                      |
| Testing              | pytest (backend, 192 tests; AI modules, 154 tests); Vitest and Testing Library (frontend, 126 tests); all run in CI |

## Architecture

```
Client
  └── frontend (React, Vite)          ── HTTP/JSON ──┐
                                                       ▼
Backend (Django)
  ├── Apps    accounts, advisor, market, portfolio, risk, tax
  ├── Background  Celery worker and beat (scheduled tasks)
  └── Data layer    PostgreSQL, Redis

AI modules (code/ai_models, imported directly by the backend apps)
  portfolio_optimizer · risk_engine · robo_advisor · market_predictor
  tax_optimizer · sentiment_analyzer · factor_models · backtester
  anomaly_detector
```

See [docs/architecture.md](docs/architecture.md) for detail.

## Installation and Setup

Prerequisites: Python 3.11+, Node.js 18+, and Docker.

Docker:

```bash
git clone https://github.com/quantsingularity/QuantumWealth.git
cd QuantumWealth
cp code/backend/.env.example code/backend/.env
# edit .env: set SECRET_KEY and DB_PASSWORD

docker compose up --build -d
docker compose exec backend python manage.py seed_demo_data
```

Local:

```bash
cd code/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

## Running the Stack

```bash
docker compose up --build -d
```

| Service      | URL                           |
| :----------- | :---------------------------- |
| Swagger UI   | `http://localhost/api/docs/`  |
| ReDoc        | `http://localhost/api/redoc/` |
| Django Admin | `http://localhost/admin/`     |

Demo login: `demo@quantumwealth.ai` / `Demo1234!`

## API Surface

Full endpoint reference with request and response schemas is in [docs/api-reference.md](docs/api-reference.md), and interactively at `/api/docs/` (Swagger) or `/api/redoc/` once the API is running.

## Testing

```bash
# Backend (from code/backend)
pytest

# AI modules (from code/ai_models)
pytest

# Frontend (from frontend)
npm test
```

| Suite            | Test count | Run in CI |
| :--------------- | :--------- | :-------- |
| `code/backend`   | 192        | Yes       |
| `code/ai_models` | 154        | Yes       |
| `frontend`       | 126        | Yes       |

See [docs/testing.md](docs/testing.md) for what each suite covers.

### Frontend tests

The dashboard has its own Vitest suite of 126 tests across 7 files, run with `npm test` from the `frontend` directory (`npm run test:coverage` adds a coverage report):

| Test file                                              | Test count |
| :----------------------------------------------------- | :--------- |
| `src/api/client.test.js` (REST client, token refresh)  | 28         |
| `src/components/ui/index.test.jsx` (shared components) | 37         |
| `src/components/layout/AppLayout.test.jsx` (app shell) | 10         |
| `src/hooks/useAuth.test.jsx` (session handling)        | 10         |
| `src/pages/LoginPage.test.jsx` (sign in form)          | 8          |
| `src/pages/RegisterPage.test.jsx` (registration form)  | 11         |
| `src/App.test.jsx` (routing and redirects)             | 22         |

Three of those tests are marked as expected failures (`it.fails`) because they record known defects. They fail the run as soon as the defect is fixed, which is the cue to turn them back into normal tests:

| Defect                                                                                                                                               | Where               |
| :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| An error response that is not JSON (for example an HTML 502 page from a proxy) rejects with a `SyntaxError` instead of an error carrying the status. | `src/api/client.js` |
| A server error about the email or name arrives while the user is on step 2 of registration, where nothing renders it, so the submit fails silently.  | `RegisterPage.jsx`  |
| A failure without error details (a network failure, for example) never reaches the generic "Registration failed." message, so nothing is shown.      | `RegisterPage.jsx`  |

## CI/CD Pipeline

GitHub Actions (`.github/workflows/cicd.yml`) runs four jobs on push to `main` or `develop`, on pull requests to those branches, and on manual dispatch:

| Job                         | Depends on          | What it does                                                                                                                                                                  |
| :-------------------------- | :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code Quality Checks         | -                   | Formatter checks across the repository (Python and Prettier).                                                                                                                 |
| Backend Test & Build        | Code Quality Checks | Runs `pytest tests/` from `code/backend` with coverage (uploaded as an artifact), then builds the backend Docker image, checks it runs as a non-root user and smoke tests it. |
| AI Models Test & Validation | Code Quality Checks | Byte-compiles the AI modules, checks that every sub-package imports cleanly, then runs their pytest suite with coverage (uploaded as an artifact).                            |
| Frontend Test & Build       | Code Quality Checks | Installs dependencies, lints, runs the Vitest suite with coverage (uploaded as an artifact), then produces the production web build and uploads the bundle.                   |

## Documentation

| Document                                           | Contents                                                      |
| :------------------------------------------------- | :------------------------------------------------------------ |
| [docs/overview.md](docs/overview.md)               | Platform goals, architecture, technology stack                |
| [docs/api-reference.md](docs/api-reference.md)     | Complete endpoint reference with request and response schemas |
| [docs/ai-models.md](docs/ai-models.md)             | Mathematical foundations for all AI and ML modules            |
| [docs/database-schema.md](docs/database-schema.md) | Full table definitions with column types and indexes          |
| [docs/architecture.md](docs/architecture.md)       | System design, request lifecycle, security model, scalability |
| [docs/developer-guide.md](docs/developer-guide.md) | Contributing guide, code style, testing patterns              |
| [docs/deployment.md](docs/deployment.md)           | Local, Docker, and production deployment instructions         |
| [docs/testing.md](docs/testing.md)                 | Test suite overview and instructions                          |

## Contributing

Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

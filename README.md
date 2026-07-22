<div align="center">

<img src="https://img.shields.io/badge/AegisOS-Industrial%20Safety%20AI-1d4ed8?style=for-the-badge&logo=shield&logoColor=white" alt="AegisOS"/>

# 🛡️ AegisOS — Industrial Safety Intelligence Platform

### *Autonomous Multi-Agent AI System for Zero-Harm Industrial Operations*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python)](https://python.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57?style=flat&logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

**AegisOS detects compound industrial hazards before thresholds are individually breached — predicting dangerous interactions between IoT sensor readings, active work permits, and spatial zone conditions in real-time.**

[**🚀 Quick Start**](#-quick-start) · [**📐 Architecture**](#-architecture) · [**🤖 AI Agents**](#-multi-agent-ai-framework) · [**🖥️ Platform Modules**](#%EF%B8%8F-platform-modules) · [**📡 API Reference**](#-api-reference)

</div>

---

## 🎯 The Problem We Solve

Traditional industrial safety systems (SCADA, EHS software) monitor sensors **individually** against fixed thresholds. They are completely blind to **compound hazards** — the real cause of major industrial disasters.

> **Example:** A methane gas level of 200 ppm is below the 500 ppm alarm threshold. An active hot-work welding permit 4 metres away in an adjacent zone is valid and approved. Individually, neither triggers any alert. Together, they create a **CRITICAL** explosion risk. Legacy systems miss this entirely. AegisOS catches it 15–30 minutes before either threshold is individually breached.

This is the **compound hazard gap** that AegisOS closes.

---

## ✨ What AegisOS Does

| Capability | How It Works |
|:---|:---|
| **Compound Risk Detection** | Non-linear scoring formula penalizes dangerous combinations of sub-threshold sensor readings + active permits |
| **Multi-Agent Autonomous Monitoring** | 5 AI agents continuously score zones, simulate cascades, take automated actions, and explain decisions |
| **Digital Twin Simulation** | Physics-based cascade propagation across factory zone graph — simulate gas leaks, fires, explosions before they happen |
| **Explainable AI Alerts** | SHAP feature attribution tells operators *exactly* which sensors drove each risk score — no black-box alerts |
| **PTW Conflict Detection** | Real-time AI conflict analysis across all active Permit-To-Work records, with approve/defer/deny recommendation |
| **Regulatory Compliance** | Automated OSHA 29 CFR & Factories Act compliance tracking with one-click PDF audit report generation |
| **RAG Safety Copilot** | Workers query safety regulations, PPE requirements, and emergency procedures via text or voice |

---

## 🚀 Quick Start

> **Requirements:** Node.js v18+ and Python v3.10+
> No Docker, no PostgreSQL, no Redis required. Runs fully standalone out of the box.

### 1. Clone the repository

```bash
git clone https://github.com/Madhav2246/AI-Powered-Industrial-Safety-Intelligence-for-Zero-Harm-Operations.git
cd AI-Powered-Industrial-Safety-Intelligence-for-Zero-Harm-Operations
```

### 2. Start the Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

| Endpoint | URL |
|:---|:---|
| Web API | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/docs` |
| Health Check | `http://localhost:8000/health` |

### 3. Start the Frontend (React + Vite)

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

| Page | URL |
|:---|:---|
| Landing Page | `http://localhost:3000/` |
| Command Center | `http://localhost:3000/dashboard` |
| GIS Map | `http://localhost:3000/map` |
| Digital Twin Lab | `http://localhost:3000/simulation` |
| Safety Copilot | `http://localhost:3000/copilot` |
| Compliance & PTW | `http://localhost:3000/compliance` |

---

## 📐 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER — React 18 + Vite + Tailwind CSS        │
│  Landing Page │ Command Center │ GIS Map │ Sim Lab │ Copilot │ Compliance │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │  REST API + WebSocket /ws/sensors
┌──────────────────────────────────▼───────────────────────────────────────┐
│              ORCHESTRATION LAYER — FastAPI + AegisOrchestrator            │
│  8 API Routers │ CORS Middleware │ WebSocket Stream │ Task Lifecycle      │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │  asyncio background tasks
┌──────────────────────────────────▼───────────────────────────────────────┐
│                 AGENT LAYER — Multi-Agent AI Framework                    │
│   RiskAgent │ SimulationAgent │ ActionAgent │ CopilotAgent │ Explainer    │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │  SQLAlchemy Async ORM
┌──────────────────────────────────▼───────────────────────────────────────┐
│               DATA LAYER — SQLite (aiosqlite) / PostgreSQL                │
│    sensor_readings │ alerts │ work_permits │ workers │ incidents           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent AI Framework

The `AegisOrchestrator` coordinates five specialized agents running as independent asyncio background tasks:

| Agent | Role | Trigger |
|:---|:---|:---|
| **RiskAgent** | Computes non-linear composite risk score per zone combining sensor telemetry + active permit state | Every 2 seconds, all 8 zones |
| **SimulationAgent** | Models physical hazard cascade propagation across the zone adjacency graph | On-demand or high-risk event |
| **ActionAgent** | Issues autonomous safety actions (permit revocation, worker alert) when zone risk ≥ 75.0 | RiskAgent threshold breach |
| **CopilotAgent** | Answers safety queries against OSHA 29 CFR & Factories Act knowledge base via RAG retrieval | Per worker request |
| **ExplainerAgent** | Decomposes black-box risk scores into ranked sensor feature contributions using SHAP values | Alongside RiskAgent output |

### Compound Risk Scoring Formula

The core innovation is the **Ω_compound interaction term** — it fires only when multiple sub-threshold conditions coincide:

```
R_zone(k, t) = min(100,  Σ[wᵢ · Sᵢ(t)]  ×  ∏[1 + μⱼ · Pⱼ(t)]  +  Ω_compound)

Where:
  Sᵢ(t)         → Normalized sensor input ∈ [0,100]: gas_level, temperature, pressure, vibration
  wᵢ             → Per-sensor weight, calibrated per zone type (Σwᵢ = 1.0)
  Pⱼ(t) ∈ {0,1} → Active permit binary: hot_work=1, confined_space=1, electrical=1
  μⱼ             → Permit risk amplification coefficient (e.g., μ_hot_work = 0.45)
  Ω_compound     → +35 pts when gas>150ppm AND temp>45°C AND any_permit=1
```

---

## 🖥️ Platform Modules

<details>
<summary><strong>📊 Command Center (/dashboard)</strong></summary>

The primary operational dashboard showing all 8 factory zones as an interactive telemetry matrix. Each zone card displays:
- Live composite risk score (0–100) with colour-coded classification (green / amber / orange / critical red)
- Current anomaly type if active
- Real-time area chart of risk trajectories for the top 3 highest-risk zones over the last 15 sampling periods
- SHAP attribution breakdown showing which sensors are driving the current zone score
- Live alert feed with one-click acknowledgement

</details>

<details>
<summary><strong>🗺️ Spatial GIS Map (/map)</strong></summary>

Interactive Leaflet.js GIS map with:
- 8 factory zone polygons overlaid on a dark-mode CARTO tile layer
- Dynamic polygon fill colour updated live based on current risk score (green → amber → orange → red)
- Zone telemetry sidebar with animated progress bars
- Popup tooltips per zone showing name and live score

</details>

<details>
<summary><strong>🧪 Digital Twin Simulation Lab (/simulation)</strong></summary>

Physics-based cascade scenario engine. Configure:
- **Scenario type:** Gas Accumulation, Thermal Runaway, Fire, Vapor Explosion
- **Target zone, severity scale (0.1–1.0), personnel count, permit state**

Returns: peak risk score, cascade event timeline (T+0, T+5, T+15 min), evacuation count, property damage estimate (USD), and ordered prevention steps.

</details>

<details>
<summary><strong>💬 Safety Copilot (/copilot)</strong></summary>

Conversational RAG assistant with:
- Voice input via Web SpeechRecognition API (hands-free for workers in PPE)
- Pre-built query chips for the most common safety questions
- Regulatory citation references alongside every response
- Context-aware: passes current zone ID with each query for location-specific guidance

**Regulatory sources covered:**
- OSHA 29 CFR 1910.119 — Process Safety Management
- OSHA 29 CFR 1910.146 — Confined Space Permits
- OSHA 29 CFR 1910.132 — PPE Requirements
- Factories Act 1948 Sections 37–40

</details>

<details>
<summary><strong>📋 Compliance & PTW (/compliance)</strong></summary>

- Real-time compliance metrics (overall score, PTW rate, PPE rate, training rate) as animated bar charts
- Full Permit-To-Work registry table with AI conflict flags and approve/defer/deny recommendations
- OSHA 29 CFR compliance matrix mapped to each standard
- One-click audit PDF report generation

</details>

---

## 📡 API Reference

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/sensors/zones` | Live telemetry snapshot for all zones |
| `WS` | `/ws/sensors` | Real-time streaming WebSocket sensor feed |
| `GET` | `/api/v1/risk/zones` | Current composite risk scores, all zones |
| `GET` | `/api/v1/alerts/active` | All unacknowledged safety alerts |
| `POST` | `/api/v1/alerts/{id}/acknowledge` | Acknowledge a specific alert |
| `POST` | `/api/v1/simulation/run` | Run a what-if cascade simulation |
| `POST` | `/api/v1/copilot/chat` | RAG safety query with zone context |
| `GET` | `/api/v1/compliance/dashboard` | Compliance metrics dashboard data |
| `GET` | `/api/v1/compliance/report/generate` | Generate audit report summary |
| `GET` | `/api/v1/permits/active` | All active/pending Permit-To-Work records |
| `GET` | `/health` | Backend health check |

Full interactive API documentation available at `http://localhost:8000/docs` (Swagger UI).

---

## 🗄️ Database Schema

The backend uses **SQLAlchemy 2.0 Async ORM** with automatic table creation on startup. Defaults to embedded SQLite — switch to PostgreSQL by changing `DATABASE_URL` in `.env`.

```
sensor_readings   — IoT time-series telemetry (gas, temp, pressure, vibration, risk_score)
alerts            — Safety event log with severity, SHAP evidence, and acknowledgement state
work_permits      — Permit-To-Work registry with AI conflict flags and recommendations
workers           — Personnel registry with GPS zone tracking and certification records
incidents         — Historical incident log used as RAG knowledge source
```

---

## 🛠️ Tech Stack

**Frontend**
- React 18, Vite 5, Tailwind CSS v3
- Zustand (state), Recharts (charts), Leaflet.js (GIS), Framer Motion (animations)
- Lucide React (icons), react-hot-toast (notifications)

**Backend**
- FastAPI 0.111, Uvicorn, Pydantic v2, Pydantic-Settings
- SQLAlchemy 2.0 Async, aiosqlite, asyncpg
- Loguru (structured logging), httpx, pytz

---

## 📁 Repository Structure

```
├── backend/
│   ├── agents/
│   │   └── orchestrator.py       # Multi-agent coordinator
│   ├── api/routes/               # 8 REST API route modules
│   │   ├── alerts.py
│   │   ├── compliance.py
│   │   ├── copilot.py
│   │   ├── permits.py
│   │   ├── risk.py
│   │   ├── sensors.py
│   │   ├── simulation.py
│   │   └── vision.py
│   ├── db/
│   │   ├── postgres.py           # SQLAlchemy models & schema
│   │   └── redis_client.py       # Cache + in-memory fallback
│   ├── simulation/
│   │   └── digital_twin.py       # Cascade physics engine
│   ├── utils/
│   │   └── sensor_stream.py      # IoT telemetry generator
│   ├── config.py                 # Pydantic settings
│   ├── main.py                   # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── CommandCenter.jsx
│       │   ├── MapView.jsx
│       │   ├── SimulationLab.jsx
│       │   ├── WorkerCopilot.jsx
│       │   └── Compliance.jsx
│       ├── store/
│       │   └── aegisStore.js     # Zustand global state
│       └── App.jsx               # Router + sidebar shell
├── PROJECT_SUBMISSION_REPORT.html
└── README.md
```

---

## 🔮 Roadmap

| Phase | Enhancement | Approach |
|:---|:---|:---|
| **Phase 2** | Computer Vision PPE Detection | YOLOv8 on CCTV streams — detect missing helmet/harness in real-time |
| **Phase 3** | Edge Anomaly Scoring | TinyML on ESP32/Raspberry Pi for sub-millisecond on-device risk scoring |
| **Phase 4** | Mobile Worker App | React Native app for real-time zone alerts and copilot on personal devices |
| **Phase 5** | Multi-Facility Federation | Aggregate compound hazard patterns across plant sites |

---

## 📄 License

This project is licensed under the MIT License.

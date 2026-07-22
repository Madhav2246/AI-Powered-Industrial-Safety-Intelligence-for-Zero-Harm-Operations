"""
AegisOS Backend — FastAPI Main Application
==========================================
Entry point for the Autonomous Industrial Safety Operating System API.
Mounts all routers, configures WebSocket streaming, and initializes
background services (Redis pub/sub, DB connections, agent orchestrator).
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from config import settings
from db.postgres import init_db
from db.redis_client import get_redis
from api.routes import sensors, risk, vision, permits, simulation, copilot, alerts, compliance
from agents.orchestrator import AegisOrchestrator


# ─── Lifespan (startup / shutdown) ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB, Redis, agents. Shutdown: clean up."""
    logger.info("🚀 AegisOS Backend starting up...")

    # Initialize PostgreSQL tables
    await init_db()
    logger.info("✅ PostgreSQL initialized")

    # Initialize orchestrator (agents + background sensor streaming)
    app.state.orchestrator = AegisOrchestrator()
    await app.state.orchestrator.start()
    logger.info("✅ Multi-agent orchestrator started")

    logger.info("🛡️ AegisOS is LIVE — Zero Harm Operations Active")
    yield

    # Shutdown
    await app.state.orchestrator.stop()
    logger.info("👋 AegisOS shutdown complete")


# ─── App Instance ──────────────────────────────────────────────────────────
app = FastAPI(
    title="AegisOS API",
    description="Autonomous Industrial Safety Operating System — Zero Harm Operations",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ───────────────────────────────────────────────────────
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["Sensors & IoT"])
app.include_router(risk.router, prefix="/api/v1/risk", tags=["Risk Engine"])
app.include_router(vision.router, prefix="/api/v1/vision", tags=["Computer Vision"])
app.include_router(permits.router, prefix="/api/v1/permits", tags=["Work Permits"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["Digital Twin Simulation"])
app.include_router(copilot.router, prefix="/api/v1/copilot", tags=["AI Safety Copilot"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts & Escalations"])
app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["Compliance & Audit"])


# ─── Health / Root ─────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for Docker / K8s probes."""
    return {
        "status": "healthy",
        "system": "AegisOS",
        "version": "1.0.0",
        "zero_harm_active": True,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "name": "AegisOS Industrial Safety Operating System",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

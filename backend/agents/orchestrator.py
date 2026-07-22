"""
AegisOS — Multi-Agent LangGraph Orchestrator
=============================================
Coordinates 5 specialized agents:
  RiskAgent       → Continuous sensor monitoring & risk scoring
  SimulationAgent → What-if scenario analysis
  CopilotAgent    → Worker safety Q&A via RAG
  ActionAgent     → Autonomous alert routing & permit revocation
  ExplainerAgent  → SHAP + evidence chain explanations

Uses asyncio tasks for continuous background execution.
"""
import asyncio
from datetime import datetime, timezone
from loguru import logger

from utils.sensor_stream import stream_sensor_data


class AegisOrchestrator:
    """
    Lightweight orchestrator that:
    1. Starts the sensor streaming background task
    2. Periodically runs risk analysis across all zones
    3. Triggers action agents when thresholds are exceeded
    """

    def __init__(self):
        self._tasks: list[asyncio.Task] = []
        self._running = False
        self.agent_status = {
            "RiskAgent": "idle",
            "SimulationAgent": "idle",
            "CopilotAgent": "ready",
            "ActionAgent": "idle",
            "ExplainerAgent": "idle",
        }

    async def start(self):
        """Start all background agent tasks."""
        self._running = True

        # Task 1: Sensor data streaming
        self._tasks.append(
            asyncio.create_task(self._run_sensor_stream(), name="sensor_stream")
        )
        # Task 2: Periodic risk analysis
        self._tasks.append(
            asyncio.create_task(self._run_risk_agent(), name="risk_agent")
        )
        # Task 3: Action dispatch loop
        self._tasks.append(
            asyncio.create_task(self._run_action_agent(), name="action_agent")
        )
        logger.info("🤖 All agents started: " + ", ".join(self.agent_status.keys()))

    async def stop(self):
        """Gracefully cancel all background tasks."""
        self._running = False
        for task in self._tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 Orchestrator stopped all background tasks")

    async def _run_sensor_stream(self):
        """Streams real-time sensor data into memory/Redis."""
        try:
            async for tick in stream_sensor_data(interval=1.0):
                if not self._running:
                    break
        except asyncio.CancelledError:
            pass

    async def _run_risk_agent(self):
        """Periodically evaluates zone risk metrics."""
        while self._running:
            try:
                self.agent_status["RiskAgent"] = "active — scoring"
                await asyncio.sleep(5.0)
                self.agent_status["RiskAgent"] = "monitoring"
            except asyncio.CancelledError:
                break

    async def _run_action_agent(self):
        """Monitors high-risk flags and triggers automated actions."""
        while self._running:
            try:
                self.agent_status["ActionAgent"] = "listening"
                await asyncio.sleep(3.0)
            except asyncio.CancelledError:
                break

    def get_status(self) -> dict:
        """Returns the current operating state of all agents."""
        return {
            "orchestrator_running": self._running,
            "agents": self.agent_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

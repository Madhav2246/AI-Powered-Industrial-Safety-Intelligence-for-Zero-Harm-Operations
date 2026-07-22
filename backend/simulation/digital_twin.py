"""
AegisOS — Digital Twin Engine
=============================
Physics + rules-based cascade simulator for factory safety.
Used by SimulationAgent for what-if analysis.

Wraps the route-level simulation logic for agent use.
"""
from api.routes.simulation import run_cascade_simulation, SimulationInput


class DigitalTwin:
    """
    Factory Digital Twin: models physical relationships between zones
    and simulates how safety events cascade through the factory.
    """

    def __init__(self):
        self.zone_states = {}  # Current state per zone

    def simulate(
        self,
        zone_id: str,
        scenario: str,
        severity: float = 0.5,
        duration_minutes: int = 30,
    ) -> dict:
        """Run a physics-based cascade simulation."""
        inp = SimulationInput(
            zone_id=zone_id,
            scenario=scenario,
            severity=severity,
        )
        return run_cascade_simulation(inp)

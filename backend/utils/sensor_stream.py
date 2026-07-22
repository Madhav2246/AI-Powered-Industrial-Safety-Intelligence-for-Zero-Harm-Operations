"""
AegisOS — Synthetic IoT Sensor Stream Generator
===============================================
Simulates realistic industrial sensor data with:
- Correlated multi-sensor readings per zone
- Anomaly injection (gas leaks, temperature spikes, vibration anomalies)
- Compound risk scenarios (multiple simultaneous hazards)
- Realistic noise and drift patterns
"""
import asyncio
import math
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List

from loguru import logger

from config import settings
from db.redis_client import publish_sensor_data, set_latest_reading

# Zone Definitions
ZONES = {
    "Z1": {"name": "Production Floor A", "type": "production",     "base_risk": 0.3, "lat": 51.505, "lng": -0.09},
    "Z2": {"name": "Production Floor B", "type": "production",     "base_risk": 0.3, "lat": 51.506, "lng": -0.09},
    "Z3": {"name": "Chemical Storage",   "type": "storage",        "base_risk": 0.6, "lat": 51.504, "lng": -0.088},
    "Z4": {"name": "Boiler Room",        "type": "utilities",      "base_risk": 0.5, "lat": 51.505, "lng": -0.087},
    "Z5": {"name": "Confined Space A",   "type": "confined_space", "base_risk": 0.7, "lat": 51.507, "lng": -0.091},
    "Z6": {"name": "Electrical Room",    "type": "electrical",     "base_risk": 0.4, "lat": 51.503, "lng": -0.089},
    "Z7": {"name": "Loading Bay",        "type": "logistics",      "base_risk": 0.2, "lat": 51.506, "lng": -0.093},
    "Z8": {"name": "Control Room",       "type": "control",        "base_risk": 0.1, "lat": 51.504, "lng": -0.092},
}

# Sensors per zone (2-3 sensors each)
SENSORS: Dict[str, List[str]] = {
    zone_id: [f"{zone_id}-S{i+1}" for i in range(2 if zone_id in ("Z7", "Z8") else 3)]
    for zone_id in ZONES
}

# Anomaly Scenarios
class AnomalyScenario:
    """Injects realistic anomaly patterns into sensor readings."""

    def __init__(self):
        self.active_anomalies: Dict[str, dict] = {}  # zone_id -> anomaly config
        self.scenario_timer = 0

    def maybe_inject(self, zone_id: str, t: float) -> dict:
        """Decide whether to start/continue an anomaly in a zone."""
        # Random chance to start new anomaly (low probability)
        if zone_id not in self.active_anomalies and random.random() < 0.002:
            scenario_type = random.choice([
                "gas_leak", "temperature_spike", "vibration_surge",
                "pressure_drop", "compound_risk"
            ])
            self.active_anomalies[zone_id] = {
                "type": scenario_type,
                "start_t": t,
                "duration": random.uniform(30, 120),
                "intensity": random.uniform(0.5, 1.0),
            }
            logger.warning(f"⚠️  Anomaly injected: {scenario_type} in {zone_id}")

        # Progress or clear anomaly
        if zone_id in self.active_anomalies:
            anomaly = self.active_anomalies[zone_id]
            elapsed = t - anomaly["start_t"]
            if elapsed > anomaly["duration"]:
                del self.active_anomalies[zone_id]
                return {}
            # Return intensity factor (ramps up then ramps down)
            peak_t = anomaly["duration"] * 0.4
            if elapsed < peak_t:
                factor = (elapsed / peak_t) * anomaly["intensity"]
            else:
                factor = ((anomaly["duration"] - elapsed) / (anomaly["duration"] - peak_t)) * anomaly["intensity"]
            return {"type": anomaly["type"], "factor": factor}
        return {}


anomaly_engine = AnomalyScenario()


# Sensor Reading Generator
def generate_reading(zone_id: str, sensor_id: str, t: float) -> dict:
    """
    Generate a realistic sensor reading for a given zone at time t.
    Uses sine waves for natural variation + anomaly injection.
    """
    zone = ZONES[zone_id]
    base_risk = zone["base_risk"]
    anomaly = anomaly_engine.maybe_inject(zone_id, t)
    af = anomaly.get("factor", 0.0)
    atype = anomaly.get("type", "none")

    # Base readings with natural noise
    temp_base    = 22 + base_risk * 15 + 5 * math.sin(t / 300) + random.gauss(0, 0.5)
    pressure_base = 1.0 + base_risk * 0.3 + 0.05 * math.sin(t / 600) + random.gauss(0, 0.01)
    humidity_base = 45 + 15 * math.sin(t / 400) + random.gauss(0, 1)
    gas_base     = 5 + base_risk * 20 + 3 * math.sin(t / 200) + random.gauss(0, 0.5)
    vibration_base = 0.5 + base_risk * 2 + random.gauss(0, 0.1)
    rpm_base     = 1400 + random.gauss(0, 20) if zone["type"] == "production" else 0
    torque_base  = 40 + random.gauss(0, 2)
    tool_wear_base = (t / 60) % 200  # increases over time, reset at 200min
    power_base   = 50 + base_risk * 100 + random.gauss(0, 5)

    # Apply anomaly effects
    if atype == "gas_leak":
        gas_base += af * 800              # Gas spikes severely
        temp_base += af * 5
    elif atype == "temperature_spike":
        temp_base += af * 80             # Temp spikes to dangerous levels
        pressure_base += af * 0.5
    elif atype == "vibration_surge":
        vibration_base += af * 15         # Machine vibration anomaly
        rpm_base += af * 300
    elif atype == "pressure_drop":
        pressure_base -= af * 0.8         # Dangerous pressure loss
    elif atype == "compound_risk":
        gas_base += af * 300
        temp_base += af * 40
        vibration_base += af * 8

    # Compute composite risk score
    risk_factors = []
    if gas_base > 200: risk_factors.append(min((gas_base - 200) / 600, 1.0) * 40)
    if temp_base > 60: risk_factors.append(min((temp_base - 60) / 40, 1.0) * 30)
    if vibration_base > 5: risk_factors.append(min((vibration_base - 5) / 10, 1.0) * 20)
    if pressure_base < 0.5 or pressure_base > 1.8: risk_factors.append(15)
    risk_score = min(sum(risk_factors) + base_risk * 20, 100)

    return {
        "sensor_id": sensor_id,
        "zone_id": zone_id,
        "zone_name": zone["name"],
        "zone_type": zone["type"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": zone["lat"] + random.uniform(-0.0001, 0.0001),
        "longitude": zone["lng"] + random.uniform(-0.0001, 0.0001),
        # Readings
        "temperature": round(temp_base, 2),
        "pressure": round(pressure_base, 3),
        "humidity": round(max(0, min(100, humidity_base)), 1),
        "gas_level": round(max(0, gas_base), 1),
        "vibration": round(max(0, vibration_base), 2),
        "noise_level": round(60 + base_risk * 30 + random.gauss(0, 2), 1),
        "air_quality": round(max(0, 100 - gas_base * 0.1 - af * 30), 1),
        "rotational_speed": round(max(0, rpm_base), 0),
        "torque": round(max(0, torque_base), 1),
        "tool_wear": round(tool_wear_base, 1),
        "power_consumption": round(max(0, power_base), 1),
        # Intelligence
        "risk_score": round(risk_score, 1),
        "anomaly_type": atype if atype != "none" else None,
        "anomaly_intensity": round(af, 3),
        "is_anomaly": af > 0.1,
    }


# Background Streaming Task
async def stream_sensor_data(interval: float = 1.0):
    """
    Background async task: generates sensor readings every N ms
    and publishes them to Redis channels for WebSocket distribution.
    """
    start_t = time.time()
    logger.info(f"📡 Sensor stream started — {interval}s interval across {len(ZONES)} zones")

    while True:
        t = time.time() - start_t
        for zone_id, sensor_ids in SENSORS.items():
            for sensor_id in sensor_ids:
                reading = generate_reading(zone_id, sensor_id, t)
                # Publish to zone-specific channel
                try:
                    await publish_sensor_data(f"sensors:{zone_id}", reading)
                    await set_latest_reading(sensor_id, reading)
                except Exception:
                    pass

        await asyncio.sleep(interval)

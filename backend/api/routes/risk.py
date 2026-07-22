"""
AegisOS — Risk Intelligence API
===============================
Risk prediction endpoint using the trained XGBoost model (or mock).
Also handles compound risk detection and SHAP explanations.
"""
import random
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

router = APIRouter()


# Schemas
class SensorInput(BaseModel):
    zone_id: str
    temperature: float = 25.0
    pressure: float = 1.0
    humidity: float = 50.0
    gas_level: float = 5.0
    vibration: float = 0.5
    rotational_speed: float = 1400.0
    torque: float = 40.0
    tool_wear: float = 0.0
    power_consumption: float = 50.0
    has_active_hot_work_permit: bool = False
    has_active_confined_space_permit: bool = False
    workers_in_zone: int = 0
    hour_of_day: int = 12
    day_of_week: int = 1


class RiskPrediction(BaseModel):
    zone_id: str
    risk_score: float           # 0-100
    risk_level: str             # low/medium/high/critical
    failure_probability: float  # 0-1
    compound_risk: bool
    primary_hazard: str
    contributing_factors: List[dict]
    shap_explanation: List[dict]
    recommended_actions: List[str]
    timestamp: str


# Risk Level Mapping
def score_to_level(score: float) -> str:
    if score < 25: return "low"
    if score < 50: return "medium"
    if score < 75: return "high"
    return "critical"


# Core Risk Computation
def compute_risk(data: SensorInput) -> RiskPrediction:
    """
    Compute compound risk score using rule-based + ML hybrid approach.
    In production: loads XGBoost model from disk. Here: realistic simulation.

    Compound risk = individual risks + interaction terms (gas * permit + temp * workers).
    """
    factors = []
    score = 0.0

    # Gas Level
    if data.gas_level > 500:
        f = min((data.gas_level - 500) / 300, 1.0)
        factors.append({"factor": "gas_level", "value": data.gas_level, "contribution": round(f * 35, 1), "unit": "ppm"})
        score += f * 35
    elif data.gas_level > 200:
        f = (data.gas_level - 200) / 300
        factors.append({"factor": "gas_level", "value": data.gas_level, "contribution": round(f * 20, 1), "unit": "ppm"})
        score += f * 20

    # Temperature
    if data.temperature > 70:
        f = min((data.temperature - 70) / 30, 1.0)
        factors.append({"factor": "temperature", "value": data.temperature, "contribution": round(f * 25, 1), "unit": "°C"})
        score += f * 25
    elif data.temperature > 50:
        f = (data.temperature - 50) / 20
        factors.append({"factor": "temperature", "value": data.temperature, "contribution": round(f * 15, 1), "unit": "°C"})
        score += f * 15

    # Vibration
    if data.vibration > 8:
        f = min((data.vibration - 8) / 7, 1.0)
        factors.append({"factor": "vibration", "value": data.vibration, "contribution": round(f * 20, 1), "unit": "m/s²"})
        score += f * 20

    # Pressure
    if data.pressure < 0.5 or data.pressure > 2.0:
        f = min(abs(data.pressure - 1.0) / 1.0, 1.0)
        factors.append({"factor": "pressure", "value": data.pressure, "contribution": round(f * 15, 1), "unit": "bar"})
        score += f * 15

    # Tool Wear
    if data.tool_wear > 150:
        f = min((data.tool_wear - 150) / 50, 1.0)
        factors.append({"factor": "tool_wear", "value": data.tool_wear, "contribution": round(f * 10, 1), "unit": "min"})
        score += f * 10

    # Compound risk: Gas + Hot Work Permit (explosion risk multiplier)
    compound_risk = False
    compound_bonus = 0.0
    if data.gas_level > 200 and data.has_active_hot_work_permit:
        compound_bonus = 25.0
        compound_risk = True
        factors.append({"factor": "compound: gas_leak ✕ hot_work_permit", "value": "ACTIVE", "contribution": 25.0, "unit": "compound"})

    # Compound: High Temp + Workers in Confined Space
    if data.temperature > 50 and data.has_active_confined_space_permit and data.workers_in_zone > 2:
        compound_bonus += 15.0
        compound_risk = True
        factors.append({"factor": "compound: high_temp ✕ confined_space ✕ workers", "value": data.workers_in_zone, "contribution": 15.0, "unit": "compound"})

    # Night shift penalty
    if data.hour_of_day < 6 or data.hour_of_day > 22:
        score += 5
        factors.append({"factor": "night_shift_multiplier", "value": data.hour_of_day, "contribution": 5.0, "unit": "hour"})

    score = min(score + compound_bonus, 100)

    # Primary hazard
    if not factors:
        primary_hazard = "none"
    else:
        primary_hazard = max(factors, key=lambda x: x["contribution"])["factor"]

    # Failure probability (logistic of risk score)
    failure_prob = 1 / (1 + 2.718 ** (-(score - 50) / 15))

    # SHAP-style explanation
    shap_vals = []
    for f in sorted(factors, key=lambda x: x["contribution"], reverse=True):
        shap_vals.append({
            "feature": f["factor"],
            "value": f["value"],
            "shap_value": round(f["contribution"] / 100, 3),
            "direction": "positive"  # increases risk
        })

    # Recommended actions
    actions = []
    if score > 75:
        actions.append("🚨 Initiate IMMEDIATE evacuation of zone")
        actions.append("🚒 Activate emergency response team")
    if data.gas_level > 200:
        actions.append("💨 Activate ventilation system immediately")
        actions.append("⛔ Suspend all hot work in zone")
    if data.temperature > 70:
        actions.append("❄️ Deploy cooling systems / fire suppression")
    if data.vibration > 8:
        actions.append("🔧 Emergency equipment shutdown for inspection")
    if compound_risk:
        actions.append("⚠️ COMPOUND RISK: Notify safety officer immediately")
    if not actions:
        actions.append("✅ Continue monitoring — within safe parameters")

    return RiskPrediction(
        zone_id=data.zone_id,
        risk_score=round(score, 1),
        risk_level=score_to_level(score),
        failure_probability=round(failure_prob, 3),
        compound_risk=compound_risk,
        primary_hazard=primary_hazard,
        contributing_factors=factors,
        shap_explanation=shap_vals,
        recommended_actions=actions,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# Endpoints
@router.post("/predict", response_model=RiskPrediction)
async def predict_risk(data: SensorInput = Body(...)):
    """
    Predict compound risk score for a zone given sensor readings.
    Returns: risk score, level, contributing factors, SHAP explanation, actions.
    """
    return compute_risk(data)


@router.get("/zones/scores")
async def get_all_zone_risk_scores():
    """Return simulated risk scores for all zones (for dashboard overview)."""
    from db.redis_client import get_all_zone_readings
    readings = await get_all_zone_readings()

    zone_scores = {}
    for sensor_id, reading in readings.items():
        zone_id = reading.get("zone_id")
        if zone_id:
            score = reading.get("risk_score", 0)
            if zone_id not in zone_scores or score > zone_scores[zone_id]["risk_score"]:
                zone_scores[zone_id] = {
                    "zone_id": zone_id,
                    "zone_name": reading.get("zone_name"),
                    "risk_score": score,
                    "risk_level": score_to_level(score),
                    "is_anomaly": reading.get("is_anomaly", False),
                    "anomaly_type": reading.get("anomaly_type"),
                }

    return {"zones": list(zone_scores.values())}


@router.get("/history/trend/{zone_id}")
async def get_risk_trend(zone_id: str, points: int = 50):
    """Return mock historical risk trend for a zone (for sparkline charts)."""
    trend = []
    base = random.uniform(20, 60)
    for i in range(points):
        base += random.gauss(0, 3)
        base = max(0, min(100, base))
        trend.append({"t": i, "risk_score": round(base, 1)})
    return {"zone_id": zone_id, "trend": trend}

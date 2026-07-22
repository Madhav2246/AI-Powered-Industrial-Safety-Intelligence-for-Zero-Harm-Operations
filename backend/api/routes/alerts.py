"""
AegisOS — Alerts & Actions API
==============================
Real-time alert management, autonomous action logging, notification dispatch.
"""
import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update

from db.postgres import get_db, Alert

router = APIRouter()


# Schemas
class AlertCreate(BaseModel):
    severity: str
    category: str
    zone_id: str
    title: str
    description: str
    risk_score: float = 0.0
    recommended_actions: List[str] = []
    evidence: dict = {}
    is_compound: bool = False
    agent: str = "system"


# Endpoints
@router.get("/active")
async def get_active_alerts(
    limit: int = 50,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Return active (unresolved) alerts, newest first."""
    query = (
        select(Alert)
        .where(Alert.is_resolved == False)
        .order_by(desc(Alert.timestamp))
        .limit(limit)
    )
    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "alerts": [
            {
                "alert_id": a.alert_id,
                "timestamp": a.timestamp.isoformat(),
                "severity": a.severity,
                "category": a.category,
                "zone_id": a.zone_id,
                "title": a.title,
                "description": a.description,
                "risk_score": a.risk_score,
                "is_compound": a.is_compound,
                "is_acknowledged": a.is_acknowledged,
                "recommended_actions": a.recommended_actions or [],
                "agent": a.agent,
            }
            for a in alerts
        ]
    }


@router.post("/create")
async def create_alert(alert_data: AlertCreate = Body(...), db: AsyncSession = Depends(get_db)):
    """Create a new alert (called by agents or external systems)."""
    alert = Alert(
        alert_id=str(uuid.uuid4()),
        severity=alert_data.severity,
        category=alert_data.category,
        zone_id=alert_data.zone_id,
        title=alert_data.title,
        description=alert_data.description,
        risk_score=alert_data.risk_score,
        recommended_actions=alert_data.recommended_actions,
        evidence=alert_data.evidence,
        is_compound=alert_data.is_compound,
        agent=alert_data.agent,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    return {
        "status": "created",
        "alert_id": alert.alert_id,
        "message": f"Alert '{alert.title}' logged in zone {alert.zone_id}",
    }


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Acknowledge an active alert."""
    stmt = (
        update(Alert)
        .where(Alert.alert_id == alert_id)
        .values(is_acknowledged=True, acknowledged_at=datetime.now(timezone.utc))
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "acknowledged", "alert_id": alert_id}


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Mark an alert as resolved."""
    stmt = (
        update(Alert)
        .where(Alert.alert_id == alert_id)
        .values(is_resolved=True, resolved_at=datetime.now(timezone.utc))
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "resolved", "alert_id": alert_id}

"""
AegisOS — Permit Intelligence API
=================================
AI-powered work permit management with conflict detection,
risk scoring, and natural-language recommendations.
"""
import uuid
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from db.postgres import get_db, WorkPermit

router = APIRouter()


# Schemas
class PermitRequest(BaseModel):
    permit_type: str                    # hot_work/confined_space/electrical/height/excavation
    zone_id: str
    location_detail: str = ""
    applicant_name: str
    applicant_id: str
    supervisor: str
    workers: List[str] = []
    valid_from: str                     # ISO datetime
    valid_until: str
    work_description: str
    hazards_identified: List[str] = []
    control_measures: List[str] = []
    ppe_required: List[str] = []


# Conflict Detection Logic
PERMIT_CONFLICTS = {
    "hot_work": ["confined_space", "chemical_handling", "electrical"],
    "confined_space": ["hot_work", "excavation"],
    "electrical": ["hot_work", "height"],
    "height": ["excavation"],
    "chemical_handling": ["hot_work", "electrical"],
}

PPE_BY_TYPE = {
    "hot_work": ["Fire-resistant suit", "Face shield", "Leather gloves", "Safety boots", "Hard hat"],
    "confined_space": ["Harness", "Retrieval line", "SCBA/PAPR", "Gas monitor", "Hard hat"],
    "electrical": ["Insulating gloves (Class 2+)", "Arc flash suit", "Face shield", "Safety boots"],
    "height": ["Full-body harness", "Lanyard", "Hard hat", "Safety boots"],
    "excavation": ["Hard hat", "High-vis vest", "Safety boots", "Gloves"],
    "chemical_handling": ["Chemical suit", "Chemical gloves", "Face shield", "SCBA", "Safety boots"],
}


async def detect_conflicts(permit: PermitRequest, db: AsyncSession) -> List[dict]:
    """Check for conflicts with existing active permits in the same zone."""
    conflicts = []

    # Find overlapping active permits in same zone
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(WorkPermit).where(
            WorkPermit.zone_id == permit.zone_id,
            WorkPermit.status.in_(["approved", "active"]),
        )
    )
    existing = result.scalars().all()

    for ep in existing:
        # Temporal overlap check
        ep_from = ep.valid_from if isinstance(ep.valid_from, datetime) else datetime.fromisoformat(str(ep.valid_from))
        ep_until = ep.valid_until if isinstance(ep.valid_until, datetime) else datetime.fromisoformat(str(ep.valid_until))
        req_from = datetime.fromisoformat(permit.valid_from.replace("Z", "+00:00"))
        req_until = datetime.fromisoformat(permit.valid_until.replace("Z", "+00:00"))

        time_overlap = req_from < ep_until and req_until > ep_from

        if time_overlap:
            conflict_types = PERMIT_CONFLICTS.get(permit.permit_type, [])
            if ep.permit_type in conflict_types:
                conflicts.append({
                    "conflict_permit_id": ep.permit_id,
                    "conflict_type": ep.permit_type,
                    "severity": "critical" if permit.permit_type == "hot_work" else "high",
                    "reason": f"{permit.permit_type} + {ep.permit_type} in same zone creates combined hazard",
                    "recommendation": "Defer one permit until the other is completed",
                })

    return conflicts


# Endpoints
@router.post("/request")
async def request_permit(
    permit_req: PermitRequest = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """Submit a new work permit request with AI analysis."""
    # Detect conflicts
    conflicts = await detect_conflicts(permit_req, db)

    # Compute risk score
    base_risk = {"hot_work": 70, "confined_space": 75, "electrical": 60, "height": 55, "excavation": 45, "chemical_handling": 65}
    risk_score = base_risk.get(permit_req.permit_type, 50)
    if conflicts: risk_score = min(risk_score + 20, 100)
    risk_score += random.uniform(-5, 5)

    # AI recommendation
    if risk_score > 80 or len(conflicts) > 0:
        recommendation = "deny" if len(conflicts) > 1 else "defer"
    elif risk_score > 60:
        recommendation = "defer"
    else:
        recommendation = "approve"

    # Augment PPE
    ai_ppe = PPE_BY_TYPE.get(permit_req.permit_type, [])
    all_ppe = list(set(permit_req.ppe_required + ai_ppe))

    permit_id = str(uuid.uuid4())
    permit = WorkPermit(
        permit_id=permit_id,
        valid_from=datetime.fromisoformat(permit_req.valid_from.replace("Z", "+00:00")),
        valid_until=datetime.fromisoformat(permit_req.valid_until.replace("Z", "+00:00")),
        permit_type=permit_req.permit_type,
        zone_id=permit_req.zone_id,
        location_detail=permit_req.location_detail,
        applicant_name=permit_req.applicant_name,
        applicant_id=permit_req.applicant_id,
        supervisor=permit_req.supervisor,
        workers=permit_req.workers,
        work_description=permit_req.work_description,
        hazards_identified=permit_req.hazards_identified,
        control_measures=permit_req.control_measures,
        ppe_required=all_ppe,
        status="pending",
        risk_score=round(risk_score, 1),
        ai_conflicts=conflicts,
        ai_recommendation=recommendation,
    )
    db.add(permit)
    await db.flush()

    return {
        "permit_id": permit_id,
        "status": "pending",
        "risk_score": round(risk_score, 1),
        "ai_recommendation": recommendation,
        "conflicts_detected": conflicts,
        "augmented_ppe": all_ppe,
        "message": f"AI recommends {recommendation.upper()} — {len(conflicts)} conflict(s) detected",
    }


@router.get("/active")
async def get_active_permits(db: AsyncSession = Depends(get_db)):
    """List all currently active/approved permits."""
    result = await db.execute(
        select(WorkPermit)
        .where(WorkPermit.status.in_(["approved", "active", "pending"]))
        .order_by(desc(WorkPermit.created_at))
        .limit(50)
    )
    permits = result.scalars().all()
    return {
        "permits": [
            {
                "permit_id": p.permit_id,
                "permit_type": p.permit_type,
                "zone_id": p.zone_id,
                "applicant_name": p.applicant_name,
                "status": p.status,
                "risk_score": p.risk_score,
                "ai_recommendation": p.ai_recommendation,
                "has_conflicts": bool(p.ai_conflicts),
                "valid_from": p.valid_from.isoformat() if p.valid_from else None,
                "valid_until": p.valid_until.isoformat() if p.valid_until else None,
            }
            for p in permits
        ]
    }


@router.patch("/{permit_id}/approve")
async def approve_permit(permit_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkPermit).where(WorkPermit.permit_id == permit_id))
    permit = result.scalar_one_or_none()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    permit.status = "approved"
    permit.approved_at = datetime.now(timezone.utc)
    return {"permit_id": permit_id, "status": "approved"}


@router.get("/mock-data")
async def get_mock_permits():
    """Return pre-generated mock permit data for demo."""
    import json, os
    data_path = "/app/data/permits.json"
    if os.path.exists(data_path):
        with open(data_path) as f:
            permits = json.load(f)
        return {"permits": permits[:20]}
    return {"permits": [], "message": "Run data generation script first"}

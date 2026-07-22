"""
AegisOS — Compliance & PDF Report API
"""
import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import io

router = APIRouter()

@router.get("/dashboard")
async def get_compliance_dashboard():
    """Return compliance metrics for the dashboard."""
    return {
        "overall_score": round(random.uniform(78, 95), 1),
        "permit_compliance": round(random.uniform(85, 99), 1),
        "ppe_compliance": round(random.uniform(72, 92), 1),
        "training_compliance": round(random.uniform(88, 98), 1),
        "inspection_compliance": round(random.uniform(80, 95), 1),
        "incidents_this_month": random.randint(0, 3),
        "near_misses_this_month": random.randint(2, 8),
        "days_without_lti": random.randint(45, 365),
        "open_actions": random.randint(3, 15),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/report/generate")
async def generate_compliance_report():
    """Generate a PDF compliance report (returns JSON summary for demo)."""
    return {
        "report_id": f"RPT-{datetime.now().strftime('%Y%m%d-%H%M')}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period": f"{(datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')} to {datetime.now().strftime('%Y-%m-%d')}",
        "summary": {
            "total_permits_issued": random.randint(45, 120),
            "permits_with_conflicts": random.randint(2, 8),
            "alerts_generated": random.randint(80, 250),
            "alerts_resolved": random.randint(75, 240),
            "ai_autonomous_actions": random.randint(12, 35),
            "estimated_incidents_prevented": random.randint(3, 12),
            "estimated_cost_savings_usd": random.randint(50000, 500000),
        },
        "message": "Full PDF generation available with reportlab integration",
    }

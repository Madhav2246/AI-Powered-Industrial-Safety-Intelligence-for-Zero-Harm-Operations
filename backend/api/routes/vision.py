"""
AegisOS — Vision (YOLOv8) & Compliance routes (stubs for remaining routes)
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import random
from datetime import datetime, timezone

router = APIRouter()

@router.get("/hazards/mock")
async def get_mock_vision_hazards():
    """Simulated YOLO detection results for demo."""
    detections = [
        {"class": "person_no_helmet", "confidence": 0.91, "zone": "Z1", "bbox": [120, 80, 200, 220]},
        {"class": "smoke_detected", "confidence": 0.87, "zone": "Z3", "bbox": [300, 150, 450, 300]},
        {"class": "spark_detected", "confidence": 0.78, "zone": "Z3", "bbox": [320, 180, 360, 220]},
    ]
    return {
        "frame_id": f"FRM-{random.randint(1000, 9999)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "detections": detections,
        "total_violations": len(detections),
    }

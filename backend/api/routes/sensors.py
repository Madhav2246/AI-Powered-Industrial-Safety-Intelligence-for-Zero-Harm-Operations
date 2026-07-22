"""
AegisOS — Sensor Streaming API Routes
======================================
WebSocket endpoint for real-time sensor data push.
REST endpoints for historical data and zone overview.
"""
import asyncio
import json
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from loguru import logger

from db.postgres import get_db, SensorReading
from db.redis_client import get_all_zone_readings, get_redis

router = APIRouter()


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info(f"WS connected — {len(self.active)} total clients")

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)
        logger.info(f"WS disconnected — {len(self.active)} total clients")

    async def broadcast(self, data: dict):
        for ws in self.active.copy():
            try:
                await ws.send_json(data)
            except Exception:
                self.active.remove(ws)


manager = ConnectionManager()


# WebSocket: Live Sensor Feed
@router.websocket("/ws/live")
async def websocket_sensor_feed(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sensor streaming.
    Subscribes to Redis pub/sub and forwards data to all connected clients.
    """
    await manager.connect(websocket)
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.psubscribe("sensors:*")   # Subscribe to all zone channels

    try:
        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                data = json.loads(message["data"])
                await websocket.send_json({"type": "sensor_update", "payload": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        await pubsub.punsubscribe("sensors:*")
        await pubsub.close()


# REST: Current Zone Overview
@router.get("/latest")
async def get_latest_readings():
    """Return the most recent reading for each sensor from Redis cache."""
    readings = await get_all_zone_readings()
    return {"sensors": list(readings.values())}


@router.get("/history/{zone_id}")
async def get_sensor_history(
    zone_id: str,
    minutes: int = Query(60, ge=5, le=1440),
    db: AsyncSession = Depends(get_db),
):
    """Return historical sensor readings for a zone from PostgreSQL."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    query = (
        select(SensorReading)
        .where(
            SensorReading.zone_id == zone_id,
            SensorReading.timestamp >= cutoff,
        )
        .order_by(desc(SensorReading.timestamp))
        .limit(500)
    )
    result = await db.execute(query)
    readings = result.scalars().all()

    return {
        "zone_id": zone_id,
        "count": len(readings),
        "readings": [
            {
                "id": r.id,
                "sensor_id": r.sensor_id,
                "timestamp": r.timestamp.isoformat(),
                "temperature": r.temperature,
                "pressure": r.pressure,
                "gas_level": r.gas_level,
                "vibration": r.vibration,
                "risk_score": r.risk_score,
            }
            for r in readings
        ],
    }

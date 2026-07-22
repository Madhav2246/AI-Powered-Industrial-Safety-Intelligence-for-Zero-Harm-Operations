"""
AegisOS — Standalone Cache & Streaming Client
==============================================
Async Redis connection with automatic in-memory fallback
when Redis server is not running locally.
"""
import json
from typing import Any, Dict
from loguru import logger

from config import settings

_redis = None
_in_memory_store: Dict[str, str] = {}
_in_memory_subscribers = []


async def get_redis():
    global _redis
    if _redis is None:
        try:
            import aioredis
            _redis = await aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        except Exception:
            _redis = False  # Mark as unavailable
    return _redis if _redis else None


async def publish_sensor_data(channel: str, data: dict) -> None:
    """Publish sensor reading to Redis or in-memory subscribers."""
    r = await get_redis()
    if r:
        try:
            await r.publish(channel, json.dumps(data))
            return
        except Exception:
            pass

    # In-memory fallback
    payload = json.dumps(data)
    _in_memory_store[f"sensor:latest:{data.get('sensor_id')}"] = payload


async def set_latest_reading(sensor_id: str, data: dict, ttl: int = 60) -> None:
    """Store latest reading in cache."""
    r = await get_redis()
    payload = json.dumps(data)
    if r:
        try:
            await r.setex(f"sensor:latest:{sensor_id}", ttl, payload)
            return
        except Exception:
            pass

    _in_memory_store[f"sensor:latest:{sensor_id}"] = payload


async def get_latest_reading(sensor_id: str) -> dict | None:
    """Get latest reading for a sensor."""
    r = await get_redis()
    if r:
        try:
            val = await r.get(f"sensor:latest:{sensor_id}")
            return json.loads(val) if val else None
        except Exception:
            pass

    val = _in_memory_store.get(f"sensor:latest:{sensor_id}")
    return json.loads(val) if val else None


async def get_all_zone_readings() -> dict:
    """Get latest readings for all sensors."""
    r = await get_redis()
    readings = {}
    if r:
        try:
            keys = await r.keys("sensor:latest:*")
            for key in keys:
                val = await r.get(key)
                if val:
                    d = json.loads(val)
                    readings[d.get("sensor_id", key)] = d
            if readings:
                return readings
        except Exception:
            pass

    # Fallback to in-memory store
    for key, val in _in_memory_store.items():
        if key.startswith("sensor:latest:"):
            try:
                d = json.loads(val)
                readings[d.get("sensor_id", key)] = d
            except Exception:
                pass
    return readings
